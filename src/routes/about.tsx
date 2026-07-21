import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P } from "@/components/PageShell";

export const Route = createFileRoute("/about")({
  head: () =>
    routeMeta({
      path: "/about",
      title: "About Roamforge | Australian 4WD & Touring Gear",
      description: "Founded in Western Australia, Roamforge supplies premium 4WD, camping and touring gear for Australian adventures.",
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
        Founded in Western Australia, Roamforge was created for 4WD enthusiasts, campers,
        overlanders, and outdoor adventurers who demand quality equipment they can trust. Whether
        you're tackling remote tracks, setting up camp under the stars, or preparing your vehicle
        for the next big journey, we're here to help you gear up with confidence.
      </P>
      <H2>Our Mission</H2>
      <P>
        To provide premium 4WD, camping, touring, and outdoor products that inspire adventure and
        withstand the toughest Australian conditions.
      </P>
      <P>
        We carefully select products from trusted brands and suppliers to ensure our customers
        receive equipment that delivers performance, durability, and value.
      </P>
      <P>
        At Roamforge, we're not just selling products—we're building a community of adventurers who
        share a passion for exploring Australia's incredible landscapes.
      </P>
      <p className="font-display text-2xl text-rf-tan tracking-wide pt-4">Forged for Adventure.</p>
    </PageShell>
  );
}
