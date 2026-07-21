import { createFileRoute } from "@tanstack/react-router";
import { PageShell, H2, P } from "@/components/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Roamforge" },
      { name: "description", content: "Terms and conditions governing purchases from Roamforge." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell eyebrow="TERMS & CONDITIONS" title="Terms and Conditions">
      <P>By accessing and purchasing from Roamforge, you agree to the following terms:</P>
      <H2>Product Information</H2>
      <P>
        We strive to ensure all product descriptions, pricing, and images are accurate. However,
        errors may occasionally occur.
      </P>
      <P>Roamforge reserves the right to correct any errors without prior notice.</P>
      <H2>Pricing</H2>
      <P>All prices are listed in Australian Dollars (AUD).</P>
      <P>Prices may change at any time without notice.</P>
      <H2>Orders</H2>
      <P>
        We reserve the right to refuse or cancel any order where necessary, including suspected
        fraud, pricing errors, or stock availability issues.
      </P>
      <H2>Limitation of Liability</H2>
      <P>
        Roamforge shall not be liable for any indirect, incidental, or consequential damages arising
        from the use of products purchased from our store.
      </P>
      <H2>Governing Law</H2>
      <P>These terms are governed by the laws of Western Australia and Australia.</P>
    </PageShell>
  );
}
