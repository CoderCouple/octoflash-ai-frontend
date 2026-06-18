/**
 * NodeCard — outer chrome around every custom node.
 *
 * Provides:
 *   • The CSS class (`drag-handle`) React Flow uses to identify the
 *     drag-grippable region — we put it on the header so users can drag the
 *     card by its title, not by clicking inside a text input.
 *   • Selection ring + hover affordance.
 *   • Consistent width so the canvas grid stays tidy.
 */

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function NodeCard({
  children,
  isSelected,
}: {
  children: ReactNode;
  isSelected: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card w-[240px] shadow-sm transition-all",
        "hover:shadow-md",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-foreground/30",
      )}
    >
      {children}
    </div>
  );
}
