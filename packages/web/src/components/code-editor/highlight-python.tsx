/**
 * Minimal Python syntax highlighter — tuned for the Manim code the playground
 * runs. Returns an array of React nodes (raw text spans + tagged spans) the
 * editor lays under a transparent textarea.
 *
 * Design choices:
 *   • Single-pass tokenizer using a non-overlapping regex with named groups.
 *     Order matters — strings + comments must be tried before identifiers so
 *     keyword-shaped substrings inside them don't bleed through.
 *   • Triple-quoted strings handled as their own pattern; can span newlines
 *     but the editor still feeds one chunk so that's fine.
 *   • Manim namespace (Scene, Mobject, Circle, …) treated as built-ins to
 *     get a separate colour from generic identifiers.
 *
 * Not a full Python parser — f-string interpolation, escape sequences inside
 * strings, and decorators with arguments all render as a single token. Good
 * enough for the playground.
 */

import { type ReactNode } from "react";

const PY_KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await",
  "break", "class", "continue", "def", "del", "elif", "else", "except",
  "finally", "for", "from", "global", "if", "import", "in", "is", "lambda",
  "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with",
  "yield", "match", "case",
]);

// Frequently-used Manim symbols — render in a distinct "builtin" tone so
// `Circle(BLUE)` reads differently from a user-defined `my_circle`.
const PY_BUILTINS = new Set([
  // Python builtins
  "print", "len", "range", "list", "dict", "set", "tuple", "int", "float",
  "str", "bool", "abs", "max", "min", "sum", "enumerate", "zip", "self",
  "super", "isinstance", "callable", "__init__",
  // Manim core
  "Scene", "ThreeDScene", "Mobject", "VMobject", "VGroup", "Group",
  "Circle", "Square", "Rectangle", "Triangle", "Polygon", "Line", "Arrow",
  "Dot", "DashedLine", "Vector", "RegularPolygon", "Annulus",
  "Text", "Tex", "MathTex", "Title", "BodyText", "Caption", "MarkupText",
  "ShowCreation", "Create", "FadeIn", "FadeOut", "Transform", "ReplacementTransform",
  "Write", "DrawBorderThenFill", "Indicate", "Flash", "Wiggle",
  "AnimationGroup", "LaggedStart", "Succession", "Rotate",
  "Axes", "ThreeDAxes", "NumberPlane", "ComplexPlane", "ValueTracker",
  "UP", "DOWN", "LEFT", "RIGHT", "ORIGIN", "PI", "TAU", "DEGREES",
  "BLUE", "RED", "GREEN", "YELLOW", "ORANGE", "PURPLE", "WHITE", "BLACK", "GRAY",
  "BLUE_A", "BLUE_B", "BLUE_C", "BLUE_D", "BLUE_E",
  "config", "linear", "smooth", "rate_func", "wait", "play", "add", "remove",
]);

type TokenKind =
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "builtin"
  | "defName"
  | "decorator"
  | "operator"
  | "text";

const COLOR: Record<TokenKind, string> = {
  // Subtle, mostly-monochrome palette. Strings + numbers carry the most
  // contrast since they're the easiest to misread as identifiers otherwise.
  comment:    "text-muted-foreground italic",
  string:     "text-emerald-600 dark:text-emerald-400",
  number:     "text-orange-600 dark:text-orange-400",
  keyword:    "text-foreground font-semibold",
  builtin:    "text-violet-600 dark:text-violet-400",
  defName:    "text-foreground font-semibold",
  decorator:  "text-amber-600 dark:text-amber-400",
  operator:   "text-foreground/70",
  text:       "",
};

// Token regex — ORDER MATTERS. Earlier alternatives win.
const TOKEN_RE = new RegExp(
  [
    // comment to end of line
    "(?<comment>#[^\\n]*)",
    // triple-quoted string (can span newlines)
    "(?<tstring>'''[\\s\\S]*?'''|\"\"\"[\\s\\S]*?\"\"\")",
    // single-quoted strings (no escape handling beyond basic)
    "(?<string>'(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\")",
    // numbers (int / float / hex / scientific)
    "(?<number>\\b(?:0[xX][0-9a-fA-F]+|\\d+(?:\\.\\d*)?(?:[eE][+-]?\\d+)?|\\.\\d+(?:[eE][+-]?\\d+)?)\\b)",
    // decorator
    "(?<decorator>@[A-Za-z_][\\w.]*)",
    // identifier (keywords + builtins + defNames disambiguated post-hoc)
    "(?<ident>[A-Za-z_][\\w]*)",
    // operators / punctuation
    "(?<op>[=+\\-*/%<>!&|^~]+|[\\[\\](){},.:])",
  ].join("|"),
  "g",
);

export function highlightPython(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Track whether the previous non-space token was `def` or `class` so the
  // next identifier renders as a function/class name rather than a plain
  // identifier.
  let prevKeyword: "def" | "class" | null = null;

  const push = (text: string, kind: TokenKind) => {
    if (!text) return;
    if (kind === "text") {
      out.push(text);
    } else {
      out.push(
        <span key={key++} className={COLOR[kind]}>
          {text}
        </span>,
      );
    }
  };

  for (const m of code.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) push(code.slice(lastIndex, idx), "text");

    const g = m.groups ?? {};
    if (g.comment !== undefined) push(g.comment, "comment");
    else if (g.tstring !== undefined) push(g.tstring, "string");
    else if (g.string !== undefined) push(g.string, "string");
    else if (g.number !== undefined) push(g.number, "number");
    else if (g.decorator !== undefined) push(g.decorator, "decorator");
    else if (g.ident !== undefined) {
      const name = g.ident;
      if (prevKeyword) {
        push(name, "defName");
        prevKeyword = null;
      } else if (PY_KEYWORDS.has(name)) {
        push(name, "keyword");
        if (name === "def" || name === "class") prevKeyword = name;
      } else if (PY_BUILTINS.has(name)) {
        push(name, "builtin");
      } else {
        push(name, "text");
      }
    } else if (g.op !== undefined) push(g.op, "operator");

    lastIndex = idx + m[0].length;
  }
  if (lastIndex < code.length) push(code.slice(lastIndex), "text");

  return out;
}
