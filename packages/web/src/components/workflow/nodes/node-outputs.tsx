/**
 * NodeOutputs — right-side rail of output handles.
 *
 * Each row renders a label + a coloured handle dot on the right. No fields:
 * outputs are produced by the node, not configured by the user.
 */

import { Handle, Position } from "@xyflow/react";

import { PARAM_COLOR } from "@/workflow-engine/task-registry";
import { type TaskParam } from "@/workflow-engine/types";

export function NodeOutputs({ outputs }: { outputs: TaskParam[] }) {
  if (outputs.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 p-2.5">
      {outputs.map((output) => (
        <NodeOutputRow key={output.name} output={output} />
      ))}
    </div>
  );
}

function NodeOutputRow({ output }: { output: TaskParam }) {
  const colour = PARAM_COLOR[output.type];
  return (
    <div className="relative flex items-center justify-end gap-1.5 pr-3">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {output.name}
      </span>
      <span
        className="text-[9px] px-1 py-0 rounded font-medium bg-muted text-muted-foreground/80"
        title={output.type}
      >
        {output.type}
      </span>
      <Handle
        id={output.name}
        type="source"
        position={Position.Right}
        style={{ background: colour, width: 10, height: 10, border: "none" }}
        className="!-right-[5px]"
      />
    </div>
  );
}
