/**
 * Workflow Import / Export buttons + dialog.
 *
 * Export: reads the current React Flow store via useReactFlow() →
 * downloads `workflow-<title>.json`. Includes any unsaved edits.
 *
 * Import: dialog with two input modes:
 *   * File picker (`.json`)
 *   * Textarea paste
 *
 * Both run through `validateDefinition()` before touching the canvas.
 * On Apply: `setNodes` / `setEdges` / `setViewport` against the shared
 * store; the existing 800ms debounced save in FlowEditor flushes the
 * change to the backend.
 *
 * No backend changes needed.
 */

import { useRef, useState } from "react";
import { Download, FileJson, Loader2, Upload } from "lucide-react";
import { useEdges, useNodes, useReactFlow, type Edge, type Node } from "@xyflow/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";


type Definition = {
  nodes: unknown[];
  edges: unknown[];
  viewport?: { x: number; y: number; zoom: number };
};


export function WorkflowExportButton({ filename = "workflow.json" }: { filename?: string }) {
  const nodes = useNodes();
  const edges = useEdges();
  const rf = useReactFlow();

  const onExport = () => {
    const definition = {
      nodes,
      edges,
      viewport: rf.getViewport(),
    };
    const blob = new Blob([JSON.stringify(definition, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Workflow exported", { description: filename });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7"
      onClick={onExport}
      title="Download workflow as JSON"
    >
      <Download className="size-3.5 mr-1" />
      Export
    </Button>
  );
}


export function WorkflowImportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7"
        onClick={() => setOpen(true)}
        title="Replace the workflow with imported JSON"
      >
        <Upload className="size-3.5 mr-1" />
        Import
      </Button>
      <WorkflowImportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}


function WorkflowImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const rf = useReactFlow();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setText("");
    setError(null);
    setSubmitting(false);
  };

  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const t = await f.text();
      setText(t);
      setError(null);
    } catch (err) {
      setError(`Couldn't read file: ${(err as Error).message}`);
    } finally {
      // Reset so the same file can be re-chosen if needed.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onApply = () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError(`JSON parse error: ${(e as Error).message}`);
      return;
    }
    const v = validateDefinition(parsed);
    if (!v.ok) {
      setError(v.message);
      return;
    }
    setSubmitting(true);
    // Apply to the shared React Flow store. FlowEditor's debounced save
    // will PUT this to /api/v1/workflows/{id} ~800ms later.
    rf.setNodes(v.def.nodes as Node[]);
    rf.setEdges(v.def.edges as Edge[]);
    if (v.def.viewport) rf.setViewport(v.def.viewport);
    toast.success("Workflow imported", {
      description: `${v.def.nodes.length} nodes · ${v.def.edges.length} edges`,
    });
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import workflow</DialogTitle>
          <DialogDescription>
            Paste a workflow definition JSON or pick a `.json` file. Replaces
            the current canvas. The next auto-save (~800 ms) syncs to the
            server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson className="size-3.5 mr-1.5" />
              Choose .json file
            </Button>
            <span className="text-[11px] text-muted-foreground">
              or paste below
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onFileChosen}
            />
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            spellCheck={false}
            placeholder='{ "nodes": [...], "edges": [...], "viewport": {...} }'
            className="font-mono text-[11.5px] leading-[1.5]"
          />

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11.5px] text-destructive font-mono whitespace-pre-wrap">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={onApply} disabled={!text.trim() || submitting}>
            {submitting ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="size-3.5 mr-1.5" />
            )}
            Replace canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


type ValidationResult =
  | { ok: true; def: Definition }
  | { ok: false; message: string };


/**
 * Validates a parsed JSON object as a workflow definition. Enough to
 * reject obvious typos before touching the React Flow store — but
 * doesn't check `data.type` against the TaskRegistry (rogue node types
 * render as "Unknown node type" placeholders, not a crash).
 */
function validateDefinition(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "Top-level must be an object." };
  }
  const obj = input as Record<string, unknown>;
  const nodes = obj.nodes;
  const edges = obj.edges ?? [];
  if (!Array.isArray(nodes)) {
    return { ok: false, message: "Missing or non-array `nodes`." };
  }
  if (!Array.isArray(edges)) {
    return { ok: false, message: "`edges` must be an array if present." };
  }
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i] as Record<string, unknown> | undefined;
    if (!n || typeof n !== "object") {
      return { ok: false, message: `nodes[${i}] is not an object.` };
    }
    if (typeof n.id !== "string") {
      return { ok: false, message: `nodes[${i}].id must be a string.` };
    }
    const pos = n.position as Record<string, unknown> | undefined;
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
      return { ok: false, message: `nodes[${i}].position.x/y must be numbers.` };
    }
  }
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i] as Record<string, unknown> | undefined;
    if (!e || typeof e !== "object") {
      return { ok: false, message: `edges[${i}] is not an object.` };
    }
    if (
      typeof e.id !== "string" ||
      typeof e.source !== "string" ||
      typeof e.target !== "string"
    ) {
      return { ok: false, message: `edges[${i}] needs string id/source/target.` };
    }
  }
  return {
    ok: true,
    def: {
      nodes,
      edges,
      viewport:
        obj.viewport &&
        typeof obj.viewport === "object" &&
        "x" in obj.viewport
          ? (obj.viewport as { x: number; y: number; zoom: number })
          : undefined,
    },
  };
}
