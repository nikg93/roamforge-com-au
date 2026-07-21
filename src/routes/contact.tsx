import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P } from "@/components/PageShell";

export const Route = createFileRoute("/contact")({
  head: () =>
    routeMeta({
      path: "/contact",
      title: "Contact Roamforge | Get in Touch",
      description:
        "Get in touch with the Roamforge team for product enquiries, warranty support and general questions.",
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageShell eyebrow="CONTACT US" title="Get In Touch">
      <P>Have a question about a product, order, or upcoming adventure? We're here to help.</P>
      <H2>Contact Details</H2>
      <P>
        Email:{" "}
        <a className="text-rf-tan underline" href="mailto:info@roamforge.com.au">
          info@roamforge.com.au
        </a>
      </P>
      <P>
        Sales:{" "}
        <a className="text-rf-tan underline" href="mailto:sales@roamforge.com.au">
          sales@roamforge.com.au
        </a>
      </P>
      <P>
        Customer Support:{" "}
        <a className="text-rf-tan underline" href="mailto:support@roamforge.com.au">
          support@roamforge.com.au
        </a>
      </P>
      <H2>Business Hours</H2>
      <P>Monday – Friday</P>
      <P>8:00 AM – 5:00 PM (AWST)</P>
      <P>We aim to respond to all enquiries within 24–48 business hours.</P>
    </PageShell>
  );
}
