/**
 * Vehicle fitment from real Shopify metafields (namespace `custom`).
 *
 * Only genuine, non-empty values returned by the Storefront API are ever
 * surfaced. Missing definitions, unpublished metafields and blank strings
 * all collapse to "no structured fitment", which lets the PDP fall back to
 * the conservative keyword extractor. We never invent compatibility.
 */

export const FITMENT_FIELDS = [
  { key: "vehicle_make", label: "Make" },
  { key: "vehicle_model", label: "Model" },
  { key: "vehicle_series", label: "Series" },
  { key: "year_range", label: "Years" },
  { key: "engine", label: "Engine" },
  { key: "installation_difficulty", label: "Installation" },
  { key: "fitment_notes", label: "Notes" },
] as const;

export type FitmentMetafield = {
  namespace?: string | null;
  key?: string | null;
  value?: string | null;
  type?: string | null;
} | null;

export interface FitmentRow {
  key: string;
  label: string;
  value: string;
}

/**
 * Shopify list metafields (`list.single_line_text_field`) arrive as a JSON
 * array string. Render those as a comma-separated list; everything else is
 * passed through as trimmed text.
 */
export function normalizeMetafieldValue(raw: string | null | undefined): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      // Not JSON after all — fall through and use the raw text.
    }
  }
  return trimmed;
}

/**
 * Build the ordered compatibility rows for a product. Returns an empty array
 * when Shopify supplied no usable values.
 */
export function readVehicleFitment(metafields: FitmentMetafield[] | undefined): FitmentRow[] {
  if (!Array.isArray(metafields) || metafields.length === 0) return [];
  const byKey = new Map<string, string>();
  for (const mf of metafields) {
    if (!mf || mf.namespace !== "custom" || !mf.key) continue;
    const value = normalizeMetafieldValue(mf.value);
    if (value) byKey.set(mf.key, value);
  }
  return FITMENT_FIELDS.filter((f) => byKey.has(f.key)).map((f) => ({
    key: f.key,
    label: f.label,
    value: byKey.get(f.key) as string,
  }));
}
