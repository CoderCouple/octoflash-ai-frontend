/**
 * Workflow-engine types — ported and adapted from context0's `types/task.ts`
 * + `types/app-node.ts` + `types/workflow-type.ts`.
 *
 * `TaskType` machine keys MATCH the rows seeded in the backend's
 * `workflow_node_type` table by sql/schema/0001_octoflash_schema.sql. Add a
 * new type here when you add a row there (the loader matches by string key).
 *
 * `TaskParamType` is a small typed-handle vocabulary used to colour the
 * handle dots and (later) validate connections so a `clip` output only
 * plugs into a `clip` input.
 */

import type { LucideIcon } from "lucide-react";

// ─── enums ──────────────────────────────────────────────────────────────────

export const TaskType = {
  SOURCE_URL: "source_url",
  SOURCE_TEXT: "source_text",
  ANALYZE: "analyze",
  SCENE: "scene",
  TARGET: "target",
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const TaskParamType = {
  STRING: "string",
  SELECT: "select",
  /** Raw source material output by source_url / source_text nodes. */
  SOURCE: "source",
  /** Analyzed brief (transcript + description + manim_prompt) — output of `analyze`,
   *  feeds the first scene in the chain. */
  BRIEF: "brief",
  /** A rendered scene MP4 — output of scene, feeds the next scene or target. */
  CLIP: "clip",
} as const;

export type TaskParamType = (typeof TaskParamType)[keyof typeof TaskParamType];

// ─── param + i/o shapes ─────────────────────────────────────────────────────

export type TaskParamOption = { label: string; value: string };

export type TaskParam = {
  name: string;
  type: TaskParamType;
  required?: boolean;
  helperText?: string;
  /** SELECT-only: dropdown options. */
  options?: TaskParamOption[];
};

// ─── task registry entry ────────────────────────────────────────────────────

export type TaskGroup = "Source" | "Process" | "Target";

export type TaskDefinition = {
  type: TaskType;
  label: string;
  description: string;
  icon: LucideIcon;
  group: TaskGroup;
  /** Whether this node sits at the start of a chain (no inputs allowed). */
  isEntryPoint: boolean;
  inputs: TaskParam[];
  outputs: TaskParam[];
};

// ─── React Flow node shape ──────────────────────────────────────────────────

export type AppNodeData = {
  type: TaskType;
  /** Per-instance values for the inputs declared in the TaskRegistry. */
  inputs: Record<string, string>;
};

export type AppNode = {
  id: string;
  type: "OctoflashNode";
  position: { x: number; y: number };
  data: AppNodeData;
  dragHandle?: string;
  width?: number;
  height?: number;
};

// ─── React Flow definition (mirrors workflow.definition JSONB) ──────────────

export type FlowViewport = { x: number; y: number; zoom: number };

export type FlowDefinition = {
  nodes: AppNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string;
    animated?: boolean;
  }>;
  viewport?: FlowViewport;
};
