import { createFileRoute, Link } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P, UL } from "@/components/PageShell";
import { GiveawayEntryForm } from "@/components/GiveawayEntryForm";
import { getGiveawayStatus } from "@/lib/giveaway.functions";
import {
  CHECKLIST_PATH,
  GIVEAWAY_PATH,
  GIVEAWAY_TERMS_PATH,
  MAX_RESPONSE_WORDS,
  PRIZE,
  PROMOTER,
  PROMOTION,
  SCORING,
} from "@/lib/giveaway";

export const Route = createFileRoute("/giveaway/recovery-kit")({
  loader: () => getGiveawayStatus(),
  head: ({ loaderData }) =>
    routeMeta({
      path: GIVEAWAY_PATH,
      title: "Recovery Kit Giveaway | Roamforge",
      description:
        "A skill-based Roamforge promotion: tell us the recovery-equipment check you complete before heading off-road and go in the draw for an Air On Board recovery kit.",
      // Indexable only once the promotion is actually live.
      noindex: !loaderData?.open,
    }),
  component: GiveawayPage,
});

function GiveawayPage() {
  const status = Route.useLoaderData();
  const closed =
    !status.open && !!status.closesAt && Date.now() > new Date(status.closesAt).getTime();

  return (
    <PageShell eyebrow="GAME OF SKILL" title="Recovery Safety Giveaway">
      {!status.open ? (
        <p className="border border-rf-tan bg-rf-tan/15 px-4 py-3 text-sm font-semibold text-rf-dark">
          {closed
            ? "Entries have closed. Thank you to everyone who entered. Judging is now underway."
            : "Coming soon. Entries are not open and no entries are being accepted yet."}
        </p>
      ) : null}

      <P>
        Roamforge is running a free, skill-based recovery-safety promotion. There is no purchase
        necessary and no element of chance — entries are judged on the practical safety value of
        your answer.
      </P>

      <H2>The prize</H2>
      <P>
        {PRIZE.quantity} × {PRIZE.name} (SKU {PRIZE.sku}), valued at ${PRIZE.valueAud.toFixed(2)}{" "}
        AUD. Roamforge covers standard delivery to one deliverable Australian address. Express
        shipping is excluded.
      </P>

      <H2>How to enter</H2>
      <UL>
        <li>Free entry, Australia-wide, open to residents aged 18 or over.</li>
        <li>One entry per person and per email address.</li>
        <li>
          Answer in {MAX_RESPONSE_WORDS} words or fewer: “{PROMOTION.question}”
        </li>
        <li>
          Opens {PROMOTION.opens}; closes {PROMOTION.closes}.
        </li>
      </UL>

      <H2>How entries are judged</H2>
      <UL>
        {SCORING.map((s) => (
          <li key={s.label}>
            {s.label} — {s.weight}
          </li>
        ))}
      </UL>
      <P>
        Judging takes place {PROMOTION.judging}. The provisional winner is emailed by{" "}
        {PROMOTION.winnerNotified} and has {PROMOTION.responseWindowDays} calendar days to respond.
        Entries containing unsafe advice, including tow-ball recovery, may be excluded.
      </P>

      <H2>Enter</H2>
      <GiveawayEntryForm open={status.open} closed={closed} />

      <H2>Before you enter</H2>
      <P>
        Read the{" "}
        <Link className="text-rf-tan underline" to={GIVEAWAY_TERMS_PATH}>
          official terms and conditions
        </Link>{" "}
        and our{" "}
        <Link className="text-rf-tan underline" to="/privacy">
          privacy policy
        </Link>
        . Need ideas? Our free{" "}
        <Link className="text-rf-tan underline" to={CHECKLIST_PATH}>
          4WD recovery equipment checklist
        </Link>{" "}
        is available to read and print with no email required.
      </P>

      <P>
        Promoter: {PROMOTER.name}, ABN {PROMOTER.abn}, {PROMOTER.location}. Contact{" "}
        <a className="text-rf-tan underline" href={`mailto:${PROMOTER.email}`}>
          {PROMOTER.email}
        </a>
        .
      </P>
      <P>
        This promotion is in no way sponsored, endorsed, administered by, or associated with
        Facebook or Instagram.
      </P>
    </PageShell>
  );
}
