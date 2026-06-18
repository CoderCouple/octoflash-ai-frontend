/**
 * NodeComponent — the React Flow custom node renderer.
 *
 * Reads the node's TaskType, looks up the TaskRegistry definition, then
 * composes the standard layout: header (with delete button) + inputs rail
 * (left handles + param fields) + outputs rail (right handles).
 *
 * Registered once in FlowEditor under `nodeTypes = { OctoflashNode: NodeComponent }`.
 */

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";

import { TaskRegistry } from "@/workflow-engine/task-registry";
import { type AppNodeData } from "@/workflow-engine/types";

import { NodeCard } from "./node-card";
import { NodeHeader } from "./node-header";
import { NodeInputs } from "./node-inputs";
import { NodeOutputs } from "./node-outputs";

export const NodeComponent = memo((props: NodeProps) => {
  const data = props.data as AppNodeData;
  const task = TaskRegistry[data.type];

  if (!task) {
    // Defensive: registry might be out of date if someone removes a TaskType
    // before scrubbing the saved definition. Render a placeholder.
    return (
      <NodeCard isSelected={!!props.selected}>
        <div className="p-3 text-[11px] text-destructive">
          Unknown node type: {String(data.type)}
        </div>
      </NodeCard>
    );
  }

  return (
    <div className="group">
      <NodeCard isSelected={!!props.selected}>
        <NodeHeader taskType={data.type} nodeId={props.id} />
        <NodeInputs nodeId={props.id} data={data} inputs={task.inputs} />
        <NodeOutputs outputs={task.outputs} />
      </NodeCard>
    </div>
  );
});

NodeComponent.displayName = "NodeComponent";
