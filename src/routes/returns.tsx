import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P, UL } from "@/components/PageShell";

export const Route = createFileRoute("/returns")({
  head: () =>
    routeMeta({
      path: "/returns",
      title: "Returns & Refunds | Roamforge",
      description:
        "Roamforge returns and refunds policy — cancellations, faulty goods and refund processing.",
    }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <PageShell eyebrow="RETURNS & REFUNDS" title="Returns Policy">
      <P>This policy explains cancellations, returns and remedies available to Roamforge customers.</P>
      <H2>Order Cancellations</H2>
      <P>
        Please contact us within 24 hours if you need to cancel an order. A cancellation completed
        before dispatch is free of charge. Because some orders are fulfilled directly by suppliers,
        dispatch may occur within that period and cancellation cannot be guaranteed.
      </P>
      <P>
        Once an order has been dispatched, it cannot be cancelled for change of mind. This does not
        limit any rights you may have under the Australian Consumer Law.
      </P>
      <H2>Change of Mind</H2>
      <P>
        Roamforge does not accept returns or provide refunds where you simply change your mind,
        order the wrong item, or no longer want the product. Please review product details and
        compatibility information carefully before ordering.
      </P>
      <H2>Faulty, Damaged or Incorrect Products</H2>
      <P>
        If your item arrives damaged, faulty, or incorrect, please contact us as soon as practicable
        after you notice the issue so we can help resolve it quickly.
      </P>
      <P>
        Nothing here limits your rights under the Australian Consumer Law. Your rights and remedies
        for faulty, damaged or incorrect goods are not restricted by any fixed notice period.
      </P>
      <P>Where required by the Australian Consumer Law, the available remedy may include:</P>
      <UL>
        <li>Repair</li>
        <li>Replacement</li>
        <li>Refund</li>
      </UL>
      <P>
        If a product is confirmed to have a fault covered by the Australian Consumer Law, Roamforge
        will reimburse reasonable return costs where required by law. Please contact us before
        sending an item so we can provide return instructions.
      </P>
      <H2>Refund Processing</H2>
      <P>
        Approved refunds are typically processed within 5–10 business days to the original payment
        method. Any delivery charge will be refunded where required by the Australian Consumer Law.
      </P>
    </PageShell>
  );
}
