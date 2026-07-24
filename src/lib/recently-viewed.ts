export interface RecentlyViewedItem {
  handle: string;
  title: string;
  image?: string;
  price?: string;
  currencyCode?: string;
  viewedAt: number;
}

export const RECENTLY_VIEWED_KEY = "roamforge-recently-viewed-v1";
export const RECENTLY_VIEWED_UPDATED_EVENT = "roamforge-recently-viewed-updated";
export const RECENTLY_VIEWED_MAX = 12;

export function readRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is RecentlyViewedItem =>
          x && typeof x === "object" && typeof x.handle === "string" && typeof x.title === "string",
      )
      .slice(0, RECENTLY_VIEWED_MAX);
  } catch {
    return [];
  }
}

export function addRecentlyViewedTo(
  prior: RecentlyViewedItem[],
  item: RecentlyViewedItem,
): RecentlyViewedItem[] {
  const filtered = prior.filter((p) => p.handle !== item.handle);
  return [item, ...filtered].slice(0, RECENTLY_VIEWED_MAX);
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">) {
  if (typeof window === "undefined") return;
  try {
    const next = addRecentlyViewedTo(readRecentlyViewed(), { ...item, viewedAt: Date.now() });
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_UPDATED_EVENT));
  } catch {
    /* swallow */
  }
}
