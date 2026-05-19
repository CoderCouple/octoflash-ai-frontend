
import { useState } from "react";
import { AlertCircle, Check, Film, Layers, MoreHorizontal, Terminal, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Scene } from "@octoflash/core";
import { formatTime } from "@octoflash/core";
import { SceneArt } from "./scene-art";

const KIND_COLORS: Record<Scene["kind"], string> = {
  title: "#475569",
  grid: "#312e81",
  warp: "#6d28d9",
  orbit: "#a21caf",
};

type Tab = "timeline" | "logs" | "renders" | "problems";

export function BottomPanel({
  scenes,
  activeId,
  total,
  playhead,
  onPick,
  onClose,
}: {
  scenes: Scene[];
  activeId: string;
  total: number;
  playhead: number;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("timeline");

  return (
    <div className="border-t bg-background flex flex-col shrink-0" style={{ height: 208 }}>
      <div className="flex items-center h-[30px] px-2 border-b">
        <TabBtn icon={<Layers className="size-3" />} active={tab === "timeline"} onClick={() => setTab("timeline")}>
          Timeline
        </TabBtn>
        <TabBtn icon={<Terminal className="size-3" />} active={tab === "logs"} onClick={() => setTab("logs")} count="24">
          Logs
        </TabBtn>
        <TabBtn icon={<Film className="size-3" />} active={tab === "renders"} onClick={() => setTab("renders")} count="12">
          Renders
        </TabBtn>
        <TabBtn icon={<AlertCircle className="size-3" />} active={tab === "problems"} onClick={() => setTab("problems")} count="0">
          Problems
        </TabBtn>
        <div className="ml-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-6">
            <MoreHorizontal className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={onClose}>
            <X className="size-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {tab === "timeline" && (
          <TimelineContent scenes={scenes} activeId={activeId} total={total} playhead={playhead} onPick={onPick} />
        )}
        {tab === "logs" && <LogsContent />}
        {tab === "renders" && <RendersContent scenes={scenes} />}
        {tab === "problems" && <ProblemsContent />}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 h-full px-2.5 text-[11.5px]",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span>{children}</span>
      {count != null && (
        <span className="font-mono text-[10px] px-1 rounded bg-muted text-muted-foreground">{count}</span>
      )}
      {active && <span className="absolute bottom-[-1px] left-1.5 right-1.5 h-0.5 bg-foreground" />}
    </button>
  );
}

// ─── Timeline ─────────────────────────────────────────────────

function TimelineContent({
  scenes,
  activeId,
  total,
  playhead,
  onPick,
}: {
  scenes: Scene[];
  activeId: string;
  total: number;
  playhead: number;
  onPick: (id: string) => void;
}) {
  const playPct = (playhead / total) * 100;

  return (
    <div className="h-full flex flex-col gap-2.5 px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-mono">v1 · video track</span>
        <Separator orientation="vertical" className="h-3" />
        <span>{scenes.length} clips</span>
        <Separator orientation="vertical" className="h-3" />
        <span className="font-mono">{formatTime(playhead)} / {formatTime(total)}</span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="size-6"><ZoomOut className="size-3" /></Button>
        <Button variant="ghost" size="icon" className="size-6"><ZoomIn className="size-3" /></Button>
      </div>

      {/* Ruler */}
      <div className="flex h-3.5 text-[9px] font-mono text-muted-foreground">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 border-l border-border pl-1">{i * 5}s</div>
        ))}
      </div>

      {/* Video track */}
      <div className="relative flex gap-0.5 h-11">
        {scenes.map((s) => {
          const pct = (s.duration / total) * 100;
          const active = s.id === activeId;
          return (
            <div
              key={s.id}
              onClick={() => onPick(s.id)}
              style={{ flex: `${pct} ${pct} 0`, background: KIND_COLORS[s.kind] }}
              className={cn(
                "relative rounded overflow-hidden cursor-pointer",
                active
                  ? "ring-[1.5px] ring-foreground"
                  : "ring-1 ring-white/10"
              )}
            >
              <div className="absolute inset-0">
                <SceneArt
                  kind={s.kind}
                  bg={s.bg}
                  accent={s.accent}
                  variant={s.selectedVariation}
                  width={140}
                  height={44}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 50%, ${KIND_COLORS[s.kind]}cc 100%)` }}
                />
              </div>
              <div className="absolute top-1 left-1.5 text-[9px] font-mono text-white/90">
                S{String(s.n).padStart(2, "0")}
              </div>
              <div className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-medium text-white/95 truncate">
                {s.title}
              </div>
              <div className="absolute bottom-1 right-1.5 text-[9px] font-mono text-white/75">
                {s.duration}s
              </div>
              {s.status === "generating" && (
                <div className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-white animate-pulse" />
              )}
            </div>
          );
        })}
        {/* Playhead */}
        <div
          className="absolute -top-3.5 -bottom-0.5 w-0.5 bg-foreground pointer-events-none"
          style={{ left: `calc(${playPct}% - 1px)` }}
        >
          <div className="absolute -top-0.5 -left-1 size-2.5 rounded-full bg-foreground" />
        </div>
      </div>

      {/* Audio track */}
      <div className="flex gap-0.5 h-5">
        <div className="flex-1 bg-muted rounded relative overflow-hidden flex items-center px-2 gap-1.5">
          <span className="text-[10px] text-muted-foreground">voiceover.mp3</span>
          <div className="flex-1 h-2 flex gap-px items-center">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-muted-foreground/35"
                style={{ height: `${20 + Math.abs(Math.sin(i * 0.7)) * 80}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Logs ─────────────────────────────────────────────────────

function LogsContent() {
  const lines: { t: string; l: "i" | "ok" | "w" | "e"; txt: string }[] = [
    { t: "00:12.40", l: "i", txt: "planner: parsed 4 scenes from prompt" },
    { t: "00:12.51", l: "i", txt: "scene s3 · template=callout_zoom · style=manic · motion=0.85" },
    { t: "00:13.02", l: "i", txt: "manim: spawning render worker (gpu-4090, py3.11)" },
    { t: "00:14.74", l: "ok", txt: "render s1.v2 → 90 frames in 13.5s (h.264, 720×1280)" },
    { t: "00:15.10", l: "ok", txt: "render s2.v1 → 330 frames in 18.2s" },
    { t: "00:18.62", l: "i", txt: "concat preview · ffmpeg -f concat -c copy preview-stitch.mp4" },
    { t: "00:18.91", l: "w", txt: "scene s4 selected variation has no audio track — using silence" },
    { t: "00:20.04", l: "i", txt: "generating 4 variations for s3 …" },
    { t: "00:22.41", l: "ok", txt: "render s3.v3 → 540 frames in 21.4s" },
    { t: "00:24.10", l: "i", txt: "selected s3.v3 — others kept on disk" },
  ];
  const color: Record<string, string> = {
    i: "text-muted-foreground",
    ok: "text-emerald-600 dark:text-emerald-400",
    w: "text-amber-600 dark:text-amber-400",
    e: "text-red-600 dark:text-red-400",
  };
  const glyph: Record<string, string> = { i: "·", ok: "✓", w: "⚠", e: "✗" };
  return (
    <div className="h-full overflow-auto font-mono text-[11px] leading-relaxed text-muted-foreground p-3">
      {lines.map((ln, i) => (
        <div key={i}>
          <span className="opacity-70">[{ln.t}]</span> <span className={color[ln.l]}>{glyph[ln.l]}</span> {ln.txt}
        </div>
      ))}
      <span className="opacity-80">▌</span>
    </div>
  );
}

// ─── Renders ──────────────────────────────────────────────────

function RendersContent({ scenes }: { scenes: Scene[] }) {
  const cols = ["scene", "variation", "template", "duration", "frames", "size", "rendered"];
  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-[11.5px] border-collapse">
        <thead>
          <tr className="text-left text-muted-foreground">
            {cols.map((h) => (
              <th key={h} className="font-medium border-b px-3.5 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {scenes.flatMap((s) =>
            [0, 1, 2, 3].map((v) => (
              <tr key={`${s.id}-${v}`} className="border-b border-border/50">
                <td className="px-3.5 py-1.5">s{s.n}</td>
                <td className="px-3.5 py-1.5">
                  v{v + 1}
                  {v === s.selectedVariation && (
                    <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">● selected</span>
                  )}
                </td>
                <td className="px-3.5 py-1.5">{s.template}</td>
                <td className="px-3.5 py-1.5">{s.duration.toFixed(1)}s</td>
                <td className="px-3.5 py-1.5">{Math.round(s.duration * 30)}</td>
                <td className="px-3.5 py-1.5">{(s.duration * 0.18 + 0.4).toFixed(1)} MB</td>
                <td className="px-3.5 py-1.5 text-muted-foreground">{(v + 1) * 2}m ago</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Problems ─────────────────────────────────────────────────

function ProblemsContent() {
  return (
    <div className="h-full grid place-items-center text-center">
      <div className="text-muted-foreground text-xs">
        <Check className="size-5 mx-auto mb-1.5 text-emerald-500" />
        <div>No problems. All scenes rendered cleanly.</div>
      </div>
    </div>
  );
}
