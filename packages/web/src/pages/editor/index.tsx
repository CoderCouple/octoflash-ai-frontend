/**
 * /editor — entry point for building a workflow from scratch.
 *
 * Shows a small modal asking for a project name. On submit:
 *   • POST /api/v1/projects to create an empty project (no source, no clips)
 *   • Navigate to /workflow/{id} which mounts the React Flow canvas
 *
 * The canvas's `getForProject` lazy-creates the matching Workflow row, so a
 * blank project lands in the editor with an empty definition ready to drag
 * nodes onto.
 *
 * Cancel → /projects.
 */

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Workflow as WorkflowIcon } from "lucide-react";

import { projectsApi } from "@octoflash/core";

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

export default function EditorEntryPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const project = await projectsApi.create({ title: title.trim() });
      navigate(`/workflow/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  function onCancel() {
    setOpen(false);
    navigate("/projects");
  }

  return (
    <>
      {/* Faded backdrop content — only briefly visible if the modal animates. */}
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          <WorkflowIcon className="mx-auto mb-2 size-6 opacity-50" />
          Setting up a new workflow…
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) onCancel();
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>New workflow</DialogTitle>
            <DialogDescription>
              Name your project. You'll land on a blank canvas where you can drag
              source / scene / target nodes from the palette and connect them.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="title" className="text-xs">
                Project name
              </Label>
              <Input
                id="title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Tensor explainer for shorts"
                maxLength={255}
                disabled={submitting}
              />
            </div>
            {error && (
              <div className="text-[11px] text-destructive">
                Couldn't create: {error}
              </div>
            )}

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>Create &amp; open</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
