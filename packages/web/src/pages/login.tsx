import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Github, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("jamie@octoflash.ai");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: POST to FastAPI /auth/email once the endpoint exists.
    setTimeout(() => navigate("/videos"), 250);
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
          <Button variant="outline" size="lg" className="justify-center gap-2">
            <Github className="size-4" /> Continue with GitHub
          </Button>
          <Button variant="outline" size="lg" className="justify-center gap-2">
            <Globe className="size-4" /> Continue with Google
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in with email"}
          </Button>
        </form>

        <p className="text-[11px] text-muted-foreground mt-5 text-center">
          By continuing, you agree to our{" "}
          <a href="#" className="underline-offset-2 hover:underline">Terms</a>
          {" & "}
          <a href="#" className="underline-offset-2 hover:underline">Privacy</a>.
        </p>
      </div>
    </div>
  );
}
