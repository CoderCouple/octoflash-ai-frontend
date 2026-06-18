import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileCode,
  FlaskConical,
  Loader2,
  Play,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ApiError, playgroundApi, type PlaygroundPreset } from "@octoflash/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { highlightPython } from "@/components/code-editor/highlight-python";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                              Preset scenes                                 */
/* -------------------------------------------------------------------------- */
// Presets are now fetched from `GET /api/v1/playground/presets` so the
// catalog lives in exactly one place (the backend). FALLBACK below covers
// the brief window before the fetch resolves; updating the catalog only
// requires editing `app/service/playground_service.py` on the backend.

type Preset = PlaygroundPreset;

const FALLBACK_PRESET: Preset = {
  id: "hello-manim",
  label: "Hello Manim",
  duration: "0:08",
  preview: "/examples/TrigonometryAnimation_ManimCE_v0.17.3.gif",
  code: `from manimlib import *

class HelloManim(Scene):
    def construct(self):
        circle = Circle(color=BLUE)
        square = Square(color=YELLOW)

        self.play(ShowCreation(circle))
        self.wait(0.5)
        self.play(Transform(circle, square))
        self.wait(2)
`,
};

const QUALITIES = ["480p", "720p", "1080p", "1440p", "2160p"] as const;
type Quality = (typeof QUALITIES)[number];

const TIPS = [
  { title: "Define a Scene", body: "Every render is a Scene subclass with a construct() method." },
  { title: "Play & wait", body: "self.play(...) runs an animation, self.wait(t) pauses." },
  { title: "Transform shapes", body: "Transform(a, b) morphs one mobject into another." },
  { title: "Run on save", body: "Toggle auto-render to re-run whenever you stop typing." },
];

/* -------------------------------------------------------------------------- */
/*                              Page                                          */
/* -------------------------------------------------------------------------- */

type RenderState = "idle" | "rendering" | "done" | "error";

export default function PlaygroundPage() {
  const [presets, setPresets] = useState<Preset[]>([FALLBACK_PRESET]);
  const [presetId, setPresetId] = useState<string>(FALLBACK_PRESET.id);
  const preset = useMemo(
    () => presets.find((p) => p.id === presetId) ?? presets[0],
    [presets, presetId],
  );

  // Fetch the canonical catalog from the backend on mount. The local
  // FALLBACK_PRESET is shown until this resolves; if the fetch fails we
  // keep the fallback (so the page still renders something usable).
  useEffect(() => {
    let cancelled = false;
    playgroundApi
      .listPresets()
      .then((list) => {
        if (cancelled || list.length === 0) return;
        setPresets(list);
        setPresetId(list[0].id);
      })
      .catch(() => {
        /* keep the fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [code, setCode] = useState<string>(preset.code);
  const [sceneName, setSceneName] = useState<string>(extractSceneName(preset.code));
  const [quality, setQuality] = useState<Quality>("720p");
  const [autoRun, setAutoRun] = useState(false);

  const [state, setState] = useState<RenderState>("idle");
  const [renderedSrc, setRenderedSrc] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [renderMs, setRenderMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState<string | null>(null);
  const renderAbort = useRef<AbortController | null>(null);

  // Switch preset → reset editor.
  useEffect(() => {
    setCode(preset.code);
    setSceneName(extractSceneName(preset.code));
    setState("idle");
    setRenderedSrc(null);
    setLogs([]);
    setRenderMs(null);
    setErrorMsg(null);
    setSandboxMode(null);
  }, [preset]);

  // Auto-run with debounce.
  useEffect(() => {
    if (!autoRun) return;
    const t = setTimeout(() => doRender(), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, autoRun]);

  async function doRender() {
    // Cancel any in-flight render before kicking off a new one.
    renderAbort.current?.abort();
    setState("rendering");
    setLogs([`POST /api/v1/playground/render  (${sceneName} @ ${quality})`]);
    setRenderMs(null);
    setRenderedSrc(null);
    setErrorMsg(null);

    const start = performance.now();
    try {
      const result = await playgroundApi.render({
        code,
        sceneName,
        quality,
      });
      setSandboxMode(result.sandboxMode);
      setLogs((l) => [...l, ...result.logLines]);
      setRenderedSrc(playgroundApi.absoluteVideoUrl(result.videoUrl));
      setRenderMs(Math.round(performance.now() - start));
      setState("done");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `HTTP ${err.status}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "render failed";
      setErrorMsg(message);
      setLogs((l) => [...l, message]);
      setState("error");
    }
  }

  const [copiedCode, setCopiedCode] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for non-secure contexts where the Clipboard API is blocked.
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1200);
  }

  function downloadCode() {
    const blob = new Blob([code], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sceneName || "scene"}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function downloadVideo() {
    if (!renderedSrc) return;
    // Cross-origin `<a download>` is ignored by browsers — the file opens
    // in-tab instead. Fetch as a blob first so we can hand the browser a
    // same-origin object URL that respects the `download` attribute.
    try {
      const res = await fetch(renderedSrc, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sceneName || "render"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[playground] video download failed:", err);
      // Last-resort fallback: open the URL in a new tab so the user at
      // least gets the file.
      window.open(renderedSrc, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background">
      {/* Top toolbar */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-foreground/70" strokeWidth={1.7} />
          <span className="text-[13px] font-semibold tracking-tight">Playground</span>
          <span className="text-[10.5px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded bg-muted text-foreground/70 font-semibold">
            ManimGL
          </span>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Scene picker */}
        <select
          value={presetId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPresetId(e.target.value)}
          className="h-8 px-2 rounded border border-border bg-card text-[12.5px] font-medium hover:border-foreground/40 transition-colors"
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Scene class name */}
        <div className="flex items-center gap-1.5">
          <FileCode className="size-3.5 text-foreground/55" strokeWidth={1.8} />
          <Input
            value={sceneName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSceneName(e.target.value)}
            className="h-8 w-[180px] text-[12.5px] font-mono"
          />
        </div>

        {/* Quality */}
        <select
          value={quality}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setQuality(e.target.value as Quality)}
          className="h-8 px-2 rounded border border-border bg-card text-[12.5px] font-medium hover:border-foreground/40 transition-colors"
        >
          {QUALITIES.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>

        {/* Auto-run toggle */}
        <label className="inline-flex items-center gap-1.5 text-[12px] text-foreground/75 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRun}
            onChange={(e) => setAutoRun(e.target.checked)}
            className="size-3.5 accent-foreground"
          />
          Auto-run
        </label>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="outline"
          className="h-8 text-[12.5px]"
          onClick={() => {
            // Cancel any in-flight render so it can't overwrite our cleared
            // state when it eventually resolves.
            renderAbort.current?.abort();
            setCode(preset.code);
            setSceneName(extractSceneName(preset.code));
            setRenderedSrc(null);
            setLogs([]);
            setRenderMs(null);
            setErrorMsg(null);
            setSandboxMode(null);
            setState("idle");
          }}
        >
          <RefreshCcw className="size-3.5 mr-1" /> Reset
        </Button>
        <Button
          size="sm"
          className="h-8 text-[12.5px] font-semibold"
          onClick={doRender}
          disabled={state === "rendering"}
        >
          {state === "rendering" ? (
            <>
              <Loader2 className="size-3.5 mr-1 animate-spin" /> Rendering…
            </>
          ) : (
            <>
              <Play className="size-3.5 mr-1 fill-background" strokeWidth={2} /> Render
            </>
          )}
        </Button>
      </div>

      {/* Body — vertical-divider split: editor on left, render on right */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Editor */}
        <div className="relative bg-card overflow-hidden flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 px-3 h-8 border-b border-border bg-muted/40 text-[11px] font-mono text-foreground/65 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>scene.py</span>
              <span className="text-foreground/40">·</span>
              <span>{code.split("\n").length} lines</span>
              <span className="text-foreground/40">·</span>
              <span>{sceneName}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={copyCode}
                title={copiedCode ? "Copied!" : "Copy"}
                className="size-6 inline-flex items-center justify-center rounded hover:bg-muted text-foreground/70 hover:text-foreground"
              >
                {copiedCode ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
              <button
                type="button"
                onClick={downloadCode}
                title="Download .py"
                className="size-6 inline-flex items-center justify-center rounded hover:bg-muted text-foreground/70 hover:text-foreground"
              >
                <Download className="size-3" />
              </button>
            </div>
          </div>

          <Editor value={code} onChange={setCode} />
        </div>

        {/* Vertical divider */}
        <div className="w-[3px] bg-border shrink-0" />

        {/* Right: Render preview (top) + console (bottom). `min-h-0` on the
            column is critical — without it, the console's intrinsic text
            content (a growing log) refuses to shrink and collapses the
            preview pane to zero height. */}
        <div className="w-[520px] xl:w-[600px] shrink-0 flex flex-col min-w-0 min-h-0">
          {/* Preview */}
          <div className="relative bg-black overflow-hidden min-h-0" style={{ flex: "1.4 1 0" }}>
            <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between text-[10.5px] font-mono text-white/85">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-white/10 backdrop-blur-sm border border-white/15 font-semibold">
                  {state === "rendering" ? "RENDERING" : state === "done" ? "PREVIEW" : "IDLE"}
                </span>
                {state === "done" && (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 backdrop-blur-sm border border-white/15">
                    {sceneName} · {preset.duration}
                  </span>
                )}
              </div>
              <span className="px-1.5 py-0.5 rounded bg-white/10 backdrop-blur-sm border border-white/15">
                {quality}
              </span>
            </div>

            {state === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
                <div className="size-10 rounded-full border border-white/20 flex items-center justify-center">
                  <Play className="size-4 fill-white/80 text-white/80 ml-0.5" />
                </div>
                <div className="text-[13px]">
                  Click <span className="font-semibold text-white">Render</span> to see the result
                </div>
                <div className="text-[10.5px] font-mono text-white/40">cmd+enter</div>
              </div>
            )}

            {state === "rendering" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/85">
                <Loader2 className="size-8 animate-spin text-white/80" />
                <div className="text-[12.5px] font-mono">manimgl · {sceneName}</div>
                <div className="text-[10.5px] text-white/45 font-mono">
                  encoding {quality} · {preset.duration}
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-rose-300">
                <div className="size-9 rounded-full border border-rose-400/40 flex items-center justify-center">
                  <span className="text-lg leading-none">!</span>
                </div>
                <div className="text-[12.5px] font-mono break-words max-w-[400px]">
                  {errorMsg ?? "render failed"}
                </div>
                <button
                  type="button"
                  onClick={doRender}
                  className="mt-1 px-2 py-1 text-[11px] rounded border border-white/20 text-white/85 hover:bg-white/10"
                >
                  Retry
                </button>
              </div>
            )}

            {state === "done" && renderedSrc && (
              <>
                <video
                  src={renderedSrc}
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                {renderMs !== null && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/55 backdrop-blur-sm border border-white/15 text-[10.5px] font-mono text-white/85">
                    <Check className="size-3 inline-block mr-1" strokeWidth={3} />
                    rendered in {(renderMs / 1000).toFixed(1)}s
                    {sandboxMode && (
                      <span className="ml-1.5 text-white/55">· {sandboxMode}</span>
                    )}
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    type="button"
                    title="Replay"
                    className="size-7 rounded-md bg-black/55 backdrop-blur-sm border border-white/15 text-white/85 hover:text-white inline-flex items-center justify-center"
                    onClick={doRender}
                  >
                    <RefreshCcw className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={downloadVideo}
                    title="Download mp4"
                    className="size-7 rounded-md bg-black/55 backdrop-blur-sm border border-white/15 text-white/85 hover:text-white inline-flex items-center justify-center"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Console */}
          <div className="border-t border-border bg-card flex flex-col min-h-0" style={{ flex: "1 1 0" }}>
            <div className="flex items-center justify-between px-3 h-7 border-b border-border text-[11px] font-mono text-foreground/65 shrink-0">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400" />
                <span>console</span>
              </div>
              <button
                type="button"
                onClick={() => setLogs([])}
                className="inline-flex items-center gap-1 px-1.5 h-5 rounded hover:bg-muted text-foreground/60 hover:text-foreground text-[10.5px]"
              >
                <Trash2 className="size-3" /> clear
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 font-mono text-[11px] leading-snug text-foreground/75 space-y-0.5">
              {logs.length === 0 && (
                <div className="text-foreground/40">$ waiting for render…</div>
              )}
              {logs.map((l, i) => (
                <div key={i} className="whitespace-pre">
                  {l}
                </div>
              ))}
              {state === "rendering" && (
                <div className="text-foreground/40">
                  <span className="inline-block w-[7px] h-[10px] -mb-[1px] bg-foreground/40 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tips strip */}
      <div className="hidden md:flex border-t border-border bg-muted/40 px-4 py-2.5 gap-5 overflow-x-auto">
        {TIPS.map((t) => (
          <div key={t.title} className="flex items-start gap-2 min-w-[220px]">
            <Sparkles className="size-3.5 mt-0.5 shrink-0 text-foreground/70" strokeWidth={1.8} />
            <div className="text-[11.5px] leading-snug">
              <div className="font-semibold">{t.title}</div>
              <div className="text-foreground/60">{t.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Editor                                        */
/* -------------------------------------------------------------------------- */

function Editor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const lines = value.split("\n");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Tab key inserts spaces.
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const inserted = "    ";
      const next = value.slice(0, start) + inserted + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + inserted.length;
      });
    }
  }

  // Mirror the textarea's scroll onto the highlighted <pre> so the colour
  // layer underneath always lines up with the caret + selection above.
  function onScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const pre = preRef.current;
    if (!pre) return;
    pre.scrollTop = e.currentTarget.scrollTop;
    pre.scrollLeft = e.currentTarget.scrollLeft;
  }

  // Pre + textarea share these EXACT styles so the highlighted glyphs sit
  // pixel-aligned under the caret. Any tweak here must be made on both.
  const codeFace =
    "font-mono text-[12.5px] leading-[1.55] py-3 pl-3 pr-4 whitespace-pre tab-size-4";

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden bg-card">
      <div className="flex h-full">
        {/* Gutter */}
        <div
          aria-hidden
          className="select-none px-2 py-3 text-right text-foreground/35 border-r border-border bg-muted/30 font-mono text-[12.5px] leading-[1.55] overflow-hidden shrink-0"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Layered code surface: highlighted <pre> behind, transparent
            <textarea> on top. The textarea owns scroll + selection; the
            <pre> mirrors scroll so colour stays aligned with the caret. */}
        <div className="relative flex-1 min-w-0">
          <pre
            ref={preRef}
            aria-hidden
            className={cn(
              codeFace,
              "absolute inset-0 m-0 overflow-auto bg-transparent text-foreground pointer-events-none",
            )}
          >
            <code>{highlightPython(value)}</code>
            {/* Trailing newline so the last line still has a slot. */}
            {"\n"}
          </pre>
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={onScroll}
            spellCheck={false}
            wrap="off"
            className={cn(
              codeFace,
              "absolute inset-0 w-full h-full bg-transparent text-transparent caret-foreground selection:bg-foreground/20 outline-none resize-none overflow-auto",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function extractSceneName(code: string): string {
  const m = code.match(/class\s+(\w+)\s*\(/);
  return m ? m[1] : "Scene";
}
