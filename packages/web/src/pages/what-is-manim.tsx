import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell, PageHero } from "@/layouts/public-shell";

export default function WhatIsManimPage() {
  return (
    <PublicShell>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "What is Manim?" }]}
        eyebrow="Background"
        title="What is Manim?"
        subtitle="A short explainer about the animation engine that powers Octoflash — and the community that's grown around it."
      />

      <Section>
        <p>
          <strong>Manim</strong> ("Mathematical Animation Engine") is an open-source Python
          library for programmatic mathematical animations. You describe a scene in code —
          arrange objects, transform them over time — and Manim renders the result to MP4
          frames using Cairo and FFmpeg under the hood.
        </p>
        <p>
          It's the engine behind <strong>3Blue1Brown</strong>, Grant Sanderson's
          YouTube channel famous for visualising linear algebra, calculus and
          neural nets. Grant originally wrote Manim in 2015 to make his own
          videos; in 2020 a community fork — <strong>ManimCommunity</strong> —
          formed to keep the library stable, documented and open to outside
          contributors.
        </p>
      </Section>

      <Section title="What you can do with Manim">
        <ul className="list-disc pl-6 space-y-2">
          <li>Render typeset equations that morph between forms.</li>
          <li>Animate plots, vector fields, geometric proofs and 3D surfaces.</li>
          <li>Build branded explainer cuts: title cards, intros, end cards.</li>
          <li>Compose scenes into longer videos via a deterministic timeline.</li>
        </ul>
        <p>
          The catch: every scene is Python. Writing one well typically takes
          hours, and learning the API takes weeks. That's the gap Octoflash
          closes — you pick templates, we generate the Manim, you ship.
        </p>
      </Section>

      <Section title="Why we built on Manim">
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Quality.</strong> The motion feels right — no rigid keyframes, no jelly easing.</li>
          <li><strong>Determinism.</strong> Same scene, same code = same pixel-perfect output. Great for reruns and diffs.</li>
          <li><strong>Open.</strong> MIT-licensed. No vendor lock-in on the renderer.</li>
          <li><strong>Composable.</strong> Each scene is an isolated `Scene` subclass — perfect for our scene-first edit model.</li>
        </ul>
      </Section>

      <Section title="Learn more">
        <div className="grid md:grid-cols-2 gap-4 not-prose">
          <ExternalCard
            title="Manim Community docs"
            href="https://docs.manim.community/en/stable/"
            sub="docs.manim.community"
            body="The canonical reference for the community fork — API, tutorials, examples."
          />
          <ExternalCard
            title="3Blue1Brown"
            href="https://www.youtube.com/@3blue1brown"
            sub="youtube.com/@3blue1brown"
            body="Grant Sanderson's channel — the original showcase for Manim's quality."
          />
          <ExternalCard
            title="ManimCommunity GitHub"
            href="https://github.com/ManimCommunity/manim"
            sub="github.com/ManimCommunity/manim"
            body="Source for the community-maintained fork. Most active development lives here."
          />
          <ExternalCard
            title="Awesome Manim"
            href="https://www.manim.community/awesome/"
            sub="manim.community/awesome"
            body="A curated feed of community creations — a good place to see what's possible."
          />
        </div>
      </Section>

      {/* CTA */}
      <section className="max-w-[820px] mx-auto px-6 py-14 md:py-16">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-[22px] font-semibold tracking-tight">
              Want Manim-quality video without writing Python?
            </h3>
            <p className="text-[14px] text-foreground/65 mt-2 max-w-[460px]">
              Octoflash compiles every render to a real Manim Scene. You pick a
              template, we generate the code, you can read it any time.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/signup">
              <Button size="lg" className="h-11 px-5 font-semibold rounded-md">
                Sign up <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/gallery">
              <Button size="lg" variant="outline" className="h-11 px-5 font-semibold rounded-md">
                See examples
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="max-w-[820px] mx-auto px-6 py-8 md:py-10 border-b border-border last:border-b-0">
      {title && (
        <h2 className="text-[22px] md:text-[26px] font-semibold tracking-tight mb-4">{title}</h2>
      )}
      <div className="space-y-4 text-[15px] text-foreground/80 leading-relaxed">{children}</div>
    </section>
  );
}

function ExternalCard({ title, href, sub, body }: { title: string; href: string; sub: string; body: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="block rounded-xl border border-border bg-card p-5 hover:border-foreground/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15.5px] font-semibold tracking-tight">{title}</h3>
        <ExternalLink className="size-3.5 text-foreground/55 group-hover:text-foreground transition-colors" />
      </div>
      <div className="text-[11px] font-mono text-foreground/55 mt-0.5">{sub}</div>
      <p className="text-[13px] text-foreground/65 mt-2.5 leading-relaxed">{body}</p>
    </a>
  );
}
