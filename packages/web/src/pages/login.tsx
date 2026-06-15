/**
 * Login — Supabase email/password + GitHub + Google OAuth.
 *
 * Successful sign-in: onAuthStateChange in authStore fires, the
 * ProtectedRoute that bounced the user here re-renders, and react-router
 * lands them on the original target (passed via location.state.from).
 *
 * For OAuth: Supabase redirects to /auth/callback, where AuthCallbackPage
 * resolves the hash fragment via supabase.auth.getSession() and navigates
 * onward.
 */

import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Github, Globe, Loader2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";

type LocationState = { from?: { pathname: string } };

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/projects";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"github" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  async function signInWith(provider: "github" | "google") {
    setOauthBusy(provider);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (err) {
      setError(err.message);
      setOauthBusy(null);
    }
    // On success the browser is already redirecting — no further action.
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-10">
      <Link to="/" className="flex items-center gap-2 mb-7 text-sm font-semibold">
        <span className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
          <Zap className="size-4" strokeWidth={2.5} />
        </span>
        Octoflash
      </Link>

      <div className="w-full max-w-[380px] rounded-xl border bg-card shadow-sm p-7">
        <h1 className="text-[22px] font-semibold tracking-tight leading-none">Welcome back</h1>
        <p className="text-[13px] text-muted-foreground mt-1.5">
          Sign in to continue to your studio.
        </p>

        <div className="grid gap-2 mt-6">
          <Button
            variant="outline"
            size="lg"
            className="justify-center gap-2"
            disabled={oauthBusy !== null || submitting}
            onClick={() => signInWith("github")}
          >
            {oauthBusy === "github" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Github className="size-4" />
            )}{" "}
            Continue with GitHub
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="justify-center gap-2"
            disabled={oauthBusy !== null || submitting}
            onClick={() => signInWith("google")}
          >
            {oauthBusy === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Globe className="size-4" />
            )}{" "}
            Continue with Google
          </Button>
        </div>

        <div className="flex items-center gap-3 my-6">
          <Separator className="flex-1" />
          <span className="text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">
            Or continue with email
          </span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-3.5">
          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          {error && (
            <p className="text-[12px] text-destructive">{error}</p>
          )}
          <Button type="submit" size="lg" disabled={submitting || oauthBusy !== null}>
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-[12px] text-muted-foreground mt-5 text-center">
          No account?{" "}
          <Link to="/signup" className="text-foreground hover:underline">
            Sign up
          </Link>
        </p>

        <p className="text-[11px] text-muted-foreground mt-3 text-center">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="underline-offset-2 hover:underline">Terms</Link>
          {" & "}
          <Link to="/privacy" className="underline-offset-2 hover:underline">Privacy</Link>.
        </p>
      </div>
    </div>
  );
}
