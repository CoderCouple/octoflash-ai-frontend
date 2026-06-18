/**
 * Node palette — left column on the workflow editor.
 *
 * Reads from `TaskRegistry` (single source of truth shared with the
 * NodeComponent renderer + the FlowEditor connection validator). Adding a
 * new TaskType in `workflow-engine/task-registry.ts` auto-shows it here.
 *
 * Drag-start stamps the type machine key into `application/reactflow`
 * dataTransfer; FlowEditor's onDrop reads it back, generates a fresh node
 * via `createFlowNode()`, and inserts it at the cursor position.
 */

import { TaskRegistry } from "@/workflow-engine/task-registry";
import { type TaskDefinition } from "@/workflow-engine/types";

const GROUP_ORDER: TaskDefinition["group"][] = ["Source", "Process", "Target"];

export function NodePalette() {
  const grouped: Record<TaskDefinition["group"], TaskDefinition[]> = {
    Source: [],
    Process: [],
    Target: [],
  };
  for (const task of Object.values(TaskRegistry)) {
    grouped[task.group].push(task);
  }

  return (
    <aside className="flex h-full min-h-0 w-[260px] shrink-0 flex-col gap-3 overflow-y-auto border-r bg-card/30 p-3">
      <header>
        <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
          Nodes
        </h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Drag onto the canvas to add. Edits auto-save.
        </p>
      </header>

      {GROUP_ORDER.map((group) => {
        const entries = grouped[group];
        if (entries.length === 0) return null;
        return (
          <section key={group} className="flex flex-col gap-1.5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 px-1">
              {group}
            </div>
            {entries.map((entry) => (
              <PaletteCard key={entry.type} entry={entry} />
            ))}
          </section>
        );
      })}
    </aside>
  );
}

function PaletteCard({ entry }: { entry: TaskDefinition }) {
  const Icon = entry.icon;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/reactflow", entry.type);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="group flex cursor-grab items-start gap-2 rounded-md border bg-card p-2 transition-colors hover:border-foreground/30 hover:bg-muted/40 active:cursor-grabbing"
    >
      <Icon className="size-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
      <div className="min-w-0">
        <div className="text-[12px] font-medium leading-tight truncate">{entry.label}</div>
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground line-clamp-2">
          {entry.description}
        </p>
      </div>
    </div>
  );
}
