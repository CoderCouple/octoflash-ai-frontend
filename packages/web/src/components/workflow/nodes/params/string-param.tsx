/**
 * StringParam — text/textarea param renderer.
 *
 * Long fields (helperText hinting "URL" / "describe …") use a textarea so
 * the user can see what they've typed. Short fields use a single-line input.
 */

import { useReactFlow } from "@xyflow/react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type AppNodeData, type TaskParam } from "@/workflow-engine/types";

export function StringParam({
  nodeId,
  param,
  value,
  multiline = false,
}: {
  nodeId: string;
  param: TaskParam;
  value: string;
  multiline?: boolean;
}) {
  const { updateNodeData } = useReactFlow();

  const persist = (next: string) => {
    updateNodeData(nodeId, (node) => {
      const data = (node.data as AppNodeData) ?? { type: "scene", inputs: {} };
      return {
        ...data,
        inputs: { ...data.inputs, [param.name]: next },
      } satisfies AppNodeData;
    });
  };

  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={(e) => persist(e.target.value)}
        placeholder={param.helperText ?? param.name}
        rows={3}
        className="text-[11px] font-mono"
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={(e) => persist(e.target.value)}
      placeholder={param.helperText ?? param.name}
      className="h-7 text-[11px]"
    />
  );
}
