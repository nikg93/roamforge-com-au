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

// Some Shopify product descriptions are stored as plain text with real
// newlines (or, worse, literal "\n" escape sequences that were double-
// encoded on import). Browsers collapse whitespace, so rendering that raw
// through dangerouslySetInnerHTML produces one wall of text with visible
// "\n\n-" markers. When we detect no HTML block structure, convert the
// text to paragraphs and bullet lists before sanitising.
function normaliseWhitespace(input: string): string {
  // Decode literal "\n", "\r", "\t" escape sequences into real whitespace.
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plainTextToHtml(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const isBulletBlock = lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l));
      if (isBulletBlock) {
        const items = lines
          .map((l) => `<li>${escapeHtml(l.replace(/^[-*•]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

const HTML_BLOCK_RE = /<(p|ul|ol|li|h[1-6]|br|div|table|blockquote)\b/i;

export function sanitizeProductHtml(html: string): string {
  if (!html) return "";
  const normalised = normaliseWhitespace(html);
  const hasBlocks = HTML_BLOCK_RE.test(normalised);
  const asHtml = hasBlocks ? normalised : plainTextToHtml(normalised);
  return filter.process(asHtml);
}

export function textFromHtml(html: string, max = 160): string {
  if (!html) return "";
  const stripped = normaliseWhitespace(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= max) return stripped;
  // Cut at a word boundary and strip trailing punctuation/whitespace so the
  // ellipsis reads cleanly (never "word.\…" or "word,…").
  let cut = stripped.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  cut = cut.replace(/[\s\\/,.;:!?\-–—]+$/u, "");
  return `${cut}…`;
}
