/**
 * ViewToggle — three-segment toggle in the workflow editor topbar.
 *
 * Lets a dev see the canvas, the raw JSON behind it, or both side-by-side.
 * Default-hidden in prod builds (import.meta.env.DEV gate) but the parent
 * is free to render it regardless if it wants to expose the view for
 * power users later.
 */

import { Braces, Columns2, GitFork } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkflowView = "editor" | "json" | "both";

const SEGMENTS: { value: WorkflowView; label: string; Icon: typeof Braces }[] = [
  { value: "editor", label: "Workflow", Icon: GitFork },
  { value: "json",   label: "JSON",     Icon: Braces },
  { value: "both",   label: "Both",     Icon: Columns2 },
];

export function ViewToggle({
  view,
  onChange,
  className,
}: {
  view: WorkflowView;
  onChange: (next: WorkflowView) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex rounded-md border bg-muted/30 p-0.5",
        className,
      )}
    >
      {SEGMENTS.map(({ value, label, Icon }) => {
        const isActive = value === view;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
              isActive
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
