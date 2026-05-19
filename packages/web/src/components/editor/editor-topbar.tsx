
import { ChevronRight, Download, Eye, GitBranch, Layers, PanelLeft, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatTime } from "@octoflash/core";

export type Scope = "scene" | "full";
export type EditorMode = "timeline" | "workflow";

export function EditorTopbar({
  title,
  onChangeTitle,
  sceneCount,
  total,
  scope,
  onChangeScope,
  mode,
  onChangeMode,
  onToggleSidebar,
}: {
  title: string;
  onChangeTitle: (v: string) => void;
  sceneCount: number;
  total: number;
  scope: Scope;
  onChangeScope: (s: Scope) => void;
  mode: EditorMode;
  onChangeMode: (m: EditorMode) => void;
  onToggleSidebar?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 h-10 px-3.5 border-b bg-background shrink-0">
      <Button variant="ghost" size="icon" className="size-7" onClick={onToggleSidebar}>
        <PanelLeft className="size-3.5" />
      </Button>

      <div className="flex items-center gap-1.5 min-w-0 text-xs">
        <span className="text-muted-foreground">Editor</span>
        <ChevronRight className="size-3 text-muted-foreground" />
        <input
          className="bg-transparent border border-transparent hover:bg-muted/60 focus:bg-background focus:border-border outline-none rounded px-2 py-1 text-[13px] font-medium min-w-0 max-w-[320px] -ml-1"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
        />
        <Badge variant="secondary" className="text-[10px] h-[18px] px-1.5 font-normal">
          {sceneCount} scenes · {formatTime(total)}
        </Badge>
        <span className="text-[10px] font-mono text-muted-foreground">saved 12s ago</span>
      </div>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="size-7"><Undo2 className="size-3.5" /></Button>
      <Button variant="ghost" size="icon" className="size-7"><Redo2 className="size-3.5" /></Button>
      <Separator orientation="vertical" className="h-4" />

      <ModeToggle value={mode} onChange={onChangeMode} />
      <Separator orientation="vertical" className="h-4" />

      {mode === "timeline" && <Segmented value={scope} onChange={onChangeScope} />}

      <Separator orientation="vertical" className="h-4" />
      <Button variant="ghost" size="sm" className="h-7"><Eye className="size-3.5 mr-1.5" />Preview</Button>
      <Button size="sm" className="h-7"><Download className="size-3.5 mr-1.5" />Export</Button>
    </div>
  );
}

function ModeToggle({ value, onChange }: { value: EditorMode; onChange: (v: EditorMode) => void }) {
  const items: { v: EditorMode; l: string; icon: React.ReactNode }[] = [
    { v: "timeline", l: "Timeline", icon: <Layers className="size-3" /> },
    { v: "workflow", l: "Workflow", icon: <GitBranch className="size-3" /> },
  ];
  return (
    <div className="inline-flex gap-px p-0.5 bg-muted rounded-md" title="Editor mode">
      {items.map((it) => (
        <button
          key={it.v}
          type="button"
          onClick={() => onChange(it.v)}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-[3px] rounded text-[11.5px] font-medium transition-colors",
            value === it.v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {it.icon}
          {it.l}
        </button>
      ))}
    </div>
  );
}

function Segmented({
  value,
  onChange,
}: {
  value: Scope;
  onChange: (v: Scope) => void;
}) {
  return (
    <div className="inline-flex gap-px p-0.5 bg-muted rounded-md">
      {(["scene", "full"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "px-2.5 py-[3px] rounded text-[11.5px] font-medium transition-colors",
            value === v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {v === "scene" ? "This scene" : "Full video"}
        </button>
      ))}
    </div>
  );
}
