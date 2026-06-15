/**
 * Single Supabase client instance for the whole web app.
 *
 * Don't import `createClient` directly from `@supabase/supabase-js`
 * anywhere else — go through `supabase` so we only ever hold one
 * GoTrue session listener (Supabase throws "Multiple GoTrueClient
 * instances detected" otherwise on HMR).
 *
 * Env:
 *   VITE_SUPABASE_URL       https://<ref>.supabase.co
 *   VITE_SUPABASE_ANON_KEY  Public anon JWT — safe to ship to browsers
 *                           (RLS / row-level checks are enforced server-side)
 *
 * When either env var is missing we emit a console warning and the
 * client is built against empty strings — every auth call will fail
 * fast with a clear error, which is the right behavior in dev where
 * someone forgot to fill in the .env.local.
 */

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!url || !anonKey) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing — auth will fail.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,       // localStorage-backed; survives reloads
    autoRefreshToken: true,     // background refresh ~5 min before expiry
    detectSessionInUrl: true,   // pick up the #access_token=... after OAuth callback
  },
});
