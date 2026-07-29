import { getKlaviyoConfig } from "./klaviyo";

export const WELCOME_DISCOUNT_PERCENT = 5;

export function isNativeWelcomePopupEnabled(): boolean {
  return getKlaviyoConfig() === null;
}

export function hasOtherOpenDialog(): boolean {
  if (typeof document === "undefined") return false;
  return !!document.querySelector(
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
  );
}
