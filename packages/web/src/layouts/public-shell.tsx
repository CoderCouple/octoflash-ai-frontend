import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Github, Moon, Sun, Twitter, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*                          Shared nav + footer data                          */
/* -------------------------------------------------------------------------- */

export const PUBLIC_NAV: { label: string; href: string }[] = [
  { label: "Examples", href: "/#examples" },
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Gallery", href: "/gallery" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export type FooterLink = { label: string; href: string };

export const FOOTER_PRODUCT: FooterLink[] = [
  { label: "Examples", href: "/#examples" },
  { label: "Gallery", href: "/gallery" },
  { label: "Playground", href: "/playground" },
  { label: "Workflow", href: "/#features" },
  { label: "Extension", href: "/#extension" },
];

export const FOOTER_LEARN: FooterLink[] = [
  { label: "What is Manim?", href: "/what-is-manim" },
  { label: "Manim docs", href: "https://docs.manim.community/en/stable/" },
  { label: "For teachers", href: "/teachers" },
  { label: "Help", href: "/help" },
];

export const FOOTER_COMPANY: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

/* -------------------------------------------------------------------------- */
/*                              PublicShell                                   */
/* -------------------------------------------------------------------------- */

export function PublicShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased flex flex-col">
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
            {PUBLIC_NAV.map((n) => {
              const isInternal = n.href.startsWith("/") && !n.href.includes("#");
              const isActive = isInternal && pathname === n.href;
              const cls = `text-[15px] font-medium hover:text-foreground transition-colors ${
                isActive ? "text-foreground" : "text-foreground/75"
              }`;
              return isInternal ? (
                <Link key={n.href} to={n.href} className={cls}>
                  {n.label}
                </Link>
              ) : (
                <a key={n.href} href={n.href} className={cls}>
                  {n.label}
                </a>
              );
            })}
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
              onClick={() => navigate("/login?signup=1")}
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

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
/*                              Theme toggle                                  */
/* -------------------------------------------------------------------------- */

export function ThemeToggle() {
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
      <Sun
        className={`size-4 transition-all ${isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0"} absolute`}
      />
      <Moon
        className={`size-4 transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 rotate-90"}`}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Footer column                                 */
/* -------------------------------------------------------------------------- */

export function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
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

export function FooterLinkA({ href, children }: { href: string; children: ReactNode }) {
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

/* -------------------------------------------------------------------------- */
/*                          PageHero (content pages)                          */
/* -------------------------------------------------------------------------- */

export function PageHero({
  eyebrow,
  title,
  subtitle,
  breadcrumb,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <section className="bg-background border-b border-border">
      <div className="max-w-[820px] mx-auto px-6 pt-14 md:pt-20 pb-12">
        {breadcrumb && (
          <nav className="flex items-center gap-1.5 text-[12.5px] text-foreground/60 mb-5" aria-label="Breadcrumb">
            {breadcrumb.map((b, i) => (
              <span key={b.label} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-foreground/40">/</span>}
                {b.href ? (
                  <Link to={b.href} className="hover:text-foreground">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="text-[12px] uppercase tracking-[0.18em] text-foreground/55 font-medium mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[36px] md:text-[44px] leading-[1.06] font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[16px] text-foreground/65 mt-4 leading-relaxed max-w-[640px]">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
