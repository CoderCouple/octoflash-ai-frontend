import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";

import { useChannelsStore } from "@/store/channelsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChannelsIndex() {
  const { channels, loading, syncing, error, loadChannels, createAndSync } =
    useChannelsStore();
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  // Once we have at least one channel, hand off to the detail page.
  if (channels.length > 0) {
    return <Navigate to={`/channels/${channels[0].id}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-sm text-muted-foreground">
        Loading channels…
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] px-6">
      <div className="max-w-md w-full">
        <h1 className="text-xl font-semibold tracking-tight mb-1">No channels yet</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Paste a YouTube channel URL to start following it. Octoflash will pull
          recent shorts and long-form videos as source ideas for your projects.
        </p>

        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setLocalError(null);
            if (!url.trim()) return;
            try {
              await createAndSync({ sourceUrl: url.trim() }, { maxVideos: 30 });
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
