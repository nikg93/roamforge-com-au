import { createFileRoute } from "@tanstack/react-router";
import { PageShell, H2, P, UL } from "@/components/PageShell";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping Information | Roamforge" },
      { name: "description", content: "Roamforge shipping times, costs, tracking and delivery information for Australia-wide orders." },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <PageShell eyebrow="SHIPPING POLICY" title="Shipping Information">
      <H2>Processing Times</H2>
      <P>Orders are typically processed within 1–3 business days after payment has been received.</P>
      <P>During peak periods, promotional events, or public holidays, processing times may be slightly extended.</P>
      <H2>Shipping Times</H2>
      <P>Estimated delivery times:</P>
      <UL>
        <li>Metro Areas: 3–7 business days</li>
        <li>Regional Areas: 5–10 business days</li>
        <li>Remote Areas: 7–14 business days</li>
      </UL>
      <P>Delivery times are estimates only and may vary depending on courier services and destination.</P>
      <H2>Shipping Costs</H2>
      <P>Shipping costs are calculated at checkout based on the size, weight, and destination of your order.</P>
      <H2>Tracking</H2>
      <P>Once your order has been dispatched, you'll receive a tracking number via email.</P>
      <H2>Delivery Issues</H2>
      <P>If your order has not arrived within the estimated timeframe, please contact us and we'll assist in locating your shipment.</P>
    </PageShell>
  );
}