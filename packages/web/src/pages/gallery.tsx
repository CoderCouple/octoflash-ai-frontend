import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { AuthCtaButtons } from "@/layouts/public-shell";
import {
  ArrowRight,
  ChevronRight,
  Github,
  Lock,
  Moon,
  Play,
  Sparkles,
  Sun,
  Twitter,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Examples", href: "/#examples" },
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Gallery", href: "/gallery" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

type Item = {
  title: string;
  description: string;
  src: string;
  tags: string[];
  featured?: boolean;
  locked?: boolean;
};

// Canonical tag list. Ordering controls the sidebar order.
const TAGS = [
  "Animation",
  "Beginner",
  "Algebra",
  "Calculus",
  "Circle",
  "Complex Numbers",
  "Cosine",
  "Differential Equations",
  "Educational",
  "Grid",
  "Phase Space",
  "Sine",
  "Surface Area",
  "Transform",
  "Trigonometry",
  "Vectors",
  "3D",
];

const ITEMS: Item[] = [
  {
    title: "Sine, cosine & the unit circle",
    description: "Classic visualization showing how the sine wave is generated from circular motion.",
    src: "/examples/TrigonometryAnimation_ManimCE_v0.17.3.gif",
    tags: ["Trigonometry", "Sine", "Cosine", "Circle"],
    featured: true,
  },
  {
    title: "Why sin(0) = 0, visualised",
    description: "Mapping angle to height — see the wave emerge from the rotating radius.",
    src: "/examples/TrigonometryAnimation_ManimCE_v0.17.3.gif",
    tags: ["Trigonometry", "Sine", "Educational", "Beginner"],
  },
  {
    title: "Tangent on the unit circle",
    description: "The asymptote at π/2 explained through a sliding line and a circle.",
    src: "/examples/TrigonometryAnimation_ManimCE_v0.17.3.gif",
    tags: ["Trigonometry", "Circle", "Animation"],
  },

  {
    title: "Geometry of complex numbers",
    description: "Argand plane, rotation and conjugates — the visual algebra of i.",
    src: "/examples/ComplexNumbersAnimation_ManimCE_v0.17.3.gif",
    tags: ["Algebra", "Complex Numbers", "Transform"],
    featured: true,
  },
  {
    title: "Complex multiplication as rotation",
    description: "Why i² = −1, shown as a quarter turn on the Argand plane.",
    src: "/examples/ComplexNumbersAnimation_ManimCE_v0.17.3.gif",
    tags: ["Complex Numbers", "Animation", "Educational"],
  },
  {
    title: "Conjugates on the Argand plane",
    description: "A reflection across the real axis, with magnitude preserved.",
    src: "/examples/ComplexNumbersAnimation_ManimCE_v0.17.3.gif",
    tags: ["Complex Numbers", "Algebra", "Beginner"],
  },

  {
    title: "Surface area in 3D",
    description: "Unrolling a cube into six faces — the hands-on proof of A = 6s².",
    src: "/examples/3d_calculus.gif",
    tags: ["Calculus", "3D", "Surface Area"],
    featured: true,
  },
  {
    title: "Building a cube from faces",
    description: "Volume of a cube assembled face-by-face with smooth easing.",
    src: "/examples/3d_calculus.gif",
    tags: ["3D", "Calculus", "Animation"],
  },
  {
    title: "Volume & surface, unrolled",
    description: "What happens when you double an edge? Animated comparison.",
    src: "/examples/3d_calculus.gif",
    tags: ["Calculus", "Surface Area", "Educational"],
  },

  {
    title: "Solution curves of ẋ = f(x)",
    description: "Trajectories drawn over a vector field — the heart of dynamical systems.",
    src: "/examples/differential_equations.gif",
    tags: ["Differential Equations", "Vectors", "Phase Space"],
    featured: true,
  },
  {
    title: "Phase-space portraits",
    description: "Spirals, sinks and saddle points classified by linearisation.",
    src: "/examples/differential_equations.gif",
    tags: ["Phase Space", "Differential Equations", "Animation"],
    locked: true,
  },
  {
    title: "Higher-dimensional rotations",
    description: "From 2D to 4D — generalising rotation matrices on a sphere.",
    src: "/examples/3d_calculus.gif",
    tags: ["3D", "Algebra"],
    locked: true,
  },
  {
    title: "Vector fields & flow lines",
    description: "Where the trajectories go, and why — flow on a grid.",
    src: "/examples/differential_equations.gif",
    tags: ["Vectors", "Grid", "Animation", "Beginner"],
  },
];

export default function GalleryPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("all");

  const items = useMemo(
    () => (active === "all" ? ITEMS : ITEMS.filter((i) => i.tags.includes(active))),
    [active],
  );

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
              n.href.startsWith("/") && !n.href.includes("#") ? (
                <Link
                  key={n.href}
                  to={n.href}
                  className={`text-[15px] font-medium hover:text-foreground transition-colors ${
                    n.href === "/gallery" ? "text-foreground" : "text-foreground/75"
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
            <AuthCtaButtons />
          </div>
        </div>
      </header>

      {/* Body — breadcrumb + 2-column (sidebar + grid) */}
      <section className="bg-background">
        <div className="max-w-[1200px] mx-auto px-6 pt-10 md:pt-12 pb-2">
          <nav className="flex items-center gap-1.5 text-[12.5px] text-foreground/60 mb-2" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-medium">Gallery</span>
          </nav>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 pb-16 flex flex-col md:flex-row md:gap-10 md:items-start">
          {/* Sidebar — md+ only */}
          <aside className="hidden md:block w-[220px] shrink-0">
            <div className="text-[12px] uppercase tracking-[0.18em] text-foreground/55 font-semibold mb-3">
              Filter by Tag
            </div>
            <ul className="space-y-1">
              <li>
                <FilterRow
                  label="All Templates"
                  count={ITEMS.length}
                  active={active === "all"}
                  onClick={() => setActive("all")}
                  primary
                />
              </li>
              {TAGS.map((t) => {
                const count = ITEMS.filter((i) => i.tags.includes(t)).length;
                if (count === 0) return null;
                return (
                  <li key={t}>
                    <FilterRow
                      label={t}
                      count={count}
                      active={active === t}
                      onClick={() => setActive(t)}
                    />
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
              <h1 className="text-[34px] md:text-[40px] leading-[1.05] font-semibold tracking-tight">
                Templates
              </h1>
              <p className="text-[14.5px] text-foreground/65 mt-3 max-w-[640px] leading-relaxed">
                Browse our collection of Manim animation templates. Click any
                template to view details, copy the code, or edit it directly.
              </p>

              {/* Mobile filter chip strip — only below md */}
              <div className="md:hidden mt-5 -mx-6 px-6 overflow-x-auto">
                <div className="flex gap-2 pb-1 min-w-max">
                  <MobileChip
                    label="All"
                    count={ITEMS.length}
                    active={active === "all"}
                    onClick={() => setActive("all")}
                  />
                  {TAGS.map((t) => {
                    const count = ITEMS.filter((i) => i.tags.includes(t)).length;
                    if (count === 0) return null;
                    return (
                      <MobileChip
                        key={t}
                        label={t}
                        count={count}
                        active={active === t}
                        onClick={() => setActive(t)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Featured hero — only on the "All" view */}
              {active === "all" && items.find((i) => i.featured) && (
                <FeaturedHero item={items.find((i) => i.featured)!} />
              )}

              <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items
                  .filter((it) => active !== "all" || !it.featured || it !== items.find((i) => i.featured))
                  .map((it) => (
                    <TemplateCard key={it.title} item={it} />
                  ))}
              </div>

              {items.length === 0 && (
                <div className="text-center py-16 text-foreground/60 text-[14px]">
                  No templates match this tag yet.
                </div>
              )}
            </main>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background border-t border-border">
        <div className="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-10 grid md:grid-cols-[1.2fr,auto] gap-6 items-center">
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-foreground/60 font-medium mb-2">
                Ready to create?
              </p>
              <h2 className="text-[26px] md:text-[32px] font-semibold tracking-tight leading-tight">
                Make your own version of any of these scenes.
              </h2>
              <p className="text-[14.5px] text-foreground/65 mt-3 max-w-[520px] leading-relaxed">
                Open any tile, swap the template or style, retime the voiceover
                and ship to Shorts in a single pass.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                size="lg"
                className="h-11 px-5 font-semibold rounded-md"
                onClick={() => navigate("/signup")}
              >
                Sign up <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-5 font-semibold rounded-md"
                onClick={() => navigate("/pricing")}
              >
                See pricing
              </Button>
            </div>
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
            <p className="text-[13px] text-foreground/75 max-w-[280px] leading-relaxed">
              AI-rendered Manim explainers. Built for creators who teach.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="https://github.com" target="_blank" rel="noreferrer noopener" className="size-8 rounded-md border border-border hover:border-foreground/40 flex items-center justify-center" aria-label="GitHub">
                <Github className="size-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer noopener" className="size-8 rounded-md border border-border hover:border-foreground/40 flex items-center justify-center" aria-label="Twitter">
                <Twitter className="size-4" />
              </a>
            </div>
          </div>
          <FooterCol title="Product" links={FOOTER_PRODUCT} />
          <FooterCol title="Learn" links={FOOTER_LEARN} />
          <FooterCol title="Company" links={FOOTER_COMPANY} />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 py-6 border-t border-border flex items-center justify-between text-[12px] text-foreground/60">
          <span>© {new Date().getFullYear()} Octoflash AI. All rights reserved.</span>
          <span className="font-mono">v0.1.0 · beta</span>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Filter row                                    */
/* -------------------------------------------------------------------------- */

function FilterRow({
  label,
  count,
  active,
  onClick,
  primary,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 h-8 px-2.5 rounded-md text-[13px] transition-colors ${
        active
          ? "bg-foreground text-background font-semibold"
          : "text-foreground/85 hover:text-foreground hover:bg-muted"
      }`}
    >
      <Play
        className={`size-2.5 shrink-0 ${
          active
            ? "fill-background text-background"
            : primary
              ? "fill-foreground text-foreground"
              : "fill-foreground/55 text-foreground/55"
        }`}
        strokeWidth={0}
      />
      <span className="flex-1 text-left truncate">{label}</span>
      <span
        className={`font-mono text-[10px] tabular-nums ${
          active ? "text-background/70" : "text-foreground/45"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Mobile chip                                   */
/* -------------------------------------------------------------------------- */

function MobileChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] font-medium border whitespace-nowrap transition-colors ${
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

/* -------------------------------------------------------------------------- */
/*                              Featured hero                                 */
/* -------------------------------------------------------------------------- */

function FeaturedHero({ item }: { item: Item }) {
  return (
    <div className="mt-7 rounded-2xl overflow-hidden border border-border bg-card shadow-sm grid md:grid-cols-[1.4fr,1fr]">
      <div className="relative aspect-video md:aspect-auto md:h-full bg-black overflow-hidden">
        <img
          src={item.src}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-sm text-white text-[10.5px] font-semibold tracking-wider uppercase border border-white/15">
          <Sparkles className="size-3 fill-white" strokeWidth={2} />
          Featured
        </span>
        {/* Play affordance */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="size-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="size-6 text-white fill-white ml-0.5" />
          </span>
        </div>
      </div>
      <div className="p-6 md:p-7 flex flex-col">
        <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/55 font-semibold mb-2">
          Editor's pick
        </p>
        <h2 className="text-[22px] md:text-[24px] font-semibold tracking-tight leading-tight">
          {item.title}
        </h2>
        <p className="text-[13.5px] text-foreground/65 mt-2 leading-relaxed">{item.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {item.tags.map((t) => (
            <span
              key={t}
              className="text-[10.5px] px-1.5 py-0.5 rounded bg-muted text-foreground/80 font-medium"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-5 flex items-center gap-3">
          <Button size="lg" className="h-10 px-4 font-semibold rounded-md">
            Try this template <ArrowRight className="size-4 ml-1.5" />
          </Button>
          <a
            href="#"
            className="text-[13px] font-semibold text-foreground/70 hover:text-foreground inline-flex items-center gap-1"
          >
            View code →
          </a>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Template card                                 */
/* -------------------------------------------------------------------------- */

function TemplateCard({ item }: { item: Item }) {
  return (
    <div className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <img
          src={item.src}
          alt={item.title}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
            item.locked ? "opacity-30 group-hover:opacity-40" : "opacity-95 group-hover:opacity-100"
          }`}
        />

        {/* Featured badge */}
        {item.featured && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wider uppercase border border-white/15">
            <Sparkles className="size-2.5 fill-white" strokeWidth={2} />
            Featured
          </span>
        )}

        {/* Locked overlay */}
        {item.locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 backdrop-blur-[1px]">
            <span className="size-9 rounded-full bg-black/55 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Lock className="size-4 text-white" strokeWidth={2} />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-white/85">
              Pro
            </span>
          </div>
        )}

        {/* Hover play (only when not locked) */}
        {!item.locked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="size-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Play className="size-4 text-white fill-white ml-0.5" />
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-[14.5px] font-semibold tracking-tight leading-tight line-clamp-1">
          {item.title}
        </h3>
        <p className="text-[12.5px] text-foreground/65 mt-1 leading-snug line-clamp-2">
          {item.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {item.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10.5px] px-1.5 py-0.5 rounded bg-muted text-foreground/80 font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Footer / theme                                */
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
      className="size-8 rounded-md inline-flex items-center justify-center text-foreground/75 hover:text-foreground hover:bg-muted transition-colors relative"
    >
      <Sun className={`size-4 transition-all ${isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0"} absolute`} />
      <Moon className={`size-4 transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
    </button>
  );
}

type FooterLink = { label: string; href: string };

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
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-foreground/55 font-medium mb-3">
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
