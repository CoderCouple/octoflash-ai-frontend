
import type { SceneKind } from "@octoflash/core";

/**
 * Faux scene preview rendered as inline SVG.
 * In production, swap for an <video> element pointing at the rendered
 * variation MP4 (or a Remotion <Player> if you want frame-level scrub).
 */
export function SceneArt({
  kind,
  bg,
  accent,
  variant = 0,
  width = 280,
  height = 498,
}: {
  kind: SceneKind;
  bg: string;
  accent: string;
  variant?: number;
  width?: number;
  height?: number;
}) {
  const cx = width / 2;
  const cy = height * 0.56;
  const uid = `${kind}-${variant}-${Math.round(width)}-${Math.round(height)}`;
  const big = width > 80;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ background: bg, display: "block" }}
    >
      <defs>
        <radialGradient id={`g-${uid}`} cx="50%" cy="56%" r="62%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="22%"  stopColor={accent}  stopOpacity="0.4" />
          <stop offset="100%" stopColor={bg}      stopOpacity="0" />
        </radialGradient>
      </defs>

      {kind === "title" && (
        <g>
          <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontFamily="ui-sans-serif" fontWeight={700} fontSize={big ? 22 : 8}>
            How black holes
          </text>
          <text x={cx} y={cy + (big ? 22 : 8)} textAnchor="middle" fill={accent} fontFamily="ui-sans-serif" fontWeight={700} fontSize={big ? 22 : 8}>
            warp time
          </text>
          {big && <line x1={cx - 40} x2={cx + 40} y1={cy + 42} y2={cy + 42} stroke="white" strokeOpacity={0.4} />}
        </g>
      )}

      {kind === "grid" && (
        <g stroke="rgba(255,255,255,.35)" strokeWidth="0.6" fill="none">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`h${i}`} x1={0} x2={width} y1={36 + i * 32} y2={36 + i * 32} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={14 + (i * (width - 28)) / 9}
              x2={14 + (i * (width - 28)) / 9}
              y1={30}
              y2={height - 28}
            />
          ))}
        </g>
      )}

      {kind === "warp" && (
        <g>
          <g stroke="rgba(255,255,255,.35)" strokeWidth="0.6" fill="none">
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`h${i}`} x1={0} x2={width} y1={36 + i * 32} y2={36 + i * 32} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => {
              const x = 14 + (i * (width - 28)) / 9;
              const dx = x - cx;
              const cpx = x + dx * (-0.22 - variant * 0.04);
              return <path key={`v${i}`} d={`M ${x} 30 Q ${cpx} ${cy} ${x} ${height - 28}`} />;
            })}
          </g>
          <circle cx={cx} cy={cy} r={84 + variant * 8} fill={`url(#g-${uid})`} />
          <circle cx={cx} cy={cy} r={6} fill="white" />
          <circle
            cx={cx}
            cy={cy}
            r={58 + variant * 4}
            fill="none"
            stroke={accent}
            strokeOpacity={0.55}
            strokeWidth={0.8}
            strokeDasharray="3 4"
          />
        </g>
      )}

      {kind === "orbit" && (
        <g>
          <circle cx={cx} cy={cy} r={80} fill={`url(#g-${uid})`} />
          <circle cx={cx} cy={cy} r={6} fill="white" />
          <g transform={`translate(${cx + 56}, ${cy - 26})`}>
            <circle r={14} fill="none" stroke="white" strokeOpacity={0.7} />
            <line x1={0} x2={0} y1={0} y2={-8} stroke="white" />
            <line x1={0} x2={6} y1={0} y2={2} stroke="white" />
          </g>
          <g transform={`translate(${cx - 86}, ${cy - 110})`}>
            <circle r={14} fill="none" stroke="white" strokeOpacity={0.7} />
            <line x1={0} x2={0} y1={0} y2={-9} stroke="white" />
            <line x1={0} x2={9} y1={0} y2={-3} stroke="white" />
          </g>
        </g>
      )}
    </svg>
  );
}
