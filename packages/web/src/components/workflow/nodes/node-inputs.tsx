/**
 * NodeInputs — left-side rail of input handles + param fields.
 *
 * Each row renders:
 *   • A small handle dot on the left (so the node can receive a connection
 *     into this specific input from a peer's matching output).
 *   • A label + param renderer (text input, textarea, select) on the right.
 *
 * SOURCE / CLIP-typed params expose only a handle (no field) since they're
 * filled by an upstream connection. STRING / SELECT params expose a field
 * since they're user-supplied.
 */

import { Handle, Position } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { PARAM_COLOR } from "@/workflow-engine/task-registry";
import {
  TaskParamType,
  type AppNodeData,
  type TaskParam,
} from "@/workflow-engine/types";

import { SelectParam } from "./params/select-param";
import { StringParam } from "./params/string-param";

export function NodeInputs({
  nodeId,
  data,
  inputs,
}: {
  nodeId: string;
  data: AppNodeData;
  inputs: TaskParam[];
}) {
  if (inputs.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 p-2.5 border-b">
      {inputs.map((input) => (
        <NodeInputRow
          key={input.name}
          nodeId={nodeId}
          input={input}
          value={data.inputs[input.name] ?? ""}
        />
      ))}
    </div>
  );
}

function NodeInputRow({
  nodeId,
  input,
  value,
}: {
  nodeId: string;
  input: TaskParam;
  value: string;
}) {
  const colour = PARAM_COLOR[input.type];
  const handleColour = colour;
  // SOURCE/CLIP inputs are connection-only — no editable field, just the handle.
  const isConnectionOnly =
    input.type === TaskParamType.SOURCE || input.type === TaskParamType.CLIP;

  return (
    <div className="relative">
      <Handle
        id={input.name}
        type="target"
        position={Position.Left}
        style={{ background: handleColour, width: 10, height: 10, border: "none" }}
        className="!-left-[5px]"
      />
      <div className="ml-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {input.name}
          </span>
          {input.required && (
            <span className="text-[10px] text-destructive/80" title="Required">
              *
            </span>
          )}
          {isConnectionOnly && (
            <span
              className={cn(
                "text-[9px] px-1 py-0 rounded font-medium",
                "bg-muted text-muted-foreground/80",
              )}
              title={`Connect from a ${input.type} output`}
            >
              {input.type}
            </span>
          )}
        </div>
        {!isConnectionOnly && input.type === TaskParamType.STRING && (
          <StringParam
            nodeId={nodeId}
            param={input}
            value={value}
            multiline={input.name === "text"}
          />
        )}
        {!isConnectionOnly && input.type === TaskParamType.SELECT && (
          <SelectParam nodeId={nodeId} param={input} value={value} />
        )}
      </div>
    </div>
  );
}
