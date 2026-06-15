/**
 * OAuth callback — Supabase redirects the browser back here after a
 * successful GitHub/Google sign-in. The SDK reads the access token out
 * of the URL hash automatically (we passed `detectSessionInUrl=true`
 * when creating the client), so all we need to do is wait for the
 * session to land and navigate to wherever the user was headed.
 *
 * `?next=…` is the original target, set by the login page. Falls back
 * to /projects so a user who bookmarks /auth/callback still ends up
 * somewhere sensible.
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/projects";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase.auth.getSession();
      if (cancelled) return;
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        navigate(next, { replace: true });
      } else {
        // No session resolved — likely an error in the OAuth flow.
        // Bounce back to /login so the user can retry.
        navigate("/login", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, next]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      {error ? (
        <>
          <p className="text-destructive">Sign-in failed: {error}</p>
          <a href="/login" className="underline">Back to sign in</a>
        </>
      ) : (
        <>
          <Loader2 className="size-5 animate-spin" />
          <p>Signing you in…</p>
        </>
      )}
    </div>
  );
}
