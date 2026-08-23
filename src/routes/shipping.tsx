import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P, UL } from "@/components/PageShell";

export const Route = createFileRoute("/shipping")({
  head: () =>
    routeMeta({
      path: "/shipping",
      title: "Shipping Information | Roamforge",
      description:
        "Roamforge shipping options, dispatch times and delivery information for Australia.",
    }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <PageShell eyebrow="SHIPPING POLICY" title="Shipping Information">
      <H2>Processing Times</H2>
      <P>
        Orders are typically processed within 1–3 business days after payment has been received.
      </P>
      <P>
        During peak periods, promotional events, or public holidays, processing times may be
        slightly extended.
      </P>

      <H2>Estimated Delivery Times</H2>
      <P>
        Delivery estimates depend on the product, shipping service and destination. The estimates
        below are provided in business days and include normal order processing.
      </P>
      <UL>
        <li>Australia Post Parcel Post: 6–8 business days.</li>
        <li>Australia Post Express Post: 4–5 business days.</li>
        <li>Supplier, courier and freight orders: 4–17 business days.</li>
      </UL>
      <P>
        Delivery times are estimates only and may vary because of carrier services, destination,
        public holidays or supplier dispatch requirements.
      </P>

      <H2>Shipping Costs</H2>
      <P>
        The applicable shipping charge is shown at checkout before payment. Current Australia-wide
        rates are:
      </P>
      <UL>
        <li>Australia Post Parcel Post: $10.55–$24.95, based on parcel weight.</li>
        <li>Australia Post Express Post: $13.20–$32.95, based on parcel weight.</li>
        <li>Air On Board supplier products: $20.00 standard delivery.</li>
        <li>Courier and oversize products: $59.95 courier delivery.</li>
        <li>Freight and pallet products: $249.95 freight delivery.</li>
      </UL>
      <P>
        If an order contains items fulfilled by more than one supplier, the checkout shows the
        applicable delivery options and charges before you place the order.
      </P>

      <H2>Orders Fulfilled by Supplier Partners</H2>
      <P>
        Some products are fulfilled directly by supplier partners. Where an order
        includes these items, it may arrive in separate shipments and separate tracking details may
        be provided.
      </P>

      <H2>Tracking</H2>
      <P>Once your order has been dispatched, you'll receive a tracking number via email.</P>

      <H2>Delivery Issues</H2>
      <P>
        If your order has not arrived within the estimated timeframe, please contact us and we'll
        assist in locating your shipment.
      </P>
    </PageShell>
  );
}
