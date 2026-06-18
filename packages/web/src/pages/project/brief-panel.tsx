/**
 * Brief sidebar — left-column viewer for the analyze workflow's output.
 *
 * Three sections stacked vertically, each in its own card with a fixed max
 * height + internal scroll. The panel itself doesn't scroll — only the
 * content of each section does, so the user can compare them at a glance
 * without losing context.
 *
 * v1: read-only. Inline editing + debounced PATCH lands in a later pass.
 */

import { FileText, Image as ImageIcon, Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProjectDetail } from "@octoflash/core";

const PLACEHOLDER = "(empty — analyze hasn't finished yet)";

export function BriefPanel({ project }: { project: ProjectDetail }) {
  const hasAny = !!(project.transcript || project.description || project.manimPrompt);

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3 p-4 overflow-hidden">
      <header className="flex items-baseline justify-between shrink-0">
        <h2 className="text-[12px] font-semibold tracking-wide uppercase text-muted-foreground">
          Brief
        </h2>
        {project.sourceDuration ? (
          <span className="text-[11px] text-muted-foreground font-mono">
            source: {project.sourceDuration.toFixed(1)}s
          </span>
        ) : (
          !hasAny && (
            <span className="text-[11px] text-muted-foreground">
              waiting for analyze…
            </span>
          )
        )}
      </header>

      <BriefSection
        title="Transcript"
        icon={<FileText className="size-3.5" />}
        text={project.transcript}
      />
      <BriefSection
        title="Visual description"
        icon={<ImageIcon className="size-3.5" />}
        text={project.description}
      />
      <BriefSection
        title="Manim brief"
        icon={<Wand2 className="size-3.5" />}
        text={project.manimPrompt}
        mono
      />
    </aside>
  );
}

function BriefSection({
  title,
  icon,
  text,
  mono = false,
}: {
  title: string;
  icon: React.ReactNode;
  text: string | null;
  mono?: boolean;
}) {
  return (
    <section className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div
        className={cn(
          // Fixed scroll viewport per card — content scrolls *inside*, panel doesn't.
          "max-h-[280px] overflow-y-auto rounded-md border bg-muted/30 px-3 py-2",
          "text-[12px] leading-relaxed whitespace-pre-wrap",
          mono && "font-mono text-[11px]",
          !text && "text-muted-foreground italic",
        )}
      >
        {text || PLACEHOLDER}
      </div>
    </section>
  );
}
