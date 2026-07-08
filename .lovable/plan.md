## Roamforge Website Update — Plan

Keep all existing branding, colors, logo, layout, and existing pages. Only the changes below.

### 1. Navigation (SiteHeader.tsx)
Replace current nav links with the main categories from the brief, plus Planners:
Performance · 12V & Vehicle Monitoring · GPS & Tracking · Lighting · Air Compressors · Recovery Gear · Touring & Camping · Vehicle Protection · Merch · Planners.
(That's 10 items — About / Contact move to footer-only to avoid crowding the top nav.)

### 2. Categories restructure (category.$slug.tsx + homepage grid)
- Rename `touring` → title "TOURING & CAMPING".
- Add two new category entries in `CATEGORY_MAP`:
  - `vehicle-protection` — nudge bars, bull bars, side steps, underbody protection (tag: `cat-vehicle-protection`).
  - `merch` — Roamforge branded apparel/accessories (tag: `cat-merch`).
- Keep `planners` in nav and homepage grid.
- Homepage `CATEGORIES` array updated to all 10 categories (brief's 9 + Planners) in the brief's order, each with its image + slug.

### 3. Category images
Generate 3 new full-width category images (fast tier) and swap on category hero + homepage tile:
- `cat-vehicle-protection.jpg` — modern 4WD with nudge bar / bull bar.
- `cat-merch.jpg` — Roamforge apparel at a campsite with touring vehicle.
- `cat-touring-camping.jpg` — premium AU campsite with awning + chairs (replaces current touring image if it doesn't match).
Existing Performance / Monitoring / GPS / Lighting / Compressors / Recovery / Planners images stay.
Also add a full-width hero image at the top of each category page (currently only a dark banner — put the category image behind it as a hero).

### 4. "Shop by Category" grid polish
Keep the existing grid structure and colors, but:
- Larger tiles (aspect 4/5 on desktop, more premium feel).
- Category name at bottom, subtle uppercase "SHOP →" label appears on hover.
- Smoother hover zoom + darken transition.

### 5. Trusted Brands section (new)
Add a homepage section below Categories titled **TRUSTED BRANDS** with a 3-logo grid:
- Ultimate9 → links to `/category/throttle-controllers`.
- Air On Board → links to `/category/air-compressors`.
- JM Fab → links to `/category/vehicle-protection`.
Logos generated as transparent PNGs (premium tier for legible text) in `src/assets/brands/`.

### 6. Adventure Lifestyle section (new)
Full-width section on the homepage between Trusted Brands and Why Roamforge:
- Background: a new "premium AU touring setup in remote landscape" image.
- Heading: **Built For The Journey**
- Body: "Premium 4WD, touring and camping gear sourced from trusted Australian brands."
- Button: **EXPLORE PRODUCTS** → `/category/performance`.

### 7. Why Roamforge upgrade
Replace the current 3-item block with 5 icon boxes in the brief's order:
Australian Owned · Trusted Brands · Secure Checkout · Fast Shipping · Adventure Ready.
Keep the dark background + tan icon styling — 5 columns on desktop / 2 on mobile.

### What is NOT changing
Colors, typography, logo, cart flow, product pages, Shopify integration, footer, About / Contact / legal pages, existing products.

### Technical notes
- Shopify: new categories rely on tags `cat-vehicle-protection` and `cat-merch`. Existing Shopify products need those tags added in Shopify admin to appear — I'll flag this after implementation. No products created or deleted.
- Files touched: `src/components/SiteHeader.tsx`, `src/routes/index.tsx`, `src/routes/category.$slug.tsx`, new `src/components/TrustedBrands.tsx` + `src/components/LifestyleSection.tsx`, plus new image assets under `src/assets/`.
- No routing changes beyond adding two `CATEGORY_MAP` entries; `category.$slug.tsx` already handles dynamic slugs.
