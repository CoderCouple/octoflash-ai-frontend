import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, Library, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell, PageHero } from "@/layouts/public-shell";

export default function TeachersPage() {
  return (
    <PublicShell>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "For teachers" }]}
        eyebrow="For schools & universities"
        title="Bring animated explainers into the classroom."
        subtitle="Octoflash makes Manim-quality animations accessible to teachers, lecturers and curriculum teams — no Python required, classroom-friendly licensing, and a 20% education discount."
      />

      {/* Use-case cards */}
      <section className="max-w-[1100px] mx-auto px-6 py-14 md:py-16">
        <div className="grid md:grid-cols-3 gap-5">
          <UseCase
            icon={GraduationCap}
            title="K–12 teachers"
            body="Drop in topic prompts during prep. Pull animated walk-throughs of any concept from algebra to genetics in under a minute."
          />
          <UseCase
            icon={Library}
            title="University lecturers"
            body="Generate scene packs for your lecture series. Branded intros, your voice, your notation — animated in your style."
          />
          <UseCase
            icon={Users}
            title="Departments & districts"
            body="Shared brand kits, SSO, per-seat licensing. Curriculum teams can ship a unified library of explainers."
          />
        </div>
      </section>

      {/* Highlight strip */}
      <section className="bg-background border-y border-border">
        <div className="max-w-[1100px] mx-auto px-6 py-14 md:py-16 grid md:grid-cols-[1fr,1.2fr] gap-10 items-center">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em] text-foreground/55 font-medium mb-2">
              Education discount
            </p>
            <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight leading-[1.1]">
              20% off the Hosted plan for eligible institutions.
            </h2>
            <p className="text-[15px] text-foreground/70 mt-4 max-w-[460px] leading-relaxed">
              Apply with your school's email or your faculty page. Once
              approved, the discount applies to every seat in your
              organisation. Annual classroom packs are also available.
            </p>
            <div className="mt-7 flex gap-3 flex-wrap">
              <a href="#book-demo">
                <Button size="lg" className="h-11 px-5 font-semibold rounded-md">
                  Book a free school demo <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </a>
              <a href="mailto:edu@octoflash.ai">
                <Button size="lg" variant="outline" className="h-11 px-5 font-semibold rounded-md">
                  Email education team
                </Button>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Education discount" value="20%" />
            <Stat label="Free tier" value="90 renders" />
            <Stat label="Your API keys" value="BYOK" />
            <Stat label="Runs on" value="Web + Desktop" />
          </div>
        </div>
      </section>

      {/* Classroom workflow */}
      <section className="max-w-[1100px] mx-auto px-6 py-14 md:py-16">
        <h2 className="text-[24px] md:text-[30px] font-semibold tracking-tight">
          How it fits into your week.
        </h2>
        <p className="text-[15px] text-foreground/65 mt-3 max-w-[640px] leading-relaxed">
          You don't need to reinvent your lesson plan. Drop in Octoflash where
          you'd usually pull a YouTube clip — it adapts to your existing slides
          and notation.
        </p>
        <ol className="mt-8 space-y-5 max-w-[720px]">
          <Step
            n="01"
            title="Prepare the topic"
            body="Paste a textbook chapter, a YouTube URL or a prompt. Octoflash splits it into 3–8 scenes that mirror the structure you'd teach."
          />
          <Step
            n="02"
            title="Tune for your class"
            body="Pick a template, an accent for the voiceover, and your school's brand colours. Re-render any single scene without affecting the rest."
          />
          <Step
            n="03"
            title="Share or screen"
            body="Export to MP4 for the projector, publish to YouTube Unlisted for homework, or paste a Vimeo link into your LMS."
          />
        </ol>
      </section>

      {/* Final CTA */}
      <section className="bg-background border-t border-border">
        <div className="max-w-[820px] mx-auto px-6 py-16 md:py-20 text-center">
          <BookOpen className="size-7 mx-auto text-foreground" strokeWidth={1.6} />
          <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight mt-4 leading-tight">
            Let's bring Octoflash into your classroom.
          </h2>
          <p className="text-[15px] text-foreground/65 mt-3 max-w-[520px] mx-auto">
            A 20-minute call to map your curriculum, set up a free trial seat
            and confirm the education discount.
          </p>
          <div className="mt-7 flex justify-center gap-3 flex-wrap">
            <a href="#book-demo">
              <Button size="lg" className="h-11 px-5 font-semibold rounded-md">
                Book a free demo <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </a>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="h-11 px-5 font-semibold rounded-md">
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function UseCase({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof GraduationCap;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="size-9 rounded-md bg-muted flex items-center justify-center mb-4">
        <Icon className="size-4.5" strokeWidth={1.7} />
      </div>
      <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
      <p className="text-[13.5px] text-foreground/65 mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-[28px] font-semibold tracking-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-foreground/55 mt-1">{label}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0 font-mono text-[11.5px] tracking-widest text-foreground/55 pt-1">
        {n}
      </span>
      <div>
        <div className="text-[16px] font-semibold tracking-tight">{title}</div>
        <p className="text-[14px] text-foreground/65 mt-1 leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
