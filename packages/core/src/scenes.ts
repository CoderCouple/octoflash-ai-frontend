// Scene + template data and types for the Manim scene editor.
// Single source of truth for the editor module. In production this is
// replaced by the React Query layer hitting FastAPI:
//
//   GET    /projects/{id}
//   POST   /scenes/{id}/variations
//   PATCH  /scenes/{id}/select-variation
//   POST   /variations/{id}/render
//
// Mirrors the octonote module layout: data types live in `lib/`,
// presentational components in `components/editor/`.

export type SceneKind = "title" | "grid" | "warp" | "orbit";
export type SceneStatus = "ready" | "generating" | "failed" | "queued";

export type TemplateId =
  // Text & titles
  | "title_reveal"
  | "text_pop"
  | "subtitle_stack"
  | "typewriter"
  | "big_quote"
  | "glitch_text"
  // Math & equations
  | "equation_morph"
  | "equation_derive"
  | "formula_explain"
  | "proof_steps"
  // Data & charts
  | "chart_growth"
  | "chart_compare"
  | "line_reveal"
  | "pie_breakdown"
  | "stat_punch"
  | "timeline_horizontal"
  // Diagrams
  | "diagram_build"
  | "flow_diagram"
  | "venn_diagram"
  | "tree_diagram"
  // Compare & contrast
  | "split_comparison"
  | "before_after"
  | "this_vs_that"
  | "pros_cons"
  | "four_quadrants"
  // Emphasis & reveals
  | "callout_zoom"
  | "bullet_burst"
  | "numbered_steps"
  | "spotlight"
  | "circle_underline"
  // Motion & geometry
  | "shape_morph"
  | "wave_animation"
  // Outros
  | "countdown"
  | "cta_card"
  | "subscribe_smash"
  // Media
  | "image_annotated";

export type StyleId =
  | "editorial"
  | "manic"
  | "classic_3b1b"
  | "kurzgesagt"
  | "whiteboard"
  | "neon"
  | "mono";

export type Scene = {
  id: string;
  n: number;
  title: string;
  /** Absolute start time (seconds) in the stitched video. */
  start: number;
  /** Duration in seconds. */
  duration: number;
  bg: string;
  accent: string;
  kind: SceneKind;
  template: TemplateId;
  style: StyleId;
  /** 0..1 — drives the manic-ness presets. */
  motion: number;
  status: SceneStatus;
  /** Which variation index is currently selected (0..3). */
  selectedVariation: number;
  /** Main text rendered in this scene. */
  mainText: string;
  /** Free-text prompt sent to the planner for this scene. */
  prompt: string;
};

export const SCENES: Scene[] = [
  {
    id: "s1", n: 1, title: "Title reveal",
    start: 0, duration: 3,
    bg: "#0b0e2a", accent: "#a78bfa",
    kind: "title", template: "title_reveal", style: "editorial",
    motion: 0.4, status: "ready", selectedVariation: 1,
    mainText: "How black holes warp time",
    prompt:
      "Reveal the title in a cool blue→violet gradient on a deep navy field. Hold for 1.0s, then ease up and shrink toward the top safe area.",
  },
  {
    id: "s2", n: 2, title: "Diagram build",
    start: 3, duration: 11,
    bg: "#1e1b4b", accent: "#a78bfa",
    kind: "grid", template: "diagram_build", style: "editorial",
    motion: 0.6, status: "ready", selectedVariation: 0,
    mainText: "A spacetime grid",
    prompt:
      "Stroke on a 14 × 8 number plane in white at 40 % opacity with staggered build-in. Annotate the axes with thin monospace ticks.",
  },
  {
    id: "s3", n: 3, title: "Show exponential growth",
    start: 14, duration: 18,
    bg: "#312e81", accent: "#fbbf24",
    kind: "warp", template: "callout_zoom", style: "manic",
    motion: 0.85, status: "ready", selectedVariation: 2,
    mainText: "Time bends here",
    prompt:
      'Drop a single bright mass dot at the origin and warp the grid radially inward with a smooth ease over 2.6s. Punch-zoom on the dot at 1.4s. Annotate "event horizon" with a thin dashed circle at radius 1.4.',
  },
  {
    id: "s4", n: 4, title: "Split comparison",
    start: 32, duration: 23,
    bg: "#581c87", accent: "#f0abfc",
    kind: "orbit", template: "split_comparison", style: "editorial",
    motion: 0.5, status: "generating", selectedVariation: 0,
    mainText: "Two clocks. One slows.",
    prompt:
      'Two clocks side-by-side: one far from the mass, one near the horizon. Tick rate of the inner clock visibly slows while the outer one keeps Earth-time. End on the caption "time slows in the well."',
  },
];

export type Template = {
  id: TemplateId;
  label: string;
  hint: string;
  category: TemplateCategoryId;
  /** Pairs especially well with the "manic" style preset. */
  manic?: boolean;
};

export type TemplateCategoryId =
  | "text"
  | "math"
  | "data"
  | "diagram"
  | "compare"
  | "emphasis"
  | "motion"
  | "outro"
  | "media";

export const TEMPLATE_CATEGORIES: { id: TemplateCategoryId; label: string }[] = [
  { id: "text",     label: "Text & titles" },
  { id: "math",     label: "Math & equations" },
  { id: "data",     label: "Data & charts" },
  { id: "diagram",  label: "Diagrams" },
  { id: "compare",  label: "Compare & contrast" },
  { id: "emphasis", label: "Emphasis & reveals" },
  { id: "motion",   label: "Motion & geometry" },
  { id: "outro",    label: "Outros & CTAs" },
  { id: "media",    label: "Media" },
];

export const TEMPLATES: Template[] = [
  // Text & titles
  { id: "title_reveal",        label: "Title reveal",      hint: "Single line, fades up + holds",         category: "text" },
  { id: "text_pop",            label: "Text pop",          hint: "Punch in, micro-shake, hold",            category: "text", manic: true },
  { id: "subtitle_stack",      label: "Subtitle stack",    hint: "Title above, subtitle slides in below",  category: "text" },
  { id: "typewriter",          label: "Typewriter",        hint: "Types one character at a time",          category: "text" },
  { id: "big_quote",           label: "Big quote",         hint: "Pull-quote with attribution bar",        category: "text" },
  { id: "glitch_text",         label: "Glitch text",       hint: "RGB-split + datamosh reveal",            category: "text", manic: true },

  // Math & equations
  { id: "equation_morph",      label: "Equation morph",    hint: "LaTeX → LaTeX, term-by-term",            category: "math" },
  { id: "equation_derive",     label: "Equation derive",   hint: "Step-by-step lines build down",          category: "math" },
  { id: "formula_explain",     label: "Formula explain",   hint: "Arrows label each variable",             category: "math" },
  { id: "proof_steps",         label: "Proof steps",       hint: "Numbered, indented logic chain",         category: "math" },

  // Data & charts
  { id: "chart_growth",        label: "Chart growth",      hint: "Bars or curves animate up",              category: "data" },
  { id: "chart_compare",       label: "Chart compare",     hint: "Two series side-by-side",                category: "data" },
  { id: "line_reveal",         label: "Line reveal",       hint: "Line draws on with a tracing dot",       category: "data" },
  { id: "pie_breakdown",       label: "Pie breakdown",     hint: "Segments highlight in sequence",         category: "data" },
  { id: "stat_punch",          label: "Stat punch",        hint: "Big number counts up + context label",   category: "data", manic: true },
  { id: "timeline_horizontal", label: "Timeline",          hint: "Events along a horizontal track",        category: "data" },

  // Diagrams
  { id: "diagram_build",       label: "Diagram build",     hint: "Strokes on, label by label",             category: "diagram" },
  { id: "flow_diagram",        label: "Flow diagram",      hint: "Boxes connected by arrows",              category: "diagram" },
  { id: "venn_diagram",        label: "Venn diagram",      hint: "2–3 overlapping circles + labels",       category: "diagram" },
  { id: "tree_diagram",        label: "Tree diagram",      hint: "Branching tree, top-down",               category: "diagram" },

  // Compare & contrast
  { id: "split_comparison",    label: "Split comparison",  hint: "Two halves, side-by-side",               category: "compare" },
  { id: "before_after",        label: "Before / after",    hint: "A wipes to B",                           category: "compare" },
  { id: "this_vs_that",        label: "This vs that",      hint: "Head-to-head with VS in the middle",     category: "compare", manic: true },
  { id: "pros_cons",           label: "Pros / cons",       hint: "Two-column checked / crossed list",      category: "compare" },
  { id: "four_quadrants",      label: "Four quadrants",    hint: "2×2 matrix with axis labels",            category: "compare" },

  // Emphasis & reveals
  { id: "callout_zoom",        label: "Callout zoom",      hint: "Punch-in + dashed annotation",           category: "emphasis", manic: true },
  { id: "bullet_burst",        label: "Bullet burst",      hint: "3–5 bullets pop in fast",                category: "emphasis", manic: true },
  { id: "numbered_steps",      label: "Numbered steps",    hint: "1 · 2 · 3 with stagger",                  category: "emphasis" },
  { id: "spotlight",           label: "Spotlight",         hint: "Darken everything except one element",   category: "emphasis" },
  { id: "circle_underline",    label: "Circle / underline",hint: "Hand-drawn ring + underline",            category: "emphasis" },

  // Motion & geometry
  { id: "shape_morph",         label: "Shape morph",       hint: "Square → circle → triangle",            category: "motion" },
  { id: "wave_animation",      label: "Wave animation",    hint: "Sine wave with parameter sweep",         category: "motion" },

  // Outros
  { id: "countdown",           label: "Countdown",         hint: "3 · 2 · 1 punch reveal",                  category: "outro",   manic: true },
  { id: "cta_card",            label: "CTA card",          hint: "Handle + button card at end",            category: "outro" },
  { id: "subscribe_smash",     label: "Subscribe smash",   hint: "Subscribe button press animation",       category: "outro",   manic: true },

  // Media
  { id: "image_annotated",     label: "Image w/ notes",    hint: "Image + arrows + labels",                category: "media" },
];

export type Style = { id: StyleId; label: string };

export const STYLES: Style[] = [
  { id: "editorial",    label: "Editorial" },
  { id: "manic",        label: "Manic" },
  { id: "classic_3b1b", label: "3b1b classic" },
  { id: "kurzgesagt",   label: "Kurzgesagt" },
  { id: "whiteboard",   label: "Whiteboard" },
  { id: "neon",         label: "Neon" },
  { id: "mono",         label: "Mono / line" },
];

/** Manic-style tag chips shown in the inspector when style === "manic". */
export const MANIC_TAGS = [
  "hard cuts",
  "punch zooms",
  "micro-shake",
  "rapid callouts",
  "oversized captions",
] as const;

/** Total stitched duration in seconds. */
export function totalDuration(scenes: Scene[]): number {
  return scenes.reduce((a, s) => a + s.duration, 0);
}

/** Looks up a scene by id, falling back to the first scene. */
export function findScene(scenes: Scene[], id: string | null): Scene {
  return scenes.find((s) => s.id === id) ?? scenes[0];
}
