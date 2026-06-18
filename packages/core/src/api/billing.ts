/**
 * `/billing` — per-organization Stripe-backed billing.
 *
 *   GET  /api/v1/billing            → current plan + subscription state
 *   POST /api/v1/billing/checkout   → Stripe Checkout session URL (upgrade)
 *   POST /api/v1/billing/portal     → Stripe Customer Portal session URL
 *   GET  /api/v1/billing/invoices   → recent invoices via Stripe
 *   GET  /api/v1/billing/usage      → current resource counts vs PlanLimits
 *
 * Plan tier is one of `free` / `pro` / `enterprise` (see PlanLimits on the
 * backend). Status follows Stripe's subscription statuses verbatim
 * (`active`, `trialing`, `past_due`, `canceled`, …).
 */

import { api } from "./client.js";

export type PlanTier = "free" | "pro" | "enterprise";

export type BillingInfo = {
  plan: PlanTier | string;
  status: string;
  seatCount: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type Invoice = {
  id: string;
  number: string | null;
  status: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  /** Unix seconds. */
  created: number;
  periodStart: number | null;
  periodEnd: number | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

export type UsageItem = {
  key: string;
  label: string;
  used: number;
  limit: number;
};

export type Usage = {
  plan: PlanTier | string;
  items: UsageItem[];
};

export type CheckoutInput = {
  plan: "pro" | "enterprise";
  successUrl: string;
  cancelUrl: string;
};

export type PortalInput = {
  returnUrl: string;
};

export const billingApi = {
  get: () => api.get<BillingInfo>("/api/v1/billing"),
  invoices: () => api.get<Invoice[]>("/api/v1/billing/invoices"),
  usage: () => api.get<Usage>("/api/v1/billing/usage"),
  checkout: (body: CheckoutInput) =>
    api.post<{ checkoutUrl: string }>("/api/v1/billing/checkout", body),
  portal: (body: PortalInput) =>
    api.post<{ portalUrl: string }>("/api/v1/billing/portal", body),
};
