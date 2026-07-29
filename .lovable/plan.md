## Goal

GA4 `G-QGGYL7FRLG` loads on production but transmits nothing. Make it actually record traffic and events. No business content, offer wording, or design changes.

## Findings this plan is based on

- Live test after consent: `gtag/js?id=G-QGGYL7FRLG` is requested, `window.gtag` is a function, `dataLayer` contains `["config","G-QGGYL7FRLG"]` — but **zero** requests to `*.google-analytics.com` or `/g/collect` over 12 seconds, including after an SPA navigation.
- Meta Pixel ID: does not exist in chat history, repo, git history, plan files, or secrets. Nothing to configure.
- Shopify custom app `Windsor AI`: no trace in any project record; never set up from here.

## Step 1 — Confirm the root cause before changing anything

`src/components/Integrations.tsx` installs a `gtag` shim that pushes a plain array into `dataLayer`. Google's `gtag.js` recognises `js` / `config` / `event` commands by the `arguments` object, not by an array literal, which would explain a loaded-but-silent tag. Verify by comparing the live `dataLayer` entry types against a known-good gtag page before editing. If the evidence points elsewhere (for example Consent Mode default `denied` never being updated to `granted`), fix that instead.

## Step 2 — Correct the tag installation

Assuming Step 1 confirms the shim:

- Replace the shim with the canonical form so commands are pushed as `arguments`.
- Ensure ordering is `js` → `config` → `gtag.js` script load, and that `config` runs only once.
- Keep every existing consent behaviour exactly as-is: nothing loads before analytics consent, and revoking consent still pushes `analytics_storage: denied` and removes the loader.

## Step 3 — Verify events actually transmit

Re-run the live browser test after consent and require, as hard evidence:

- at least one `/g/collect` request carrying `tid=G-QGGYL7FRLG` and `en=page_view`
- a second `page_view` on SPA navigation to `/shop`
- `view_item` on a product page and `add_to_cart` on an add
- `begin_checkout` on the checkout handoff, stopping before any order

Report the exact query parameters observed. GA4 is not called working until collect hits are seen.

## Step 4 — QA and deploy

Run format, lint, typecheck, unit tests, static/catalogue checks, and the production build, then publish and repeat Step 3 against `roamforge.com.au`.

## External blockers (cannot be resolved in code)

1. **Meta Pixel ID** — no value exists anywhere in this project. Provide the numeric ID from Meta Events Manager and it can be wired the same public-config way GA4 now is.
2. **Windsor AI Shopify app** — no record of installation, scopes, or redirect URLs. Its setup lives in Shopify admin under Settings → Apps and sales channels → Develop apps; details would need to be read there.
3. **Purchase tracking** — the order completes on Shopify checkout, so GA4 and Meta must also be installed in Shopify admin (Customer events / Meta sales channel) with the same IDs. Not a code change in this project.
