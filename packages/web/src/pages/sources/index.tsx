import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";

import { useSourcesStore } from "@/store/sourcesStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SourcesIndex() {
  const { sources, loading, syncing, error, loadSources, createAndSync } =
    useSourcesStore();
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  // Once we have at least one source, hand off to the detail page.
  if (sources.length > 0) {
    return <Navigate to={`/sources/${sources[0].id}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-sm text-muted-foreground">
        Loading sources…
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] px-6">
      <div className="max-w-md w-full">
        <h1 className="text-xl font-semibold tracking-tight mb-1">No sources yet</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Sources are where Octoflash pulls video ideas from. Today we support
          YouTube channels — paste a channel URL to start following it.
        </p>

        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setLocalError(null);
            if (!url.trim()) return;
            try {
              await createAndSync({ sourceUrl: url.trim() });
              setUrl("");
            } catch (err) {
              setLocalError((err as Error).message);
            }
          }}
        >
          <Input
            placeholder="https://youtube.com/@channel-handle"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={syncing}
            className="flex-1"
          />
          <Button type="submit" disabled={syncing || !url.trim()}>
            {syncing ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Syncing…
              </>
            ) : (
              <>
                <Plus className="size-3.5 mr-1.5" /> Add
              </>
            )}
          </Button>
        </form>

        {(error || localError) && (
          <div className="mt-3 text-[12px] text-destructive font-mono">
            {localError || error}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-4">
          Examples: <code className="font-mono">/@3blue1brown</code>,{" "}
          <code className="font-mono">/channel/UCxxxxxxxx</code>
        </p>
      </div>
    </div>
  );
}
