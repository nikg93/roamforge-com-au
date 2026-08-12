import { createFileRoute, Link } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P, UL } from "@/components/PageShell";
import { getGiveawayStatus } from "@/lib/giveaway.functions";
import {
  GIVEAWAY_PATH,
  GIVEAWAY_TERMS_PATH,
  GIVEAWAY_TERMS_VERSION,
  MAX_RESPONSE_WORDS,
  PRIZE,
  PROMOTER,
  PROMOTION,
  SCORING,
} from "@/lib/giveaway";

export const Route = createFileRoute("/giveaway/recovery-kit/terms")({
  loader: () => getGiveawayStatus(),
  head: ({ loaderData }) =>
    routeMeta({
      path: GIVEAWAY_TERMS_PATH,
      title: "Recovery Kit Giveaway Terms | Roamforge",
      description:
        "Official terms and conditions for the Roamforge recovery-safety game of skill, including eligibility, judging criteria, prize details and privacy.",
      noindex: !loaderData?.open,
    }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell eyebrow="OFFICIAL TERMS" title="Recovery Safety Giveaway — Terms and Conditions">
      <P>
        Terms version {GIVEAWAY_TERMS_VERSION}. By entering, you accept these terms. Entry is only
        possible via{" "}
        <Link className="text-rf-tan underline" to={GIVEAWAY_PATH}>
          the entry page
        </Link>
        .
      </P>

      <H2>1. Promoter</H2>
      <P>
        {PROMOTER.name}, {PROMOTER.structure}, ABN {PROMOTER.abn}, {PROMOTER.location}. Contact{" "}
        <a className="text-rf-tan underline" href={`mailto:${PROMOTER.email}`}>
          {PROMOTER.email}
        </a>
        .
      </P>

      <H2>2. Nature of the promotion</H2>
      <P>
        This is a game of skill. Chance plays no part in determining the winner. Entry is free and
        no purchase is necessary.
      </P>

      <H2>3. Eligibility</H2>
      <UL>
        <li>Open to residents of Australia aged 18 years or over at the time of entry.</li>
        <li>One entry per person and per email address. Duplicate entries are not accepted.</li>
        <li>
          The promoter, and members of their immediate family or household, may not enter or win.
        </li>
      </UL>

      <H2>4. Promotional period</H2>
      <UL>
        <li>Opens: {PROMOTION.opens}.</li>
        <li>Closes: {PROMOTION.closes}.</li>
        <li>Entries received outside this period are not accepted.</li>
      </UL>

      <H2>5. How to enter</H2>
      <P>
        Complete the entry form with your name, email address, state or territory, confirmation of
        age, and your answer, in {MAX_RESPONSE_WORDS} words or fewer, to: “{PROMOTION.question}”
      </P>
      <P>
        Answers longer than {MAX_RESPONSE_WORDS} words are invalid. Incomplete entries, entries that
        do not accept these terms, and entries that do not confirm age are invalid.
      </P>

      <H2>6. Judging</H2>
      <P>
        Judging takes place {PROMOTION.judging} by a representative of the promoter. Entries are
        scored as follows:
      </P>
      <UL>
        {SCORING.map((s) => (
          <li key={s.label}>
            {s.label} — {s.weight}
          </li>
        ))}
      </UL>
      <P>
        Tie break: the entry with the highest practical-safety score wins. If entries remain tied,
        the tied entries are reassessed on clarity and originality.
      </P>
      <P>
        Entries that promote or describe unsafe recovery practices, including tow-ball recovery, may
        be excluded from judging. The judge’s decision is final and no correspondence will be
        entered into, except as required by law.
      </P>

      <H2>7. Prize</H2>
      <P>
        {PRIZE.quantity} × {PRIZE.name} (SKU {PRIZE.sku}), valued at ${PRIZE.valueAud.toFixed(2)}{" "}
        AUD. The promoter covers standard delivery to one deliverable Australian address. Express
        shipping is excluded. The prize is not transferable and not redeemable for cash. If the
        prize becomes unavailable, the promoter may substitute a prize of equal or greater value,
        subject to any applicable law.
      </P>

      <H2>8. Winner notification and claim</H2>
      <UL>
        <li>The provisional winner is notified by email by {PROMOTION.winnerNotified}.</li>
        <li>
          The provisional winner has {PROMOTION.responseWindowDays} calendar days from the date of
          that email to respond and supply a deliverable Australian delivery address.
        </li>
        <li>
          If no valid response is received in that period, the entry may be forfeited and the
          next-highest scoring eligible entry may be awarded the prize.
        </li>
      </UL>

      <H2>9. Winner announcement</H2>
      <P>
        The winner’s first name, surname initial and state or territory may be published by the
        promoter (for example: “Sam G., WA”). No other personal details are published.
      </P>

      <H2>10. Entrant content licence</H2>
      <P>
        By entering, you grant the promoter a non-exclusive, royalty-free licence to use your entry
        answer solely for the purposes of administering this promotion and announcing its result.
        You confirm the entry is your own original content.
      </P>

      <H2>11. Privacy and marketing</H2>
      <P>
        Personal information collected is used to administer this promotion and is handled in
        accordance with our{" "}
        <Link className="text-rf-tan underline" to="/privacy">
          privacy policy
        </Link>
        . Marketing consent is optional, separate and unchecked by default. It is not required to
        enter or to win, and declining it does not affect your entry in any way.
      </P>

      <H2>12. Social media disclaimer</H2>
      <P>
        This promotion is in no way sponsored, endorsed, administered by, or associated with
        Facebook or Instagram. Entrants release those platforms completely.
      </P>

      <H2>13. General</H2>
      <UL>
        <li>
          The promoter may exclude any entry that is fraudulent, automated, duplicated or otherwise
          in breach of these terms.
        </li>
        <li>
          The promoter may vary, suspend or cancel this promotion where necessary, subject to any
          applicable law.
        </li>
        <li>
          Nothing in these terms excludes, restricts or modifies any right or remedy under the
          Australian Consumer Law that cannot lawfully be excluded.
        </li>
        <li>These terms are governed by the laws of Western Australia.</li>
      </UL>
    </PageShell>
  );
}
