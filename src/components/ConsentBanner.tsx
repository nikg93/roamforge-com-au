import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CONSENT_OPEN_EVENT,
  CONSENT_UPDATED_EVENT,
  readConsent,
  writeConsent,
  type ConsentPrefs,
} from "@/lib/consent";

/**
 * Privacy consent banner + preferences panel. Non-blocking (does not gate
 * site usage), no dark patterns — Reject All and Accept All are given equal
 * weight. Analytics/marketing default OFF until an explicit choice is made.
 */
export function ConsentBanner() {
  const [prefs, setPrefs] = useState<ConsentPrefs | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Hydrate from localStorage once the component mounts on the client.
  useEffect(() => {
    const initial = readConsent();
    setPrefs(initial);
    setAnalytics(initial.analytics);
    setMarketing(initial.marketing);

    const onOpen = () => setShowPanel(true);
    const onUpdate = () => {
      const next = readConsent();
      setPrefs(next);
      setAnalytics(next.analytics);
      setMarketing(next.marketing);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    window.addEventListener(CONSENT_UPDATED_EVENT, onUpdate);
    return () => {
      window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
      window.removeEventListener(CONSENT_UPDATED_EVENT, onUpdate);
    };
  }, []);

  // Focus management + ESC to close the preferences dialog.
  // Keeps focus inside the modal and returns it to the opener on close.
  useEffect(() => {
    if (!showPanel) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    const node = dialogRef.current;
    const focusables = node?.querySelectorAll<HTMLElement>(
      'button, [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setShowPanel(false);
      } else if (e.key === "Tab" && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [showPanel]);

  if (!prefs) return null;

  const acceptAll = () => {
    writeConsent({ analytics: true, marketing: true, decided: true });
    setShowPanel(false);
  };
  const rejectAll = () => {
    writeConsent({ analytics: false, marketing: false, decided: true });
    setShowPanel(false);
  };
  const savePanel = () => {
    writeConsent({ analytics, marketing, decided: true });
    setShowPanel(false);
  };

  const bannerVisible = !prefs.decided && !showPanel;

  return (
    <>
      {bannerVisible && (
        <div
          role="region"
          aria-label="Privacy preferences"
          className="fixed inset-x-3 bottom-3 z-50 max-w-3xl md:left-6 md:right-auto"
        >
          <div className="rounded border border-rf-dark bg-rf-cream text-rf-dark shadow-lg">
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <div>
                <p className="font-display text-sm tracking-widest">YOUR PRIVACY</p>
                <p className="mt-1 text-sm text-rf-dark/80">
                  We use essential cookies to run the site. With your permission we&apos;d also like
                  to use analytics (to understand how the site is used) and marketing tools (live
                  chat, email capture). You can change your choice any time.{" "}
                  <Link to="/privacy" className="underline hover:text-rf-tan">
                    Read our privacy policy
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="min-h-11 flex-1 border border-rf-dark px-4 py-2 text-xs font-semibold tracking-widest text-rf-dark hover:bg-rf-dark hover:text-rf-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                >
                  REJECT ALL
                </button>
                <button
                  type="button"
                  onClick={() => setShowPanel(true)}
                  className="min-h-11 flex-1 border border-rf-dark px-4 py-2 text-xs font-semibold tracking-widest text-rf-dark hover:bg-rf-dark hover:text-rf-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                >
                  MANAGE
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="min-h-11 flex-1 bg-rf-dark px-4 py-2 text-xs font-semibold tracking-widest text-rf-cream hover:bg-rf-dark-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2"
                >
                  ACCEPT ALL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPanel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
          className="fixed inset-0 z-50 flex items-end justify-center bg-rf-dark/60 p-3 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPanel(false);
          }}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-lg rounded border border-rf-dark bg-rf-cream text-rf-dark shadow-xl"
          >
            <div className="border-b border-rf-dark/10 p-5">
              <h2 id="consent-title" className="font-display text-xl tracking-widest">
                PRIVACY PREFERENCES
              </h2>
              <p id="consent-desc" className="mt-1 text-sm text-rf-dark/70">
                Choose which tools we can load in your browser.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Necessary</p>
                  <p className="text-xs text-rf-dark/70">
                    Required for the site and cart to work. Always on.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-rf-dark/70">
                  <input type="checkbox" checked disabled className="h-4 w-4" />
                  Required
                </label>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Analytics</p>
                  <p className="text-xs text-rf-dark/70">
                    Google Analytics 4 to measure page visits and improve the site.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="h-4 w-4"
                    aria-label="Enable analytics"
                  />
                  Enable
                </label>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Marketing</p>
                  <p className="text-xs text-rf-dark/70">
                    Live chat (Tidio) and email capture (Klaviyo).
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="h-4 w-4"
                    aria-label="Enable marketing"
                  />
                  Enable
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-rf-dark/10 p-4">
              <button
                type="button"
                onClick={rejectAll}
                className="min-h-11 flex-1 border border-rf-dark px-4 py-2 text-xs font-semibold tracking-widest text-rf-dark hover:bg-rf-dark hover:text-rf-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
              >
                REJECT ALL
              </button>
              <button
                type="button"
                onClick={savePanel}
                className="min-h-11 flex-1 bg-rf-dark px-4 py-2 text-xs font-semibold tracking-widest text-rf-cream hover:bg-rf-dark-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2"
              >
                SAVE PREFERENCES
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
