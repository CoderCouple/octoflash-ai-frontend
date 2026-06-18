/**
 * CreateFlowNode — builds a new AppNode of the requested TaskType at a
 * canvas position. Used by the FlowEditor onDrop handler when the user
 * drags a palette card onto the canvas.
 *
 * IDs use the backend's `wni_<uuid>` convention so a future save round
 * doesn't need to remap. `dragHandle` matches the CSS selector on NodeCard
 * so only the header drags, not parameter inputs.
 */

import { TaskType, type AppNode } from "./types";

export function createFlowNode(
  taskType: TaskType,
  position?: { x: number; y: number },
): AppNode {
  return {
    id: `wni_${crypto.randomUUID()}`,
    type: "OctoflashNode",
    dragHandle: ".drag-handle",
    position: position ?? { x: 0, y: 0 },
    data: {
      type: taskType,
      inputs: {},
    },
  };
}
