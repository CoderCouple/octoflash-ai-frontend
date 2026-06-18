import { useEffect, useMemo, useState } from "react";
import { Plus, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewFromTextDialog } from "@/components/new-from-text-dialog";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { ProjectCard } from "@/components/project-card";
import { UrlPasteForm } from "@/components/forms/url-paste-form";
import { SortMenu, applySort, type SortKey } from "@/components/sort-menu";
import { useProjectsStore } from "@/store/projectsStore";
import type { ProjectStatus } from "@octoflash/core";

const FILTER_TABS: { v: ProjectStatus | "all"; label: string }[] = [
  { v: "all",        label: "All" },
  { v: "queued",     label: "Queued" },
  { v: "analyzing",  label: "Analyzing" },
  { v: "analyzed",   label: "Analyzed" },
  { v: "generating", label: "Generating" },
  { v: "generated",  label: "Generated" },
  { v: "published",  label: "Published" },
  { v: "failed",     label: "Failed" },
];

export default function ProjectsPage() {
  const { projects, loading, error, loadProjects } = useProjectsStore();
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [newOpen, setNewOpen] = useState(false);
  const [newFromTextOpen, setNewFromTextOpen] = useState(false);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: projects.length };
    for (const p of projects) out[p.status] = (out[p.status] || 0) + 1;
    return out;
  }, [projects]);

  const visible = useMemo(() => {
    const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);
    return applySort(filtered, sort);
  }, [filter, projects, sort]);

  return (
    <div className="px-7 py-6 max-w-[1280px] mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Projects</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Paste a source URL — Octoflash analyses it and turns it into a Manim video.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setNewFromTextOpen(true)}>
            <Type className="size-3.5 mr-1" /> Type a brief
          </Button>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="size-3.5 mr-1" /> New
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <UrlPasteForm />
      </div>

      <div className="flex items-center justify-between mb-4 gap-3">
        <Tabs
          value={filter}
          onValueChange={(v: string) => setFilter(v as ProjectStatus | "all")}
        >
          <TabsList className="h-8">
            {FILTER_TABS.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="text-xs">
                {t.label}
                {counts[t.v] !== undefined && counts[t.v] > 0 && (
                  <span className="ml-1.5 text-muted-foreground">{counts[t.v]}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <SortMenu value={sort} onChange={setSort} />
      </div>

      {loading && projects.length === 0 && (
        <div className="text-sm text-muted-foreground py-10 text-center">
          Loading projects…
        </div>
      )}
      {error && (
        <div className="text-sm text-destructive py-10 text-center">
          Couldn't load projects: {error}
        </div>
      )}
      {!loading && projects.length === 0 && !error && (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <div className="text-sm font-medium">No projects yet</div>
          <div className="text-xs text-muted-foreground mt-1">
            Paste a YouTube short, Medium, or Substack URL above to get started.
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}

      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} />
      <NewFromTextDialog open={newFromTextOpen} onOpenChange={setNewFromTextOpen} />
    </div>
  );
}
