/**
 * /contact — marketing-site contact + waitlist form.
 *
 *   • On submit we fire two things in parallel:
 *       1. POST /api/v1/contact → persists the row in `waitlist_entry`
 *          (email is the unique key; the BE returns a friendly
 *          'already on list' message on a re-submit).
 *       2. EmailJS sendForm → ops gets the message in their inbox.
 *
 *     The BE write is the source of truth — EmailJS is a courtesy
 *     notification. If EmailJS isn't configured (`VITE_EMAILJS_*` env
 *     vars unset) we skip the email step silently.
 *
 *   • Success state shows whichever message the BE returned (the dup
 *     responses pick from a small pool of one-liners server-side).
 */

import { useRef, useState, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { Github, Linkedin, Loader2, Mail, Send } from "lucide-react";

import { contactApi } from "@octoflash/core";

import { PublicShell, PageHero } from "@/layouts/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; message: string; duplicate: boolean }
  | { kind: "error"; message: string };

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const EMAILJS_ENABLED = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      // Fire both in parallel. EmailJS failure shouldn't block the
      // BE write or vice versa — we still want the waitlist row.
      const beCall = contactApi.submit({ name, email, subject, message });
      const emailCall: Promise<unknown> = EMAILJS_ENABLED && formRef.current
        ? emailjs.sendForm(
            EMAILJS_SERVICE_ID!,
            EMAILJS_TEMPLATE_ID!,
            formRef.current,
            { publicKey: EMAILJS_PUBLIC_KEY! },
          ).catch((err) => {
            console.warn("[contact] EmailJS notification failed (non-fatal):", err);
          })
        : Promise.resolve();

      const [beResult] = await Promise.all([beCall, emailCall]);

      // The BE's message field has the dedupe-friendly copy already.
      // (Read it off the wrapper — `contactApi.submit` unwraps the
      // result, so we re-fetch via the full envelope below.)
      // We embedded `duplicate` in the result; on dup we reset the form
      // less aggressively (keep the email so the user knows we have them).
      setStatus({
        kind: "ok",
        message: beResult.duplicate
          ? "We've already got you on the list. Good things happen to those who wait."
          : "Thanks — you're on the list. We'll get back to you within a day or two.",
        duplicate: beResult.duplicate,
      });
      if (!beResult.duplicate) {
        setName("");
        setSubject("");
        setMessage("");
      }
    } catch (err) {
      setStatus({
        kind: "error",
        message: (err as Error).message ?? "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <PublicShell>
      <PageHero
        title="Get in Touch"
        subtitle="Drop a note about anything — a collaboration, a question, or just to say hi. We read every message."
      />

      <div className="mx-auto w-full max-w-[640px] px-6 py-10 space-y-10">
        {/* Form */}
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="Your name"
              disabled={status.kind === "sending"}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              disabled={status.kind === "sending"}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input
              id="contact-subject"
              name="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="What's this about?"
              disabled={status.kind === "sending"}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              name="message"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              placeholder="Tell us a bit about what you're building, or what you'd like to see in Octoflash."
              rows={6}
              disabled={status.kind === "sending"}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={status.kind === "sending"}>
              {status.kind === "sending" ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="size-4 mr-1.5" />
                  Send Message
                </>
              )}
            </Button>

            {status.kind === "ok" && (
              <span
                className={
                  status.duplicate
                    ? "text-[13px] text-muted-foreground"
                    : "text-[13px] text-emerald-600 dark:text-emerald-400"
                }
              >
                {status.message}
              </span>
            )}
            {status.kind === "error" && (
              <span className="text-[13px] text-destructive">{status.message}</span>
            )}
          </div>
        </form>

        {/* Let's Connect */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold tracking-tight">Let's Connect</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5 mb-4">
            Always happy to chat about animation, AI, or anything you're building.
          </p>
          <div className="flex flex-wrap gap-2">
            <SocialLink
              href="mailto:hello@octoflash.ai"
              icon={<Mail className="size-3.5" />}
              label="hello@octoflash.ai"
            />
            <SocialLink
              href="https://github.com/CoderCouple/octoflash-ai-backend"
              icon={<Github className="size-3.5" />}
              label="GitHub"
            />
            <SocialLink
              href="https://www.linkedin.com"
              icon={<Linkedin className="size-3.5" />}
              label="LinkedIn"
            />
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12.5px] hover:border-foreground/40 hover:bg-muted/40 transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}
