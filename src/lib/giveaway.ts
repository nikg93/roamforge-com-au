/**
 * Roamforge recovery-safety giveaway — shared, client-safe constants.
 *
 * The promotion is a GAME OF SKILL. Everything here is copy/config only; the
 * authoritative launch switch lives in the `giveaway_launch_config` row in the
 * database (`launch_enabled` AND `supplier_confirmed` must both be true and the
 * current time must fall inside the window before entries are accepted).
 */

export const GIVEAWAY_ID = "recovery-kit-2026-08";
export const GIVEAWAY_TERMS_VERSION = "v1.0-2026-08";

export const GIVEAWAY_PATH = "/giveaway/recovery-kit";
export const GIVEAWAY_TERMS_PATH = "/giveaway/recovery-kit/terms";
export const CHECKLIST_PATH = "/recovery-checklist";

export const MAX_RESPONSE_WORDS = 25;

export const PROMOTER = {
  name: "Roamforge",
  abn: "12 269 090 681",
  location: "WA 6066, Australia",
  email: "info@roamforge.com.au",
} as const;

export const PRIZE = {
  name: "Air On Board 20T Soft Shackle & 8T Snatch Ring Recovery Kit",
  sku: "AOB-RK407",
  valueAud: 87.9,
  quantity: 1,
} as const;

export const PROMOTION = {
  opens: "9:00am AWST Monday 17 August 2026",
  closes: "11:59pm AWST Sunday 30 August 2026",
  judging: "Monday 31 August 2026, remotely in Western Australia",
  winnerNotified: "Tuesday 1 September 2026",
  responseWindowDays: 5,
  question: "What recovery-equipment check do you complete before heading off-road, and why?",
} as const;

export const SCORING = [
  { label: "Practical safety value", weight: "50%" },
  { label: "Relevance to the question", weight: "30%" },
  { label: "Clarity and originality", weight: "20%" },
] as const;

export const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"] as const;
export type AuState = (typeof AU_STATES)[number];

/** Word count used for the live counter AND re-validated server-side. */
export function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
