/**
 * Template catalog — STUBBED.
 *
 * The 127-template catalog has been demoted in the backend: templates are now
 * an "effect preset" applied per-clip in the workflow editor, NOT the primary
 * planning surface. The backend's `/api/v1/templates*` endpoints were removed
 * in the MVP-shape refactor. This file keeps the types + a no-op `templatesApi`
 * so any FE imports keep type-checking; `list()` resolves to an empty array
 * so any "template library" UI greys out cleanly.
 *
 * When templates come back as a per-clip effect dropdown, restore the original
 * `api.get<TemplateSummary[]>("/api/v1/effect-presets")` shape here.
 */

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
  list: async (): Promise<TemplateSummary[]> => [],
  get: async (_templateId: string): Promise<TemplateDetail> => {
    throw new Error(
      "templatesApi.get: backend /api/v1/templates endpoints have been removed. " +
        "Templates are now effect presets; see TODO in core/api/templates.ts.",
    );
  },
};

/** Human labels — kept around in case a future FE iteration needs them. */
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
