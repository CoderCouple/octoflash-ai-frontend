/** Time formatting helpers shared across the editor module. */

/** Format seconds as `m:ss.cc` (centiseconds). */
export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${m}:${String(ss).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** Format seconds as `m:ss` (no decimal). */
export function formatShort(s: number): string {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
}

/** Format a scene's start..end range as `0:14–0:32`. */
export function formatRange(start: number, duration: number): string {
  return `${formatShort(start)}–${formatShort(start + duration)}`;
}

/** Format seconds as `m:ss`. Alias kept for callers that imported it from lib/utils. */
export function formatDuration(s: number): string {
  return formatShort(s);
}
