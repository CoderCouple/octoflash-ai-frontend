/**
 * Auto-refresh the open project on a fixed interval while it's in an
 * in-flight state. Stops polling as soon as it reaches a terminal state.
 *
 * Use case: user pastes URL → lands on /projects/:id → status=queued →
 * AnalyzeProjectWorkflow runs in background → without polling, the page
 * stays stuck at "queued · 0 scenes" until manual refresh. With this hook,
 * status flips live to analyzing → analyzed (and to generating → generated
 * once they click Generate).
 *
 * Cheap: just refetches /projects/:id every `intervalMs` (default 3s) while
 * any of these conditions hold:
 *   - project.status ∈ {queued, analyzing, generating}
 *   - any scene.status ∈ {scripting, rendering}
 */

import { useEffect } from "react";

import type { ProjectDetail } from "@octoflash/core";

const IN_FLIGHT_PROJECT_STATUSES = new Set(["queued", "analyzing", "generating"]);
const IN_FLIGHT_SCENE_STATUSES = new Set(["scripting", "rendering"]);

export function useProjectPolling(
  project: ProjectDetail | null,
  refetch: () => Promise<unknown>,
  intervalMs = 3000,
): void {
  useEffect(() => {
    if (!project) return;
    const inFlight =
      IN_FLIGHT_PROJECT_STATUSES.has(project.status) ||
      project.scenes.some((s) => IN_FLIGHT_SCENE_STATUSES.has(s.status));
    if (!inFlight) return;

    const handle = setInterval(() => {
      void refetch();
    }, intervalMs);
    return () => clearInterval(handle);
  }, [project, refetch, intervalMs]);
}
