import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell, PageHero } from "@/layouts/public-shell";

export default function AboutPage() {
  return (
    <PublicShell>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About" }]}
        eyebrow="About"
        title="We're building the studio for explainer videos."
        subtitle="Octoflash turns the way creators teach math, science and code into something you can ship in minutes — not weeks."
      />

      <Section title="Why Octoflash exists">
        <P>
          Most great explainers on YouTube are made by a tiny handful of people
          who spent years learning to animate. Tools like Manim — the engine
          behind 3Blue1Brown — give you cinema-quality math motion, but they
          require fluent Python and hours of iteration per scene.
        </P>
        <P>
          We wanted the same look without the cost. So we built Octoflash: a
          scene-first studio that takes any topic — a paper, a YouTube short,
          a tweet — and renders a Manim explainer with voiceover, captions and
          publish-to-Shorts in a single pass.
        </P>
      </Section>

      <Section title="What we believe">
        <ul className="space-y-4 text-[15px] text-foreground/85 leading-relaxed">
          <Belief
            title="Quality is the ceiling, not the cost."
            body="A great animation should be cheap to ship. The bottleneck is taste, not tooling."
          />
          <Belief
            title="Scene-first, not timeline-first."
            body="You edit ideas, not frames. One scene re-renders without touching the rest of the video."
          />
          <Belief
            title="AI that supports the craft, not replaces it."
            body="Templates compile to readable Manim. You can always drop into Python — we just don't make you."
          />
          <Belief
            title="Open, local, portable."
            body="Your project is a folder. Your keys stay on your machine. Your renders are MP4 files you own."
          />
        </ul>
      </Section>

      <Section title="The team">
        <P>
          We're a small team building this in public. We also run{" "}
          <a
            href="https://www.youtube.com/@ContextZeroAI"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            @ContextZeroAI
          </a>
          , a YouTube channel about applied AI — every Short on it was rendered
          with Octoflash. If a feature doesn't survive our own publishing
          workflow, it doesn't ship.
        </P>
      </Section>

      <CTAStrip />
    </PublicShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-[820px] mx-auto px-6 py-10 md:py-14 border-b border-border">
      <h2 className="text-[24px] md:text-[28px] font-semibold tracking-tight mb-5">{title}</h2>
      <div className="space-y-4 text-[15px] text-foreground/80 leading-relaxed">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

function Belief({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <Sparkles className="size-4 mt-1 shrink-0 text-foreground" strokeWidth={1.7} />
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <p className="text-foreground/65 mt-1">{body}</p>
      </div>
    </li>
  );
}

function CTAStrip() {
  return (
    <section className="max-w-[820px] mx-auto px-6 py-14 md:py-16">
      <div className="rounded-2xl border border-border bg-card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-[22px] font-semibold tracking-tight">Try Octoflash for free.</h3>
          <p className="text-[14px] text-foreground/65 mt-2 max-w-[460px]">
            Free credits to start. No credit card. Bring your own keys if you'd prefer.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/signup">
            <Button size="lg" className="h-11 px-5 font-semibold rounded-md">
              Sign up <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline" className="h-11 px-5 font-semibold rounded-md">
              See pricing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
