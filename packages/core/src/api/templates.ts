/**
 * Template catalog — what the editor's "template library" panel reads.
 *
 * `list()` is lightweight (catalog summaries; no full definition). `get()`
 * returns the full TemplateDefinition for the inspector. `implemented: false`
 * templates exist in the catalog but can't render yet — grey them out.
 */

import { api } from "./client.js";

export type TemplateSummary = {
  id: string;
  name: string;
  category: string;
  glyph: string;
  manicCompatible: boolean;
  implemented: boolean;
};

export type ParamSpec = {
  name: string;
  label: string;
  type: "string" | "number" | "color" | "enum" | "image" | "bool" | "duration" | "list";
  required: boolean;
  description?: string | null;
  default?: unknown;
  choices?: string[];
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
};

export type StepSpec = {
  primitive: string;
  bind: Record<string, unknown>;
  at: number;
  duration: number | string | null;
  label: string | null;
};

export type StyleModifier = {
  durationScale: number | null;
  addShake: boolean;
  captionSizeScale: number | null;
  cutStyle: "soft" | "hard" | null;
  extraSteps: StepSpec[];
  paletteOverride: Record<string, string> | null;
};

export type TemplateDetail = {
  id: string;
  version: string;
  name: string;
  category: string;
  glyph: string;
  manicCompatible: boolean;
  description: string | null;
  params: ParamSpec[];
  steps: StepSpec[];
  styleModifiers: Record<string, StyleModifier>;
  defaultDuration: number;
  defaultSize: [number, number];
  contentHash: string;
};

export const templatesApi = {
  list: () => api.get<TemplateSummary[]>("/api/v1/templates"),
  get: (templateId: string) =>
    api.get<TemplateDetail>(`/api/v1/templates/${templateId}`),
};

/**
 * Human labels for backend category slugs.
 * Mirrors `app/common/enum/template.py::CATEGORY_LABELS` in the backend.
 * Keep in sync if either side adds a category.
 */
export const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  text_titles: "Text & titles",
  math_equations: "Math & equations",
  data_charts: "Data & charts",
  diagrams: "Diagrams",
  compare_contrast: "Compare & contrast",
  emphasis_reveals: "Emphasis & reveals",
  motion_geometry: "Motion & geometry",
  camera_transitions: "Camera & transitions",
  outros_ctas: "Outros & CTAs",
  media: "Media",
  reactions_shorts: "Reactions / shorts",
};

/** Display order — controls section order in the template library UI. */
export const TEMPLATE_CATEGORY_ORDER: string[] = [
  "text_titles",
  "math_equations",
  "data_charts",
  "diagrams",
  "compare_contrast",
  "emphasis_reveals",
  "motion_geometry",
  "camera_transitions",
  "outros_ctas",
  "media",
  "reactions_shorts",
];
