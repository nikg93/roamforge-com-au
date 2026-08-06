import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P } from "@/components/PageShell";

export const Route = createFileRoute("/about")({
  head: () =>
    routeMeta({
      path: "/about",
      title: "About Roamforge | Australian 4WD & Touring Gear",
      description:
        "Founded in Western Australia, Roamforge is an online retailer supplying 4WD, camping and touring gear for Australian adventures.",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell eyebrow="ABOUT US" title="About Roamforge">
      <P>
        At Roamforge, we believe every adventure begins with reliable gear and a passion for
        exploring beyond the ordinary.
      </P>
      <P>
        Founded in Western Australia, Roamforge is an online-only retailer created for 4WD
        enthusiasts, campers, overlanders, and outdoor adventurers. Whether you're tackling remote
        tracks, setting up camp under the stars, or preparing your vehicle for the next big journey,
        we're here to help you gear up with confidence.
      </P>
      <H2>How We Fulfil Orders</H2>
      <P>
        We source products from Australian brands and suppliers. Depending on the product, your
        order may be dispatched directly by one of our Australian suppliers, and items in the same
        order may arrive separately.
      </P>
      <H2>Our Mission</H2>
      <P>
        To provide 4WD, camping, touring, and outdoor products that support Australian adventures.
      </P>
      <P>
        We select products from established brands and suppliers with a focus on performance,
        durability, and value.
      </P>
      <P>
        At Roamforge, we're not just selling products—we're building a community of adventurers who
        share a passion for exploring Australia's incredible landscapes.
      </P>
      <p className="font-display text-2xl text-rf-tan tracking-wide pt-4">Forged for Adventure.</p>
    </PageShell>
  );
}
