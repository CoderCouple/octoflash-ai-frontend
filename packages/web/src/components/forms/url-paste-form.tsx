/**
 * URL paste entry — the main intake form on /projects.
 *
 * Paste a YouTube / Medium / Substack URL → submits to AnalyzeProjectWorkflow
 * via jobsStore.startAnalyze → redirects to /projects/:id, where the editor
 * page picks up the polling loop.
 *
 * Slice 5: bare URL input + submit.
 * Slice 12 (later): "More options" collapsible reveals orientation toggle,
 * voiceover switch, voice picker, length override.
 */

import { useState, type FormEvent } from "react";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJobsStore } from "@/store/jobsStore";

export function UrlPasteForm() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startAnalyze = useJobsStore((s) => s.startAnalyze);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await startAnalyze({ sourceUrl: url.trim() });
      // Always redirect to the editor; analyze polling will show progress there.
      navigate(`/projects/${response.project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border bg-card p-3">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <LinkIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Paste a YouTube short, Medium article, or Substack post URL…"
            className="pl-9 h-10"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <Button type="submit" className="h-10" disabled={submitting || !url.trim()}>
          {submitting ? (
            <>
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              Starting…
            </>
          ) : (
            <>Analyze</>
          )}
        </Button>
      </div>
      {error && (
        <div className="text-xs text-destructive mt-2 px-1">
          Couldn’t start analyze: {error}
        </div>
      )}
    </form>
  );
}
