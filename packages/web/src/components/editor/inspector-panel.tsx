
import { Check, Lock, MoreHorizontal, RefreshCw, Search, Sparkles, Upload, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MANIC_TAGS,
  STYLES,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ORDER,
  type Scene,
  type StyleId,
  type TemplateCategoryId,
  type TemplateId,
  type TemplateSummary,
} from "@octoflash/core";
import { useTemplatesStore } from "@/store/templatesStore";
import { SceneArt } from "./scene-art";
import { TemplateGlyph } from "./template-glyph";

type Props = {
  scene: Scene;
  variant: number;
  onChangeVariant: (v: number) => void;
};

export function InspectorPanel({ scene, variant, onChangeVariant }: Props) {
  return (
    <div className="flex flex-col h-full w-[340px] shrink-0 border-l bg-background">
      {/* Header */}
      <div className="flex items-center h-[30px] px-3 shrink-0 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Scene editor</span>
        <span className="ml-1.5 text-primary font-medium normal-case tracking-normal font-mono">
          s{scene.n}.{scene.template}
        </span>
        <div className="ml-auto">
          <Button variant="ghost" size="icon" className="size-6">
            <MoreHorizontal className="size-3" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <Section>
          <Header label="Prompt" right="scene-scoped" />
          <Textarea defaultValue={scene.prompt} rows={5} className="text-[12.5px] leading-snug resize-none" />
          <div className="flex gap-1 mt-2 flex-wrap">
            {["Shorter", "More dramatic", "Less motion"].map((t) => (
              <Chip key={t}>
                <Wand2 className="size-2.5" /> {t}
              </Chip>
            ))}
          </div>
        </Section>

        <Section>
          <Header label="Main text" />
          <Input defaultValue={scene.mainText} className="text-[12.5px]" />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Rendered in this scene. Optional <span className="font-mono">{"{vars}"}</span>.
          </p>
        </Section>

        <Section>
          <Header label="Template" />
          <TemplateGallery selected={scene.template} />
          <p className="text-[11px] text-muted-foreground mt-2">
            Templates map params → Manim. No code editing in MVP.
          </p>
          <TemplateParamsPreview templateId={scene.template} />
        </Section>

        <Section>
          <div className="flex items-center justify-between mb-2">
            <Label>Duration</Label>
            <span className="text-[12.5px] font-mono tabular-nums">{scene.duration.toFixed(1)}s</span>
          </div>
          <Range min={1} max={30} step={0.5} defaultValue={scene.duration} />
          <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
            <span>1s</span>
            <span>30s</span>
          </div>
        </Section>

        <Section>
          <Header label="Style preset" />
          <div className="flex flex-wrap gap-1">
            {STYLES.map((s) => (
              <StyleChip key={s.id} id={s.id} label={s.label} selected={s.id === scene.style} />
            ))}
          </div>
          {scene.style === "manic" && (
            <div className="flex flex-wrap gap-1 mt-2">
              {MANIC_TAGS.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section>
          <div className="flex items-center justify-between mb-2">
            <Label>Motion intensity</Label>
            <span className="text-[12.5px] font-mono tabular-nums">{Math.round(scene.motion * 100)}%</span>
          </div>
          <Range min={0} max={1} step={0.01} defaultValue={scene.motion} />
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>calm</span>
            <span>manic</span>
          </div>
        </Section>

        <Section>
          <Header label="Variations" right="4 rendered · 38s ago" />
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((v) => {
              const sel = v === variant;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChangeVariant(v)}
                  className={cn(
                    "relative aspect-[9/16] rounded-md overflow-hidden cursor-pointer transition-all",
                    sel
                      ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
                      : "ring-1 ring-border hover:-translate-y-0.5"
                  )}
                >
                  <SceneArt
                    kind={scene.kind}
                    bg={scene.bg}
                    accent={scene.accent}
                    variant={v}
                    width={60}
                    height={106}
                  />
                  <span className="absolute top-1 left-1 text-[9px] font-mono text-white bg-black/55 px-1 rounded-sm">
                    v{v + 1}
                  </span>
                  {sel && (
                    <span className="absolute top-1 right-1 size-4 rounded-full bg-foreground text-background flex items-center justify-center">
                      <Check className="size-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Picking a variation only swaps this scene — others untouched.
          </p>
        </Section>

        <Section>
          <div className="grid grid-cols-2 gap-1.5">
            <Button size="sm" className="h-8">
              <RefreshCw className="size-3 mr-1" /> Regenerate
            </Button>
            <Button size="sm" variant="outline" className="h-8">
              <Sparkles className="size-3 mr-1" /> 4 variations
            </Button>
            <Button size="sm" variant="outline" className="h-8">
              <Upload className="size-3 mr-1" /> Replace
            </Button>
            <Button size="sm" variant="outline" className="h-8">
              <Lock className="size-3 mr-1" /> Keep timing
            </Button>
          </div>
        </Section>

        <div className="h-3" />
      </div>
    </div>
  );
}

// ─── Layout primitives ────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3.5 border-t first:border-t-0">{children}</div>;
}

function Header({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <Label>{label}</Label>
      {right && <span className="text-[10px] font-mono text-muted-foreground">{right}</span>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-medium text-muted-foreground">{children}</span>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-secondary-foreground cursor-pointer">
      {children}
    </span>
  );
}

function StyleChip({ id, label, selected }: { id: StyleId; label: string; selected: boolean }) {
  return (
    <span
      className={cn(
        "px-2 py-[3px] rounded text-[11px] font-medium cursor-pointer",
        selected
          ? "bg-foreground text-background"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
      data-style-id={id}
    >
      {label}
    </span>
  );
}

function TemplateButton({
  t,
  selected,
}: {
  t: TemplateSummary;
  selected: boolean;
}) {
  return (
    <div
      title={t.implemented ? undefined : "Not yet renderable — coming soon"}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-2 rounded-md text-center transition-colors",
        t.implemented ? "cursor-pointer" : "cursor-not-allowed opacity-50 grayscale",
        selected
          ? "border-[1.5px] border-foreground bg-muted"
          : "border border-border bg-background hover:bg-muted/60"
      )}
    >
      {t.manicCompatible && (
        <span
          className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary"
          title="Pairs well with Manic"
        />
      )}
      <TemplateGlyph id={t.glyph as TemplateId} />
      <span
        className={cn(
          "text-[10.5px] leading-tight",
          selected ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
        )}
      >
        {t.name}
      </span>
    </div>
  );
}

function TemplateGallery({ selected }: { selected: TemplateId }) {
  const [q, setQ] = useState("");
  const { catalog, loading, loadCatalog } = useTemplatesStore();

  // Idempotent — store no-ops if already loaded.
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const byCat = new Map<string, TemplateSummary[]>();
    for (const t of catalog) {
      if (needle && !t.name.toLowerCase().includes(needle) && !t.id.toLowerCase().includes(needle)) {
        continue;
      }
      const list = byCat.get(t.category) ?? [];
      list.push(t);
      byCat.set(t.category, list);
    }
    return TEMPLATE_CATEGORY_ORDER.filter((cat) => byCat.has(cat)).map((cat) => ({
      cat,
      label: TEMPLATE_CATEGORY_LABELS[cat] ?? cat,
      items: byCat.get(cat)!,
    }));
  }, [catalog, q]);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${catalog.length || ""} templates…`}
          className="h-7 text-[12px] pl-7"
        />
      </div>

      <div className="max-h-[290px] overflow-auto pr-1 flex flex-col gap-3 -mr-1">
        {loading && catalog.length === 0 && (
          <div className="text-center text-[11px] text-muted-foreground py-6">Loading…</div>
        )}
        {grouped.map(({ cat, label, items }) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">{items.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {items.map((t) => (
                <TemplateButton key={t.id} t={t} selected={t.id === selected} />
              ))}
            </div>
          </div>
        ))}
        {!loading && grouped.length === 0 && (
          <div className="text-center text-[11px] text-muted-foreground py-6">
            No templates match <span className="font-mono">{q}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Lazy-loads TemplateDetail for the selected template and shows a compact
 * param-schema preview. Different scene → different template → different detail
 * fetch (cached by id in the store).
 */
function TemplateParamsPreview({ templateId }: { templateId: TemplateId }) {
  const detail = useTemplatesStore((s) => s.detailsById[templateId]);
  const loadDetail = useTemplatesStore((s) => s.loadDetail);
  const catalogEntry = useTemplatesStore((s) =>
    s.catalog.find((t) => t.id === templateId)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    // Only fetch detail for implemented templates (others 404).
    if (catalogEntry && !catalogEntry.implemented) return;
    if (detail) return;
    loadDetail(templateId).catch((e: Error) => setError(e.message));
  }, [templateId, detail, loadDetail, catalogEntry]);

  if (catalogEntry && !catalogEntry.implemented) {
    return (
      <div className="mt-3 p-2 rounded-md border bg-muted/30 text-[11px] text-muted-foreground">
        This template is in the catalog but not yet renderable.
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 p-2 rounded-md border border-destructive/40 bg-destructive/5 text-[11px] text-destructive font-mono">
        Failed to load template detail: {error}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mt-3 p-2 rounded-md border bg-muted/20 text-[11px] text-muted-foreground">
        Loading template params…
      </div>
    );
  }

  return (
    <div className="mt-3 p-2 rounded-md border bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Params
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{detail.params.length}</span>
        <span className="ml-auto text-[9.5px] font-mono text-muted-foreground">
          v{detail.version} · {detail.contentHash.slice(0, 8)}
        </span>
      </div>
      {detail.params.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic">No tunable params.</div>
      ) : (
        <ul className="flex flex-col gap-1">
          {detail.params.map((p) => (
            <li key={p.name} className="flex items-center gap-2 text-[11px]">
              <span className="font-mono text-foreground/80">{p.name}</span>
              <span className="font-mono text-[10px] px-1 py-px rounded bg-muted text-muted-foreground border">
                {p.type}
              </span>
              {p.required && (
                <span className="text-[9.5px] uppercase tracking-wider text-destructive">req</span>
              )}
              <span className="ml-auto text-muted-foreground truncate max-w-[140px] text-[10.5px]">
                {p.default !== undefined && p.default !== null
                  ? `default: ${JSON.stringify(p.default)}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Used by older fixture-driven sections; retained for type-completeness during
// the incremental migration off fixtures.
function CategoryLabel({ id, children }: { id: TemplateCategoryId; children: React.ReactNode }) {
  void id;
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function Range({
  min,
  max,
  step,
  defaultValue,
}: {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      defaultValue={defaultValue}
      className={cn(
        "w-full h-0.5 appearance-none bg-border rounded-full outline-none",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer",
        "[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      )}
    />
  );
}
