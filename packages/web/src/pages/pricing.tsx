import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Github, Moon, Sun, Twitter, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingFlowchart, type PlanId } from "@/components/pricing-flowchart";

const NAV = [
  { label: "Examples", href: "/#examples" },
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Gallery", href: "/gallery" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
            <span className="size-7 rounded-md bg-foreground text-background flex items-center justify-center">
              <Zap className="size-4" strokeWidth={2.5} />
            </span>
            Octoflash
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) =>
              n.href.startsWith("/") ? (
                <Link
                  key={n.href}
                  to={n.href}
                  className={`text-[15px] font-medium hover:text-foreground transition-colors ${
                    n.href === "/pricing" ? "text-foreground" : "text-foreground/75"
                  }`}
                >
                  {n.label}
                </Link>
              ) : (
                <a
                  key={n.href}
                  href={n.href}
                  className="text-[15px] font-medium text-foreground/75 hover:text-foreground transition-colors"
                >
                  {n.label}
                </a>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden sm:inline-flex text-[15px] font-medium text-foreground/75 hover:text-foreground px-3 h-9 items-center"
            >
              Sign in
            </Link>
            <Button
              size="sm"
              className="h-9 px-4 text-[14px] rounded-md"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero + flowchart — shared with /billing/plans */}
      <section className="bg-background pb-16">
        <PricingFlowchart
          onSelectPlan={(plan: PlanId) => navigate(`/login?plan=${plan}`)}
        />
      </section>

      {/* FAQ */}
      <section className="border-t border-border">
        <div className="max-w-[760px] mx-auto px-6 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-[30px] md:text-[36px] font-semibold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-[14.5px] text-muted-foreground mt-2">
              Everything you need to know about Octoflash.
            </p>
          </div>
          <div className="divide-y divide-border border border-border rounded-xl bg-card">
            {FAQ.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background text-foreground border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight mb-4">
              <span className="size-6 rounded-md bg-foreground text-background flex items-center justify-center">
                <Zap className="size-3.5" strokeWidth={2.5} />
              </span>
              Octoflash
            </Link>
            <p className="text-[13px] text-muted-foreground max-w-[280px] leading-relaxed">
              AI-rendered Manim explainers. Built for creators who teach.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="size-8 rounded-md border border-border hover:border-foreground/40 flex items-center justify-center" aria-label="GitHub">
                <Github className="size-4" />
              </a>
              <a href="#" className="size-8 rounded-md border border-border hover:border-foreground/40 flex items-center justify-center" aria-label="Twitter">
                <Twitter className="size-4" />
              </a>
            </div>
          </div>
          <FooterCol title="Product" links={FOOTER_PRODUCT} />
          <FooterCol title="Learn" links={FOOTER_LEARN} />
          <FooterCol title="Company" links={FOOTER_COMPANY} />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 py-6 border-t border-border flex items-center justify-between text-[12px] text-muted-foreground">
          <span>© {new Date().getFullYear()} Octoflash AI. All rights reserved.</span>
          <span className="font-mono">v0.1.0 · beta</span>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FAQ                                           */
/* -------------------------------------------------------------------------- */

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "What is Octoflash?",
    a: "An AI studio for explainer videos: drop a YouTube link or topic, Octoflash splits it into scenes, picks Manim templates, narrates them in your voice and publishes the cut to Shorts, Reels and TikTok.",
  },
  {
    q: "What counts as one video render?",
    a: "Any time you click Publish on a project — regardless of length, scene count, or how many platforms you publish to. Re-publishing after edits counts as a new render.",
  },
  {
    q: "Where are my keys stored on the BYOK plan?",
    a: "Encrypted locally in the desktop app's secure storage (Keychain on macOS, DPAPI on Windows). They're never sent to our servers — every request goes directly from your machine to Claude or ElevenLabs.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes — switch any time from your account settings. Mid-cycle changes are pro-rated and apply on the next billing date.",
  },
  {
    q: "What happens after my 90 hosted renders?",
    a: "Extra renders auto-top-up at $0.80 each, or you can pause until next month — no hard cap. Existing projects stay editable either way.",
  },
  {
    q: "Do I need to know Python or Manim?",
    a: "No. You pick a template + style, tweak parameters in the inspector, and Octoflash compiles a Manim Scene under the hood. The generated Python is available read-only if you want to see it.",
  },
];

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
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
        <div className="px-5 pb-4 -mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Theme toggle                                  */
/* -------------------------------------------------------------------------- */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="size-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
    >
      <Sun className={`size-4 transition-all ${isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0"} absolute`} />
      <Moon className={`size-4 transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Footer column                                 */
/* -------------------------------------------------------------------------- */

type FooterLink = { label: string; href: string };

// Anchors are resolved against the home page since /pricing has no #examples etc.
const FOOTER_PRODUCT: FooterLink[] = [
  { label: "Examples", href: "/#examples" },
  { label: "Gallery", href: "/gallery" },
  { label: "Playground", href: "/playground" },
  { label: "Workflow", href: "/#features" },
  { label: "Extension", href: "/#extension" },
];

const FOOTER_LEARN: FooterLink[] = [
  { label: "What is Manim?", href: "/what-is-manim" },
  { label: "Manim docs", href: "https://docs.manim.community/en/stable/" },
  { label: "For teachers", href: "/teachers" },
  { label: "Help", href: "/help" },
];

const FOOTER_COMPANY: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "mailto:hello@octoflash.ai" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-3">
        {title}
      </div>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <FooterLinkA href={l.href}>{l.label}</FooterLinkA>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLinkA({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = "text-[13px] text-foreground/75 hover:text-foreground transition-colors";
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={cls}>
        {children}
      </Link>
    );
  }
  const external = href.startsWith("http") || href.startsWith("mailto:");
  return (
    <a
      href={href}
      className={cls}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
    >
      {children}
    </a>
  );
}
