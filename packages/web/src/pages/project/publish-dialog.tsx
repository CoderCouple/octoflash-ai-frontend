/**
 * PublishDialog — pick a target + fill metadata + POST /targets/{id}/publish.
 *
 * Triggered by the Publish button on the project overview. Lists every
 * connected target the user has, lets them pick one, fills in defaults
 * (title from project, privacy=private, orientation defaults to whichever
 * final video the project actually has), submits, and surfaces the
 * resulting Execution id via toast so the polling loop downstream can pick
 * it up.
 *
 * 501 on submit = the platform's publish path isn't implemented yet
 * (TikTok / IG / LinkedIn / X today). We surface the backend's detail
 * verbatim — the message points the user at the right docs.
 *
 * 401 = stored token can't refresh → show a reconnect CTA.
 *
 * Uses native <select> rather than a Radix-based Select — the rest of the
 * UI kit doesn't include one and the dialog doesn't need the extras.
 */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import {
  ApiError,
  targetsApi,
  type ProjectDetail,
  type Target,
  type TargetPlatform,
} from "@octoflash/core";

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
import { Textarea } from "@/components/ui/textarea";


const PLATFORM_LABEL: Record<TargetPlatform, string> = {
  youtube:   "YouTube",
  tiktok:    "TikTok",
  instagram: "Instagram",
  linkedin:  "LinkedIn",
  x:         "X",
};


// Native-select styling tuned to feel like the rest of the kit. Same border /
// height as Input.
const SELECT_CLASSES =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[13px] " +
  "shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";


export function PublishDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectDetail;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const availableOrientations = useMemo<("portrait" | "landscape")[]>(() => {
    const r: ("portrait" | "landscape")[] = [];
    if (project.finalPortraitVideoUrl) r.push("portrait");
    if (project.finalLandscapeVideoUrl) r.push("landscape");
    return r;
  }, [project.finalPortraitVideoUrl, project.finalLandscapeVideoUrl]);

  const [targetId, setTargetId] = useState<string>("");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    availableOrientations[0] ?? "portrait",
  );
  const [title, setTitle] = useState<string>(project.title);
  const [description, setDescription] = useState<string>("");
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">("private");

  // Load targets only while the dialog is open — no point polling otherwise.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingTargets(true);
    (async () => {
      try {
        const page = await targetsApi.list({ limit: 100 });
        if (cancelled) return;
        // Surface only active, credentialed targets — anything else can't publish.
        const usable = page.items.filter(
          (t) => t.hasCredential && t.status === "active",
        );
        setTargets(usable);
        // Auto-pick the first usable target so the user can submit in one click.
        if (usable.length > 0 && !targetId) setTargetId(usable[0].id);
      } catch (e) {
        toast.error(
          e instanceof ApiError
            ? `HTTP ${e.status}: ${e.message}`
            : (e as Error).message,
        );
      } finally {
        if (!cancelled) setLoadingTargets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset orientation if the project finishes generating while the dialog is open.
  useEffect(() => {
    if (availableOrientations.length > 0 && !availableOrientations.includes(orientation)) {
      setOrientation(availableOrientations[0]);
    }
  }, [availableOrientations, orientation]);

  const selectedTarget = targets.find((t) => t.id === targetId) ?? null;

  async function onSubmit() {
    if (!targetId) {
      toast.error("Pick a target first.");
      return;
    }
    if (!availableOrientations.includes(orientation)) {
      toast.error(`No ${orientation} final video to publish yet.`);
      return;
    }
    setSubmitting(true);
    try {
      const execution = await targetsApi.publish(targetId, {
        projectId: project.id,
        orientation,
        title: title.trim() || project.title,
        description: description.trim(),
        privacy,
      });
      toast.success("Publish started", {
        description: `Watch progress in the executions panel (id ${execution.id.slice(0, 14)}…).`,
      });
      onOpenChange(false);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      const detail = e instanceof ApiError ? e.message : (e as Error).message;
      if (status === 401) {
        toast.error("Reconnect needed", {
          description: `${selectedTarget?.platform ?? "Target"} token can't refresh — reconnect it on /targets.`,
        });
      } else if (status === 501) {
        toast.error("Platform not wired", { description: detail });
      } else if (status === 409) {
        toast.error("Can't publish yet", { description: detail });
      } else {
        toast.error("Publish failed", {
          description: detail || "Unknown error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish video</DialogTitle>
          <DialogDescription>
            Upload this project's final render to a connected target.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-[13px]">
          <div className="space-y-1.5">
            <Label htmlFor="publish-target">Target</Label>
            <select
              id="publish-target"
              className={SELECT_CLASSES}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={loadingTargets || targets.length === 0}
            >
              {targets.length === 0 ? (
                <option value="">
                  {loadingTargets ? "Loading…" : "No connected targets — connect one on /targets first."}
                </option>
              ) : (
                targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {PLATFORM_LABEL[t.platform]} · {t.displayName ?? t.handle ?? t.id.slice(0, 10)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publish-orientation">Orientation</Label>
            <select
              id="publish-orientation"
              className={SELECT_CLASSES}
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
              disabled={availableOrientations.length <= 1}
            >
              {availableOrientations.length === 0 ? (
                <option value="">No final video yet — run Generate first.</option>
              ) : (
                availableOrientations.map((o) => (
                  <option key={o} value={o}>
                    {o[0].toUpperCase() + o.slice(1)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publish-title">Title</Label>
            <Input
              id="publish-title"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publish-description">Description</Label>
            <Textarea
              id="publish-description"
              value={description}
              maxLength={5000}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — defaults to empty."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publish-privacy">Privacy</Label>
            <select
              id="publish-privacy"
              className={SELECT_CLASSES}
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as "public" | "unlisted" | "private")}
            >
              <option value="private">Private (only me)</option>
              <option value="unlisted">Unlisted (link only)</option>
              <option value="public">Public</option>
            </select>
            <p className="text-[11px] text-muted-foreground">
              Honored by YouTube. Other platforms map this best-effort or ignore it.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void onSubmit()}
            disabled={
              submitting ||
              loadingTargets ||
              !targetId ||
              availableOrientations.length === 0
            }
          >
            {submitting ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Send className="size-3.5 mr-1.5" /> Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
