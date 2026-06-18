/**
 * /billing — account billing overview (Anthropic Console layout).
 *
 *   Current plan row  → GET  /api/v1/billing
 *   Payment row       → opens Stripe Customer Portal (POST /billing/portal)
 *   Invoices table    → GET  /api/v1/billing/invoices
 *   Cancellation row  → opens Customer Portal — cancellation lives in Stripe
 *
 * Layout: flat sections separated by generous vertical spacing. No card
 * borders around each section — just bold section labels + clean rows.
 * "Adjust plan" routes to /billing/plans (the picker).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ExternalLink, Loader2, Sparkles } from "lucide-react";

import { ApiError, billingApi, type BillingInfo, type Invoice } from "@octoflash/core";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PLAN_META: Record<string, { label: string; tagline: string }> = {
  free:       { label: "Free plan",       tagline: "Get started" },
  pro:        { label: "Pro plan",        tagline: "More usage and priority access" },
  enterprise: { label: "Enterprise plan", tagline: "Higher limits and priority access" },
};

const PAGE_SIZE = 10;

export default function BillingPage() {
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [b, inv] = await Promise.all([
          billingApi.get(),
          billingApi.invoices().catch(() => [] as Invoice[]),
        ]);
        if (cancelled) return;
        setInfo(b);
        setInvoices(inv);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? `HTTP ${e.status}: ${e.message}`
            : (e as Error).message ?? "Failed to load billing",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-7 py-10 max-w-[920px] mx-auto">
      {loading && <BillingSkeleton />}

      {error && !loading && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 flex items-start gap-2 text-[13px]">
          <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && info && (
        <div className="flex flex-col gap-12">
          <PlanRow info={info} />
          <PaymentSection info={info} />
          <InvoicesSection
            invoices={invoices ?? []}
            limit={pageLimit}
            onLoadMore={() => setPageLimit((n) => n + PAGE_SIZE)}
          />
          <CancellationSection info={info} />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Plan row (the hero — no card border, just the row)
// ────────────────────────────────────────────────────────────────────────────

function PlanRow({ info }: { info: BillingInfo }) {
  const navigate = useNavigate();
  const meta = PLAN_META[info.plan] ?? { label: info.plan, tagline: "" };
  const renewal = buildRenewalLine(info);

  return (
    <section className="flex items-start gap-4">
      <div className="size-14 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Sparkles className="size-5" strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-[17px] font-semibold">{meta.label}</h2>
        {meta.tagline && (
          <div className="text-[13px] text-muted-foreground mt-0.5">{meta.tagline}</div>
        )}
        {renewal && (
          <div className="text-[13px] text-muted-foreground">{renewal}</div>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate("/billing/plans")}>
        Adjust plan
      </Button>
    </section>
  );
}

function buildRenewalLine(info: BillingInfo): string | null {
  if (!info.currentPeriodEnd) return null;
  const end = new Date(info.currentPeriodEnd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (info.cancelAtPeriodEnd) {
    return `Your subscription is set to cancel on ${end}.`;
  }
  if (info.status === "active" || info.status === "trialing") {
    return `Your subscription will auto renew on ${end}.`;
  }
  return `Current period ends ${end}.`;
}

// ────────────────────────────────────────────────────────────────────────────
// Payment section
// ────────────────────────────────────────────────────────────────────────────

function PaymentSection({ info }: { info: BillingInfo }) {
  const hasCustomer = !!info.stripeCustomerId;

  return (
    <section>
      <h3 className="text-[15px] font-semibold mb-4">Payment</h3>
      <div className="flex items-center gap-3">
        <div className="size-7 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
          <span className="text-emerald-600 dark:text-emerald-400 text-[14px] font-bold leading-none">
            ›
          </span>
        </div>
        <div className="flex-1 min-w-0 text-[13.5px]">
          {hasCustomer ? "Link by Stripe" : "No payment method on file"}
        </div>
        <PortalButton label={hasCustomer ? "Update" : "Add"} disabled={!hasCustomer} />
      </div>
    </section>
  );
}

function PortalButton({
  label,
  variant = "outline",
  disabled,
}: {
  label: string;
  variant?: "outline" | "default" | "ghost" | "destructive";
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openPortal = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await billingApi.portal({ returnUrl: window.location.href });
      window.location.href = res.portalUrl;
    } catch (e) {
      setErr(
        e instanceof ApiError ? `HTTP ${e.status}` : (e as Error).message ?? "Failed",
      );
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant={variant} onClick={openPortal} disabled={busy || disabled}>
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <>
            {label}
            <ExternalLink className="size-3 ml-1.5 opacity-70" />
          </>
        )}
      </Button>
      {err && <span className="text-[10px] text-destructive">{err}</span>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Invoices section — clean table with column headers + View links
// ────────────────────────────────────────────────────────────────────────────

function InvoicesSection({
  invoices,
  limit,
  onLoadMore,
}: {
  invoices: Invoice[];
  limit: number;
  onLoadMore: () => void;
}) {
  const visible = invoices.slice(0, limit);
  const hasMore = invoices.length > limit;

  return (
    <section>
      <h3 className="text-[15px] font-semibold mb-4">Invoices</h3>
      {invoices.length === 0 ? (
        <div className="text-[12.5px] text-muted-foreground py-2">
          No invoices yet — upgrade to a paid plan to see billing history here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_140px_120px_80px] gap-3 text-[12px] text-muted-foreground pb-2">
            <span>Date</span>
            <span>Total</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div>
            {visible.map((inv) => (
              <div
                key={inv.id}
                className="grid grid-cols-[1fr_140px_120px_80px] gap-3 items-center py-2 text-[13px] border-t border-border/60"
              >
                <span>{formatInvoiceDate(inv.created)}</span>
                <span>{formatMoney(inv.amountPaid || inv.amountDue, inv.currency)}</span>
                <span className={cn("capitalize", invoiceStatusTone(inv.status))}>
                  {inv.status.replace(/_/g, " ")}
                </span>
                <span className="text-right">
                  {inv.hostedInvoiceUrl ? (
                    <a
                      href={inv.hostedInvoiceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button size="sm" variant="outline" onClick={onLoadMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function formatInvoiceDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase() || "USD",
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

function invoiceStatusTone(status: string): string {
  switch (status) {
    case "paid":
      return "text-foreground";
    case "open":
    case "draft":
      return "text-muted-foreground";
    case "uncollectible":
    case "void":
      return "text-destructive";
    default:
      return "";
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Cancellation — section header + label row with right-aligned destructive btn
// ────────────────────────────────────────────────────────────────────────────

function CancellationSection({ info }: { info: BillingInfo }) {
  if (!info.stripeSubscriptionId) return null;

  if (info.cancelAtPeriodEnd) {
    return (
      <section>
        <h3 className="text-[15px] font-semibold mb-4">Cancellation</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-[13px]">
            Your subscription is set to end at the close of the current period.
          </div>
          <PortalButton label="Manage" />
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-[15px] font-semibold mb-4">Cancellation</h3>
      <div className="flex items-center gap-3">
        <div className="flex-1 text-[13px]">Cancel plan</div>
        <PortalButton label="Cancel" variant="destructive" />
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────────────────────────

function BillingSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 rounded-md shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64 mt-2" />
          <Skeleton className="h-3 w-56 mt-1.5" />
        </div>
      </div>
      <div>
        <Skeleton className="h-5 w-24 mb-3" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div>
        <Skeleton className="h-5 w-24 mb-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full my-2" />
        ))}
      </div>
    </div>
  );
}
