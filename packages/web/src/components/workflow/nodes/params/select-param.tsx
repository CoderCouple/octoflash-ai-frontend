/**
 * SelectParam — native <select> for enum-shaped params (e.g. target.platform).
 *
 * Kept native rather than wrapping a shadcn Select to avoid the dropdown
 * accidentally being treated as a drag affordance by React Flow.
 */

import { useReactFlow } from "@xyflow/react";

import { type AppNodeData, type TaskParam } from "@/workflow-engine/types";

export function SelectParam({
  nodeId,
  param,
  value,
}: {
  nodeId: string;
  param: TaskParam;
  value: string;
}) {
  const { updateNodeData } = useReactFlow();
  const options = param.options ?? [];

  return (
    <select
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        updateNodeData(nodeId, (node) => {
          const data = (node.data as AppNodeData) ?? { type: "scene", inputs: {} };
          return {
            ...data,
            inputs: { ...data.inputs, [param.name]: next },
          } satisfies AppNodeData;
        });
      }}
      className="h-7 w-full rounded-md border bg-background px-2 text-[11px]"
    >
      <option value="">{param.helperText ?? `Select ${param.name}…`}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
