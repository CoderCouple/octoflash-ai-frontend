
import type { TemplateId } from "@octoflash/core";

/**
 * Tiny iconographic glyph (~22px) for each Manim template preset.
 * Designed for the inspector's template gallery: monochrome, single
 * stroke weight, instantly recognizable at small sizes.
 */
export function TemplateGlyph({ id, size = 22 }: { id: TemplateId; size?: number }) {
  const s = size;
  const c = s / 2;
  const fg = "hsl(var(--muted-foreground))";

  switch (id) {
    // ─── Text & titles ─────────────────────────────────────
    case "title_reveal":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <rect x={3} y={c - 2} width={s - 6} height={4} fill={fg} />
          <rect x={6} y={c + 4} width={s - 12} height={2} fill={fg} opacity={0.5} />
        </svg>
      );
    case "text_pop":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <text x={c} y={c + 4} textAnchor="middle" fontWeight={900} fontSize={s * 0.55} fill={fg}>A!</text>
        </svg>
      );
    case "subtitle_stack":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <rect x={3} y={c - 5} width={s - 6} height={3} fill={fg} />
          <rect x={6} y={c + 1} width={s - 12} height={2} fill={fg} opacity={0.6} />
          <rect x={6} y={c + 5} width={s - 14} height={1.5} fill={fg} opacity={0.45} />
        </svg>
      );
    case "typewriter":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <rect x={3} y={c - 1.5} width={s - 9} height={3} fill={fg} />
          <rect x={s - 5} y={c - 4} width={1.5} height={8} fill={fg} />
        </svg>
      );
    case "big_quote":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill={fg}>
          <path d="M4 5 v4 a2 2 0 0 0 2 2 v-6 z" />
          <path d="M10 5 v4 a2 2 0 0 0 2 2 v-6 z" />
          <rect x={3} y={c + 2} width={s - 8} height={1.5} opacity={0.6} />
          <rect x={3} y={c + 5} width={s - 12} height={1.5} opacity={0.4} />
        </svg>
      );
    case "glitch_text":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <rect x={3} y={c - 2} width={s - 6} height={4} fill={fg} />
          <rect x={5} y={c - 4} width={s - 6} height={2} fill={fg} opacity={0.45} />
          <rect x={1} y={c + 2} width={s - 6} height={2} fill={fg} opacity={0.45} />
        </svg>
      );

    // ─── Math & equations ──────────────────────────────────
    case "equation_morph":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.4}>
          <text x={2} y={c + 4} fontFamily="serif" fontSize={s * 0.55} fill={fg}>∫</text>
          <path d={`M${c} ${c} h${c - 3}`} />
          <path d={`M${s - 5} ${c - 3} l3 3 l-3 3`} />
        </svg>
      );
    case "equation_derive":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} stroke={fg} strokeWidth={1.2}>
          <path d="M3 5 H19 M5 11 H17 M7 17 H15" fill="none" />
          <text x={c + 5} y={6} fontSize={4} fill={fg}>=</text>
        </svg>
      );
    case "formula_explain":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.2}>
          <text x={c - 2} y={c + 3} fontFamily="serif" fontSize={11} fill={fg}>x²</text>
          <path d={`M${c + 4} ${c + 1} l4 4`} />
          <circle cx={s - 4} cy={s - 4} r={2} fill={fg} />
        </svg>
      );
    case "proof_steps":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill={fg}>
          <text x={3} y={7} fontSize={6} fontFamily="ui-monospace">1.</text>
          <rect x={9} y={4} width={s - 12} height={1.5} />
          <text x={3} y={13} fontSize={6} fontFamily="ui-monospace">2.</text>
          <rect x={9} y={10} width={s - 14} height={1.5} />
          <text x={3} y={19} fontSize={6} fontFamily="ui-monospace">3.</text>
          <rect x={9} y={16} width={s - 16} height={1.5} />
        </svg>
      );

    // ─── Data & charts ─────────────────────────────────────
    case "chart_growth":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill={fg}>
          <rect x={3} y={s - 6} width={3} height={3} />
          <rect x={8} y={s - 9} width={3} height={6} />
          <rect x={13} y={s - 13} width={3} height={10} />
          <rect x={s - 6} y={s - 17} width={3} height={14} />
        </svg>
      );
    case "chart_compare":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <g fill={fg}>
            <rect x={3} y={s - 9}  width={2.5} height={6} />
            <rect x={3} y={s - 14} width={2.5} height={4} opacity={0.5} />
            <rect x={9} y={s - 12} width={2.5} height={9} />
            <rect x={9} y={s - 18} width={2.5} height={5} opacity={0.5} />
            <rect x={15} y={s - 16} width={2.5} height={13} />
            <rect x={15} y={s - 20} width={2.5} height={3} opacity={0.5} />
          </g>
        </svg>
      );
    case "line_reveal":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.4}>
          <path d="M3 17 L8 12 L13 14 L19 5" />
          <circle cx={19} cy={5} r={2} fill={fg} />
        </svg>
      );
    case "pie_breakdown":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <circle cx={c} cy={c} r={8} fill={fg} opacity={0.25} />
          <path d={`M${c} ${c} L${c} ${c - 8} A 8 8 0 0 1 ${c + 8} ${c} Z`} fill={fg} />
          <path d={`M${c} ${c} L${c + 8} ${c} A 8 8 0 0 1 ${c + 2.5} ${c + 7.6} Z`} fill={fg} opacity={0.55} />
        </svg>
      );
    case "stat_punch":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill={fg}>
          <text x={c} y={c + 4} textAnchor="middle" fontWeight={900} fontSize={s * 0.7}>42</text>
        </svg>
      );
    case "timeline_horizontal":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} stroke={fg} strokeWidth={1.2} fill={fg}>
          <line x1={3} y1={c} x2={s - 3} y2={c} />
          <circle cx={6}  cy={c} r={1.8} />
          <circle cx={c}  cy={c} r={1.8} />
          <circle cx={s - 6} cy={c} r={1.8} />
        </svg>
      );

    // ─── Diagrams ──────────────────────────────────────────
    case "diagram_build":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.2}>
          <circle cx={6} cy={6} r={2} />
          <circle cx={s - 6} cy={6} r={2} />
          <circle cx={c} cy={s - 6} r={2} />
          <path d={`M6 6 L${s - 6} 6 L${c} ${s - 6} Z`} />
        </svg>
      );
    case "flow_diagram":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.1}>
          <rect x={2} y={c - 3} width={6} height={6} />
          <rect x={s - 8} y={c - 3} width={6} height={6} />
          <path d={`M8 ${c} L${s - 8} ${c}`} />
          <path d={`M${s - 11} ${c - 2} l3 2 l-3 2`} />
        </svg>
      );
    case "venn_diagram":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.2}>
          <circle cx={c - 3} cy={c} r={6} />
          <circle cx={c + 3} cy={c} r={6} />
        </svg>
      );
    case "tree_diagram":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill={fg} stroke={fg} strokeWidth={1.1}>
          <circle cx={c} cy={4} r={1.8} />
          <circle cx={5} cy={s - 5} r={1.8} />
          <circle cx={s - 5} cy={s - 5} r={1.8} />
          <path d={`M${c} 5 L5 ${s - 6} M${c} 5 L${s - 5} ${s - 6}`} fill="none" />
        </svg>
      );

    // ─── Compare & contrast ────────────────────────────────
    case "split_comparison":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.2}>
          <rect x={2} y={4} width={c - 3} height={s - 8} fill={fg} opacity={0.25} />
          <rect x={c + 1} y={4} width={c - 3} height={s - 8} />
        </svg>
      );
    case "before_after":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.2}>
          <rect x={2} y={4} width={s - 4} height={s - 8} fill={fg} opacity={0.25} />
          <line x1={c} y1={2} x2={c} y2={s - 2} strokeDasharray="2 2" />
        </svg>
      );
    case "this_vs_that":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} stroke={fg} strokeWidth={1.2} fill="none">
          <rect x={2} y={5} width={6} height={12} />
          <rect x={s - 8} y={5} width={6} height={12} />
          <text x={c} y={c + 3} textAnchor="middle" fontWeight={900} fontSize={7} fill={fg}>vs</text>
        </svg>
      );
    case "pros_cons":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.4}>
          <path d="M3 7 l2.5 2.5 L10 5" />
          <path d="M14 5 l5 5 M19 5 l-5 5" />
          <path d="M3 17 l2.5 2.5 L10 14" opacity={0.5} />
          <path d="M14 14 l5 5 M19 14 l-5 5" opacity={0.5} />
        </svg>
      );
    case "four_quadrants":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill={fg}>
          <rect x={2} y={2} width={c - 3} height={c - 3} opacity={0.7} />
          <rect x={c + 1} y={2} width={c - 3} height={c - 3} opacity={0.4} />
          <rect x={2} y={c + 1} width={c - 3} height={c - 3} opacity={0.4} />
          <rect x={c + 1} y={c + 1} width={c - 3} height={c - 3} opacity={0.85} />
        </svg>
      );

    // ─── Emphasis & reveals ────────────────────────────────
    case "callout_zoom":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.2}>
          <circle cx={c} cy={c} r={3} fill={fg} />
          <circle cx={c} cy={c} r={7} strokeDasharray="2 2" />
          <path d={`M${c + 5} ${c - 5} l4 -4`} />
        </svg>
      );
    case "bullet_burst":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.2}>
          <circle cx={5} cy={6} r={1.5} fill={fg} />
          <path d="M9 6 H20" />
          <circle cx={5} cy={c} r={1.5} fill={fg} />
          <path d={`M9 ${c} H17`} />
          <circle cx={5} cy={s - 6} r={1.5} fill={fg} />
          <path d={`M9 ${s - 6} H19`} />
        </svg>
      );
    case "numbered_steps":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill={fg}>
          <text x={3}  y={c + 4} fontWeight={800} fontSize={9}>1</text>
          <text x={c}  y={c + 4} textAnchor="middle" fontWeight={800} fontSize={9} opacity={0.6}>2</text>
          <text x={s - 3} y={c + 4} textAnchor="end" fontWeight={800} fontSize={9} opacity={0.35}>3</text>
        </svg>
      );
    case "spotlight":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <rect x={0} y={0} width={s} height={s} fill={fg} opacity={0.25} />
          <circle cx={c} cy={c} r={6} fill="hsl(var(--background))" />
          <circle cx={c} cy={c} r={2.5} fill={fg} />
        </svg>
      );
    case "circle_underline":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.3}>
          <ellipse cx={c} cy={c - 1} rx={8} ry={5} strokeDasharray="3 2" />
          <path d={`M5 ${s - 4} q ${c - 5} 3, ${s - 10} 0`} />
        </svg>
      );

    // ─── Motion & geometry ─────────────────────────────────
    case "shape_morph":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.3}>
          <rect x={3} y={c - 5} width={10} height={10} />
          <circle cx={s - 6} cy={c} r={5} />
        </svg>
      );
    case "wave_animation":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.4}>
          <path d={`M2 ${c} q 3 -6, 6 0 t 6 0 t 6 0`} />
        </svg>
      );

    // ─── Outros ────────────────────────────────────────────
    case "countdown":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.4}>
          <circle cx={c} cy={c} r={c - 3} />
          <text x={c} y={c + 4} textAnchor="middle" fontWeight={800} fontSize={s * 0.55} fill={fg}>3</text>
        </svg>
      );
    case "cta_card":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <rect x={2} y={4} width={s - 4} height={s - 8} fill="none" stroke={fg} strokeWidth={1} rx={2} />
          <rect x={5} y={c - 1.5} width={s - 10} height={4} fill={fg} rx={1} />
        </svg>
      );
    case "subscribe_smash":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill={fg}>
          <rect x={4} y={c - 3} width={s - 8} height={7} rx={2} />
          <path d={`M${c - 1.5} ${c} l1.5 1.5 l3 -3`} stroke="hsl(var(--background))" strokeWidth={1.4} fill="none" />
          <path d={`M${c} 3 v4 M${c - 2} 4 l2 -2 l2 2`} stroke={fg} strokeWidth={1.2} fill="none" />
        </svg>
      );

    // ─── Media ─────────────────────────────────────────────
    case "image_annotated":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" stroke={fg} strokeWidth={1.2}>
          <rect x={2} y={3} width={s - 4} height={s - 9} />
          <path d="M4 14 L8 10 L12 13 L18 7" />
          <circle cx={18} cy={7} r={1.5} fill={fg} />
        </svg>
      );
  }
}
