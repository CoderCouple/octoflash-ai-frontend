import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatShort,
  formatRange,
  formatDuration,
  DEFAULT_API_URL,
  getRuntimeConfig,
  setRuntimeConfig,
  VIDEOS,
  CHANNELS,
  SCENES,
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  DEFAULT_WORKFLOW,
  pathSet,
  totalDuration,
} from "../index.js";

describe("format helpers", () => {
  it("formatTime renders centiseconds", () => {
    expect(formatTime(72.34)).toBe("1:12.34");
  });
  it("formatShort drops decimals", () => {
    expect(formatShort(72.9)).toBe("1:12");
  });
  it("formatDuration is an alias for formatShort", () => {
    expect(formatDuration(47)).toBe("0:47");
  });
  it("formatRange concatenates start..end", () => {
    expect(formatRange(14, 18)).toBe("0:14–0:32");
  });
});

describe("runtime config", () => {
  it("defaults to the local FastAPI URL", () => {
    setRuntimeConfig({ apiUrl: DEFAULT_API_URL });
    expect(getRuntimeConfig().apiUrl).toBe("http://localhost:8000");
  });
  it("setRuntimeConfig overrides the cached value", () => {
    setRuntimeConfig({ apiUrl: "http://example.test/api" });
    expect(getRuntimeConfig().apiUrl).toBe("http://example.test/api");
    setRuntimeConfig({ apiUrl: DEFAULT_API_URL });
  });
});

describe("fixtures", () => {
  it("VIDEOS has at least one of every interesting status", () => {
    const statuses = new Set(VIDEOS.map((v) => v.status));
    for (const s of ["analyzing", "analyzed", "generating", "generated", "published", "failed", "queued"]) {
      expect(statuses.has(s as never)).toBe(true);
    }
  });
  it("CHANNELS and SCENES are non-empty", () => {
    expect(CHANNELS.length).toBeGreaterThan(0);
    expect(SCENES.length).toBeGreaterThan(0);
  });
  it("every TEMPLATE category resolves to at least one template", () => {
    for (const c of TEMPLATE_CATEGORIES) {
      expect(TEMPLATES.some((t) => t.category === c.id)).toBe(true);
    }
  });
  it("totalDuration sums scene durations", () => {
    const total = totalDuration(SCENES);
    expect(total).toBe(SCENES.reduce((a, s) => a + s.duration, 0));
  });
});

describe("workflow", () => {
  it("DEFAULT_WORKFLOW has a start and at least one end", () => {
    expect(DEFAULT_WORKFLOW.nodes.some((n) => n.kind === "start")).toBe(true);
    expect(DEFAULT_WORKFLOW.nodes.filter((n) => n.kind === "end").length).toBeGreaterThan(0);
  });
  it("pathSet follows only the branches it is told to", () => {
    const editorialOnly = pathSet(DEFAULT_WORKFLOW, ["n-s4a"]);
    expect(editorialOnly.has("end-a")).toBe(true);
    expect(editorialOnly.has("end-b")).toBe(false);
  });
});
