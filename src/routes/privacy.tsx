import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/seo";
import { PageShell, H2, P, UL } from "@/components/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () =>
    routeMeta({
      path: "/privacy",
      title: "Privacy Policy | Roamforge",
      description: "How Roamforge collects, uses and protects your personal information.",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell eyebrow="PRIVACY POLICY" title="Privacy Policy">
      <P>Roamforge values your privacy.</P>
      <H2>Information We Collect</H2>
      <P>We may collect:</P>
      <UL>
        <li>Name</li>
        <li>Address</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Payment information</li>
        <li>Order history</li>
      </UL>
      <H2>How We Use Your Information</H2>
      <P>We use your information to:</P>
      <UL>
        <li>Process orders</li>
        <li>Deliver products</li>
        <li>Provide customer support</li>
        <li>Improve our services</li>
        <li>Send promotional communications (where consent has been provided)</li>
      </UL>
      <H2>Data Security</H2>
      <P>
        We take reasonable steps to protect your personal information from unauthorised access,
        disclosure, or misuse.
      </P>
      <H2>Third-Party Services</H2>
      <P>
        We may use trusted third-party providers including payment processors and shipping carriers
        to fulfil orders.
      </P>
      <H2>Contact</H2>
      <P>
        For privacy-related enquiries, contact:{" "}
        <a className="text-rf-tan underline" href="mailto:privacy@roamforge.com.au">
          privacy@roamforge.com.au
        </a>
      </P>
    </PageShell>
  );
}
