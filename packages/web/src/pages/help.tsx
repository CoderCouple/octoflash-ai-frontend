import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Github, LifeBuoy, Mail, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicShell, PageHero } from "@/layouts/public-shell";

const CATEGORIES = [
  { id: "getting-started", label: "Getting started" },
  { id: "billing", label: "Billing & plans" },
  { id: "byok", label: "BYOK & keys" },
  { id: "rendering", label: "Rendering & quotas" },
  { id: "publishing", label: "Publishing" },
  { id: "account", label: "Account & data" },
];

type Article = { q: string; a: string; cat: string };
const ARTICLES: Article[] = [
  { cat: "getting-started", q: "What is Octoflash?", a: "An AI studio for explainer videos. Paste a YouTube link or topic and Octoflash renders a Manim animation with voiceover, captions and ready-to-publish cuts." },
  { cat: "getting-started", q: "Do I need to know Python or Manim?", a: "No. Templates compile to Manim under the hood. You can view the generated Python in read-only mode if you'd like." },
  { cat: "getting-started", q: "Which platforms can I publish to?", a: "YouTube Shorts, TikTok, Instagram Reels — plus a master 16:9 MP4 you can drop into any other workflow." },

  { cat: "billing", q: "What's the difference between BYOK and Hosted?", a: "BYOK ($29.99/mo) routes every render through your own Claude + ElevenLabs keys. Hosted ($99.99/mo) gives you 90 renders per month using our keys, with free credits to start." },
  { cat: "billing", q: "Can I switch plans later?", a: "Yes — switch any time from your account settings. Changes are pro-rated and apply on the next billing date." },
  { cat: "billing", q: "Is there a refund?", a: "Yes — 14-day refund on the Hosted plan, no questions asked." },

  { cat: "byok", q: "Where are my API keys stored?", a: "Encrypted in the desktop app's secure storage (Keychain on macOS, DPAPI on Windows). Every request goes directly from your machine to the provider — never proxied through us." },
  { cat: "byok", q: "Which providers does BYOK support?", a: "Claude (Anthropic), ChatGPT (OpenAI) for transcripts, ElevenLabs for voiceover, and Gemini CLI is coming soon." },

  { cat: "rendering", q: "What counts as one render?", a: "Any time you click Publish on a project — regardless of length, scene count or how many platforms you publish to. Re-publishing after edits counts as a new render." },
  { cat: "rendering", q: "What happens after 90 renders on the Hosted plan?", a: "Extra renders auto-top-up at $0.80 each. You can also pause until next month — no hard cap." },
  { cat: "rendering", q: "Why is scene-first rendering faster?", a: "We re-render only the scene you edited, plus any downstream workflow nodes — not the whole video. A one-line tweak typically renders in under 10 seconds." },

  { cat: "publishing", q: "Do you handle YouTube uploads directly?", a: "Yes — connect your YouTube account in settings and Octoflash will upload Shorts with title, description, hashtags and an end card." },
  { cat: "publishing", q: "Can I export without publishing?", a: "Of course. Every render produces an MP4 you can download from the project page." },

  { cat: "account", q: "How do I delete my data?", a: "Go to settings → privacy → delete account. We purge everything within 30 days." },
  { cat: "account", q: "Do you offer SSO or team seats?", a: "Hosted accounts can be upgraded to team workspaces with shared brand kits, per-seat quotas and SSO. Talk to support." },
];

export default function HelpPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = ARTICLES.filter((a) => {
    if (cat !== "all" && a.cat !== cat) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return a.q.toLowerCase().includes(needle) || a.a.toLowerCase().includes(needle);
  });

  return (
    <PublicShell>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Help" }]}
        eyebrow="Help center"
        title="How can we help?"
        subtitle="Answers to the questions we hear most often. Can't find what you need? Email us — we reply within a business day."
      />

      {/* Search */}
      <section className="bg-background border-b border-border">
        <div className="max-w-[820px] mx-auto px-6 py-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/50" />
            <Input
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              placeholder="Search articles — try 'BYOK' or 'refund'"
              className="h-11 pl-9 text-[14px]"
            />
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="bg-background border-b border-border">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex flex-wrap gap-2">
          <CategoryChip label="All" active={cat === "all"} onClick={() => setCat("all")} count={ARTICLES.length} />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.label}
              active={cat === c.id}
              onClick={() => setCat(c.id)}
              count={ARTICLES.filter((a) => a.cat === c.id).length}
            />
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="max-w-[820px] mx-auto px-6 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-foreground/60 text-[14px]">
            No articles match "{q}". Try a different term or{" "}
            <a href="mailto:help@octoflash.ai" className="underline underline-offset-2">
              email us
            </a>
            .
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-xl bg-card">
            {filtered.map((a, i) => (
              <Q key={a.q} q={a.q} a={a.a} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </section>

      {/* Contact */}
      <section className="bg-background border-t border-border">
        <div className="max-w-[1100px] mx-auto px-6 py-14 md:py-16">
          <h2 className="text-[26px] md:text-[32px] font-semibold tracking-tight text-center mb-2">
            Still stuck? Talk to us.
          </h2>
          <p className="text-[14.5px] text-foreground/65 text-center max-w-[520px] mx-auto">
            We're a small team — your message lands with an engineer, not a
            ticket queue.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            <Channel
              icon={Mail}
              title="Email"
              body="Reply within one business day."
              ctaLabel="help@octoflash.ai"
              ctaHref="mailto:help@octoflash.ai"
            />
            <Channel
              icon={MessageSquare}
              title="Community Discord"
              body="Active community of creators and educators."
              ctaLabel="Join the server"
              ctaHref="https://discord.gg"
            />
            <Channel
              icon={Github}
              title="GitHub Issues"
              body="Bug reports and feature requests, public."
              ctaLabel="File an issue"
              ctaHref="https://github.com"
            />
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <LifeBuoy className="size-6 mt-0.5" strokeWidth={1.7} />
              <div>
                <h3 className="text-[18px] font-semibold tracking-tight">For schools & universities</h3>
                <p className="text-[13.5px] text-foreground/65 mt-1 max-w-[460px]">
                  Book a free 20-minute call. Classroom setup, education
                  discount, and onboarding for your team.
                </p>
              </div>
            </div>
            <Link to="/teachers">
              <Button size="lg" className="h-11 px-5 font-semibold rounded-md">
                For teachers <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] font-medium border transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border hover:border-foreground/40"
      }`}
    >
      {label}
      <span
        className={`font-mono text-[10.5px] tabular-nums ${
          active ? "text-background/70" : "text-foreground/55"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function Q({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="text-[14.5px] font-semibold">{q}</span>
        <span
          className={`text-foreground/60 transition-transform ${open ? "rotate-45" : ""}`}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 -mt-1 text-[13.5px] text-foreground/70 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

function Channel({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  icon: typeof Mail;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const external = ctaHref.startsWith("http") || ctaHref.startsWith("mailto:");
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="size-9 rounded-md bg-muted flex items-center justify-center mb-4">
        <Icon className="size-4.5" strokeWidth={1.7} />
      </div>
      <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>
      <p className="text-[13px] text-foreground/65 mt-1.5 leading-relaxed">{body}</p>
      <a
        href={ctaHref}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer noopener" : undefined}
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold hover:underline underline-offset-4"
      >
        {ctaLabel} <ArrowRight className="size-3.5" />
      </a>
    </div>
  );
}
