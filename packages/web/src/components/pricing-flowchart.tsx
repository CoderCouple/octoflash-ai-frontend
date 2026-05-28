/**
 * Y-split pricing flowchart used by both the public /pricing page (signed-out
 * marketing) and the in-app /billing/plans page (logged-in upgrade).
 *
 * Visual: question pill → Y-split → two BranchCards (BYOK vs Hosted) →
 * Y-merge → support callout → schools callout.
 *
 * The caller decides what happens when a CTA is clicked via `onSelectPlan` —
 * public page navigates to `/login?plan=…`, in-app page kicks Stripe Checkout.
 *
 * Visual chrome can be trimmed via `embedded` (drops the eyebrow + outer hero
 * spacing) — used when mounted inside the AppShell so it doesn't fight the
 * sidebar layout.
 */

import {
  ArrowRight,
  Check,
  ChevronDown,
  GraduationCap,
  Key,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export type PlanId = "byok" | "hosted";

export type PricingFlowchartProps = {
  eyebrow?: string;
  heading?: string;
  subhead?: string;
  /** Drops the eyebrow tag and shrinks vertical spacing — for in-app mounting. */
  embedded?: boolean;
  onSelectPlan: (plan: PlanId) => void;
  busyPlan?: PlanId | null;
};

export function PricingFlowchart({
  eyebrow = "Pricing",
  heading = "How much does it cost?",
  subhead = "Adapted to you.",
  embedded,
  onSelectPlan,
  busyPlan,
}: PricingFlowchartProps) {
  return (
    <div className={embedded ? "max-w-[860px] mx-auto" : ""}>
      <div
        className={
          embedded
            ? "text-center pt-2 pb-8"
            : "max-w-[640px] mx-auto px-6 pt-20 pb-10 md:pt-24 text-center"
        }
      >
        {!embedded && (
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-3">
            {eyebrow}
          </p>
        )}
        <h1
          className={
            embedded
              ? "text-3xl md:text-4xl font-bold tracking-tight"
              : "text-[44px] md:text-[56px] leading-[1.04] font-semibold tracking-tight"
          }
        >
          {heading}
        </h1>
        <p
          className={
            embedded
              ? "text-[14px] text-muted-foreground mt-2"
              : "text-[18px] text-muted-foreground mt-3 font-medium"
          }
        >
          {subhead}
        </p>
      </div>

      <div className={embedded ? "px-2 pb-10" : "max-w-[860px] mx-auto px-6 pb-16"}>
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-border bg-card text-[13.5px] font-medium">
            Already use Claude, ChatGPT or ElevenLabs?
          </div>
        </div>

        <FlowStem />
        <YSplit leftLabel="Yes" rightLabel="No" />

        <div className="grid md:grid-cols-2 gap-5 md:gap-8 mt-4">
          <BranchCard
            variant="yes"
            title="No extra cost"
            body="Plug in your Claude + ElevenLabs keys. Octoflash runs every render against your own quota — we charge a flat fee."
            providers={["Claude", "ChatGPT", "ElevenLabs", "Gemini CLI"]}
            plan="byok"
            busy={busyPlan === "byok"}
            onCta={() => onSelectPlan("byok")}
          />
          <BranchCard
            variant="no"
            title="Free credits included"
            body="We gift you enough Claude Opus + ElevenLabs credits to render your first 10 scenes. After that, $99.99/month for 90 videos."
            providers={["Claude Opus", "ElevenLabs · Multilingual"]}
            plan="hosted"
            busy={busyPlan === "hosted"}
            onCta={() => onSelectPlan("hosted")}
          />
        </div>

        <YMerge />
        <FlowStem />

        <Callout
          icon={ShieldCheck}
          title="Either way, we adapt to you"
          body="Have questions? Let's talk. We'll help you pick the right plan, set up your keys and support you along the way."
          ctaLabel="Contact Octoflash support"
          ctaHref="mailto:support@octoflash.ai"
          centered
        />

        <FlowStem />

        <Callout
          icon={GraduationCap}
          title="For schools & universities"
          body="Bring Octoflash into your classroom or lab. Book a free call — eligible institutions get a 20% discount."
          ctaLabel="Book a free school demo"
          ctaHref="mailto:schools@octoflash.ai"
          centered
          emphasized
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Flow primitives                               */
/* -------------------------------------------------------------------------- */

function FlowStem({ length = 28, arrow = true }: { length?: number; arrow?: boolean }) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <div className="w-px bg-border" style={{ height: length }} />
      {arrow && <ChevronDown className="size-4 -mt-1.5 text-border" />}
    </div>
  );
}

function YSplit({ leftLabel, rightLabel }: { leftLabel: string; rightLabel: string }) {
  return (
    <div className="relative h-16" aria-hidden>
      <svg
        viewBox="0 0 200 64"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full text-border"
      >
        <line x1="100" y1="0" x2="100" y2="22" stroke="currentColor" strokeWidth="1" />
        <line x1="25" y1="22" x2="175" y2="22" stroke="currentColor" strokeWidth="1" />
        <line x1="25" y1="22" x2="25" y2="42" stroke="currentColor" strokeWidth="1" />
        <line x1="175" y1="22" x2="175" y2="42" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="absolute inset-x-0 bottom-1 flex">
        <div className="flex-1 flex justify-center">
          <BranchPill label={leftLabel} />
        </div>
        <div className="flex-1 flex justify-center">
          <BranchPill label={rightLabel} />
        </div>
      </div>
    </div>
  );
}

function YMerge() {
  return (
    <div className="relative h-12" aria-hidden>
      <svg
        viewBox="0 0 200 48"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full text-border"
      >
        <line x1="25" y1="0" x2="25" y2="22" stroke="currentColor" strokeWidth="1" />
        <line x1="175" y1="0" x2="175" y2="22" stroke="currentColor" strokeWidth="1" />
        <line x1="25" y1="22" x2="175" y2="22" stroke="currentColor" strokeWidth="1" />
        <line x1="100" y1="22" x2="100" y2="48" stroke="currentColor" strokeWidth="1" />
      </svg>
      <ChevronDown className="absolute left-1/2 -translate-x-1/2 bottom-[-2px] size-4 text-border" />
    </div>
  );
}

function BranchPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 h-6 rounded-full bg-muted border border-border text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Branch card                                   */
/* -------------------------------------------------------------------------- */

const PLANS = {
  hosted: {
    badge: "Octoflash · Hosted",
    sub: "Monthly subscription",
    price: "$99.99",
    period: "/month",
    features: [
      "90 video renders per month · 3 per day",
      "Powered by Claude Opus + ElevenLabs",
      "All 36 templates · editorial + Manic",
      "Mac / Windows / Linux + Chrome extension",
      "Free credits to start — no card required",
    ],
    cta: "Start hosted",
  },
  byok: {
    badge: "Octoflash · BYOK",
    sub: "Flat monthly fee",
    price: "$29.99",
    period: "/month",
    features: [
      "Bring your own Claude + ElevenLabs keys",
      "Unlimited videos against your own quota",
      "All 36 templates · editorial + Manic",
      "Mac / Windows / Linux + Chrome extension",
      "Keys stored locally — never proxied through us",
    ],
    cta: "Start BYOK",
  },
} as const;

function BranchCard({
  variant,
  title,
  body,
  providers,
  plan,
  busy,
  onCta,
}: {
  variant: "yes" | "no";
  title: string;
  body: string;
  providers: string[];
  plan: PlanId;
  busy?: boolean;
  onCta: () => void;
}) {
  const p = PLANS[plan];
  const emphasized = variant === "no";

  return (
    <div
      className={`rounded-2xl border p-6 md:p-7 transition-all flex flex-col ${
        emphasized
          ? "bg-foreground text-background border-foreground shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]"
          : "bg-card text-foreground border-border shadow-[0_10px_30px_-18px_rgba(0,0,0,0.12)]"
      }`}
    >
      <h3 className="text-[20px] font-semibold tracking-tight">{title}</h3>
      <p
        className={`text-[13.5px] mt-1.5 leading-relaxed ${
          emphasized ? "text-background/70" : "text-muted-foreground"
        }`}
      >
        {body}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {providers.map((pv) => (
          <span
            key={pv}
            className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
              emphasized
                ? "bg-background/10 text-background border-background/20"
                : "bg-muted text-foreground border-border"
            }`}
          >
            {pv}
          </span>
        ))}
      </div>

      <div
        className={`mt-5 pt-5 border-t ${
          emphasized ? "border-background/15" : "border-border"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`size-6 rounded-md flex items-center justify-center ${
              emphasized ? "bg-background/15" : "bg-muted"
            }`}
          >
            {plan === "byok" ? (
              <Key className="size-3.5" strokeWidth={2.2} />
            ) : (
              <Sparkles className="size-3.5" strokeWidth={2.2} />
            )}
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">{p.badge}</div>
            <div
              className={`text-[10.5px] ${
                emphasized ? "text-background/60" : "text-muted-foreground"
              }`}
            >
              {p.sub}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[44px] font-semibold tracking-tight leading-none">
            {p.price.includes(".") ? (
              <>
                {p.price.split(".")[0]}
                <span className="text-[24px] align-baseline">
                  .{p.price.split(".")[1]}
                </span>
              </>
            ) : (
              p.price
            )}
          </span>
          <span
            className={`text-[13px] ${
              emphasized ? "text-background/65" : "text-muted-foreground"
            }`}
          >
            {p.period}
          </span>
        </div>

        <ul className="mt-4 space-y-1.5 text-[12.5px]">
          {p.features.slice(0, 4).map((f) => (
            <li key={f} className="flex items-start gap-1.5">
              <Check
                className={`size-3.5 mt-0.5 shrink-0 ${
                  emphasized ? "text-background" : "text-foreground"
                }`}
                strokeWidth={2.6}
              />
              <span className={emphasized ? "text-background/95" : "text-foreground/95"}>
                {f}
              </span>
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          onClick={onCta}
          disabled={busy}
          className={`w-full mt-5 h-10 rounded-md font-semibold ${
            emphasized ? "bg-background text-foreground hover:bg-background/90" : ""
          }`}
        >
          {busy ? "Redirecting…" : (
            <>
              {p.cta} <ArrowRight className="size-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Callout                                       */
/* -------------------------------------------------------------------------- */

function Callout({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
  emphasized,
  centered,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  emphasized?: boolean;
  centered?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-7 md:p-8 border ${centered ? "text-center" : ""} ${
        emphasized
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border"
      }`}
    >
      <div
        className={`size-10 rounded-md flex items-center justify-center mb-4 ${
          centered ? "mx-auto" : ""
        } ${emphasized ? "bg-background/15" : "bg-muted"}`}
      >
        <Icon className="size-5" strokeWidth={1.8} />
      </div>
      <h3 className="text-[20px] font-semibold tracking-tight">{title}</h3>
      <p
        className={`text-[13.5px] mt-2 leading-relaxed ${
          centered ? "max-w-[460px] mx-auto" : ""
        } ${emphasized ? "text-background/75" : "text-muted-foreground"}`}
      >
        {body}
      </p>
      <a
        href={ctaHref}
        className={`mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold h-10 px-4 rounded-md transition-colors ${
          emphasized
            ? "bg-background text-foreground hover:bg-background/90"
            : "bg-foreground text-background hover:bg-foreground/90"
        }`}
      >
        {ctaLabel} <ArrowRight className="size-3.5" />
      </a>
    </div>
  );
}
