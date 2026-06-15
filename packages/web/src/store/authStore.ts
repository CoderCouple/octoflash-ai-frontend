/**
 * Auth state — wraps the Supabase session so React subscribers re-render
 * when the user signs in / out / refreshes their token.
 *
 * `bootstrap()` is called once from <App> on mount. It does two things:
 *   1. Calls supabase.auth.getSession() to surface any persisted session
 *      (the SDK rehydrates from localStorage on its own; this just pulls
 *      the result so we can mark `ready=true` and unblock <ProtectedRoute>).
 *   2. Registers an `onAuthStateChange` listener that keeps the store in
 *      sync with every SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED event.
 *
 * The bearer token plumbed into `setAuthTokenGetter` is sourced
 * lazy-from-store on every API call, so refreshed tokens are picked up
 * automatically without re-wiring.
 */

import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

import { setAuthTokenGetter } from "@octoflash/core";

import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";

type AuthState = {
  /** Active Supabase session (null = signed out). */
  session: Session | null;
  /** Convenience accessor — Session.user. */
  user: User | null;
  /** False until the first getSession() resolves; gates <ProtectedRoute>. */
  ready: boolean;

  /** Wire SDK → store. Idempotent; safe to call again under StrictMode. */
  bootstrap: () => Promise<void>;
  /** Mutator used by both bootstrap() and onAuthStateChange(). */
  setSession: (session: Session | null) => void;
  /** Convenience — wraps supabase.auth.signOut. */
  signOut: () => Promise<void>;
};

let _bootstrapped = false;
let _unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  ready: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  bootstrap: async () => {
    if (_bootstrapped) return;
    _bootstrapped = true;

    // Hand the core API client a getter that always reads the latest
    // access_token from this store, so refreshed tokens are picked up
    // without re-registering. Falling back to null skips the header.
    setAuthTokenGetter(() => get().session?.access_token ?? null);

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[auth] getSession failed:", error);
    }
    get().setSession(data.session ?? null);
    set({ ready: true });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      get().setSession(session);
    });
    _unsubscribe = () => sub.subscription.unsubscribe();
  },

  signOut: async () => {
    // Supabase wipes localStorage tokens + invalidates the refresh
    // token server-side (default scope='global'). onAuthStateChange
    // then fires SIGNED_OUT → setSession(null) → useIsAuthenticated
    // flips false, ProtectedRoute starts redirecting.
    await supabase.auth.signOut();
    // Drop every cached server response so a subsequent sign-in as
    // a different user doesn't render stale /me / /projects data
    // before the new fetches resolve.
    queryClient.clear();
  },
}));

// Cleanup for hot-reload safety.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    _unsubscribe?.();
    _unsubscribe = null;
    _bootstrapped = false;
  });
}

// Selector hooks — cheap subscriptions, avoid re-rendering on unrelated changes.
export const useIsAuthenticated = (): boolean =>
  useAuthStore((s) => s.session !== null);
export const useAuthReady = (): boolean => useAuthStore((s) => s.ready);
export const useAuthUser = (): User | null => useAuthStore((s) => s.user);
