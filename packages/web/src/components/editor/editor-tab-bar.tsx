
import { Code, Eye, File as FileIcon, Maximize2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Scene } from "@octoflash/core";

export type EditorTab = "preview" | "prompt" | "code";

const TAB_META: Record<EditorTab, { label: (s: Scene) => string; icon: React.ReactNode; dirty?: boolean }> = {
  preview: { label: (s) => `s${s.n} · preview`,    icon: <Eye className="size-3" /> },
  prompt:  { label: (s) => `s${s.n} · prompt.txt`, icon: <FileIcon className="size-3" />, dirty: true },
  code:    { label: (s) => `s${s.n} · scene.py`,   icon: <Code className="size-3" /> },
};

export function EditorTabBar({
  scene,
  tabs,
  active,
  onSelect,
  onClose,
}: {
  scene: Scene;
  tabs: EditorTab[];
  active: EditorTab;
  onSelect: (t: EditorTab) => void;
  onClose: (t: EditorTab) => void;
}) {
  return (
    <div className="flex items-stretch h-[34px] bg-muted/35 border-b shrink-0">
      {tabs.map((id) => {
        const isActive = id === active;
        const meta = TAB_META[id];
        return (
          <div
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 pl-3 pr-2 h-full border-r text-xs cursor-pointer group",
              isActive
                ? "text-foreground bg-background"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {isActive && <span className="absolute top-0 left-0 right-0 h-[1.5px] bg-foreground" />}
            <span className="text-primary inline-flex">{meta.icon}</span>
            <span>{meta.label(scene)}</span>
            {meta.dirty && <span className="size-1.5 rounded-full bg-muted-foreground" />}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(id);
              }}
              className={cn(
                "size-3.5 rounded-sm inline-flex items-center justify-center transition-opacity",
                isActive ? "opacity-80 hover:bg-muted" : "opacity-0 group-hover:opacity-80 hover:bg-muted"
              )}
            >
              <X className="size-2.5" />
            </button>
          </div>
        );
      })}
      <div className="ml-auto flex items-center gap-0.5 px-2">
        <Button variant="ghost" size="icon" className="size-6">
          <Plus className="size-3" />
        </Button>
        <Separator orientation="vertical" className="h-3.5" />
        <Button variant="ghost" size="icon" className="size-6">
          <Maximize2 className="size-3" />
        </Button>
      </div>
    </div>
  );
}
