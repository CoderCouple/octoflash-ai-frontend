import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ORDER,
  type TemplateSummary,
  type TemplateId,
} from "@octoflash/core";
import { useTemplatesStore } from "@/store/templatesStore";
import { TemplateGlyph } from "@/components/editor/template-glyph";

export default function TemplateLibraryPage() {
  const [q, setQ] = useState("");
  const { catalog, loading, error, loadCatalog } = useTemplatesStore();

  // Fetch once on mount. The store no-ops if already loaded.
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const byCat = new Map<string, TemplateSummary[]>();
    for (const t of catalog) {
      if (
        needle &&
        !t.name.toLowerCase().includes(needle) &&
        !t.id.toLowerCase().includes(needle)
      ) {
        continue;
      }
      const list = byCat.get(t.category) ?? [];
      list.push(t);
      byCat.set(t.category, list);
    }
    // Apply the canonical category order.
    return TEMPLATE_CATEGORY_ORDER.filter((cat) => byCat.has(cat)).map((cat) => ({
      cat,
      label: TEMPLATE_CATEGORY_LABELS[cat] ?? cat,
      items: byCat.get(cat)!,
    }));
  }, [catalog, q]);

  const manicCount = catalog.filter((t) => t.manicCompatible).length;
  const implementedCount = catalog.filter((t) => t.implemented).length;
  const shown = grouped.reduce((a, g) => a + g.items.length, 0);

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-auto">
      <div className="max-w-[1180px] mx-auto px-8 pt-7 pb-12">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight leading-tight">
              Template library
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Scene presets that compile to a Manim{" "}
              <span className="font-mono">Scene</span> subclass. Pick one per
              scene and tweak its params — no Python required.
            </p>
          </div>
          <div className="flex items-end gap-5">
            <Stat label="Templates" value={catalog.length} />
            <Stat label="Implemented" value={implementedCount} />
            <Stat label="Manic-friendly" value={manicCount} dot />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5 p-3 border rounded-md bg-muted/30">
          <div className="relative w-[280px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              placeholder={`Search ${catalog.length || ""} templates…`}
              className="pl-8 h-8"
            />
          </div>
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex flex-wrap gap-1">
            {grouped.map((g) => (
              <a
                key={g.cat}
                href={`#cat-${g.cat}`}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {g.label}
              </a>
            ))}
          </nav>
          <div className="flex-1" />
          <span className="font-mono text-[11px] text-muted-foreground">{shown} shown</span>
          <Button variant="ghost" size="sm" className="h-8">
            <Filter className="size-3.5 mr-1.5" /> Filter
          </Button>
          <Button size="sm" className="h-8">
            <Plus className="size-3.5 mr-1.5" /> New template
          </Button>
        </div>

        {loading && catalog.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Loading catalog…
          </div>
        )}

        {error && catalog.length === 0 && (
          <div className="text-center py-16 text-sm">
            <div className="text-destructive font-medium">Failed to load templates</div>
            <div className="text-xs mt-1 text-muted-foreground font-mono">{error}</div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-7"
              onClick={() => void useTemplatesStore.getState().refreshCatalog()}
            >
              Retry
            </Button>
          </div>
        )}

        {grouped.map(({ cat, label, items }) => (
          <section key={cat} id={`cat-${cat}`} className="mb-9 scroll-mt-20">
            <div className="flex items-baseline gap-2.5 mb-3.5 pb-2 border-b">
              <h2 className="text-base font-semibold tracking-tight">{label}</h2>
              <span className="font-mono text-[11px] text-muted-foreground">{items.length}</span>
              <div className="flex-1" />
              <span className="text-[11px] text-muted-foreground font-mono">{cat}</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {items.map((t) => (
                <TemplateCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        ))}

        {!loading && grouped.length === 0 && catalog.length > 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="size-5 mx-auto opacity-50 mb-2" />
            <div className="text-sm font-medium">No templates match "{q}"</div>
            <div className="text-xs mt-1">Try a different query, or clear the search.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: number; dot?: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[22px] font-semibold tracking-tight leading-none flex items-center gap-1.5">
        {dot && <span className="size-1.5 rounded-full bg-primary" />}
        {value}
      </span>
      <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function TemplateCard({ t }: { t: TemplateSummary }) {
  return (
    <div
      className={cn(
        "relative border rounded-md overflow-hidden bg-card transition-all",
        t.implemented
          ? "cursor-pointer hover:shadow-sm hover:-translate-y-px hover:border-foreground/30"
          : "opacity-55 grayscale cursor-not-allowed",
      )}
      title={t.implemented ? undefined : "Not yet renderable — coming soon"}
    >
      <div className="relative h-[84px] flex items-center justify-center bg-muted/50 border-b">
        <div className="scale-[2.2] text-foreground">
          <TemplateGlyph id={t.glyph as TemplateId} />
        </div>
        {t.manicCompatible && (
          <span
            title="Pairs well with Manic"
            className="absolute top-2 right-2 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-px rounded-full bg-primary/15 text-primary"
          >
            <span className="size-1 rounded-full bg-primary" />
            manic
          </span>
        )}
        {!t.implemented && (
          <span className="absolute top-2 left-2 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-px rounded-full bg-muted text-muted-foreground border">
            soon
          </span>
        )}
      </div>

      <div className="px-3 pt-2.5 pb-3">
        <div className="text-[12.5px] font-semibold">{t.name}</div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug min-h-[30px]">
          {/* Summary doesn't carry a description — TemplateDetail does; fetch on hover/click later. */}
          {t.implemented ? "Ready to render" : "Definition pending"}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-[9.5px] text-muted-foreground">{t.id}</span>
          {t.implemented && (
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
              Use <ChevronRight className="size-2.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
