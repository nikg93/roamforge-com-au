import DOMPurify from "isomorphic-dompurify";

// Sanitizes trusted Shopify product description HTML for safe render.
// Restricts allowed tags to typical rich-text output.
export function sanitizeProductHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p","br","strong","em","b","i","u","ul","ol","li","a","h2","h3","h4","span","hr","blockquote","img","table","thead","tbody","tr","td","th",
    ],
    ALLOWED_ATTR: ["href","target","rel","src","alt","title"],
  });
}

export function textFromHtml(html: string, max = 160): string {
  if (!html) return "";
  const stripped = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return stripped.length > max ? `${stripped.slice(0, max - 1)}…` : stripped;
}