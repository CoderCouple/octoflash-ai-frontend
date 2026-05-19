
import { useState } from "react";
import { GitBranch, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCENES, totalDuration } from "@octoflash/core";
import { EditorTopbar, type Scope } from "./editor-topbar";
import { EditorTabBar, type EditorTab } from "./editor-tab-bar";
import { ScenesPanel } from "./scenes-panel";
import { InspectorPanel } from "./inspector-panel";
import { PreviewCanvas } from "./preview-canvas";
import { PromptTab } from "./prompt-tab";
import { CodeTab } from "./code-tab";
import { BottomPanel } from "./bottom-panel";
import { StatusBar } from "./status-bar";
import { TransportControls } from "./transport-controls";
import { WorkflowCanvas } from "./workflow-canvas";

export type EditorMode = "timeline" | "workflow";

/**
 * Top-level IDE shell for the Manim scene editor.
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ EditorTopbar  (project title · scope · Preview · Export) │
 *   ├──────────────┬─────────────────────────────┬─────────────┤
 *   │ ScenesPanel  │ EditorTabBar                │ Inspector   │
 *   │              │ ┌─────────────────────────┐ │             │
 *   │              │ │ PreviewCanvas / Prompt  │ │             │
 *   │              │ │ / Code                  │ │             │
 *   │              │ └─────────────────────────┘ │             │
 *   │              │ TransportControls           │             │
 *   │              │ BottomPanel (tabs)          │             │
 *   ├──────────────┴─────────────────────────────┴─────────────┤
 *   │ StatusBar                                                 │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Pure UI; backend wiring (React Query) plugs into props.
 */
export function EditorShell({
  initialSceneId,
  initialVariant,
  initialTab = "preview",
  initialMode = "timeline",
}: {
  initialSceneId?: string;
  initialVariant?: number;
  initialTab?: EditorTab;
  initialMode?: EditorMode;
}) {
  const scenes = SCENES;
  const total = totalDuration(scenes);

  const [title, setTitle] = useState("How black holes warp time");
  const [selId, setSelId] = useState(initialSceneId ?? "s3");
  const scene = scenes.find((s) => s.id === selId) ?? scenes[0];

  const [variant, setVariant] = useState(initialVariant ?? scene.selectedVariation);
  const [scope, setScope] = useState<Scope>("scene");
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<EditorTab>(initialTab);
  const [openTabs, setOpenTabs] = useState<EditorTab[]>(["preview", "prompt", "code"]);
  const [locked] = useState<Record<string, boolean>>({});
  const [bottomOpen, setBottomOpen] = useState(true);
  const [mode, setMode] = useState<EditorMode>(initialMode);

  const playhead =
    scope === "scene" ? scene.start + scene.duration * 0.18 : scene.start + scene.duration * 0.18;

  const pickScene = (id: string) => {
    const s = scenes.find((x) => x.id === id);
    if (!s) return;
    setSelId(id);
    setVariant(s.selectedVariation);
  };

  const closeTab = (t: EditorTab) => {
    const next = openTabs.filter((x) => x !== t);
    setOpenTabs(next);
    if (tab === t && next.length) setTab(next[0]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <EditorTopbar
        title={title}
        onChangeTitle={setTitle}
        sceneCount={scenes.length}
        total={total}
        scope={scope}
        onChangeScope={setScope}
        mode={mode}
        onChangeMode={setMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <ScenesPanel scenes={scenes} activeId={selId} locked={locked} onPick={pickScene} />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 border-l">
          {mode === "timeline" ? (
            <>
              <EditorTabBar
                scene={scene}
                tabs={openTabs}
                active={tab}
                onSelect={setTab}
                onClose={closeTab}
              />

              <div className="flex-1 flex flex-col min-h-0">
                {tab === "preview" && (
                  <PreviewCanvas
                    scene={scene}
                    variant={variant}
                    playing={playing}
                    onTogglePlay={() => setPlaying((p) => !p)}
                  />
                )}
                {tab === "prompt" && <PromptTab scene={scene} />}
                {tab === "code" && <CodeTab scene={scene} />}

                {tab === "preview" && (
                  <TransportControls
                    scene={scene}
                    scope={scope}
                    playing={playing}
                    onTogglePlay={() => setPlaying((p) => !p)}
                    playhead={playhead}
                    total={total}
                  />
                )}
              </div>
            </>
          ) : (
            <WorkflowCanvas
              scenes={scenes}
              activeSceneId={selId}
              onPickScene={pickScene}
            />
          )}

          {bottomOpen && (
            <BottomPanel
              scenes={scenes}
              activeId={selId}
              total={total}
              playhead={playhead}
              onPick={pickScene}
              onClose={() => setBottomOpen(false)}
            />
          )}
        </div>

        <InspectorPanel scene={scene} variant={variant} onChangeVariant={setVariant} />
      </div>

      <StatusBar scene={scene} playing={playing} />
    </div>
  );
}
