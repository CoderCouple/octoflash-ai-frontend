/**
 * /targets — publishing destinations.
 *
 * A "target" is a connected third-party account where generated videos get
 * published. Backend exposes:
 *   GET   /api/v1/targets
 *   GET   /api/v1/targets/oauth/{platform}/authorize   ← starts the connect flow
 *   POST  /api/v1/targets/{id}/publish
 *   DELETE /api/v1/targets/{id}
 *
 * Connect flow: clicking Connect calls authorize, the browser navigates to
 * the platform's consent screen, the platform redirects to the backend
 * callback, the backend 303s back to `/targets?connected=<id>` (or
 * `/targets?error=…&detail=…`). This page reads those URL params on mount
 * and surfaces a toast accordingly.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Linkedin,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Twitter,
  Youtube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import {
  ApiError,
  targetsApi,
  type Target,
  type TargetPlatform,
} from "@octoflash/core";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PlatformId = TargetPlatform;

type Platform = {
  id: PlatformId;
  label: string;
  description: string;
  bg: string;
  fg: string;
  Icon: LucideIcon;
};

const PLATFORMS: Platform[] = [
  {
    id: "youtube",
    label: "YouTube",
    description: "Publish to a channel as a Short or long-form video.",
    bg: "#ff0033",
    fg: "#ffffff",
    Icon: Youtube,
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Publish vertical videos to your TikTok account.",
    bg: "#000000",
    fg: "#ffffff",
    Icon: Play,
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Publish Reels from a Business or Creator account.",
    bg: "linear-gradient(135deg,#fa7e1e,#d62976,#962fbf)",
    fg: "#ffffff",
    Icon: Play,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Post videos to your personal feed or a company page.",
    bg: "#0a66c2",
    fg: "#ffffff",
    Icon: Linkedin,
  },
  {
    id: "x",
    label: "X",
    description: "Post videos as a tweet from your X account.",
    bg: "#000000",
    fg: "#ffffff",
    Icon: Twitter,
  },
];

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<PlatformId | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const refresh = async () => {
    try {
      const page = await targetsApi.list({ limit: 100 });
      setTargets(page.items);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? `HTTP ${e.status}: ${e.message}`
          : (e as Error).message ?? "Failed to load targets",
      );
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Surface the result of an OAuth round-trip. The backend's callback 303s
  // back to `/targets?connected=<id>` on success or `?error=&detail=` on
  // failure; we toast + strip the params so a refresh isn't a duplicate toast.
  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    const detail = searchParams.get("detail");
    if (!connected && !err) return;
    if (connected) {
      toast.success("Account connected", {
        description: "Target is ready to publish to.",
      });
    } else if (err) {
      toast.error("Connect failed", {
        description: detail ?? err,
      });
    }
    const next = new URLSearchParams(searchParams);
    next.delete("connected");
    next.delete("error");
    next.delete("detail");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byPlatform = useMemo(() => {
    const m = new Map<PlatformId, Target[]>();
    for (const t of targets) {
      const arr = m.get(t.platform) ?? [];
      arr.push(t);
      m.set(t.platform, arr);
    }
    return m;
  }, [targets]);

  const onConnect = async (p: Platform) => {
    setConnecting(p.id);
    try {
      const { authorizeUrl } = await targetsApi.authorize(p.id);
      // Full-page nav — OAuth providers don't support cross-origin iframes.
      window.location.assign(authorizeUrl);
    } catch (e) {
      setConnecting(null);
      if (e instanceof ApiError && e.status === 501) {
        toast.error(`${p.label} not configured`, {
          description: "The backend doesn't have an OAuth client id/secret for this platform yet.",
        });
      } else {
        toast.error("Connect failed", {
          description: e instanceof ApiError ? `HTTP ${e.status}: ${e.message}` : String(e),
        });
      }
    }
  };

  const onDisconnect = async (t: Target) => {
    const label = t.displayName || t.handle || t.id;
    if (!confirm(`Disconnect ${label}? This soft-deletes the target.`)) return;
    try {
      await targetsApi.delete(t.id);
      toast(`${label} disconnected`);
      await refresh();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? `HTTP ${e.status}: ${e.message}` : (e as Error).message ?? "Disconnect failed",
      );
    }
  };

  return (
    <div className="px-7 py-6 max-w-[1280px] mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Targets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publishing destinations. Connect an account once — every project can
            then publish to it from the Publish dialog.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
          {loading ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5 mr-1.5" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 max-w-4xl rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12px] text-destructive font-mono">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        {PLATFORMS.map((p) => (
          <PlatformCard
            key={p.id}
            platform={p}
            accounts={byPlatform.get(p.id) ?? []}
            loading={loading}
            connecting={connecting === p.id}
            onConnect={() => void onConnect(p)}
            onDisconnect={onDisconnect}
          />
        ))}
      </div>

      <p className="text-[11.5px] text-muted-foreground mt-6 max-w-4xl">
        Need a destination we don't list? Tell us at{" "}
        <a href="mailto:hello@octoflash.ai" className="text-primary hover:underline">
          hello@octoflash.ai
        </a>{" "}
        — X, Threads, Vimeo and Facebook are on the roadmap.
      </p>
    </div>
  );
}

function PlatformCard({
  platform,
  accounts,
  loading,
  connecting,
  onConnect,
  onDisconnect,
}: {
  platform: Platform;
  accounts: Target[];
  loading: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: (t: Target) => void | Promise<void>;
}) {
  const { label, description, bg, fg, Icon } = platform;
  const hasAccounts = accounts.length > 0;

  return (
    <Card className="p-5 shadow-none flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className="size-10 rounded-md flex items-center justify-center shrink-0"
          style={{ background: bg, color: fg }}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[14px] font-semibold">{label}</h2>
            <StatusPill connected={hasAccounts} />
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {loading && !hasAccounts ? (
        <div className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-[12px] text-muted-foreground">
          Loading…
        </div>
      ) : hasAccounts ? (
        <div className="flex flex-col gap-1.5">
          {accounts.map((a) => (
            <AccountRow key={a.id} account={a} onDisconnect={onDisconnect} />
          ))}
          <Button
            size="sm"
            variant="outline"
            className="self-start mt-1"
            onClick={onConnect}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Plus className="size-3.5 mr-1.5" />
            )}
            Add another account
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-muted/30 px-3 py-3 flex items-center justify-between">
          <div className="text-[12px] text-muted-foreground">
            No {label} account connected.
          </div>
          <Button size="sm" onClick={onConnect} disabled={connecting}>
            {connecting ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="size-3.5 mr-1.5" />
            )}
            Connect
          </Button>
        </div>
      )}
    </Card>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium tracking-wider">
        Connected
      </span>
    );
  }
  return (
    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium tracking-wider">
      Not connected
    </span>
  );
}

function AccountRow({
  account,
  onDisconnect,
}: {
  account: Target;
  onDisconnect: (t: Target) => void | Promise<void>;
}) {
  const displayName = account.displayName ?? account.handle ?? "(unnamed)";
  const initials =
    displayName
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "??";
  const statusColor =
    account.status === "active"
      ? "text-emerald-600 dark:text-emerald-400"
      : account.status === "expired"
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <div className="size-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold shrink-0 overflow-hidden">
        {account.avatarUrl ? (
          <img src={account.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium truncate">{displayName}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {account.handle ?? account.externalId ?? "—"}
        </div>
      </div>
      <span className={`text-[10px] uppercase font-medium tracking-wider ${statusColor}`}>
        {account.status}
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={() => void onDisconnect(account)}
        title="Disconnect"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
