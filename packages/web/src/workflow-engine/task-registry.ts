/**
 * Task registry — the source of truth for what each node type renders +
 * what handles it exposes.
 *
 * Mirrors the `workflow_node_type` rows seeded in the backend. The renderer
 * (NodeComponent) and palette (NodePalette) both read from this — adding a
 * 5th type is: insert into workflow_node_type → add a TaskType key here →
 * add the entry to TaskRegistry.
 *
 * Type chain we model:
 *   source_url   ┐
 *   source_text  ├─[source]─► analyze ─[brief]─► scene ─[clip]─► scene ─[clip]─► target
 *                ┘             (1+ inputs)        (brief or prev)
 */

import { Brain, FileText, Globe, Send, Video } from "lucide-react";

import {
  TaskParamType,
  TaskType,
  type TaskDefinition,
} from "./types";

export const TaskRegistry: Record<TaskType, TaskDefinition> = {
  [TaskType.SOURCE_URL]: {
    type: TaskType.SOURCE_URL,
    label: "Source: URL",
    description:
      "Pull source content from a YouTube short, Medium article, or Substack post.",
    icon: Globe,
    group: "Source",
    isEntryPoint: true,
    inputs: [
      {
        name: "url",
        type: TaskParamType.STRING,
        required: true,
        helperText: "YouTube / Medium / Substack URL",
      },
    ],
    outputs: [{ name: "source", type: TaskParamType.SOURCE }],
  },
  [TaskType.SOURCE_TEXT]: {
    type: TaskType.SOURCE_TEXT,
    label: "Source: Text",
    description: "Start from a free-form text description of the video you want.",
    icon: FileText,
    group: "Source",
    isEntryPoint: true,
    inputs: [
      {
        name: "text",
        type: TaskParamType.STRING,
        required: true,
        helperText: "Describe the video content + style",
      },
    ],
    outputs: [{ name: "source", type: TaskParamType.SOURCE }],
  },
  [TaskType.ANALYZE]: {
    type: TaskType.ANALYZE,
    label: "Analyze",
    description:
      "Pull together one or more sources into a unified brief (transcript + visual + manim prompt) the scene chain plans from.",
    icon: Brain,
    group: "Process",
    isEntryPoint: false,
    inputs: [
      // React Flow allows multiple incoming edges into the same handle by
      // default — multiple sources fan into this single SOURCE input.
      { name: "source", type: TaskParamType.SOURCE, required: true },
    ],
    outputs: [{ name: "brief", type: TaskParamType.BRIEF }],
  },
  [TaskType.SCENE]: {
    type: TaskType.SCENE,
    label: "Scene",
    description:
      "A Manim-rendered clip with optional voiceover. Connect from analyze (first scene) or another scene (chained sequence).",
    icon: Video,
    group: "Process",
    isEntryPoint: false,
    inputs: [
      // First scene in the chain receives the analyzed brief.
      { name: "brief", type: TaskParamType.BRIEF },
      // Subsequent scenes receive the previous scene's clip (for continuity / order).
      { name: "prev", type: TaskParamType.CLIP },
      {
        name: "prompt",
        type: TaskParamType.STRING,
        helperText: "Creative direction for this clip (optional override)",
      },
    ],
    outputs: [{ name: "clip", type: TaskParamType.CLIP }],
  },
  [TaskType.TARGET]: {
    type: TaskType.TARGET,
    label: "Target",
    description:
      "Publish the final stitched video to a connected destination (YouTube / TikTok / Instagram).",
    icon: Send,
    group: "Target",
    isEntryPoint: false,
    inputs: [
      { name: "clip", type: TaskParamType.CLIP, required: true },
      {
        name: "platform",
        type: TaskParamType.SELECT,
        required: true,
        options: [
          { label: "YouTube", value: "youtube" },
          { label: "TikTok", value: "tiktok" },
          { label: "Instagram", value: "instagram" },
        ],
      },
    ],
    outputs: [],
  },
};

/** Convenience: colour swatch for a handle, keyed by TaskParamType. */
export const PARAM_COLOR: Record<TaskParamType, string> = {
  string: "#94a3b8",   // slate-400 — plain text
  select: "#94a3b8",
  source: "#a78bfa",   // violet-400 — raw source material
  brief: "#f59e0b",    // amber-500 — analyzed brief
  clip: "#34d399",     // emerald-400 — rendered clip
};
