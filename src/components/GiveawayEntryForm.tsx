import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import {
  AU_STATES,
  GIVEAWAY_TERMS_PATH,
  MAX_RESPONSE_WORDS,
  PROMOTION,
  countWords,
} from "@/lib/giveaway";
import { submitGiveawayEntry } from "@/lib/giveaway.functions";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; marketing: boolean }
  | { kind: "error"; message: string };

const labelCls = "block text-xs font-semibold tracking-[0.14em] text-rf-dark/70 mb-1";
const fieldCls =
  "min-h-11 w-full bg-white border border-rf-dark/20 px-3 py-2 text-sm text-rf-dark placeholder:text-rf-dark/40 focus:outline-none focus:ring-2 focus:ring-rf-tan focus:border-rf-tan disabled:bg-rf-dark/5 disabled:text-rf-dark/50";

export function GiveawayEntryForm({ open, closed }: { open: boolean; closed: boolean }) {
  const submit = useServerFn(submitGiveawayEntry);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [response, setResponse] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const words = countWords(response);
  const overLimit = words > MAX_RESPONSE_WORDS;

  if (status.kind === "success") {
    return (
      <div
        role="status"
        className="border border-rf-dark/15 bg-white p-6"
        data-testid="giveaway-confirmation"
      >
        <h3 className="font-display text-xl tracking-wide text-rf-dark">Entry received</h3>
        <p className="mt-2 text-sm text-rf-dark/80">
          Thanks — your entry has been recorded. Judging takes place {PROMOTION.judging}. We only
          contact you about this promotion if you are the provisional winner.
        </p>
        <p className="mt-3 text-sm text-rf-dark/70">
          {marketing
            ? "You also asked to receive Roamforge emails. That is a separate, optional signup and has no effect on your entry or chance of winning."
            : "You did not opt in to Roamforge marketing emails, so you have not been subscribed to anything."}
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!open || status.kind === "submitting") return;
    const form = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const state = String(form.get("state") ?? "");
    if (!firstName) next["firstName"] = "Enter your first name.";
    if (!lastName) next["lastName"] = "Enter your last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next["email"] = "Enter a valid email address.";
    if (!state) next["state"] = "Select your state or territory.";
    if (!form.get("age")) next["age"] = "You must confirm you are 18 or over.";
    if (!form.get("terms")) next["terms"] = "You must accept the official terms.";
    if (words < 1) next["response"] = "Please answer the entry question.";
    else if (overLimit) next["response"] = `Use ${MAX_RESPONSE_WORDS} words or fewer.`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus({ kind: "submitting" });
    const params =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = params?.get(key);
      if (v) utm[key] = v;
    }
    const result = await submit({
      data: {
        firstName,
        lastName,
        email,
        state,
        ageConfirmed: true,
        response,
        termsAccepted: true,
        marketingConsent: marketing,
        source: "giveaway-recovery-kit",
        utm,
        company: String(form.get("company") ?? ""),
      },
    });
    if (result.ok) setStatus({ kind: "success", marketing });
    else setStatus({ kind: "error", message: result.message });
  }

  const err = (key: string) =>
    errors[key] ? (
      <p id={`${key}-error`} className="mt-1 text-xs text-red-700">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {!open ? (
        <p
          role="status"
          className="border border-rf-tan bg-rf-tan/15 px-4 py-3 text-sm font-semibold text-rf-dark"
        >
          {closed
            ? "Entries have closed. Thank you to everyone who entered. Judging is now underway."
            : `Entries are not open yet. The form below is disabled until the promotion opens (${PROMOTION.opens}).`}
        </p>
      ) : null}

      <fieldset disabled={!open || status.kind === "submitting"} className="space-y-5">
        <legend className="sr-only">Giveaway entry form</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="gw-first">
              FIRST NAME
            </label>
            <input
              id="gw-first"
              name="firstName"
              autoComplete="given-name"
              className={fieldCls}
              aria-invalid={!!errors["firstName"]}
              aria-describedby={errors["firstName"] ? "firstName-error" : undefined}
            />
            {err("firstName")}
          </div>
          <div>
            <label className={labelCls} htmlFor="gw-last">
              LAST NAME
            </label>
            <input
              id="gw-last"
              name="lastName"
              autoComplete="family-name"
              className={fieldCls}
              aria-invalid={!!errors["lastName"]}
              aria-describedby={errors["lastName"] ? "lastName-error" : undefined}
            />
            {err("lastName")}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="gw-email">
              EMAIL
            </label>
            <input
              id="gw-email"
              name="email"
              type="email"
              autoComplete="email"
              className={fieldCls}
              aria-invalid={!!errors["email"]}
              aria-describedby={errors["email"] ? "email-error" : undefined}
            />
            {err("email")}
          </div>
          <div>
            <label className={labelCls} htmlFor="gw-state">
              STATE / TERRITORY
            </label>
            <select
              id="gw-state"
              name="state"
              defaultValue=""
              className={fieldCls}
              aria-invalid={!!errors["state"]}
              aria-describedby={errors["state"] ? "state-error" : undefined}
            >
              <option value="">Select…</option>
              {AU_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {err("state")}
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="gw-response">
            {PROMOTION.question.toUpperCase()}
          </label>
          <textarea
            id="gw-response"
            name="response"
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className={`${fieldCls} min-h-28`}
            aria-invalid={overLimit || !!errors["response"]}
            aria-describedby="gw-response-count"
          />
          <p
            id="gw-response-count"
            aria-live="polite"
            className={`mt-1 text-xs ${overLimit ? "text-red-700" : "text-rf-dark/60"}`}
          >
            {words} / {MAX_RESPONSE_WORDS} words
            {overLimit ? " — please shorten your answer." : ""}
          </p>
          {err("response")}
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-rf-dark/80">
            <input type="checkbox" name="age" className="mt-1 size-5 accent-rf-tan" />
            <span>I confirm I am 18 years or older and a resident of Australia.</span>
          </label>
          {err("age")}
          <label className="flex items-start gap-3 text-sm text-rf-dark/80">
            <input type="checkbox" name="terms" className="mt-1 size-5 accent-rf-tan" />
            <span>
              I have read and accept the{" "}
              <Link className="text-rf-tan underline" to={GIVEAWAY_TERMS_PATH}>
                official terms and conditions
              </Link>{" "}
              and the{" "}
              <Link className="text-rf-tan underline" to="/privacy">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {err("terms")}
          <label className="flex items-start gap-3 text-sm text-rf-dark/80">
            <input
              type="checkbox"
              name="marketing"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-1 size-5 accent-rf-tan"
            />
            <span>
              Optional: email me Roamforge news and offers. This is not required to enter or win.
            </span>
          </label>
        </div>

        {/* honeypot */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {status.kind === "error" ? (
          <p role="alert" className="text-sm text-red-700">
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          className="min-h-11 inline-flex items-center gap-2 bg-rf-dark px-6 py-2 text-xs font-semibold tracking-[0.16em] text-rf-cream hover:bg-rf-dark-2 disabled:opacity-50"
        >
          {status.kind === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
          {open ? "SUBMIT ENTRY" : closed ? "ENTRIES CLOSED" : "ENTRIES COMING SOON"}
        </button>
      </fieldset>
    </form>
  );
}
