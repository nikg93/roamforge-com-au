import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P, UL } from "@/components/PageShell";

export const Route = createFileRoute("/warranty")({
  head: () =>
    routeMeta({
      path: "/warranty",
      title: "Warranty Information | Roamforge",
      description: "Roamforge warranty coverage, claim process and exclusions for gear purchased through our store.",
    }),
  component: WarrantyPage,
});

function WarrantyPage() {
  return (
    <PageShell eyebrow="WARRANTY" title="Warranty Information">
      <P>
        Roamforge partners with reputable suppliers and manufacturers to provide quality products
        backed by warranty coverage.
      </P>
      <H2>Manufacturer Warranty</H2>
      <P>Many products sold by Roamforge are covered by the original manufacturer's warranty.</P>
      <P>Warranty periods vary between brands and products.</P>
      <H2>Warranty Claims</H2>
      <P>To submit a warranty claim, please provide:</P>
      <UL>
        <li>Order number</li>
        <li>Description of the issue</li>
        <li>Photos or videos showing the fault (if applicable)</li>
      </UL>
      <P>
        Claims can be submitted via:{" "}
        <a className="text-rf-tan underline" href="mailto:warranty@roamforge.com.au">
          warranty@roamforge.com.au
        </a>
      </P>
      <H2>Exclusions</H2>
      <P>Warranty coverage generally does not apply to:</P>
      <UL>
        <li>Normal wear and tear</li>
        <li>Improper installation</li>
        <li>Misuse or abuse</li>
        <li>Accidental damage</li>
        <li>Unauthorised modifications</li>
      </UL>
      <H2>Australian Consumer Law</H2>
      <P>Our goods come with guarantees that cannot be excluded under Australian Consumer Law.</P>
    </PageShell>
  );
}
