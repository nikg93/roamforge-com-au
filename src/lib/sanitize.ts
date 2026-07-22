import { FilterXSS } from "xss";

// Pure-JS sanitizer. Runs identically in Node, browsers, and Cloudflare
// Workers (unlike isomorphic-dompurify, which requires jsdom and crashes at
// SSR on workerd). Whitelists Shopify's typical rich-text tags/attrs and
// forces safe rel on anchors.
const ATTRS = ["href", "target", "rel", "src", "alt", "title"];
const TAG_ATTRS: Record<string, string[]> = {
  p: [],
  br: [],
  strong: [],
  em: [],
  b: [],
  i: [],
  u: [],
  ul: [],
  ol: [],
  li: [],
  a: ATTRS,
  h2: [],
  h3: [],
  h4: [],
  span: [],
  hr: [],
  blockquote: [],
  img: ATTRS,
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  td: [],
  th: [],
};

const filter = new FilterXSS({
  whiteList: TAG_ATTRS,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  onTagAttr: (tag, name, value) => {
    if (tag === "a" && name === "href") {
      // Only allow http(s)/mailto/tel/relative
      if (/^(https?:|mailto:|tel:|\/|#)/i.test(value)) {
        return `href="${value.replace(/"/g, "&quot;")}"`;
      }
      return "";
    }
    if (tag === "a" && name === "target") {
      return `target="_blank" rel="noopener noreferrer"`;
    }
    return undefined; // fall through to default handling
  },
});

export function sanitizeProductHtml(html: string): string {
  if (!html) return "";
  return filter.process(html);
}

export function textFromHtml(html: string, max = 160): string {
  if (!html) return "";
  const stripped = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > max ? `${stripped.slice(0, max - 1)}…` : stripped;
}
