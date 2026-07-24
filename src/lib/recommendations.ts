import type { ShopifyProduct } from "@/lib/shopify";

type ProductNode = ShopifyProduct["node"];

function catTags(tags: string[] | undefined): Set<string> {
  const out = new Set<string>();
  (tags ?? []).forEach((t) => {
    if (/^cat-/i.test(t)) out.add(t.toLowerCase());
  });
  return out;
}

function otherTags(tags: string[] | undefined): Set<string> {
  const out = new Set<string>();
  (tags ?? []).forEach((t) => {
    if (!/^cat-/i.test(t)) out.add(t.toLowerCase());
  });
  return out;
}

export function scoreRecommendation(source: ProductNode, candidate: ProductNode): number {
  if (candidate.id === source.id) return -1;
  let score = 0;
  const srcCat = catTags(source.tags);
  const candCat = catTags(candidate.tags);
  let sharedCat = 0;
  candCat.forEach((t) => {
    if (srcCat.has(t)) sharedCat++;
  });
  score += sharedCat * 10;
  const srcTags = otherTags(source.tags);
  const candTags = otherTags(candidate.tags);
  let sharedTags = 0;
  candTags.forEach((t) => {
    if (srcTags.has(t)) sharedTags++;
  });
  score += sharedTags * 2;
  if (
    source.productType &&
    candidate.productType &&
    source.productType.trim().toLowerCase() === candidate.productType.trim().toLowerCase()
  ) {
    score += 4;
  }
  if (
    source.vendor &&
    candidate.vendor &&
    source.vendor.trim().toLowerCase() === candidate.vendor.trim().toLowerCase()
  ) {
    score += 1;
  }
  return score;
}

export function rankRecommendations(
  source: ProductNode,
  candidates: ShopifyProduct[],
  limit = 4,
): ShopifyProduct[] {
  return candidates
    .map((c) => ({ product: c, score: scoreRecommendation(source, c.node) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.product);
}
