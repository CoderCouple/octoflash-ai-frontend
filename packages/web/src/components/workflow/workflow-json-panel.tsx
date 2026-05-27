/**
 * WorkflowJsonPanel — collapsible JSON viewer for the live React Flow store.
 *
 * Subscribes to the same `<ReactFlowProvider>` the canvas uses, so the JSON
 * always reflects the current state (drag a node → the JSON updates).
 *
 * Read-only by design. Editing the workflow goes through:
 *   * the canvas (drag / connect / delete) → debounced auto-save
 *   * the Import dialog (paste / file upload) — coming in the next commit
 *
 * Uses `@uiw/react-json-view` for tree-style display with click-to-collapse
 * nodes, dark/light theme support, and a built-in copy button per row.
 */

import { useMemo, useState } from "react";
import { Check, ChevronsDown, ChevronsUp, Copy, Download } from "lucide-react";
import { useEdges, useNodes, useReactFlow } from "@xyflow/react";
import JsonView from "@uiw/react-json-view";
import { vscodeTheme } from "@uiw/react-json-view/vscode";
import { lightTheme } from "@uiw/react-json-view/light";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";


type Theme = "vscode" | "light";


export type WorkflowDefinitionLike = {
  nodes?: unknown[];
  edges?: unknown[];
  viewport?: unknown;
};


export function WorkflowJsonPanel({
  filename = "workflow.json",
}: {
  filename?: string;
}) {
  const nodes = useNodes();
  const edges = useEdges();
  const rf = useReactFlow();
  const viewport = rf.getViewport();

  const definition: WorkflowDefinitionLike = useMemo(
    () => ({ nodes, edges, viewport }),
    // viewport tracked indirectly via re-render — `getViewport()` re-reads
    // on every render so panning the canvas doesn't go stale visually,
    // even though it's not in the dep array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, edges],
  );

  const pretty = useMemo(() => JSON.stringify(definition, null, 2), [definition]);

  const [copied, setCopied] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<number | false>(2);

  // Match the app theme by inspecting the document for the `dark` class.
  // Settles on the first render after mount; theme switches that happen
  // *after* this point require a remount of this panel (rare).
  const theme = useMemo<Theme>(() => {
    if (typeof document === "undefined") return "vscode";
    return document.documentElement.classList.contains("dark") ? "vscode" : "light";
  }, []);
  const themeStyle = theme === "vscode" ? vscodeTheme : lightTheme;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      toast.error("Couldn't copy", { description: (e as Error).message });
    }
  };

  const onDownload = () => {
    const blob = new Blob([pretty], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-9 items-center justify-between border-b px-2 gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Workflow JSON
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => setCollapsed(collapsed === false ? 1 : false)}
            title={collapsed === false ? "Collapse all" : "Expand all"}
          >
            {collapsed === false ? (
              <ChevronsUp className="size-3.5" />
            ) : (
              <ChevronsDown className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => void onCopy()}
            title="Copy JSON to clipboard"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onDownload}
            title="Download as .json"
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-2 text-[12px]">
        <JsonView
          value={definition as Record<string, unknown>}
          collapsed={collapsed}
          displayDataTypes={false}
          enableClipboard={true}
          style={themeStyle}
        />
      </div>
    </div>
  );
}
