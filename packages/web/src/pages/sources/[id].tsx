import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ExternalLink, Loader2, MoreHorizontal, Plus, RefreshCw, Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSourcesStore } from "@/store/sourcesStore";
import {
  useAsSourceQueueStore,
  useError,
  useIsCurrent,
  useIsPending,
} from "@/store/useAsSourceQueueStore";
import { type SourceVideo, type SourceVideoKind } from "@octoflash/core";

type FeedTab = SourceVideoKind;

// Hashed pastel from the source id for a stable per-source accent.
function accentFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const palette = [
    "#0e7490", "#0891b2", "#6d28d9", "#1e3a8a", "#831843",
    "#a16207", "#15803d", "#9d174d", "#7c2d12", "#1e40af",
  ];
  return palette[Math.abs(h) % palette.length];
}

function fmtSubs(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtViews(n: number | null): string {
  return fmtSubs(n);
}

function fmtDuration(s: number | null): string {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

function fmtAge(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function SourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    sources,
    currentSource,
    videosById,
    loading,
    syncing,
    error,
    loadSources,
    openSource,
    createAndSync,
    refresh,
  } = useSourcesStore();

  // Default tab is "short", but auto-switch to "landscape" when the loaded
  // source has 0 shorts and ≥1 long-form. Many channels (3Blue1Brown,
  // most education) post zero shorts, and landing on an empty Shorts tab
  // looked like "the videos didn't load" — they did, just not as shorts.
  const [tab, setTab] = useState<FeedTab>("short");
  const [railQuery, setRailQuery] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Load the list of sources for the rail.
  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  // Open the source from the URL param.
  useEffect(() => {
    if (id) void openSource(id);
  }, [id, openSource]);

  const videos = (currentSource && videosById[currentSource.id]) ?? [];
  const shorts = useMemo(() => videos.filter((v) => v.kind === "short"), [videos]);
  const landscape = useMemo(
    () => videos.filter((v) => v.kind === "landscape"),
    [videos],
  );
  const visible = tab === "short" ? shorts : landscape;

  // Auto-switch to landscape on first load when a source has 0 shorts.
  // Pin to `currentSource.id` so it doesn't override the user's manual
  // tab choice within the same source view.
  useEffect(() => {
    if (!currentSource) return;
    if (videos.length > 0 && shorts.length === 0 && landscape.length > 0) {
      setTab("landscape");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSource?.id, videos.length]);

  const filteredRail = useMemo(() => {
    const q = railQuery.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.handle ?? "").toLowerCase().includes(q),
    );
  }, [sources, railQuery]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Rail */}
      <aside className="w-[280px] border-r flex flex-col">
        <div className="px-3.5 py-3 border-b">
          <h2 className="text-sm font-semibold mb-2">Sources</h2>
          <div className="relative">
            <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={railQuery}
              onChange={(e) => setRailQuery(e.target.value)}
              placeholder="Search sources…"
              className="pl-8 h-7 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredRail.map((c) => {
            const active = c.id === id;
            const accent = c.accentColor || accentFor(c.id);
            return (
              <Link
                key={c.id}
                to={`/sources/${c.id}`}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 transition-colors border-l-2",
                  active
                    ? "border-foreground bg-accent"
                    : "border-transparent hover:bg-accent/50",
                )}
              >
                {c.thumbnailUrl ? (
                  <img
                    src={c.thumbnailUrl}
                    alt=""
                    className="size-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span
                    className="size-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                    style={{ background: accent }}
                  >
                    {c.name[0]}
                    {c.name.split(" ")[1]?.[0] ?? ""}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {c.handle ?? "—"} · {fmtSubs(c.subscriberCount)}
                  </div>
                </div>
              </Link>
            );
          })}
          {sources.length === 0 && !loading && (
            <div className="text-[11px] text-muted-foreground text-center py-6 px-4">
              No sources yet. Paste a URL below to add one.
            </div>
          )}
        </div>

        {/* Paste-URL footer */}
        <form
          className="border-t p-2.5 flex gap-1.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setPasteError(null);
            if (!pasteUrl.trim()) return;
            try {
              const source = await createAndSync({ sourceUrl: pasteUrl.trim() });
              setPasteUrl("");
              navigate(`/sources/${source.id}`);
            } catch (err) {
              setPasteError((err as Error).message);
            }
          }}
        >
          <Input
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            placeholder="https://youtube.com/@…"
            className="h-7 text-xs"
            disabled={syncing}
          />
          <Button
            type="submit"
            size="icon"
            className="size-7"
            disabled={syncing || !pasteUrl.trim()}
            title="Add source"
          >
            {syncing ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
          </Button>
        </form>
        {pasteError && (
          <div className="text-[10.5px] text-destructive font-mono px-3 pb-2">
            {pasteError}
          </div>
        )}
      </aside>

      {/* Feed */}
      <section className="flex-1 overflow-auto">
        {!currentSource && loading && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Loading source…
          </div>
        )}

        {!currentSource && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground px-6">
            <div className="mb-2">Source not found.</div>
            <Link to="/sources" className="text-xs underline text-primary">
              Browse sources
            </Link>
          </div>
        )}

        {currentSource && (
          <>
            <SourceHeader
              sourceId={currentSource.id}
              name={currentSource.name}
              handle={currentSource.handle}
              subscriberCount={currentSource.subscriberCount}
              thumbnailUrl={currentSource.thumbnailUrl}
              shortsCount={shorts.length}
              landscapeCount={landscape.length}
              syncing={syncing}
              onRefresh={() => refresh(currentSource.id)}
            />

            <div className="flex items-center gap-4 px-6 py-2 border-b text-xs">
              <button
                onClick={() => setTab("short")}
                className={cn(
                  "py-2",
                  tab === "short"
                    ? "font-medium border-b-2 border-foreground"
                    : "text-muted-foreground",
                )}
              >
                Shorts ({shorts.length})
              </button>
              <button
                onClick={() => setTab("landscape")}
                className={cn(
                  "py-2",
                  tab === "landscape"
                    ? "font-medium border-b-2 border-foreground"
                    : "text-muted-foreground",
                )}
              >
                Long-form ({landscape.length})
              </button>
              <div className="flex-1" />
              <span className="text-muted-foreground text-[11px]">
                {currentSource.lastSyncedAt
                  ? `Last synced ${fmtAge(currentSource.lastSyncedAt)}`
                  : "Not synced yet"}
              </span>
            </div>

            {visible.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {syncing
                  ? "Syncing videos…"
                  : tab === "short"
                  ? "No shorts found for this source."
                  : "No long-form videos found for this source."}
              </div>
            ) : (
              <ul>
                {visible.map((v) => (
                  <VideoRow key={v.id} v={v} />
                ))}
              </ul>
            )}
          </>
        )}

        {error && (
          <div className="px-6 py-3 text-[12px] text-destructive font-mono border-t">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}

function SourceHeader({
  sourceId,
  name,
  handle,
  subscriberCount,
  thumbnailUrl,
  shortsCount,
  landscapeCount,
  syncing,
  onRefresh,
}: {
  sourceId: string;
  name: string;
  handle: string | null;
  subscriberCount: number | null;
  thumbnailUrl: string | null;
  shortsCount: number;
  landscapeCount: number;
  syncing: boolean;
  onRefresh: () => Promise<void>;
}) {
  const accent = accentFor(sourceId);
  return (
    <div className="flex items-center gap-3.5 px-6 py-5 border-b">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="size-14 rounded-full object-cover shrink-0"
        />
      ) : (
        <span
          className="size-14 rounded-full flex items-center justify-center text-white text-xl font-semibold shrink-0"
          style={{ background: accent }}
        >
          {name[0]}
          {name.split(" ")[1]?.[0] ?? ""}
        </span>
      )}
      <div className="flex-1">
        <h1 className="text-lg font-semibold tracking-tight">{name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {handle ?? "—"} · {fmtSubs(subscriberCount)} subscribers
          {" · "}
          {shortsCount} shorts · {landscapeCount} long-form
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void onRefresh()}
        disabled={syncing}
      >
        {syncing ? (
          <>
            <Loader2 className="size-3 mr-1.5 animate-spin" /> Syncing…
          </>
        ) : (
          <>
            <RefreshCw className="size-3 mr-1.5" /> Refresh
          </>
        )}
      </Button>
      <Button variant="ghost" size="icon" className="size-8">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}

function VideoRow({ v }: { v: SourceVideo }) {
  const aspect = v.kind === "short" ? "aspect-[9/16] w-[70px]" : "aspect-video w-[124px]";
  // Clicking the button enqueues the video — the store drains FIFO,
  // one POST /projects/from-source at a time, so a user clicking five
  // videos in quick succession doesn't fan out five parallel calls.
  // Per-row state reads the queue's "is this me?" selectors.
  const enqueue = useAsSourceQueueStore((s) => s.enqueue);
  const isCurrent = useIsCurrent(v.id);
  const isPending = useIsPending(v.id);
  const err = useError(v.id);
  const busy = isCurrent || isPending;
  return (
    <li className="flex gap-3.5 px-6 py-3.5 border-b transition-colors hover:bg-accent/40">
      <div className={cn("rounded shrink-0 relative overflow-hidden bg-muted", aspect)}>
        {v.thumbnailUrl ? (
          <img src={v.thumbnailUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}
        <span className="absolute right-1 bottom-1 rounded bg-black/75 text-white text-[9px] font-mono px-1 py-px">
          {fmtDuration(v.durationSeconds)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium mb-1 line-clamp-2">{v.title}</div>
        <p className="text-xs text-muted-foreground mb-2">
          {fmtViews(v.viewCount)} views · {fmtAge(v.publishedAt)}
          {v.kind === "short" && (
            <Badge variant="secondary" className="ml-2 text-[9px] uppercase">
              short
            </Badge>
          )}
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => enqueue(v)}
            disabled={busy}
          >
            {isCurrent ? (
              <>
                <Loader2 className="size-3 mr-1 animate-spin" />
                Creating…
              </>
            ) : isPending ? (
              <>
                <Loader2 className="size-3 mr-1 animate-spin" />
                Queued
              </>
            ) : (
              <>
                <Plus className="size-3 mr-1" /> Use as source
              </>
            )}
          </Button>
          <a
            href={v.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3" /> Original
          </a>
          {err && (
            <span className="text-[11px] text-destructive truncate">{err}</span>
          )}
        </div>
      </div>
    </li>
  );
}
