/**
 * TargetSidebar — right-drawer for the `target` node.
 *
 * Shows the fully stitched final video for the project. Reuses the same
 * orientation toggle (portrait/landscape) as the project overview page so
 * the user can flip between cuts. If nothing has been generated yet, shows
 * a clear placeholder + the project status.
 */

import { useState } from "react";
import { Monitor, Send, Smartphone } from "lucide-react";

import { projectsApi, type Orientation, type ProjectDetail } from "@octoflash/core";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TargetSidebar({ project }: { project: ProjectDetail }) {
  const hasPortrait = !!project.finalPortraitVideoUrl;
  const hasLandscape = !!project.finalLandscapeVideoUrl;
  const initial: Orientation = hasPortrait ? "portrait" : "landscape";
  const [orientation, setOrientation] = useState<Orientation>(initial);

  const ready = hasPortrait || hasLandscape;
  const bust = encodeURIComponent(project.updatedAt);
  const src = `${projectsApi.previewUrl(project.id, orientation)}&t=${bust}`;
  const aspectClass = orientation === "portrait" ? "aspect-[9/16]" : "aspect-video";

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <Send className="size-3" /> Target
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Fully stitched final video.
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!ready ? (
          <div className="text-[11px] text-muted-foreground space-y-1">
            <div>
              No final video yet · status{" "}
              <span className="font-mono">{project.status}</span>
            </div>
            <div>Run Generate from the topbar to render and stitch the clips.</div>
          </div>
        ) : (
          <>
            {hasPortrait && hasLandscape && (
              <Tabs
                value={orientation}
                onValueChange={(v) => setOrientation(v as Orientation)}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="portrait" className="text-xs">
                    <Smartphone className="size-3 mr-1" /> Portrait
                  </TabsTrigger>
                  <TabsTrigger value="landscape" className="text-xs">
                    <Monitor className="size-3 mr-1" /> Landscape
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <video
              key={`${orientation}-${project.updatedAt}`}
              src={src}
              controls
              preload="metadata"
              className={`w-full rounded-md border bg-black ${aspectClass}`}
            />
          </>
        )}
      </div>
    </div>
  );
}
