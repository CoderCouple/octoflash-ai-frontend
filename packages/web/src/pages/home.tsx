import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronRight,
  Github,
  Heart,
  Instagram,
  Layers,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Moon,
  Music,
  Play,
  Send,
  Share2,
  Sparkles,
  Sun,
  ThumbsDown,
  Twitter,
  Volume2,
  Workflow,
  Youtube,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV = [
  { label: "Examples", href: "#examples" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Gallery", href: "/gallery" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

// Real Manim renders (downloaded into public/examples/).
const EXAMPLES: Array<{
  title: string;
  category: string;
  duration: string;
  src: string;
}> = [
  {
    title: "Sine, cosine & the unit circle",
    category: "Trigonometry",
    duration: "0:48",
    src: "/examples/TrigonometryAnimation_ManimCE_v0.17.3.gif",
  },
  {
    title: "Geometry of complex numbers",
    category: "Algebra",
    duration: "1:12",
    src: "/examples/ComplexNumbersAnimation_ManimCE_v0.17.3.gif",
  },
  {
    title: "3D surface — calculus of a cube",
    category: "Calculus",
    duration: "1:24",
    src: "/examples/3d_calculus.gif",
  },
  {
    title: "Solution curves & phase space",
    category: "Diff. eq.",
    duration: "0:54",
    src: "/examples/differential_equations.gif",
  },
  {
    title: "Sine, cosine & the unit circle",
    category: "Trigonometry",
    duration: "0:48",
    src: "/examples/TrigonometryAnimation_ManimCE_v0.17.3.gif",
  },
  {
    title: "Geometry of complex numbers",
    category: "Algebra",
    duration: "1:12",
    src: "/examples/ComplexNumbersAnimation_ManimCE_v0.17.3.gif",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Drop a YouTube URL",
    body: "Paste a short, a lecture clip, or even a tweet. Octoflash pulls the transcript and breaks it into scenes.",
    icon: Youtube,
    Visual: StepUrlVisual,
  },
  {
    n: "02",
    title: "Pick a template & voice",
    body: "36 Manim-backed templates. Choose orientation, length, and a voiceover — no Python required.",
    icon: Layers,
    Visual: StepTemplateVisual,
  },
  {
    n: "03",
    title: "Publish everywhere",
    body: "One click to YouTube Shorts, TikTok, and Instagram Reels. Branded intro, end card, hashtags handled.",
    icon: ArrowUpRight,
    Visual: StepPublishVisual,
  },
];

const FEATURES = [
  {
    icon: Layers,
    title: "36 scene templates",
    body: "Equations, charts, knowledge graphs, particle systems — every preset compiles down to a Manim Scene.",
    Visual: FeatureTemplatesVisual,
  },
  {
    icon: Workflow,
    title: "DAG workflow editor",
    body: "Branch and merge variants visually. Render one cut for Shorts and another for TikTok without forking.",
    Visual: FeatureWorkflowVisual,
  },
  {
    icon: Mic,
    title: "AI voiceover",
    body: "20+ voices across accents. Word-level alignment with the on-screen animation, retiming included.",
    Visual: FeatureVoiceVisual,
  },
  {
    icon: Sparkles,
    title: "Manic style transfer",
    body: "Compatible scenes get the Manic look — gradient particles, soft glow, smooth easing — with one toggle.",
    Visual: FeatureManicVisual,
  },
  {
    icon: Boxes,
    title: "Scene-first, not timeline-first",
    body: "Edit one scene; only that scene re-renders. No waiting on the whole video to preview a tweak.",
    Visual: FeatureSceneFirstVisual,
  },
  {
    icon: Zap,
    title: "Ships everywhere",
    body: "Web, Mac, Windows, Linux, and a Chrome extension that queues videos straight from YouTube.",
    Visual: FeaturePlatformsVisual,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      navigate(`/login?next=${encodeURIComponent(`/projects?queue=${encodeURIComponent(trimmed)}`)}`);
    } else {
      navigate("/login");
    }
  }

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
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-[15px] font-medium text-foreground/75 hover:text-foreground transition-colors"
              >
                {n.label}
              </a>
            ))}
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

      {/* Hero */}
      <section className="bg-background text-foreground">
        <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 md:pt-24 md:pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-[11.5px] font-medium tracking-wide mb-7">
            <span className="size-1.5 rounded-full bg-foreground animate-pulse" />
            Now in private beta — Chrome extension available
          </div>
          <h1 className="text-[44px] md:text-[68px] leading-[1.02] font-semibold tracking-tight max-w-[920px] mx-auto">
            Turn any topic into a{" "}
            <span className="italic font-serif">Manim</span> video.
          </h1>
          <p className="text-[15px] md:text-[17px] text-muted-foreground mt-6 max-w-[620px] mx-auto leading-relaxed">
            Drop a YouTube link. Octoflash splits it into scenes, picks the
            animation template, narrates it in your voice, and publishes the cut
            to Shorts, Reels and TikTok.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-9 max-w-[600px] mx-auto flex items-center gap-2 p-1.5 rounded-xl bg-card border border-border focus-within:border-foreground/40 transition-colors shadow-sm"
          >
            <Input
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className="flex-1 h-11 bg-transparent border-0 text-[14.5px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
            />
            <Button
              type="submit"
              size="sm"
              className="h-11 px-5 font-semibold rounded-lg"
            >
              Animate <ArrowRight className="size-4 ml-1" />
            </Button>
          </form>
          <p className="text-[11.5px] text-muted-foreground mt-3.5">
            No credit card. Or{" "}
            <Link to="/login" className="underline underline-offset-2 hover:text-foreground">
              start from a blank scene
            </Link>
            .
          </p>
        </div>

        {/* Demo — full width below the hero text */}
        <div className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-28">
          <HeroDemo />
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="bg-background">
        <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
                Made with Octoflash
              </p>
              <h2 className="text-[34px] md:text-[44px] font-semibold tracking-tight leading-[1.05]">
                Real shorts, rendered by Manim.
              </h2>
            </div>
            <a href="#" className="text-[13px] font-medium inline-flex items-center gap-1 hover:underline underline-offset-4">
              See the full gallery <ChevronRight className="size-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {EXAMPLES.map((ex) => (
              <PreviewTile key={ex.title} ex={ex} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-background text-foreground border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
          <div className="max-w-[640px] mb-14">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
              How it works
            </p>
            <h2 className="text-[34px] md:text-[44px] font-semibold tracking-tight leading-[1.05]">
              Three steps from idea to upload.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border rounded-2xl overflow-hidden">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-background p-6 md:p-7">
                <s.Visual />
                <div className="mt-6 flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] text-muted-foreground tracking-widest">{s.n}</span>
                  <s.icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
                </div>
                <h3 className="text-[19px] font-semibold tracking-tight mb-1.5">{s.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-background">
        <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
          <div className="max-w-[640px] mb-14">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
              Features
            </p>
            <h2 className="text-[34px] md:text-[44px] font-semibold tracking-tight leading-[1.05]">
              Built for explainer creators.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-2xl overflow-hidden">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-background p-5 md:p-6">
                <f.Visual />
                <div className="mt-5 flex items-center gap-2 mb-1.5">
                  <f.icon className="size-4 text-muted-foreground" strokeWidth={1.7} />
                  <h3 className="text-[16px] font-semibold tracking-tight">{f.title}</h3>
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chrome extension */}
      <section id="extension" className="bg-background text-foreground border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-[1fr,1.2fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
                Chrome extension
              </p>
              <h2 className="text-[34px] md:text-[44px] font-semibold tracking-tight leading-[1.05]">
                Queue without leaving YouTube.
              </h2>
              <p className="text-[15px] text-muted-foreground mt-5 leading-relaxed max-w-[460px]">
                Right-click any short, lecture, or tutorial — Octoflash queues
                it instantly with your default render settings. The popup gives
                you per-job overrides for quality, orientation, voiceover and
                length.
              </p>
              <ul className="mt-6 space-y-3 text-[14px]">
                {[
                  "One-click queue from the context menu",
                  "Per-video overrides for quality, orientation, length, voiceover",
                  "Works on youtube.com, m.youtube.com and youtu.be links",
                  "Settings sync via chrome.storage — install once, use anywhere",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <Check className="size-4 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-center gap-3">
                <Button size="lg" className="h-11 px-5 font-semibold rounded-md">
                  Install for Chrome <ArrowUpRight className="size-4 ml-1.5" />
                </Button>
                <a
                  href="#"
                  className="h-11 px-3 inline-flex items-center text-[14px] font-medium text-muted-foreground hover:text-foreground"
                >
                  View source →
                </a>
              </div>
            </div>

            <ExtensionDemo />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background text-foreground border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32 text-center">
          <h2 className="text-[40px] md:text-[64px] font-semibold tracking-tight leading-[1.02] max-w-[820px] mx-auto">
            Ship your first short in under 90 sec.
          </h2>
          <p className="text-muted-foreground text-[15px] mt-5 max-w-[520px] mx-auto">
            Free while in private beta. No credit card. Cancel any time.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-12 px-7 font-semibold rounded-lg"
              onClick={() => navigate("/login")}
            >
              Start free <ArrowRight className="size-4 ml-1.5" />
            </Button>
            <a
              href="#examples"
              className="h-12 px-5 inline-flex items-center text-[14px] font-medium text-muted-foreground hover:text-foreground"
            >
              Watch a demo →
            </a>
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
/*                              Theme toggle                                  */
/* -------------------------------------------------------------------------- */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Render an icon placeholder until mounted to avoid SSR/hydration mismatches.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="size-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Sun className={`size-4 transition-all ${isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0"} absolute`} />
      <Moon className={`size-4 transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              HeroDemo                                      */
/*                                                                            */
/*  A self-running stylised demo. Cycles through four phases:                 */
/*    0 — typing the YouTube URL into the address-bar style input             */
/*    1 — workflow nodes pop in one by one with edges drawing in              */
/*    2 — render progress bar fills + faux terminal lines stream              */
/*    3 — published preview thumbnail with a "Ready" pill, then loops         */
/* -------------------------------------------------------------------------- */

const DEMO_URL = "https://youtube.com/watch?v=ManimAI42";

type DemoStatus = "idle" | "rendering" | "done";
type SceneData = {
  code: string;       // "S01"
  template: string;   // "title_reveal"
  title: string;      // "Title reveal"
  duration: number;   // seconds
  style: "editorial" | "manic";
  art: "title" | "diagram" | "callout" | "outro";
  appearAt: number;   // ms after planning starts
  activeFrom: number; // ms after rendering starts → flip to "rendering"
  doneAt: number;     // ms after rendering starts → flip to "done"
};
type SourceData = { label: string; appearAt: number };
type PublishData = { label: string; appearAt: number; activeFrom: number };

// Linear horizontal flow: Source → S01 → S02 → S03 → Publish.
const SCENE_DEFS: Array<{ id: string; x: number; data: SceneData }> = [
  {
    id: "s1",
    x: 200,
    data: {
      code: "S01", template: "title_reveal", title: "Title reveal",
      duration: 3.0, style: "editorial", art: "title",
      appearAt: 200, activeFrom: 100, doneAt: 900,
    },
  },
  {
    id: "s2",
    x: 410,
    data: {
      code: "S02", template: "diagram_build", title: "Diagram build",
      duration: 11.0, style: "editorial", art: "diagram",
      appearAt: 420, activeFrom: 900, doneAt: 1800,
    },
  },
  {
    id: "s3",
    x: 620,
    data: {
      code: "S03", template: "callout_zoom", title: "Show exponential growth",
      duration: 18.0, style: "manic", art: "callout",
      appearAt: 640, activeFrom: 1800, doneAt: 2700,
    },
  },
];

const SOURCE_DEF = { id: "source", x: 0, data: { label: "Source", appearAt: 0 } as SourceData };
const PUBLISH_DEF = {
  id: "publish",
  x: 850,
  data: { label: "Publish", appearAt: 860, activeFrom: 2700 } as PublishData,
};
const DEMO_LOGS = [
  "manim render scene_01.py -ql",
  "  ✓ transcript split → 3 scenes",
  "  ✓ template `equation_intro`",
  "  ✓ voiceover · Indian · Male",
  "  ✓ encoding mp4 · 1080×1920",
  "  ✓ uploaded to YouTube Shorts",
];

function HeroDemo() {
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logLines, setLogLines] = useState(0);

  // Phase timeline.
  useEffect(() => {
    const durations = [3200, 2200, 3000, 2400]; // ms per phase
    const t = setTimeout(() => setPhase((p) => (p + 1) % 4), durations[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  // Per-phase animations.
  useEffect(() => {
    if (phase === 0) {
      setTyped(0);
      const id = setInterval(() => {
        setTyped((n) => {
          if (n >= DEMO_URL.length) {
            clearInterval(id);
            return n;
          }
          return n + 1;
        });
      }, 70);
      return () => clearInterval(id);
    }
    if (phase === 2) {
      setProgress(0);
      setLogLines(0);
      const p = setInterval(() => setProgress((v) => (v >= 100 ? 100 : v + 4)), 110);
      const l = setInterval(
        () => setLogLines((n) => (n >= DEMO_LOGS.length ? DEMO_LOGS.length : n + 1)),
        450,
      );
      return () => {
        clearInterval(p);
        clearInterval(l);
      };
    }
    if (phase === 3) {
      setProgress(100);
      setLogLines(DEMO_LOGS.length);
    }
  }, [phase]);

  const showWorkflow = phase >= 1;
  const showRender = phase >= 2;
  const showDone = phase >= 3;

  return (
    <div className="relative">
      {/* App-window frame */}
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_24px_60px_-20px_rgba(0,0,0,0.12)]">
        {/* title bar */}
        <div className="flex items-center gap-3 px-4 h-9 border-b border-border bg-muted">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="font-mono text-[10.5px] text-muted-foreground tracking-wider">
              octoflash · studio
            </div>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {phase === 0 ? "idle" : phase === 1 ? "planning" : phase === 2 ? "rendering" : "done"}
          </div>
        </div>

        {/* URL bar */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-muted">
            <Youtube className="size-4 text-muted-foreground shrink-0" strokeWidth={1.6} />
            <span className="font-mono text-[12.5px] text-foreground truncate">
              {phase === 0 ? DEMO_URL.slice(0, typed) : DEMO_URL}
              {phase === 0 && typed < DEMO_URL.length && (
                <span className="inline-block w-[1px] h-[14px] -mb-[2px] ml-[1px] bg-foreground animate-pulse" />
              )}
            </span>
            <div className="ml-auto" />
            <span
              className={`shrink-0 text-[10.5px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                phase === 0
                  ? "bg-muted text-muted-foreground"
                  : "bg-foreground text-background"
              }`}
            >
              {phase === 0 ? "↩ Animate" : "✓ Queued"}
            </span>
          </div>
        </div>

        {/* Body — workflow + render preview */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] min-h-[340px]">
          {/* Workflow */}
          <div className="relative border-b lg:border-b-0 lg:border-r border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Workflow className="size-3.5 text-muted-foreground" strokeWidth={1.6} />
              <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                Workflow
              </span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                {showWorkflow ? `1 source · ${SCENE_DEFS.length} scenes · 1 output` : ""}
              </span>
            </div>
            <DemoWorkflow phase={phase} />
          </div>

          {/* Render / preview pane */}
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-3">
              <Play className="size-3.5 text-muted-foreground" strokeWidth={1.6} />
              <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                {showDone ? "Preview" : "Render"}
              </span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                {showRender && !showDone ? `${progress}%` : showDone ? "0:48" : ""}
              </span>
            </div>

            {/* preview — landscape master + portrait Shorts cut, both playing the same Manim render */}
            <div className="flex gap-3 items-end max-w-[420px] mx-auto">
              {/* Landscape (master) */}
              <PreviewSurface
                kind="landscape"
                phase={phase}
                progress={progress}
                showDone={showDone}
                showRender={showRender}
              />
              {/* Portrait (shorts cut) */}
              <PreviewSurface
                kind="portrait"
                phase={phase}
                progress={progress}
                showDone={showDone}
                showRender={showRender}
              />
            </div>

            {/* progress bar */}
            <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground"
                style={{
                  width: `${showRender ? progress : 0}%`,
                  transition: "width 220ms linear",
                }}
              />
            </div>

            {/* log lines */}
            <div className="mt-3 h-[64px] font-mono text-[10.5px] text-muted-foreground overflow-hidden leading-snug">
              {DEMO_LOGS.slice(0, logLines).map((l, i) => (
                <div
                  key={i}
                  className="truncate"
                  style={{
                    opacity: 1,
                    animation: "fadeIn 200ms ease",
                  }}
                >
                  {l}
                </div>
              ))}
              {phase === 2 && logLines < DEMO_LOGS.length && (
                <div className="text-muted-foreground/60">
                  <span className="inline-block w-[1px] h-[10px] -mb-[1px] bg-muted-foreground/60 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phase dots */}
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-border bg-muted">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                phase === i ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              DemoWorkflow                                  */
/* -------------------------------------------------------------------------- */

const nodeTypes = {
  source: SourceNode,
  scene: SceneNode,
  publish: PublishNode,
};

function DemoWorkflow({ phase }: { phase: number }) {
  const [elapsed, setElapsed] = useState(0);

  // Reset timer at the start of phase 1 (planning) and phase 2 (rendering).
  useEffect(() => {
    if (phase !== 1 && phase !== 2) return;
    setElapsed(0);
    const t0 = performance.now();
    let raf: number;
    const tick = () => {
      setElapsed(performance.now() - t0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const visible = phase >= 1;
  const renderingElapsed = phase >= 2 ? elapsed : 0; // ms into rendering phase
  const planningElapsed = phase === 1 ? elapsed : phase > 1 ? Infinity : 0;

  const nodes: Node[] = useMemo(() => {
    const baseY = 60; // px from top, accounts for ReactFlow's coord system
    const list: Node[] = [];

    // Source
    list.push({
      id: SOURCE_DEF.id,
      type: "source",
      position: { x: SOURCE_DEF.x, y: baseY + 70 },
      data: {
        ...SOURCE_DEF.data,
        visible: visible && planningElapsed >= SOURCE_DEF.data.appearAt,
      },
      draggable: false,
      selectable: false,
    });

    // Scenes
    for (const s of SCENE_DEFS) {
      let status: DemoStatus = "idle";
      if (phase >= 3) status = "done";
      else if (phase === 2) {
        if (renderingElapsed >= s.data.doneAt) status = "done";
        else if (renderingElapsed >= s.data.activeFrom) status = "rendering";
      }
      list.push({
        id: s.id,
        type: "scene",
        position: { x: s.x, y: baseY },
        data: {
          ...s.data,
          status,
          visible: visible && planningElapsed >= s.data.appearAt,
        },
        draggable: false,
        selectable: false,
      });
    }

    // Publish
    list.push({
      id: PUBLISH_DEF.id,
      type: "publish",
      position: { x: PUBLISH_DEF.x, y: baseY + 70 },
      data: {
        ...PUBLISH_DEF.data,
        active: phase >= 3 || (phase === 2 && renderingElapsed >= PUBLISH_DEF.data.activeFrom),
        visible: visible && planningElapsed >= PUBLISH_DEF.data.appearAt,
      },
      draggable: false,
      selectable: false,
    });

    return list;
  }, [phase, visible, planningElapsed, renderingElapsed]);

  const edges: Edge[] = useMemo(() => {
    if (!visible) return [];
    const mk = (id: string, source: string, target: string, delay: number): Edge => ({
      id,
      source,
      target,
      type: "smoothstep",
      animated: phase >= 2,
      style: {
        stroke: "hsl(var(--foreground))",
        strokeWidth: 1.5,
        opacity: planningElapsed >= delay ? 0.5 : 0,
        transition: "opacity 320ms ease",
      },
    });
    return [
      mk("e-src-s1", "source", "s1", 250),
      mk("e-s1-s2", "s1", "s2", 450),
      mk("e-s2-s3", "s2", "s3", 670),
      mk("e-s3-pub", "s3", "publish", 880),
    ];
  }, [visible, planningElapsed, phase]);

  return (
    <div className="relative h-[280px] w-full rounded-lg border border-border bg-muted overflow-hidden demo-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1.2}
          color="hsl(var(--muted-foreground) / 0.55)"
        />
      </ReactFlow>
      {/* Hide ReactFlow's default node chrome */}
      <style>{`
        .demo-flow .react-flow__node { padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; width: auto !important; }
        .demo-flow .react-flow__handle { opacity: 0; pointer-events: none; }
        .demo-flow .react-flow__edge-path { stroke-linecap: round; }
        .demo-flow .react-flow__attribution { display: none !important; }
      `}</style>
    </div>
  );
}

function SourceNode({ data }: NodeProps) {
  const d = data as unknown as SourceData & { visible: boolean };
  return (
    <div
      className="relative"
      style={{
        opacity: d.visible ? 1 : 0,
        transform: d.visible ? "scale(1)" : "scale(0.85)",
        transition: "opacity 320ms ease, transform 320ms ease",
      }}
    >
      <Handle type="source" position={Position.Right} />
      <div className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-foreground text-background text-[12px] font-semibold shadow-md">
        <Play className="size-3 fill-background" />
        {d.label}
      </div>
    </div>
  );
}

function PublishNode({ data }: NodeProps) {
  const d = data as unknown as PublishData & { visible: boolean; active: boolean };
  return (
    <div
      className="relative"
      style={{
        opacity: d.visible ? 1 : 0,
        transform: d.visible ? "scale(1)" : "scale(0.85)",
        transition: "opacity 320ms ease, transform 320ms ease",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div
        className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[12px] font-semibold shadow-md transition-colors ${
          d.active
            ? "bg-foreground text-background"
            : "bg-background text-foreground border border-border"
        }`}
      >
        {d.active ? <Check className="size-3" strokeWidth={3} /> : <Send className="size-3" />}
        {d.label}
      </div>
    </div>
  );
}

function SceneNode({ data }: NodeProps) {
  const d = data as unknown as SceneData & { status: DemoStatus; visible: boolean };
  const dot =
    d.status === "rendering"
      ? "bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.18)] animate-pulse"
      : d.status === "done"
        ? "bg-emerald-400"
        : "bg-background/30";

  return (
    <div
      className="relative w-[180px]"
      style={{
        opacity: d.visible ? 1 : 0,
        transform: d.visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 360ms ease, transform 360ms ease",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div
        className={`rounded-lg overflow-hidden bg-background text-foreground border shadow-lg transition-shadow ${
          d.status === "rendering" ? "ring-2 ring-amber-400/40" : "ring-0"
        }`}
        style={{ borderColor: "hsl(var(--border))" }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1.5 border-b border-border">
          <span className="font-mono text-[10px] text-muted-foreground">{d.code}</span>
          <span className="font-mono text-[10px] px-1 rounded bg-muted text-muted-foreground truncate">
            {d.template}
          </span>
          <div className="flex-1" />
          <span className={`size-1.5 rounded-full ${dot}`} />
        </div>
        {/* Art */}
        <SceneArtMini art={d.art} status={d.status} />
        {/* Footer */}
        <div className="px-2.5 pt-1.5 pb-2">
          <div className="text-[11.5px] font-medium leading-tight truncate">{d.title}</div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
            <span className="font-mono">{d.duration.toFixed(1)}s</span>
            <span>·</span>
            <span
              className={`font-mono text-[9px] px-1 rounded ${
                d.style === "manic"
                  ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                  : "bg-foreground/10 text-foreground"
              }`}
            >
              {d.style}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneArtMini({
  art,
  status,
}: {
  art: SceneData["art"];
  status: DemoStatus;
}) {
  const dim = status === "idle" ? "opacity-60" : "opacity-100";
  if (art === "title") {
    return (
      <div className={`relative aspect-video bg-[#0a1240] overflow-hidden ${dim}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-white text-[10px] font-bold tracking-tight">How black holes</span>
          <span className="text-[#a78bfa] text-[10px] font-bold italic tracking-tight">warp time</span>
        </div>
      </div>
    );
  }
  if (art === "diagram") {
    return (
      <div className={`relative aspect-video bg-[#0a1240] overflow-hidden ${dim}`}>
        <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full">
          {Array.from({ length: 7 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={20 + i * 20}
              y1={20}
              x2={20 + i * 20}
              y2={75}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.6"
            />
          ))}
          <line x1={15} y1={20} x2={145} y2={20} stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
          <line x1={15} y1={75} x2={145} y2={75} stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
        </svg>
      </div>
    );
  }
  if (art === "callout") {
    return (
      <div className={`relative aspect-video bg-[#0a1240] overflow-hidden ${dim}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(251,191,36,0.55),transparent_55%)]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-white" />
        <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full">
          {[18, 28, 38].map((r) => (
            <circle
              key={r}
              cx={80}
              cy={48}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          ))}
        </svg>
      </div>
    );
  }
  return <div className={`aspect-video bg-[#0a1240] ${dim}`} />;
}

/* -------------------------------------------------------------------------- */
/*                        ExtensionDemo                                       */
/*                                                                            */
/*  Browser-window mock showing the Chrome extension flow:                    */
/*   A — cursor enters & moves over the YouTube video                         */
/*   B — right-click context menu appears                                     */
/*   C — cursor highlights "Queue in Octoflash", click pulse                  */
/*   D — menu disappears, extension popup slides in from top-right            */
/*   E — popup shows form, "Queueing..." spinner                              */
/*   F — popup shows "✓ Queued!"                                              */
/*  …then loops.                                                              */
/* -------------------------------------------------------------------------- */

type Pt = { x: number; y: number };

function ExtensionDemo() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [cursor, setCursor] = useState<Pt>({ x: 95, y: 95 });

  // Phase timeline (ms)
  useEffect(() => {
    const durations = [1800, 1100, 1300, 1500, 1300, 1800];
    const t = setTimeout(() => setPhase((p) => (((p + 1) % 6) as 0 | 1 | 2 | 3 | 4 | 5)), durations[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  // Cursor animation: A→B target points are anchored to the browser frame coords (% of frame).
  // The Shorts player sits offset by the 78px left sidebar, so the centered click lands near 44%.
  const targets: Record<number, Pt> = {
    0: { x: 44, y: 46 },   // hover the centered Shorts player
    1: { x: 44, y: 46 },   // right-click happens here, cursor stays
    2: { x: 56, y: 62 },   // move down to "Queue in Octoflash" item
    3: { x: 90, y: 14 },   // hop over the popup (top-right)
    4: { x: 90, y: 36 },   // move down to "Queueing…" button
    5: { x: 90, y: 36 },   // hold
  };

  useEffect(() => {
    const start = cursor;
    const end = targets[phase];
    const t0 = performance.now();
    const dur = phase === 0 || phase === 2 ? 700 : 350;
    let raf: number;
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      setCursor({
        x: start.x + (end.x - start.x) * ease,
        y: start.y + (end.y - start.y) * ease,
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const menuOpen = phase >= 1 && phase <= 2;
  const popupOpen = phase >= 3;
  const queueing = phase === 4;
  const queued = phase === 5;
  const clickPulse = phase === 2;

  return (
    <div className="relative">
      {/* Browser window */}
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_24px_60px_-20px_rgba(0,0,0,0.12)]">
        {/* Title bar — YouTube tab */}
        <div className="flex items-center gap-3 px-3 h-9 border-b border-border bg-muted">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="font-mono text-[10.5px] text-muted-foreground tracking-wider truncate max-w-[80%]">
              youtube.com/shorts/ManimAI42
            </div>
          </div>
          {/* Extension icon in toolbar */}
          <div
            className={`size-6 rounded-md flex items-center justify-center transition-all ${
              popupOpen ? "bg-foreground text-background" : "bg-muted-foreground/15 text-muted-foreground"
            }`}
            title="Octoflash extension"
          >
            <Zap className="size-3.5" strokeWidth={2.5} />
          </div>
        </div>

        {/* YouTube Shorts mock — matches the real layout: top nav + left rail + center player + right action rail */}
        <div className="relative aspect-[16/10] bg-white overflow-hidden">
          {/* YouTube top nav */}
          <div className="absolute top-0 inset-x-0 h-8 flex items-center px-2.5 gap-3 z-10 bg-white border-b border-zinc-200">
            {/* burger + logo */}
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col gap-[2px]">
                <span className="block w-3 h-px bg-zinc-700" />
                <span className="block w-3 h-px bg-zinc-700" />
                <span className="block w-3 h-px bg-zinc-700" />
              </div>
              <div className="flex items-center gap-0.5">
                <span className="size-3.5 rounded-sm bg-red-600 flex items-center justify-center">
                  <Play className="size-2 fill-white text-white ml-px" />
                </span>
                <span className="text-[10.5px] font-bold tracking-tight text-zinc-900">YouTube</span>
              </div>
            </div>
            {/* search */}
            <div className="flex-1 flex justify-center">
              <div className="flex items-center w-[60%] max-w-[260px] h-5 rounded-full border border-zinc-300 bg-zinc-50">
                <span className="flex-1 px-2 text-[9px] text-zinc-500">Search</span>
                <span className="px-2 border-l border-zinc-300 h-full inline-flex items-center text-zinc-500 text-[9px]">⌕</span>
              </div>
            </div>
            {/* right cluster */}
            <div className="flex items-center gap-1.5">
              <div className="px-1.5 h-4 rounded-full bg-zinc-100 border border-zinc-200 inline-flex items-center text-[8.5px] font-medium text-zinc-700">+ Create</div>
              <div className="relative size-4 rounded-full bg-zinc-100 border border-zinc-200 inline-flex items-center justify-center">
                <span className="text-[8px] text-zinc-700">🔔</span>
                <span className="absolute -top-px -right-px text-[6.5px] text-white bg-red-500 rounded-full px-[3px] leading-[8px]">9+</span>
              </div>
              <div className="size-4 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500" />
            </div>
          </div>

          {/* Left sidebar */}
          <div className="absolute left-0 top-8 bottom-0 w-[78px] border-r border-zinc-200 bg-white z-10 py-2 flex flex-col gap-1.5 text-zinc-700">
            <SideItem label="Home" icon="⌂" />
            <SideItem label="Shorts" icon="⚡" active />
            <SideItem label="Subs" icon="≣" />
            <div className="border-t border-zinc-200 mx-2 my-1.5" />
            <div className="px-2 text-[8px] font-semibold text-zinc-500 mb-0.5">SUBSCRIPTIONS</div>
            {[
              { name: "ExplainingAI", c: "from-violet-400 to-fuchsia-500" },
              { name: "Vizura", c: "from-orange-400 to-rose-500" },
              { name: "Arivu", c: "from-amber-300 to-orange-500" },
              { name: "MathMinute", c: "from-sky-400 to-indigo-500" },
              { name: "ProofPilot", c: "from-emerald-400 to-teal-500" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 px-2 py-0.5">
                <span className={`size-3.5 rounded-full bg-gradient-to-br ${s.c}`} />
                <span className="text-[8.5px] truncate text-zinc-700">{s.name}</span>
              </div>
            ))}
          </div>

          {/* Center Shorts player */}
          <div className="absolute left-[78px] right-0 top-8 bottom-0 flex items-center justify-center pl-2 pr-12">
            <div className="relative h-[94%] aspect-[9/16] rounded-lg overflow-hidden bg-zinc-900 ring-1 ring-black/20 shadow-xl">
              <img
                src="/examples/TrigonometryAnimation_ManimCE_v0.17.3.gif"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: "scale(1.45)" }}
              />
              {/* Contrast scrims so the white overlay text stays readable over any frame */}
              <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/65 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

              {/* Player top controls */}
              <div className="absolute top-1.5 left-2 right-2 flex items-center gap-2 text-white">
                <Play className="size-3 fill-white" />
                <Volume2 className="size-3" strokeWidth={2} />
                <div className="flex-1" />
                <span className="text-[8px] font-mono px-1 border border-white/30 rounded-sm">CC</span>
                <span className="text-[10px]">⚙</span>
                <span className="text-[10px]">⛶</span>
              </div>

              {/* Bottom info */}
              <div className="absolute left-2 right-2 bottom-1.5 text-white">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="size-4 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 ring-1 ring-white/30" />
                  <span className="text-[9px] font-semibold">@yourchannel</span>
                  <span className="text-[8px] px-1 py-px rounded-sm bg-white text-black font-semibold">Subscribe</span>
                </div>
                <div className="text-[8.5px] text-white/95 leading-snug line-clamp-2">
                  How black holes warp time #manim #shorts
                </div>
              </div>

              {/* Scrub bar */}
              <div className="absolute left-2 right-2 bottom-[3px] h-[2px] rounded-full bg-white/15 overflow-hidden">
                <div className="h-full w-[34%] bg-white" />
              </div>
            </div>
          </div>

          {/* Right action rail (outside the player, like real Shorts) */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2.5 items-center">
            <ShortsAction icon={Heart} label="84K" />
            <ShortsAction icon={ThumbsDown} label="Dislike" />
            <ShortsAction icon={MessageCircle} label="1.2K" />
            <ShortsAction icon={Share2} label="Share" />
            <ShortsAction icon={MoreHorizontal} />
            <div className="size-7 rounded-md bg-gradient-to-br from-amber-400 to-rose-500 ring-2 ring-white/40 mt-1" />
          </div>

          {/* Down-arrow ("next Shorts") */}
          <div className="absolute right-2.5 bottom-3 z-10 size-7 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center">
            <ArrowRight className="size-3.5 text-zinc-700 rotate-90" />
          </div>

          {/* Right-click context menu — opens at the click point on the centered player */}
          <div
            className="absolute z-20 w-[200px] rounded-lg border border-border bg-card shadow-2xl overflow-hidden text-foreground"
            style={{
              left: "44%",
              top: "44%",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "scale(1)" : "scale(0.95)",
              transformOrigin: "top left",
              transition: "opacity 160ms ease, transform 160ms ease",
              pointerEvents: "none",
            }}
          >
            <MenuItem label="Copy video URL" />
            <MenuItem label="Open in new tab" />
            <Divider />
            <MenuItem
              label="Queue in Octoflash"
              icon={<Zap className="size-3.5" strokeWidth={2.5} />}
              highlighted={phase === 2}
              clicking={clickPulse}
            />
            <MenuItem label="Save to playlist" />
            <Divider />
            <MenuItem label="Inspect" muted />
          </div>

          {/* Click pulse ring on the highlighted menu item */}
          {clickPulse && (
            <span
              className="absolute z-20 rounded-full border-2 border-foreground/60 pointer-events-none"
              style={{
                left: `calc(44% + 95px)`,
                top: `calc(44% + 88px)`,
                width: 14,
                height: 14,
                transform: "translate(-50%, -50%)",
                animation: "click-pulse 600ms ease-out",
              }}
            />
          )}

          {/* Extension popup */}
          <div
            className="absolute z-30 right-2 top-2 w-[210px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
            style={{
              opacity: popupOpen ? 1 : 0,
              transform: popupOpen ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 260ms ease, transform 260ms ease",
              pointerEvents: "none",
            }}
          >
            {/* popup header */}
            <div className="flex items-center gap-2 px-3 h-8 bg-foreground text-background">
              <Zap className="size-3.5" strokeWidth={2.5} />
              <span className="text-[11.5px] font-bold tracking-tight">Octoflash</span>
            </div>
            <div className="p-2.5 space-y-2 text-foreground">
              <PopupField label="YouTube URL" value="youtube.com/watch?v=ManimAI42" mono />
              <div className="grid grid-cols-2 gap-2">
                <PopupField label="Quality" value="720p" />
                <PopupField label="Orientation" value="Portrait" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <PopupField label="Voiceover" value="Yes" />
                <PopupField label="Length" value="120s" />
              </div>
              <button
                className={`w-full h-7 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  queued
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-foreground text-background"
                }`}
                disabled
              >
                {queueing && (
                  <>
                    <span className="size-3 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                    Queueing…
                  </>
                )}
                {queued && (
                  <>
                    <Check className="size-3" strokeWidth={3} /> Queued · vid_4k2j
                  </>
                )}
                {!queueing && !queued && <>Queue Video</>}
              </button>
            </div>
          </div>

          {/* Cursor */}
          <div
            className="absolute z-40 pointer-events-none"
            style={{
              left: `${cursor.x}%`,
              top: `${cursor.y}%`,
              transform: "translate(-3px, -3px)",
            }}
          >
            <svg width="18" height="22" viewBox="0 0 18 22" className="drop-shadow-md">
              <path
                d="M2 1 L2 17 L6.5 13 L9.5 20 L11.7 19 L8.7 12 L14.5 11.5 Z"
                fill="white"
                stroke="black"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 h-8 border-t border-border bg-muted text-[10.5px] font-mono text-muted-foreground">
          <span>
            {phase === 0 && "hovering video"}
            {phase === 1 && "right-click → context menu"}
            {phase === 2 && "select · Queue in Octoflash"}
            {phase === 3 && "extension popup opened"}
            {phase === 4 && "POST /api/videos"}
            {phase === 5 && "✓ queued · vid_4k2j"}
          </span>
          <span className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`size-1 rounded-full transition-colors ${
                  phase === i ? "bg-foreground" : "bg-muted-foreground/40"
                }`}
              />
            ))}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes click-pulse {
          0%   { opacity: 0.9; width: 6px;  height: 6px; }
          100% { opacity: 0;   width: 48px; height: 48px; }
        }
      `}</style>
    </div>
  );
}

function SideItem({
  label,
  icon,
  active,
}: {
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <div
      className={`mx-1.5 flex flex-col items-center gap-0.5 py-1.5 rounded-md transition-colors ${
        active ? "bg-zinc-100" : ""
      }`}
    >
      <span className="text-[12px] leading-none text-zinc-700">{icon}</span>
      <span className={`text-[8.5px] ${active ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>
        {label}
      </span>
    </div>
  );
}

function ShortsAction({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label?: string;
}) {
  // Rail sits on the YouTube page (white bg) outside the dark player, so use dark icon/text.
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="size-7 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center">
        <Icon className="size-3.5 text-zinc-700" strokeWidth={2} />
      </div>
      {label && <span className="text-[8.5px] text-zinc-700 font-semibold">{label}</span>}
    </div>
  );
}

function MenuItem({
  label,
  icon,
  highlighted,
  muted,
  clicking,
}: {
  label: string;
  icon?: React.ReactNode;
  highlighted?: boolean;
  muted?: boolean;
  clicking?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 text-[11.5px] transition-colors ${
        highlighted
          ? "bg-foreground text-background"
          : muted
            ? "text-muted-foreground/60"
            : "text-foreground"
      }`}
      style={clicking ? { animation: "pulse 200ms ease 2" } : undefined}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {highlighted && <span className="font-mono text-[9.5px] opacity-75">⏎</span>}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border mx-1.5" />;
}

function PopupField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </div>
      <div
        className={`h-6 px-2 flex items-center rounded border border-border bg-muted/40 text-[10.5px] truncate ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Feature visuals (6)                               */
/* -------------------------------------------------------------------------- */

/** 1 · 36 scene templates — 4×3 grid of distinct glyphs with a scanning highlight. */
function FeatureTemplatesVisual() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 12), 420);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-[112px] rounded-lg border border-border bg-muted/40 p-2">
      <div className="grid grid-cols-4 grid-rows-3 gap-1 h-full">
        {Array.from({ length: 12 }).map((_, i) => {
          const isActive = i === active;
          return (
            <div
              key={i}
              className={`relative rounded border transition-colors ${
                isActive ? "border-foreground bg-foreground/10" : "border-border bg-card"
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <TemplateGlyph index={i} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TemplateGlyph({ index }: { index: number }) {
  const variants = [
    // 0 — sine
    <svg key="sine" viewBox="0 0 16 10" className="w-4 h-2.5">
      <path d="M0 5 Q 4 0, 8 5 T 16 5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>,
    // 1 — bar chart
    <svg key="bar" viewBox="0 0 14 10" className="w-4 h-2.5">
      <rect x="0" y="6" width="2.5" height="4" fill="currentColor" />
      <rect x="4" y="3" width="2.5" height="7" fill="currentColor" />
      <rect x="8" y="5" width="2.5" height="5" fill="currentColor" />
      <rect x="11.5" y="1" width="2.5" height="9" fill="currentColor" />
    </svg>,
    // 2 — particle dots
    <svg key="dots" viewBox="0 0 14 10" className="w-4 h-2.5">
      {[[2,3],[6,7],[10,4],[12,8],[4,8],[8,2]].map(([x,y],k) => (
        <circle key={k} cx={x} cy={y} r="1" fill="currentColor" />
      ))}
    </svg>,
    // 3 — equation: x²
    <span key="eq" className="text-[8px] font-mono font-semibold">x²</span>,
    // 4 — circle
    <svg key="circle" viewBox="0 0 14 14" className="w-3.5 h-3.5">
      <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="7" cy="7" r="0.8" fill="currentColor" />
    </svg>,
    // 5 — knowledge graph nodes
    <svg key="graph" viewBox="0 0 14 10" className="w-4 h-2.5">
      <line x1="3" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="0.6" />
      <line x1="3" y1="5" x2="7" y2="2" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="3" cy="5" r="1" fill="currentColor" />
      <circle cx="7" cy="2" r="1" fill="currentColor" />
      <circle cx="11" cy="5" r="1" fill="currentColor" />
    </svg>,
    // 6 — pi
    <span key="pi" className="text-[10px] font-serif italic font-semibold">π</span>,
    // 7 — arrow
    <svg key="arrow" viewBox="0 0 14 10" className="w-4 h-2.5">
      <path d="M1 5 L11 5 M8 2 L11 5 L8 8" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>,
    // 8 — line plot
    <svg key="line" viewBox="0 0 14 10" className="w-4 h-2.5">
      <polyline points="1,8 4,5 7,7 10,3 13,6" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>,
    // 9 — triangle
    <svg key="tri" viewBox="0 0 14 12" className="w-3.5 h-3.5">
      <polygon points="7,2 12,10 2,10" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>,
    // 10 — sigma
    <span key="sigma" className="text-[10px] font-serif italic font-semibold">Σ</span>,
    // 11 — grid
    <svg key="grid" viewBox="0 0 12 10" className="w-3.5 h-3">
      <line x1="0" y1="2" x2="12" y2="2" stroke="currentColor" strokeWidth="0.4" />
      <line x1="0" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="0.4" />
      <line x1="0" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="0.4" />
      <line x1="3" y1="0" x2="3" y2="10" stroke="currentColor" strokeWidth="0.4" />
      <line x1="6" y1="0" x2="6" y2="10" stroke="currentColor" strokeWidth="0.4" />
      <line x1="9" y1="0" x2="9" y2="10" stroke="currentColor" strokeWidth="0.4" />
    </svg>,
  ];
  return <div className="text-foreground/70">{variants[index % variants.length]}</div>;
}

/** 2 · DAG workflow — mini graph with edges drawing in. */
function FeatureWorkflowVisual() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 900);
    return () => clearInterval(id);
  }, []);

  const nodes = [
    { id: "src", x: 8, y: 50 },
    { id: "s1", x: 38, y: 22 },
    { id: "s2", x: 38, y: 78 },
    { id: "out1", x: 78, y: 22 },
    { id: "out2", x: 78, y: 78 },
  ];

  return (
    <div className="h-[112px] rounded-lg border border-border bg-muted/40 p-2 relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {[
          ["src", "s1"],
          ["src", "s2"],
          ["s1", "out1"],
          ["s2", "out2"],
        ].map(([a, b], i) => {
          const A = nodes.find((n) => n.id === a)!;
          const B = nodes.find((n) => n.id === b)!;
          const isHot = step >= 1 && (i === 0 || i === 2) && step % 2 === 0;
          const isHot2 = step >= 1 && (i === 1 || i === 3) && step % 2 === 1;
          return (
            <line
              key={`${a}-${b}`}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke="hsl(var(--foreground))"
              strokeWidth={isHot || isHot2 ? "0.7" : "0.35"}
              strokeLinecap="round"
              style={{
                opacity: isHot || isHot2 ? 0.9 : 0.4,
                transition: "opacity 280ms ease, stroke-width 280ms ease",
              }}
            />
          );
        })}
      </svg>
      {nodes.map((n) => {
        const isOut = n.id.startsWith("out");
        const isHotOut = step >= 1 && ((n.id === "out1" && step % 2 === 0) || (n.id === "out2" && step % 2 === 1));
        return (
          <div
            key={n.id}
            className="absolute"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {isOut ? (
              <div
                className={`px-1 h-4 rounded text-[7.5px] font-mono font-semibold flex items-center transition-all ${
                  isHotOut ? "bg-foreground text-background" : "bg-card text-foreground/55 border border-border"
                }`}
              >
                {n.id === "out1" ? "9:16" : "16:9"}
              </div>
            ) : (
              <div
                className={`size-3 rounded ${
                  n.id === "src" ? "bg-foreground" : "bg-foreground/30 border border-foreground/40"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 3 · AI voiceover — waveform with word chips appearing in cadence. */
function FeatureVoiceVisual() {
  const WORDS = ["How", "black", "holes", "warp", "time"];
  const [head, setHead] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setHead((h) => (h + 1) % (WORDS.length + 2)), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-[112px] rounded-lg border border-border bg-muted/40 p-3 flex flex-col">
      {/* Word track */}
      <div className="flex flex-wrap gap-1 mb-auto">
        {WORDS.map((w, i) => (
          <span
            key={w + i}
            className={`text-[10.5px] px-1.5 py-0.5 rounded font-medium transition-all ${
              i < head ? "bg-foreground text-background" : "bg-card text-foreground/40 border border-border"
            }`}
            style={{
              transform: i < head ? "translateY(0)" : "translateY(2px)",
              opacity: i < head ? 1 : 0.6,
            }}
          >
            {w}
          </span>
        ))}
      </div>

      {/* Waveform */}
      <div className="h-7 flex items-end gap-[2px]">
        {Array.from({ length: 44 }).map((_, i) => {
          const wave = Math.abs(Math.sin(i * 0.35) * Math.cos(i * 0.21));
          const reached = head > 0 && i < Math.floor((head / (WORDS.length + 2)) * 44);
          return (
            <div
              key={i}
              className="w-[2px] rounded-full bg-foreground"
              style={{
                height: `${3 + wave * 22}px`,
                opacity: reached ? 0.85 : 0.18,
                transition: "opacity 200ms ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** 4 · Manic style transfer — a plain scene morphs into a gradient/glow version on toggle. */
function FeatureManicVisual() {
  const [manic, setManic] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setManic((m) => !m), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-[112px] rounded-lg border border-border overflow-hidden bg-black relative">
      {/* Plain layer (always visible underneath) */}
      <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
        <circle cx="50" cy="30" r="14" fill="none" stroke="white" strokeWidth="0.8" opacity="0.9" />
        <circle cx="50" cy="30" r="2" fill="white" />
        <line x1="20" y1="30" x2="80" y2="30" stroke="white" strokeOpacity="0.4" strokeWidth="0.4" />
        <line x1="50" y1="6" x2="50" y2="54" stroke="white" strokeOpacity="0.4" strokeWidth="0.4" />
      </svg>

      {/* Manic glow layer */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: manic ? 1 : 0 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.55),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(56,189,248,0.45),transparent_55%)]" />
        <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
          {[
            [22, 18], [78, 22], [16, 44], [82, 46], [35, 14], [66, 50], [50, 8], [50, 52],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="0.9" fill="white" opacity="0.85" />
          ))}
        </svg>
      </div>

      {/* Toggle pill */}
      <div className="absolute top-2 right-2 inline-flex p-0.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-[9px] font-mono">
        <span className={`px-1.5 py-0.5 rounded-full transition-colors ${!manic ? "bg-white text-black" : "text-white/65"}`}>plain</span>
        <span className={`px-1.5 py-0.5 rounded-full transition-colors ${manic ? "bg-white text-black" : "text-white/65"}`}>manic</span>
      </div>
    </div>
  );
}

/** 5 · Scene-first — row of scene tiles, one is "rendering" while others stay done. */
function FeatureSceneFirstVisual() {
  const [editing, setEditing] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const tick = setInterval(() => setProgress((p) => (p >= 100 ? 100 : p + 4)), 90);
    const next = setTimeout(() => {
      clearInterval(tick);
      setEditing((e) => (e + 1) % 4);
    }, 2600);
    return () => {
      clearInterval(tick);
      clearTimeout(next);
    };
  }, [editing]);

  return (
    <div className="h-[112px] rounded-lg border border-border bg-muted/40 p-2.5 flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {[0, 1, 2, 3].map((i) => {
          const isEditing = i === editing;
          return (
            <div
              key={i}
              className={`relative rounded border bg-card transition-all ${
                isEditing ? "border-amber-400 ring-2 ring-amber-400/30" : "border-border"
              }`}
            >
              <div className="absolute top-1 left-1 font-mono text-[8px] text-foreground/55">
                S0{i + 1}
              </div>
              <div className="absolute top-1 right-1">
                <span
                  className={`size-1.5 rounded-full ${
                    isEditing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                  }`}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-1.5 rounded-sm bg-foreground/25" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress for the editing scene only */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono text-foreground/55">S0{editing + 1}</span>
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full"
            style={{ width: `${progress}%`, transition: "width 120ms linear" }}
          />
        </div>
        <span className="text-[9px] font-mono text-foreground/55 tabular-nums">{progress}%</span>
      </div>
    </div>
  );
}

/** 6 · Ships everywhere — row of platforms lighting up in sequence. */
function FeaturePlatformsVisual() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 6), 700);
    return () => clearInterval(id);
  }, []);

  const PLATFORMS = ["Web", "Mac", "Win", "Linux", "Chrome"];

  return (
    <div className="h-[112px] rounded-lg border border-border bg-muted/40 p-3 flex flex-col">
      <div className="flex-1 flex items-center justify-center gap-2">
        {PLATFORMS.map((p, i) => {
          const active = step > i;
          const done = step >= PLATFORMS.length && step < 6;
          return (
            <div key={p} className="flex flex-col items-center gap-1">
              <div
                className={`size-9 rounded-md flex items-center justify-center transition-all ${
                  active || done
                    ? "bg-foreground text-background border border-foreground"
                    : "bg-card text-foreground/35 border border-border"
                }`}
                style={{ transform: active || done ? "scale(1)" : "scale(0.92)" }}
              >
                <PlatformIcon name={p} done={done || (active && step > i + 1)} />
              </div>
              <span
                className={`text-[8.5px] font-medium tracking-wide ${
                  active || done ? "text-foreground" : "text-foreground/45"
                }`}
              >
                {p}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlatformIcon({ name, done }: { name: string; done: boolean }) {
  if (done) return <Check className="size-3.5" strokeWidth={3} />;
  if (name === "Web") return <span className="text-[9px] font-bold">W</span>;
  if (name === "Mac") return <span className="text-[10px]">⌘</span>;
  if (name === "Win") return <span className="text-[9px] font-bold">⊞</span>;
  if (name === "Linux") return <span className="text-[10px]">🐧</span>;
  if (name === "Chrome") return <Zap className="size-3.5" strokeWidth={2.5} />;
  return null;
}

/* -------------------------------------------------------------------------- */
/*                          PreviewSurface (hero)                             */
/* -------------------------------------------------------------------------- */

function PreviewSurface({
  kind,
  phase,
  progress,
  showRender,
  showDone,
}: {
  kind: "landscape" | "portrait";
  phase: number;
  progress: number;
  showRender: boolean;
  showDone: boolean;
}) {
  const isPortrait = kind === "portrait";
  const wrapper = isPortrait
    ? "w-[104px] shrink-0 aspect-[9/16] rounded-md"
    : "flex-1 min-w-0 aspect-video rounded-lg";
  const label = isPortrait ? "9:16 · Shorts" : "16:9 · Master";

  return (
    <div className={`relative overflow-hidden border border-border bg-black ${wrapper}`}>
      {/* Real Manim render — runs from the start of the rendering phase. */}
      {phase >= 2 && (
        <img
          src="/examples/TrigonometryAnimation_ManimCE_v0.17.3.gif"
          alt="Rendered Manim animation"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: isPortrait ? "50% 50%" : "center",
            transform: isPortrait ? "scale(1.4)" : "none",
            animation: "fadeIn 400ms ease",
          }}
        />
      )}

      {/* Idle / planning placeholder */}
      {phase < 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black">
          <div
            className={`rounded-full border-2 border-white/25 border-t-white/70 animate-spin ${
              isPortrait ? "size-4" : "size-6"
            }`}
          />
          {!isPortrait && (
            <span className="font-mono text-[10px] text-white/55 tracking-wider">
              {phase === 0 ? "WAITING FOR SOURCE" : "QUEUEING SCENES…"}
            </span>
          )}
        </div>
      )}

      {/* Format chip */}
      <div
        className={`absolute top-1.5 left-1.5 ${
          isPortrait ? "text-[8px] px-1 py-px" : "text-[9.5px] px-1.5 py-0.5"
        } rounded bg-black/55 backdrop-blur-sm text-white font-semibold tracking-wider`}
      >
        {label}
      </div>

      {/* REC indicator — landscape only to avoid clutter on portrait */}
      {!isPortrait && showRender && (
        <div className="absolute top-1.5 right-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/55 backdrop-blur-sm text-[9.5px] font-semibold tracking-wider text-white">
            {showDone ? (
              <>
                <Play className="size-2.5 fill-white" />
                PREVIEW
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                REC · {progress}%
              </>
            )}
          </span>
        </div>
      )}

      {/* Scrubber */}
      {showRender && (
        <div
          className={`absolute left-1.5 right-1.5 ${
            isPortrait ? "bottom-1.5 h-0.5" : "bottom-2 h-1"
          } rounded-full bg-white/15 overflow-hidden`}
        >
          <div
            className="h-full bg-white"
            style={{
              width: `${showDone ? 100 : progress}%`,
              transition: "width 220ms linear",
            }}
          />
        </div>
      )}

      {/* Published badge — landscape only */}
      {!isPortrait && showDone && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-white text-black text-[10px] font-bold tracking-wider uppercase shadow-lg"
          style={{ animation: "fadeIn 500ms ease" }}
        >
          ✓ Published
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          How-it-works step visuals                         */
/* -------------------------------------------------------------------------- */

const STEP_URL = "youtube.com/watch?v=…";

function StepUrlVisual() {
  const [phase, setPhase] = useState(0); // 0 typing | 1 transcript | 2 scenes
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    const dur = [2600, 1800, 2200];
    const t = setTimeout(() => setPhase((p) => ((p + 1) % 3) as 0 | 1 | 2), dur[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 0) return;
    setTyped(0);
    const id = setInterval(() => {
      setTyped((n) => (n >= STEP_URL.length ? n : n + 1));
    }, 90);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div className="h-[140px] rounded-lg border border-border bg-muted/40 p-3 flex flex-col gap-2">
      {/* URL bar */}
      <div className="h-7 px-2 rounded-md border border-border bg-background flex items-center gap-1.5 font-mono text-[11px]">
        <Youtube className="size-3 text-muted-foreground shrink-0" strokeWidth={1.8} />
        <span className="truncate text-foreground/85">
          {phase === 0 ? STEP_URL.slice(0, typed) : STEP_URL}
          {phase === 0 && typed < STEP_URL.length && (
            <span className="inline-block w-px h-3 align-middle ml-px bg-foreground animate-pulse" />
          )}
        </span>
      </div>

      {/* Transcript lines */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 rounded-sm"
            style={{
              opacity: phase >= 1 ? 1 : 0,
              width: ["88%", "76%", "60%"][i],
              backgroundColor: `hsl(var(--foreground) / ${phase >= 2 ? 0.85 : 0.35})`,
              transition: `opacity 320ms ${i * 120}ms ease, background-color 320ms ease`,
            }}
          />
        ))}
      </div>

      {/* Scene chips */}
      <div className="flex gap-1.5">
        {["S01", "S02", "S03"].map((s, i) => (
          <div
            key={s}
            className="flex-1 h-5 rounded text-[9px] font-mono flex items-center justify-center border border-border bg-card text-foreground/75"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0)" : "translateY(4px)",
              transition: `opacity 280ms ${i * 120}ms ease, transform 280ms ${i * 120}ms ease`,
            }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepTemplateVisual() {
  // 0: cycling, 1: settled on one, 2: voice playing
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [cursor, setCursor] = useState(0);
  const CHOSEN = 4;

  useEffect(() => {
    if (phase === 0) {
      const cyc = setInterval(() => setCursor((c) => (c + 1) % 9), 240);
      const t = setTimeout(() => {
        clearInterval(cyc);
        setCursor(CHOSEN);
        setPhase(1);
      }, 2400);
      return () => {
        clearInterval(cyc);
        clearTimeout(t);
      };
    }
    if (phase === 1) {
      const t = setTimeout(() => setPhase(2), 900);
      return () => clearTimeout(t);
    }
    if (phase === 2) {
      const t = setTimeout(() => setPhase(0), 2200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="h-[140px] rounded-lg border border-border bg-muted/40 p-3 flex flex-col gap-2">
      {/* Template grid */}
      <div className="grid grid-cols-3 gap-1 flex-1">
        {Array.from({ length: 9 }).map((_, i) => {
          const isActive = (phase === 0 && i === cursor) || (phase >= 1 && i === CHOSEN);
          const dimmed = phase >= 2 && i !== CHOSEN;
          return (
            <div
              key={i}
              className={`relative rounded border transition-all ${
                isActive ? "border-foreground bg-foreground/10" : "border-border bg-card"
              }`}
              style={{
                opacity: dimmed ? 0.4 : 1,
                transform: isActive ? "scale(1.04)" : "scale(1)",
              }}
            >
              {/* mini glyph — vary shape by index */}
              <div className="absolute inset-0 flex items-center justify-center">
                {i % 3 === 0 && <div className="size-2 rounded-full bg-foreground/60" />}
                {i % 3 === 1 && <div className="w-3 h-px bg-foreground/60" />}
                {i % 3 === 2 && <div className="size-2 rotate-45 bg-foreground/60" />}
              </div>
              {phase >= 1 && i === CHOSEN && (
                <div className="absolute top-0.5 right-0.5 size-3 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="size-2" strokeWidth={3.5} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Voice waveform */}
      <div className="h-5 flex items-center gap-[2px]">
        {Array.from({ length: 32 }).map((_, i) => {
          const base = 3 + Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.31)) * 14;
          return (
            <div
              key={i}
              className="w-[2px] rounded-full bg-foreground"
              style={{
                height: phase >= 2 ? `${base}px` : "3px",
                opacity: phase >= 2 ? 0.75 : 0.18,
                transition: `height 280ms ${i * 14}ms ease, opacity 240ms ${i * 14}ms ease`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function StepPublishVisual() {
  // 0 idle → 1 YT → 2 TT → 3 IG → 4 hold → loop
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);

  useEffect(() => {
    const dur = [800, 650, 650, 650, 1800];
    const t = setTimeout(() => setPhase((p) => (((p + 1) % 5) as 0 | 1 | 2 | 3 | 4)), dur[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  const platforms = [
    { id: "yt", icon: Youtube, label: "YT", x: 50, y: 12 },
    { id: "tt", icon: Music, label: "TT", x: 14, y: 78 },
    { id: "ig", icon: Instagram, label: "IG", x: 86, y: 78 },
  ];

  const isActive = (i: number) => phase >= i + 1;

  return (
    <div className="relative h-[140px] rounded-lg border border-border bg-muted/40 p-3">
      {/* connectors */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {platforms.map((p, i) => (
          <line
            key={p.id}
            x1={50}
            y1={50}
            x2={p.x}
            y2={p.y}
            stroke="hsl(var(--foreground))"
            strokeWidth="0.3"
            strokeDasharray="2 1.5"
            pathLength={100}
            style={{
              opacity: isActive(i) ? 0.5 : 0,
              strokeDashoffset: isActive(i) ? 0 : 100,
              transition: "stroke-dashoffset 380ms ease, opacity 240ms ease",
            }}
          />
        ))}
      </svg>

      {/* center video tile */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="px-2 h-7 rounded-md bg-foreground text-background flex items-center gap-1 text-[10px] font-semibold">
          <Play className="size-3 fill-background" />
          Render
        </div>
      </div>

      {/* platform icons */}
      {platforms.map((p, i) => {
        const active = isActive(i);
        const Icon = p.icon;
        return (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className={`size-8 rounded-full flex items-center justify-center transition-all ${
                active
                  ? "bg-foreground text-background border border-foreground"
                  : "bg-card text-foreground/40 border border-border"
              }`}
              style={{ transform: active ? "scale(1)" : "scale(0.9)" }}
            >
              {phase === 4 && active ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                <Icon className="size-3.5" strokeWidth={2} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Small helpers                                 */
/* -------------------------------------------------------------------------- */

function PreviewTile({ ex }: { ex: (typeof EXAMPLES)[number] }) {
  // Tiles are intentionally dark — these are video thumbnails, not page chrome.
  return (
    <div className="relative group overflow-hidden rounded-xl border border-border aspect-[4/5] cursor-pointer transition-shadow hover:shadow-lg bg-black">
      <img
        src={ex.src}
        alt={ex.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
      />
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/55 text-white backdrop-blur-sm border border-white/15">
          {ex.category}
        </span>
        <span className="font-mono text-[10.5px] text-white/85 px-1.5 py-0.5 rounded bg-black/45 backdrop-blur-sm">
          {ex.duration}
        </span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="size-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
          <Play className="size-5 text-white fill-white ml-0.5" />
        </span>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-[13px] font-medium leading-snug text-white">{ex.title}</p>
      </div>
    </div>
  );
}

type FooterLink = { label: string; href: string };

const FOOTER_PRODUCT: FooterLink[] = [
  { label: "Examples", href: "#examples" },
  { label: "Gallery", href: "/gallery" },
  { label: "Playground", href: "/playground" },
  { label: "Workflow", href: "#features" },
  { label: "Extension", href: "#extension" },
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
  { label: "Contact", href: "/contact" },
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
  // Internal route → react-router Link. External / mail / hash → anchor.
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
