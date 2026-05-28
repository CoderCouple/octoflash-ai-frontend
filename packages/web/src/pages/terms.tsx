import { PublicShell, PageHero } from "@/layouts/public-shell";

export default function TermsPage() {
  return (
    <PublicShell>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]}
        eyebrow="Legal"
        title="Terms & Conditions"
        subtitle="Last updated 2026-05-20. By using Octoflash, you agree to these terms."
      />

      <Article>
        <Section title="1. Acceptance">
          <p>
            By accessing or using Octoflash (the "Service"), you agree to be
            bound by these Terms. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. Your account">
          <p>
            You're responsible for the activity under your account, including
            the API keys you connect on the BYOK plan. Keep your credentials
            confidential. We never share them with third parties.
          </p>
        </Section>

        <Section title="3. Acceptable use">
          <p>You may not use the Service to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Generate content that infringes copyright, trademark or other rights.</li>
            <li>Produce content that is harassing, hateful, or sexually exploitative of minors.</li>
            <li>Bypass, probe or interfere with our infrastructure or rate limits.</li>
            <li>Resell the Service or its outputs without a written commercial agreement.</li>
          </ul>
        </Section>

        <Section title="4. Content ownership">
          <p>
            You own the videos you create with Octoflash. We claim no rights
            over your renders. You grant us a limited license to process and
            store project files solely to provide the Service.
          </p>
        </Section>

        <Section title="5. Subscriptions & payment">
          <p>
            Plans are billed monthly in USD. The Hosted plan includes 90
            renders per month with overflow at $0.80/render. The BYOK plan is a
            flat $29.99/month against your own AI quota. You can cancel any time;
            the Hosted plan offers a 14-day refund window.
          </p>
        </Section>

        <Section title="6. Service availability">
          <p>
            We aim for 99.5% uptime but the Service is provided "as is" without
            warranties of any kind. Status updates are posted to our status
            page.
          </p>
        </Section>

        <Section title="7. Limitation of liability">
          <p>
            To the maximum extent permitted by law, our aggregate liability for
            any claim is capped at the amount you paid us in the 12 months
            preceding the claim.
          </p>
        </Section>

        <Section title="8. Termination">
          <p>
            We may suspend or terminate accounts that violate these Terms. On
            termination, you can export your projects for 30 days.
          </p>
        </Section>

        <Section title="9. Changes">
          <p>
            We may update these Terms. Material changes will be announced via
            email or an in-app notice at least 30 days before they take effect.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these Terms?{" "}
            <a href="mailto:legal@octoflash.ai" className="underline underline-offset-2">
              legal@octoflash.ai
            </a>
            .
          </p>
        </Section>
      </Article>
    </PublicShell>
  );
}

function Article({ children }: { children: React.ReactNode }) {
  return (
    <article className="max-w-[820px] mx-auto px-6 py-14 space-y-10 text-[15px] text-foreground/80 leading-relaxed">
      {children}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[20px] font-semibold tracking-tight text-foreground mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
