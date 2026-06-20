import { PublicShell, PageHero } from "@/layouts/public-shell";

export default function PrivacyPage() {
  return (
    <PublicShell>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
        eyebrow="Legal"
        title="Privacy policy"
        subtitle="Last updated 2026-05-20. We keep this short and unsurprising."
      />

      <Article>
        <Section title="What we collect">
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Account info</strong> — email, name, OAuth provider id.</li>
            <li><strong>Billing</strong> — handled by Stripe; we store only the customer id and last 4 digits.</li>
            <li><strong>Project metadata</strong> — titles, scene counts, render durations. Not the contents of your transcripts.</li>
            <li><strong>Diagnostics</strong> — anonymous performance + error data, opt-out from settings.</li>
          </ul>
        </Section>

        <Section title="What we don't collect">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Your API keys (BYOK). They live in your OS keychain and never reach our servers.</li>
            <li>The contents of your transcripts on the BYOK plan — those go directly to Claude / ElevenLabs.</li>
            <li>Third-party analytics tracking across sites.</li>
          </ul>
        </Section>

        <Section title="How we use it">
          <p>
            To run the Service: authenticate you, render your projects, bill
            for hosted usage, send transactional email. We do not sell your
            data and do not run ad networks.
          </p>
        </Section>

        <Section title="Sub-processors">
          <p>For the Hosted plan we use a small set of vendors:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Anthropic</strong> — Claude inference</li>
            <li><strong>ElevenLabs</strong> — text-to-speech</li>
            <li><strong>Stripe</strong> — payments</li>
            <li><strong>Cloudflare R2</strong> — render storage</li>
            <li><strong>Resend</strong> — transactional email</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <p>
            You can export, edit or delete any data tied to your account from
            your settings page. EU/UK users get the full GDPR set of rights
            (access, rectification, erasure, portability).
          </p>
        </Section>

        <Section title="Retention">
          <p>
            Active accounts: indefinitely. After deletion, we purge within 30
            days. Anonymised diagnostics are retained for up to 18 months.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions?{" "}
            <a href="mailto:support@octoflash.ai" className="underline underline-offset-2">
              support@octoflash.ai
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
