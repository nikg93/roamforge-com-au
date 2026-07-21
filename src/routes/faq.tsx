import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H3, P } from "@/components/PageShell";

export const Route = createFileRoute("/faq")({
  head: () =>
    routeMeta({
      path: "/faq",
      title: "Roamforge FAQ | Shipping, Returns & Warranty",
      description: "Answers to common Roamforge questions on shipping, returns, warranty and product support.",
    }),
  component: FAQPage,
});

function FAQPage() {
  const faqs: [string, string][] = [
    ["Where are you located?", "Roamforge is based in Western Australia."],
    ["Do you offer Australia-wide shipping?", "Yes. We ship Australia-wide."],
    [
      "How long does shipping take?",
      "Most orders arrive within 3–10 business days depending on location.",
    ],
    [
      "Can I track my order?",
      "Yes. Tracking details will be emailed once your order has been dispatched.",
    ],
    ["Do you offer returns?", "Yes. Please refer to our Returns & Refunds Policy."],
    [
      "What payment methods do you accept?",
      "We accept major credit cards, PayPal, and other payment methods available at checkout.",
    ],
    [
      "Do your products come with warranties?",
      "Many products include manufacturer warranties. Warranty periods vary depending on the brand and product.",
    ],
  ];
  return (
    <PageShell eyebrow="FAQ" title="Frequently Asked Questions">
      {faqs.map(([q, a]) => (
        <div key={q}>
          <H3>{q}</H3>
          <P>{a}</P>
        </div>
      ))}
    </PageShell>
  );
}
