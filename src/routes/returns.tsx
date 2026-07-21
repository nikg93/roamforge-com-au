import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P, UL } from "@/components/PageShell";

export const Route = createFileRoute("/returns")({
  head: () =>
    routeMeta({
      path: "/returns",
      title: "Returns & Refunds | Roamforge",
      description:
        "Roamforge returns and refunds policy — how to request a return and eligibility.",
    }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <PageShell eyebrow="RETURNS & REFUNDS" title="Returns Policy">
      <P>We want you to be completely satisfied with your purchase.</P>
      <H2>Change of Mind Returns</H2>
      <P>We accept change-of-mind returns within 30 days of delivery provided that:</P>
      <UL>
        <li>The item is unused</li>
        <li>The item is in original packaging</li>
        <li>The item is in resalable condition</li>
      </UL>
      <P>
        Return shipping costs for change-of-mind returns are the responsibility of the customer.
      </P>
      <H2>Faulty or Damaged Products</H2>
      <P>
        If your item arrives damaged, faulty, or incorrect, please contact us within 7 days of
        receiving your order.
      </P>
      <P>Where applicable, we will:</P>
      <UL>
        <li>Replace the item</li>
        <li>Repair the item</li>
        <li>Offer a refund</li>
      </UL>
      <P>In accordance with Australian Consumer Law.</P>
      <H2>Refund Processing</H2>
      <P>Approved refunds are typically processed within 5–10 business days.</P>
    </PageShell>
  );
}
