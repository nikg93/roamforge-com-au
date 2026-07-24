// Klaviyo public subscribe helper. Uses the client-side `client/subscriptions`
// endpoint which only needs the public company_id + a public list_id — no
// server secrets in the browser. When either identifier is missing this
// helper returns { ok: false, reason: "not-configured" } so callers can
// surface an honest "wiring not complete" state instead of faking success.
//
// Docs: https://developers.klaviyo.com/en/reference/create_client_subscription

export interface KlaviyoConfig {
  companyId: string;
  listId: string;
}

export type KlaviyoResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not-configured" | "invalid-email" | "network" | "server";
      message?: string;
    };

const KLAVIYO_ENDPOINT = "https://a.klaviyo.com/client/subscriptions";
// This is the Klaviyo public API revision the docs pin for client-side calls.
const KLAVIYO_REVISION = "2024-10-15";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function getKlaviyoConfig(): KlaviyoConfig | null {
  const rawCompany =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_KLAVIYO_COMPANY_ID : undefined;
  const rawList =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_KLAVIYO_NEWSLETTER_LIST_ID
      : undefined;
  const companyId = typeof rawCompany === "string" ? rawCompany.trim() : "";
  const listId = typeof rawList === "string" ? rawList.trim() : "";
  if (!companyId || !listId) return null;
  return { companyId, listId };
}

export async function subscribeToNewsletter(
  email: string,
  source = "footer",
  configOverride?: KlaviyoConfig | null,
): Promise<KlaviyoResult> {
  const trimmed = email.trim().toLowerCase();
  if (!isEmail(trimmed)) return { ok: false, reason: "invalid-email" };
  const cfg = configOverride === undefined ? getKlaviyoConfig() : configOverride;
  if (!cfg) return { ok: false, reason: "not-configured" };

  const body = {
    data: {
      type: "subscription",
      attributes: {
        custom_source: source,
        profile: {
          data: {
            type: "profile",
            attributes: { email: trimmed, properties: { signup_source: source } },
          },
        },
      },
      relationships: { list: { data: { type: "list", id: cfg.listId } } },
    },
  };

  try {
    const res = await fetch(
      `${KLAVIYO_ENDPOINT}/?company_id=${encodeURIComponent(cfg.companyId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          revision: KLAVIYO_REVISION,
        },
        body: JSON.stringify(body),
      },
    );
    // 202 Accepted is Klaviyo's success response for this endpoint.
    if (res.status === 202 || res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, reason: "server", message: text || `HTTP ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      reason: "network",
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

// Test hook: build the request body without hitting the network. Lets
// unit tests assert payload shape independently of fetch.
export function buildSubscriptionPayload(email: string, cfg: KlaviyoConfig, source = "footer") {
  return {
    endpoint: `${KLAVIYO_ENDPOINT}/?company_id=${encodeURIComponent(cfg.companyId)}`,
    revision: KLAVIYO_REVISION,
    body: {
      data: {
        type: "subscription",
        attributes: {
          custom_source: source,
          profile: {
            data: {
              type: "profile",
              attributes: {
                email: email.trim().toLowerCase(),
                properties: { signup_source: source },
              },
            },
          },
        },
        relationships: { list: { data: { type: "list", id: cfg.listId } } },
      },
    },
  };
}
