import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, H3, P } from "@/components/PageShell";

export const Route = createFileRoute("/faq")({
  head: () =>
    routeMeta({
      path: "/faq",
      title: "Roamforge FAQ | Shipping, Returns & Warranty",
      description:
        "Answers to common Roamforge questions on shipping, returns, warranty and product support.",
    }),
  component: FAQPage,
});

function FAQPage() {
  const groups: Array<{ heading: string; items: Array<[string, string]> }> = [
    {
      heading: "About Roamforge",
      items: [["Where are you located?", "Roamforge is based in Western Australia."]],
    },
    {
      heading: "Shipping & Delivery",
      items: [
        ["Do you offer Australia-wide shipping?", "Yes. We ship Australia-wide."],
        [
          "Can I track my order?",
          "Yes. Tracking details are emailed once your order has been dispatched.",
        ],
      ],
    },
    {
      heading: "Returns & Warranty",
      items: [
        ["Do you offer returns?", "Yes. Please refer to our Returns & Refunds Policy."],
        [
          "Do your products come with warranties?",
          "Many products include manufacturer warranties. Warranty periods vary by brand and product — see the product page or our Warranty page for specifics.",
        ],
      ],
    },
    {
      heading: "Payments",
      items: [
        [
          "What payment methods do you accept?",
          "Payment methods available at checkout are provided by Shopify and shown on the checkout page.",
        ],
      ],
    },
  ];
  return (
    <PageShell eyebrow="FAQ" title="Frequently Asked Questions">
      {groups.map((g) => (
        <section key={g.heading} aria-label={g.heading}>
          <H2>{g.heading}</H2>
          {g.items.map(([q, a]) => (
            <div key={q}>
              <H3>{q}</H3>
              <P>{a}</P>
            </div>
          ))}
        </section>
      ))}
    </PageShell>
  );
}
