import { useState } from "react";
import { Loader2 } from "lucide-react";
import { subscribeToNewsletter, getKlaviyoConfig } from "@/lib/klaviyo";
import { trackSignUp } from "@/lib/analytics";

interface NewsletterFormProps {
  source?: string;
  variant?: "footer" | "popup";
  onSuccess?: () => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function NewsletterForm({
  source = "footer",
  variant = "footer",
  onSuccess,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const configured = getKlaviyoConfig() !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (status.kind === "submitting") return;
    setStatus({ kind: "submitting" });
    const result = await subscribeToNewsletter(email, source);
    if (result.ok) {
      setStatus({ kind: "success" });
      trackSignUp(source);
      setEmail("");
      onSuccess?.();
      return;
    }
    const message =
      result.reason === "invalid-email"
        ? "Please enter a valid email address."
        : result.reason === "not-configured"
          ? "Signups aren't wired up yet — please check back soon."
          : result.reason === "network"
            ? "Couldn't reach the newsletter service. Please try again."
            : "Something went wrong. Please try again.";
    setStatus({ kind: "error", message });
  };

  const dark = variant === "footer";
  const inputCls = dark
    ? "min-h-11 flex-1 bg-rf-dark-2 border border-white/10 px-3 py-2 text-sm text-rf-cream placeholder:text-rf-cream/40 focus:outline-none focus:border-rf-tan"
    : "min-h-11 flex-1 bg-white border border-rf-dark/20 px-3 py-2 text-sm text-rf-dark placeholder:text-rf-dark/40 focus:outline-none focus:border-rf-tan";
  const btnCls = dark
    ? "min-h-11 bg-rf-tan px-4 py-2 text-xs font-semibold tracking-[0.14em] text-rf-dark hover:bg-rf-tan-bright disabled:opacity-60"
    : "min-h-11 bg-rf-dark px-4 py-2 text-xs font-semibold tracking-[0.14em] text-rf-cream hover:bg-rf-dark-2 disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} noValidate aria-describedby={`newsletter-status-${variant}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor={`newsletter-email-${variant}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-email-${variant}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={200}
          className={inputCls}
          aria-invalid={status.kind === "error" ? "true" : "false"}
        />
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          aria-hidden="true"
          name="website"
        />
        <button type="submit" disabled={status.kind === "submitting"} className={btnCls}>
          {status.kind === "submitting" ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden />
          ) : (
            "SUBSCRIBE"
          )}
        </button>
      </div>
      <p
        id={`newsletter-status-${variant}`}
        aria-live="polite"
        className={`mt-2 text-[11px] leading-relaxed ${
          status.kind === "error"
            ? "text-rose-500"
            : status.kind === "success"
              ? dark
                ? "text-rf-tan"
                : "text-emerald-700"
              : dark
                ? "text-rf-cream/50"
                : "text-muted-foreground"
        }`}
      >
        {status.kind === "success"
          ? "Thanks — you're subscribed. Watch your inbox for your welcome message."
          : status.kind === "error"
            ? status.message
            : configured
              ? "By subscribing you agree to receive marketing emails from Roamforge. Unsubscribe any time."
              : "Enter your email to be first to hear about new gear and offers."}
      </p>
    </form>
  );
}
