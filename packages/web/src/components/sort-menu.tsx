/**
 * Shared sort dropdown for project / workflow list pages.
 *
 * Trigger is the radix DropdownMenuTrigger rendered directly (no `asChild`
 * around a custom Button — that pattern was misbehaving on the projects
 * page; the button rendered but its click didn't reach the Radix popper).
 * `buttonVariants` is composed in via className so the trigger still
 * inherits the shadcn button look.
 */

import { ArrowDownAZ, ArrowDownUp, ArrowDownZA, Calendar, Check, ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SortKey = "newest" | "oldest" | "title-az" | "title-za";

const OPTS: { key: SortKey; label: string; icon: typeof Calendar }[] = [
  { key: "newest",   label: "Newest first", icon: Calendar },
  { key: "oldest",   label: "Oldest first", icon: Calendar },
  { key: "title-az", label: "Title A → Z",  icon: ArrowDownAZ },
  { key: "title-za", label: "Title Z → A",  icon: ArrowDownZA },
];

export function SortMenu({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  const active = OPTS.find((o) => o.key === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 text-xs shrink-0",
        )}
      >
        <ArrowDownUp className="size-3.5 mr-1.5" />
        {active?.label ?? "Sort"}
        <ChevronDown className="size-3 ml-1.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="z-50 min-w-[180px]">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTS.map((opt) => {
          const Icon = opt.icon;
          const isActive = opt.key === value;
          return (
            <DropdownMenuItem key={opt.key} onSelect={() => onChange(opt.key)}>
              <Icon className="size-3.5 mr-2" />
              <span className="flex-1">{opt.label}</span>
              {isActive && <Check className="size-3.5 text-foreground" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Shared sort applied by SortKey. Works on any row that has `title` +
 * `createdAt` (string). */
export function applySort<T extends { title: string; createdAt: string }>(
  rows: T[],
  key: SortKey,
): T[] {
  const copy = [...rows];
  switch (key) {
    case "newest":
      return copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case "oldest":
      return copy.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    case "title-az":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "title-za":
      return copy.sort((a, b) => b.title.localeCompare(a.title));
  }
}
