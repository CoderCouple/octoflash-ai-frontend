/**
 * Sign-up — Supabase email/password sign-up.
 *
 * Supabase sends a confirmation email by default. If the project has
 * "Confirm email" turned OFF in the dashboard, the new session is
 * created synchronously and we route the user straight in; otherwise
 * we show a "Check your email" panel and they finish via the link.
 */

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/projects`,
      },
    });
    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }
    // If Supabase returned a session immediately, confirm-email is OFF
    // and the user is signed in. Otherwise show the "check your email" UI.
    if (data.session) {
      navigate("/projects", { replace: true });
    } else {
      setNeedsConfirm(true);
      setSubmitting(false);
    }
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
        {needsConfirm ? (
          <div className="text-center">
            <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Mail className="size-5" />
            </div>
            <h1 className="text-[20px] font-semibold tracking-tight">Check your email</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              We sent a confirmation link to <span className="text-foreground">{email}</span>. Click it
              to activate your account.
            </p>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-[22px] font-semibold tracking-tight leading-none">
              Create your account
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Start turning sources into Manim videos.
            </p>

            <form onSubmit={onSubmit} className="grid gap-3.5 mt-6">
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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={submitting}
                />
              </div>
              {error && <p className="text-[12px] text-destructive">{error}</p>}
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 mr-1.5 animate-spin" /> Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <p className="text-[12px] text-muted-foreground mt-5 text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
