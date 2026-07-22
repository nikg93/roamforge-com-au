// Consent preference store. Persists to localStorage under the versioned
// key CONSENT_STORAGE_KEY. `necessary` is always true; optional categories
// default to `false` until the user makes an explicit choice.
//
// Kept SSR-safe: every localStorage access is guarded and the module ships
// zero side effects at import time so route loaders (which run during SSR)
// can import it without breaking the Cloudflare worker runtime.

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "roamforge-consent-v1";
export const CONSENT_UPDATED_EVENT = "roamforge-consent-updated";

export interface ConsentPrefs {
  version: number;
  timestamp: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** True once the user has interacted with the banner. Used to decide
   * whether to show the banner on subsequent visits. */
  decided: boolean;
}

export const DEFAULT_CONSENT: ConsentPrefs = {
  version: CONSENT_VERSION,
  timestamp: 0,
  necessary: true,
  analytics: false,
  marketing: false,
  decided: false,
};

/** Parse a raw string blob (typically from localStorage). Never throws. */
export function parseConsent(raw: string | null | undefined): ConsentPrefs {
  if (!raw) return { ...DEFAULT_CONSENT };
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentPrefs> & Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_CONSENT };
    // A version mismatch means the schema changed — reset to defaults so
    // the banner asks again rather than trusting a stale allow-list.
    if (parsed.version !== CONSENT_VERSION) return { ...DEFAULT_CONSENT };
    return {
      version: CONSENT_VERSION,
      timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : 0,
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      decided: parsed.decided === true,
    };
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

export function readConsent(): ConsentPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_CONSENT };
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

export function writeConsent(next: Omit<ConsentPrefs, "version" | "timestamp" | "necessary">) {
  if (typeof window === "undefined") return;
  const value: ConsentPrefs = {
    version: CONSENT_VERSION,
    timestamp: Date.now(),
    necessary: true,
    analytics: next.analytics === true,
    marketing: next.marketing === true,
    decided: next.decided === true,
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT));
  } catch (err) {
    console.error("[consent] failed to persist", err);
  }
}

/** Explicit trigger — used by the "Privacy preferences" links. */
export const CONSENT_OPEN_EVENT = "roamforge-consent-open";
export function openConsentPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT));
}