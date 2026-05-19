
import { Play } from "lucide-react";
import type { Scene } from "@octoflash/core";
import { formatTime } from "@octoflash/core";
import { SceneArt } from "./scene-art";

export function PreviewCanvas({
  scene,
  variant,
  playing,
  onTogglePlay,
}: {
  scene: Scene;
  variant: number;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  // 9:16 phone, fixed height — the parent flex centers it.
  const height = 540;
  const width = (height * 9) / 16;

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-7 bg-muted/25">
      <div
        style={{ width, height }}
        className="relative rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.06)]"
      >
        <SceneArt
          kind={scene.kind}
          bg={scene.bg}
          accent={scene.accent}
          variant={variant}
          width={width}
          height={height}
        />

        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <Pill>S{String(scene.n).padStart(2, "0")} · v{variant + 1}</Pill>
          <Pill>
            {formatTime(scene.start)} → {formatTime(scene.start + scene.duration)}
          </Pill>
        </div>

        {/* Big play */}
        {!playing && (
          <button
            type="button"
            onClick={onTogglePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            aria-label="Play"
          >
            <span className="size-[52px] rounded-full bg-white/95 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
              <Play className="size-5 text-[#0b0e2a] ml-[3px]" />
            </span>
          </button>
        )}

        {/* Caption */}
        <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 bg-black/45 text-white/90 text-[11px] font-medium rounded-md">
          {scene.mainText}
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-black/45 text-white rounded">
      {children}
    </span>
  );
}
