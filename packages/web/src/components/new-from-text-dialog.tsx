/**
 * "From text" project dialog — sibling of `new-project-dialog.tsx`.
 *
 * Opened from the "Type a brief" CTA on /projects. Instead of pasting
 * a source URL and waiting for AnalyzeProjectWorkflow to fetch
 * transcript + frames, the user writes the brief directly. The backend
 * stamps the brief as `manim_prompt` and kicks GenerateVideoWorkflow
 * immediately — no yt-dlp, no PO tokens, no analyze step. The whole
 * YouTube cat-and-mouse layer is skipped.
 *
 * Render-option controls mirror the URL flow so the FE feels
 * symmetric: same orientation / quality / voiceover / length picker
 * and the same voice cascade.
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { projectsApi, voicesApi, type Voice, type Orientation } from "@octoflash/core";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
};

type Form = {
  brief: string;
  title: string;
  orientation: Orientation;
  quality: "480p" | "720p" | "1080p";
  voiceover: boolean;
  targetDurationSec: number;
  voiceGender: "male" | "female" | "";
  voiceAccent: string;
  voiceId: string;
};

const DEFAULT_FORM: Form = {
  brief: "",
  title: "",
  orientation: "portrait",
  quality: "720p",
  voiceover: true,
  targetDurationSec: 90,
  voiceGender: "male",
  voiceAccent: "British",
  voiceId: "",
};

// Matches the backend's CreateProjectFromTextRequest min_length. Below
// this, plan_clips tends to produce 1-2 trivial clips or repeat itself.
const MIN_BRIEF_CHARS = 50;

export function NewFromTextDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[] | null>(null);

  // Reset on open.
  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
      setErr(null);
    }
  }, [open]);

  // Fetch voices once per open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await voicesApi.list();
        if (!cancelled) setVoices(list);
      } catch (e) {
        console.warn("[new-from-text-dialog] voice catalog failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const accentsForGender = useMemo(() => {
    if (!voices) return [];
    const set = new Set<string>();
    for (const v of voices) {
      if (form.voiceGender && v.gender !== form.voiceGender) continue;
      if (v.accent) set.add(v.accent);
    }
    return [...set].sort();
  }, [voices, form.voiceGender]);

  const voicesForAccent = useMemo(() => {
    if (!voices) return [];
    return voices.filter(
      (v) =>
        (!form.voiceGender || v.gender === form.voiceGender) &&
        (!form.voiceAccent || v.accent === form.voiceAccent),
    );
  }, [voices, form.voiceGender, form.voiceAccent]);

  useEffect(() => {
    if (!voices) return;
    if (!voicesForAccent.length) {
      setForm((f) => ({ ...f, voiceId: "" }));
      return;
    }
    if (!voicesForAccent.some((v) => v.id === form.voiceId)) {
      setForm((f) => ({ ...f, voiceId: voicesForAccent[0].id }));
    }
  }, [voices, voicesForAccent, form.voiceId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.brief.trim().length < MIN_BRIEF_CHARS) {
      setErr(`Brief is too short — at least ${MIN_BRIEF_CHARS} characters needed.`);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const execution = await projectsApi.fromText({
        brief: form.brief.trim(),
        title: form.title.trim() || null,
        orientation: form.orientation,
        quality: form.quality,
        voiceover: form.voiceover,
        targetDuration: form.targetDurationSec,
        voiceGender: form.voiceGender || null,
        voiceAccent: form.voiceAccent || null,
        voiceId: form.voiceId || null,
      });
      onOpenChange(false);
      // BE populates projectId on the execution response so we can
      // jump straight to the project page. Falls back to /projects if
      // the link isn't there for some reason.
      navigate(execution.projectId ? `/projects/${execution.projectId}` : "/projects");
    } catch (error) {
      setErr((error as Error).message ?? "Couldn't start generate.");
      setBusy(false);
    }
  }

  const selectedVoice = voicesForAccent.find((v) => v.id === form.voiceId);
  const briefRemaining = MIN_BRIEF_CHARS - form.brief.trim().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New project from text</DialogTitle>
          <DialogDescription>
            Describe what you want to visualize. Skips the YouTube/article
            scraping path entirely and kicks generate immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Brief — the load-bearing field */}
          <Field label="Brief" htmlFor="nft-brief">
            <textarea
              id="nft-brief"
              required
              autoFocus
              rows={6}
              placeholder="Explain the bisection method in 90 seconds. Show the interval halving step-by-step with a concrete example like x^2 - 2 = 0 converging to √2."
              value={form.brief}
              onChange={(e) => setForm({ ...form, brief: e.target.value })}
              disabled={busy}
              className="w-full rounded-md border bg-background text-[12.5px] px-2 py-1.5 resize-y min-h-[120px] focus-visible:outline-none focus-visible:ring-1"
              maxLength={10000}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {briefRemaining > 0
                ? `${briefRemaining} more character${briefRemaining === 1 ? "" : "s"} to go.`
                : `${form.brief.trim().length} chars — ready.`}
            </p>
          </Field>

          {/* Optional title */}
          <Field label="Title (optional)" htmlFor="nft-title">
            <Input
              id="nft-title"
              placeholder="Auto-generated from the brief if blank"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={busy}
              maxLength={255}
            />
          </Field>

          {/* Orientation + Quality */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Orientation">
              <Choice
                value={form.orientation}
                options={[
                  { v: "portrait",  label: "Portrait" },
                  { v: "landscape", label: "Landscape" },
                ]}
                onChange={(v) => setForm({ ...form, orientation: v as Orientation })}
                disabled={busy}
              />
            </Field>
            <Field label="Quality">
              <Choice
                value={form.quality}
                options={[
                  { v: "480p",  label: "480p" },
                  { v: "720p",  label: "720p" },
                  { v: "1080p", label: "1080p" },
                ]}
                onChange={(v) => setForm({ ...form, quality: v as Form["quality"] })}
                disabled={busy}
              />
            </Field>
          </div>

          {/* Voiceover + Length */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Voiceover">
              <div className="flex items-center gap-2 h-8">
                <Switch
                  id="nft-voiceover"
                  checked={form.voiceover}
                  onCheckedChange={(checked: boolean) =>
                    setForm({ ...form, voiceover: checked })
                  }
                  disabled={busy}
                />
                <Label htmlFor="nft-voiceover" className="text-[12.5px]">
                  {form.voiceover ? "Yes" : "No"}
                </Label>
              </div>
            </Field>
            <Field label="Length (sec)" htmlFor="nft-len">
              <Input
                id="nft-len"
                type="number"
                min={10}
                max={form.orientation === "portrait" ? 120 : 600}
                value={form.targetDurationSec}
                onChange={(e) =>
                  setForm({ ...form, targetDurationSec: Number(e.target.value) || 0 })
                }
                disabled={busy}
              />
            </Field>
          </div>

          {/* Voice cascade — only when voiceover=true */}
          {form.voiceover && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Voice Gender">
                  <Choice
                    value={form.voiceGender}
                    options={[
                      { v: "male",   label: "Male" },
                      { v: "female", label: "Female" },
                    ]}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        voiceGender: v as Form["voiceGender"],
                        voiceAccent: "",
                        voiceId: "",
                      })
                    }
                    disabled={busy}
                  />
                </Field>
                <Field label="Voice Accent">
                  <select
                    className="h-8 w-full rounded-md border bg-background text-[12.5px] px-2"
                    value={form.voiceAccent}
                    onChange={(e) =>
                      setForm({ ...form, voiceAccent: e.target.value, voiceId: "" })
                    }
                    disabled={busy || !accentsForGender.length}
                  >
                    {!form.voiceAccent && <option value="">Select…</option>}
                    {accentsForGender.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Voice">
                <select
                  className="h-8 w-full rounded-md border bg-background text-[12.5px] px-2"
                  value={form.voiceId}
                  onChange={(e) => setForm({ ...form, voiceId: e.target.value })}
                  disabled={busy || !voicesForAccent.length}
                >
                  {voicesForAccent.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.accent} {v.gender} · {v.blurb}
                    </option>
                  ))}
                </select>
                {selectedVoice && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {selectedVoice.name} — {selectedVoice.accent} {selectedVoice.gender} ·{" "}
                    {selectedVoice.blurb}
                  </p>
                )}
              </Field>
            </>
          )}

          {err && (
            <p className="text-[12px] text-destructive">{err}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || form.brief.trim().length < MIN_BRIEF_CHARS}
            >
              {busy ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Starting…
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Choice({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: { v: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-md border p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.v}
          type="button"
          onClick={() => onChange(opt.v)}
          disabled={disabled}
          className={`flex-1 px-2.5 h-7 rounded text-[12px] transition-colors ${
            value === opt.v
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted/60"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
