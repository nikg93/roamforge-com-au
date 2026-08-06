import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P } from "@/components/PageShell";

export const Route = createFileRoute("/contact")({
  head: () =>
    routeMeta({
      path: "/contact",
      title: "Contact Roamforge | Get in Touch",
      description:
        "Contact Roamforge for product enquiries, order support and warranty assistance.",
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageShell eyebrow="CONTACT US" title="Get In Touch">
      <P>Have a question about a product, order, or upcoming adventure? We're here to help.</P>
      <H2>Business Details</H2>
      <P>Legal entity: Nikola Grujic, sole trader</P>
      <P>Registered business name: ROAMFORGE</P>
      <P>ABN: 12 269 090 681</P>
      <P>
        Phone:{" "}
        <a className="text-rf-tan underline" href="tel:+61472725709">
          0472 725 709
        </a>
      </P>
      <P>
        Email:{" "}
        <a className="text-rf-tan underline" href="mailto:info@roamforge.com.au">
          info@roamforge.com.au
        </a>
      </P>
      <P>Postal address: PO Box 4017, Alexander Heights WA 6064, Australia</P>
      <P>
        Roamforge is an online-only retailer. This postal address is not a retail store or customer
        collection point.
      </P>
      <H2>Business Hours</H2>
      <P>Monday – Friday</P>
      <P>8:00 AM – 5:00 PM (AWST)</P>
      <P>We aim to respond to all enquiries within 24–48 business hours.</P>
    </PageShell>
  );
}
