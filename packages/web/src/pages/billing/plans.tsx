/**
 * /billing/plans — in-app plan picker. Reuses the same Y-split flowchart UI
 * as the public /pricing page (see components/pricing-flowchart) so signed-in
 * users see a consistent layout. CTAs differ:
 *
 *   public /pricing      → onSelectPlan navigates to /login?plan=…
 *   in-app /billing/plans → onSelectPlan kicks Stripe Checkout via /billing/checkout
 *
 * The "Hosted" branch maps to backend plan `pro`. "BYOK" is a flat-fee tier
 * that's still a paid Stripe plan; we route it through the same checkout
 * endpoint with `plan: "pro"` until the backend grows a dedicated BYOK price.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { ApiError, billingApi } from "@octoflash/core";

import { Card } from "@/components/ui/card";
import { PricingFlowchart, type PlanId } from "@/components/pricing-flowchart";

export default function BillingPlansPage() {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSelectPlan = async (plan: PlanId) => {
    setBusy(plan);
    setError(null);
    try {
      const res = await billingApi.checkout({
        plan: "pro",
        successUrl: `${window.location.origin}/billing?checkout=success`,
        cancelUrl: window.location.href,
      });
      window.location.href = res.checkoutUrl;
    } catch (e) {
      setError(
        e instanceof ApiError
          ? `HTTP ${e.status}: ${e.message}`
          : (e as Error).message ?? "Checkout failed",
      );
      setBusy(null);
    }
  };

  return (
    <div className="px-7 py-6 max-w-[920px] mx-auto">
      <div className="mb-4">
        <Link
          to="/billing"
          className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to billing
        </Link>
      </div>

      {error && (
        <Card className="p-4 mb-4 border-destructive/40 bg-destructive/5 shadow-none">
          <div className="text-[12px] text-destructive">{error}</div>
        </Card>
      )}

      <PricingFlowchart
        embedded
        heading="Plans"
        subhead="Pick the path that fits — switch any time."
        onSelectPlan={onSelectPlan}
        busyPlan={busy}
      />
    </div>
  );
}
