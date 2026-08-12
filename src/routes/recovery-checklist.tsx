import { createFileRoute, Link } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, H3, P, UL } from "@/components/PageShell";
import { CHECKLIST_PATH, GIVEAWAY_PATH } from "@/lib/giveaway";

const SECTIONS: Array<{ heading: string; items: string[] }> = [
  {
    heading: "Before you leave home",
    items: [
      "Check tyre pressures and tread, including the spare, and pack a working gauge.",
      "Confirm your jack, wheel brace and jacking base plate are present and functional.",
      "Inspect recovery points — rated, chassis-mounted points only. Never recover from a tow ball.",
      "Test your air compressor and hose fittings before they are needed in the dirt.",
      "Charge and test communications: UHF radio, phone, and any satellite device.",
      "Tell someone your route and expected return time.",
    ],
  },
  {
    heading: "Recovery gear inspection",
    items: [
      "Snatch strap: check for cuts, abrasion, chemical damage, stiffness and UV fading.",
      "Soft shackles: inspect the knot, eye and body for fraying or heat glazing.",
      "Snatch ring or pulley: check for cracks, burrs and rope grooving.",
      "Bow shackles: pin turns freely, no bending, correct rating stamped and legible.",
      "Winch: rope condition, fairlead wear, clutch operation, remote and battery health.",
      "Tree trunk protector: no cuts, stitching intact.",
      "Dampener blanket present — never perform a strap or winch recovery without one.",
      "Traction boards: check teeth, mounting pins and that they are accessible, not buried.",
      "Gloves, long sleeves and eye protection packed with the recovery gear.",
    ],
  },
  {
    heading: "At the recovery site",
    items: [
      "Stop and assess before acting; rushing causes most recovery injuries.",
      "Dig out and lower tyre pressure first — often no recovery gear is needed at all.",
      "Identify rated recovery points on both vehicles and confirm ratings suit the load.",
      "Keep everyone well clear of the load path; bystanders behind and to the side only.",
      "Fit a dampener to every tensioned line.",
      "Agree hand signals and one person in charge before tension is applied.",
      "Apply load progressively — never a running start into a snatch strap.",
      "Reassess after each attempt instead of escalating force.",
    ],
  },
  {
    heading: "After the recovery",
    items: [
      "Inspect every item used and retire anything damaged rather than repacking it.",
      "Wash and dry straps before storage; mud and grit shorten strap life.",
      "Repack gear so it is reachable, and secure hard items so they cannot become projectiles.",
      "Re-inflate tyres to road pressures before returning to the bitumen.",
      "Note anything missing or worn so it is replaced before the next trip.",
    ],
  },
];

export const Route = createFileRoute("/recovery-checklist")({
  head: () =>
    routeMeta({
      path: CHECKLIST_PATH,
      title: "4WD Recovery Equipment Checklist (Free, Printable)",
      description:
        "A free, printable 4WD recovery equipment checklist covering pre-trip checks, gear inspection, safe recovery-site procedure and post-recovery care. No email required.",
      type: "article",
    }),
  component: ChecklistPage,
});

function ChecklistPage() {
  return (
    <PageShell eyebrow="FREE RESOURCE" title="4WD Recovery Equipment Checklist">
      <P>
        Use this checklist before every trip and before every recovery. It is free to read and print
        — no email address required. Recovery gear is only as safe as the last time someone actually
        inspected it.
      </P>
      <p className="print:hidden">
        <button
          type="button"
          onClick={() => typeof window !== "undefined" && window.print()}
          className="min-h-11 inline-flex items-center border border-rf-dark px-4 py-2 text-xs font-semibold tracking-widest text-rf-dark hover:bg-rf-dark hover:text-rf-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
        >
          PRINT THIS CHECKLIST
        </button>
      </p>

      {SECTIONS.map((section) => (
        <section key={section.heading}>
          <H2>{section.heading}</H2>
          <UL>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </UL>
        </section>
      ))}

      <H2>Safety note</H2>
      <P>
        This checklist is general guidance only, not training. Never recover from a tow ball, never
        exceed the rated capacity of any component, and follow the manufacturer instructions for
        every item you use.
      </P>

      <section className="mt-10 border border-rf-dark/15 bg-white p-6 print:hidden">
        <H3>More Roamforge guides are coming</H3>
        <P>
          This checklist stays free and ungated. Email updates are temporarily unavailable while
          Roamforge moves subscriptions to Shopify.
        </P>
      </section>

      <p className="print:hidden text-sm text-rf-dark/70">
        Also see our{" "}
        <Link className="text-rf-tan underline" to={GIVEAWAY_PATH}>
          recovery safety giveaway
        </Link>
        .
      </p>
    </PageShell>
  );
}
