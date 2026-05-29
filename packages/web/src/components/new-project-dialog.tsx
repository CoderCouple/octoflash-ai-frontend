/**
 * New Project dialog — opened from the "+ New" button on /projects.
 *
 * Collects the URL plus the render-time settings (orientation, quality,
 * voiceover, length, voice gender/accent/specific id) and submits them
 * to POST /projects/from-source. The brief still gets filled in by the
 * AnalyzeProjectWorkflow afterwards — settings just persist on the
 * Project row so the first Generate uses them without a follow-up
 * PATCH.
 *
 * Voice picker is a cascade: Gender → Accent → Voice.
 * The full voice catalog is fetched once on open and filtered client-side.
 *
 * Existing `<UrlPasteForm>` is unchanged — it kicks analyze with backend
 * defaults (portrait / 720p / voiceover on). This dialog is the path
 * for "I want to tweak the defaults before analyze."
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { voicesApi, type Voice, type Orientation } from "@octoflash/core";

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
import { useJobsStore } from "@/store/jobsStore";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
};

type Form = {
  sourceUrl: string;
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
  sourceUrl: "",
  title: "",
  orientation: "portrait",
  quality: "720p",
  voiceover: true,
  targetDurationSec: 120,
  voiceGender: "male",
  voiceAccent: "British",
  voiceId: "",
};

export function NewProjectDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const startAnalyze = useJobsStore((s) => s.startAnalyze);
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[] | null>(null);

  // Reset form whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
      setErr(null);
    }
  }, [open]);

  // Fetch the voice catalog once per open. Cheap call (~50 rows).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await voicesApi.list();
        if (!cancelled) setVoices(list);
      } catch (e) {
        console.warn("[new-project-dialog] voice catalog failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Cascade filters.
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

  // Auto-pick the first voice when accent / gender change so the
  // dropdown never sits empty.
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
    setBusy(true);
    setErr(null);
    try {
      const response = await startAnalyze({
        sourceUrl: form.sourceUrl.trim(),
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
      navigate(`/projects/${response.project.id}`);
    } catch (error) {
      setErr((error as Error).message ?? "Couldn't start analyze.");
      setBusy(false);
    }
  }

  const selectedVoice = voicesForAccent.find((v) => v.id === form.voiceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Paste a source URL and tune the render options. You can change any
            of these later before clicking Generate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Source URL */}
          <Field label="Source URL" htmlFor="np-url">
            <Input
              id="np-url"
              required
              autoFocus
              placeholder="https://www.youtube.com/shorts/…  /  https://medium.com/…"
              value={form.sourceUrl}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              disabled={busy}
            />
          </Field>

          {/* Optional title */}
          <Field label="Title (optional)" htmlFor="np-title">
            <Input
              id="np-title"
              placeholder="Defaults to the source's own title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={busy}
              maxLength={255}
            />
          </Field>

          {/* Two-column row: orientation + quality */}
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
                  id="np-voiceover"
                  checked={form.voiceover}
                  onCheckedChange={(checked: boolean) =>
                    setForm({ ...form, voiceover: checked })
                  }
                  disabled={busy}
                />
                <Label htmlFor="np-voiceover" className="text-[12.5px]">
                  {form.voiceover ? "Yes" : "No"}
                </Label>
              </div>
            </Field>
            <Field label="Length" htmlFor="np-len">
              <Input
                id="np-len"
                type="number"
                min={form.orientation === "portrait" ? 60 : 60}
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
                        // Reset accent so the next cascade step picks a valid one
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
            <Button type="submit" disabled={busy || !form.sourceUrl.trim()}>
              {busy ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Starting…
                </>
              ) : (
                "Analyze"
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
