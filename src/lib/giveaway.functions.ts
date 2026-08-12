import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import {
  AU_STATES,
  GIVEAWAY_ID,
  MAX_RESPONSE_WORDS,
  countWords,
  isValidEmail,
  normalizeEmail,
} from "./giveaway";

export interface GiveawayStatus {
  /** True only when the launch flag, the supplier confirmation and the window all pass. */
  open: boolean;
  launchEnabled: boolean;
  supplierConfirmed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  termsVersion: string | null;
}

const CLOSED: GiveawayStatus = {
  open: false,
  launchEnabled: false,
  supplierConfirmed: false,
  opensAt: null,
  closesAt: null,
  termsVersion: null,
};

/**
 * Public, read-only launch state. Returns booleans/dates only — never entries.
 * Reads through the service client inside the handler because the tables are
 * fully locked down (no anon/authenticated grants, no RLS policies).
 */
export const getGiveawayStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<GiveawayStatus> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("giveaway_launch_config")
        .select("launch_enabled, supplier_confirmed, opens_at, closes_at, terms_version")
        .eq("id", GIVEAWAY_ID)
        .maybeSingle();
      if (error || !data) return CLOSED;
      const now = Date.now();
      const inWindow =
        now >= new Date(data.opens_at).getTime() && now <= new Date(data.closes_at).getTime();
      return {
        open: data.launch_enabled && data.supplier_confirmed && inWindow,
        launchEnabled: data.launch_enabled,
        supplierConfirmed: data.supplier_confirmed,
        opensAt: data.opens_at,
        closesAt: data.closes_at,
        termsVersion: data.terms_version,
      };
    } catch (err) {
      console.error("[giveaway] status read failed", err);
      return CLOSED;
    }
  },
);

export interface EntryInput {
  firstName: string;
  lastName: string;
  email: string;
  state: string;
  ageConfirmed: boolean;
  response: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
  source?: string;
  utm?: Record<string, string | undefined>;
  /** Anti-bot honeypot — must stay empty. */
  company?: string;
}

export type EntryResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not-open" | "invalid" | "duplicate" | "rate-limited" | "server";
      message: string;
    };

async function hashIp(ip: string): Promise<string> {
  const bytes = new TextEncoder().encode(`roamforge-giveaway:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Anonymous entry endpoint. Every rule (window, launch flags, word limit,
 * required consents, one-entry-per-email) is enforced here and again by
 * database constraints — client validation is convenience only.
 */
export const submitGiveawayEntry = createServerFn({ method: "POST" })
  .inputValidator((data: EntryInput) => data)
  .handler(async ({ data }): Promise<EntryResult> => {
    if (data.company) return { ok: true }; // silently drop bots

    const invalid = (message: string): EntryResult => ({ ok: false, reason: "invalid", message });

    const firstName = data.firstName?.trim() ?? "";
    const lastName = data.lastName?.trim() ?? "";
    const email = data.email?.trim() ?? "";
    const state = (data.state ?? "").trim().toUpperCase();
    const response = data.response?.trim() ?? "";
    const words = countWords(response);

    if (firstName.length < 1 || firstName.length > 80) return invalid("Enter your first name.");
    if (lastName.length < 1 || lastName.length > 80) return invalid("Enter your last name.");
    if (!isValidEmail(email)) return invalid("Enter a valid email address.");
    if (!(AU_STATES as readonly string[]).includes(state))
      return invalid("Select your state or territory.");
    if (!data.ageConfirmed) return invalid("You must confirm you are 18 or over.");
    if (!data.termsAccepted) return invalid("You must accept the official terms to enter.");
    if (words < 1) return invalid("Please answer the entry question.");
    if (words > MAX_RESPONSE_WORDS)
      return invalid(`Your answer must be ${MAX_RESPONSE_WORDS} words or fewer.`);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: config } = await supabaseAdmin
        .from("giveaway_launch_config")
        .select("launch_enabled, supplier_confirmed, opens_at, closes_at, terms_version")
        .eq("id", GIVEAWAY_ID)
        .maybeSingle();

      const now = Date.now();
      const open =
        !!config &&
        config.launch_enabled &&
        config.supplier_confirmed &&
        now >= new Date(config.opens_at).getTime() &&
        now <= new Date(config.closes_at).getTime();

      if (!open) {
        return {
          ok: false,
          reason: "not-open",
          message: "Entries are not open yet. Please check back once the promotion launches.",
        };
      }

      const forwarded = getRequestHeader("x-forwarded-for") ?? "";
      const ip = forwarded.split(",")[0]?.trim() || getRequestHeader("cf-connecting-ip") || "";
      const ipHash = ip ? await hashIp(ip) : null;

      if (ipHash) {
        const since = new Date(now - 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("giveaway_entries")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", since);
        if ((count ?? 0) >= 5) {
          return {
            ok: false,
            reason: "rate-limited",
            message: "Too many entry attempts. Please try again later.",
          };
        }
      }

      const { error } = await supabaseAdmin.from("giveaway_entries").insert({
        giveaway_id: GIVEAWAY_ID,
        first_name: firstName,
        last_name: lastName,
        email,
        email_normalized: normalizeEmail(email),
        state_territory: state,
        age_confirmed: true,
        response,
        response_word_count: words,
        terms_accepted: true,
        terms_version: config.terms_version,
        terms_accepted_at: new Date().toISOString(),
        marketing_consent: !!data.marketingConsent,
        marketing_consent_at: data.marketingConsent ? new Date().toISOString() : null,
        source: data.source ?? "giveaway-recovery-kit",
        utm_source: data.utm?.["utm_source"] ?? null,
        utm_medium: data.utm?.["utm_medium"] ?? null,
        utm_campaign: data.utm?.["utm_campaign"] ?? null,
        utm_term: data.utm?.["utm_term"] ?? null,
        utm_content: data.utm?.["utm_content"] ?? null,
        ip_hash: ipHash,
        user_agent: (getRequestHeader("user-agent") ?? "").slice(0, 300),
      });

      if (error) {
        if (error.code === "23505") {
          return {
            ok: false,
            reason: "duplicate",
            message: "This email address has already entered. One entry per person.",
          };
        }
        console.error("[giveaway] insert failed", error);
        return { ok: false, reason: "server", message: "Something went wrong. Please try again." };
      }

      return { ok: true };
    } catch (err) {
      console.error("[giveaway] submit failed", err);
      return { ok: false, reason: "server", message: "Something went wrong. Please try again." };
    }
  });
