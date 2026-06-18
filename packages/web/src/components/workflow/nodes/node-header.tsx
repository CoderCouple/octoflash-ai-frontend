/**
 * NodeHeader — top strip of a custom node. Icon + label + dropdown with
 * Run / Retry / Delete actions. Carries the `.drag-handle` class so React
 * Flow lets the user drag the whole card by this strip.
 *
 * Run / Retry route through useWorkflowRunner() (context populated by
 * FlowEditor). Backend coalesces identical clicks while a prior run is
 * in-flight; a closed prior run lets the same id be reused, so "Retry
 * after failure" is just "Run" again.
 */

import { Loader2, MoreVertical, Play, RefreshCw, Trash } from "lucide-react";
import { useReactFlow } from "@xyflow/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskRegistry } from "@/workflow-engine/task-registry";
import { type TaskType } from "@/workflow-engine/types";

import { useWorkflowRunner } from "../workflow-runner-context";

export function NodeHeader({
  taskType,
  nodeId,
}: {
  taskType: TaskType;
  nodeId: string;
}) {
  const task = TaskRegistry[taskType];
  const Icon = task.icon;
  const { setNodes, setEdges } = useReactFlow();
  const { runNode, runByNode, workflowId } = useWorkflowRunner();
  const runStatus = runByNode[nodeId] ?? { state: "idle" as const };

  const isRunning = runStatus.state === "running";
  const isFailed = runStatus.state === "failed";
  const isCompleted = runStatus.state === "completed";
  const canRun = Boolean(workflowId) && !isRunning;

  const onRun = async () => {
    if (!canRun) return;
    try {
      await runNode(nodeId);
    } catch (err) {
      console.error("[NodeHeader] run failed:", err);
    }
  };

  const onDelete = () => {
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
  };

  const RunIcon = isRunning ? Loader2 : isFailed ? RefreshCw : Play;
  const runLabel = isRunning ? "Running…" : isFailed ? "Retry" : isCompleted ? "Re-run" : "Run";

  return (
    <div className="drag-handle flex items-center gap-2 cursor-grab active:cursor-grabbing rounded-t-lg border-b bg-muted/30 px-2.5 py-1.5">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="text-[12px] font-medium leading-tight truncate flex-1">
        {task.label}
      </span>
      {/* Inline status indicator: spinner while running, red dot on failure. */}
      {isRunning && (
        <Loader2
          className="size-3 text-primary animate-spin"
          aria-label="Running"
        />
      )}
      {isFailed && (
        <span
          className="size-2 rounded-full bg-destructive"
          aria-label="Failed"
          title={`Failed: ${runStatus.message ?? "unknown"}`}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            aria-label="Node actions"
          >
            <MoreVertical className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canRun}
            onSelect={onRun}
            className={isFailed ? "text-destructive focus:text-destructive" : undefined}
          >
            <RunIcon className={"size-3.5 mr-1.5" + (isRunning ? " animate-spin" : "")} />
            {runLabel}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDelete}
          >
            <Trash className="size-3.5 mr-1.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
