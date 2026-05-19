
import type { Scene } from "@octoflash/core";

/**
 * Code tab — shows the generated Manim Python for the current scene.
 * Read-only in MVP per spec: "Do not let users write Manim code".
 */
export function CodeTab({ scene }: { scene: Scene }) {
  const setup =
    scene.template === "split_comparison"
      ? `
        left  = Text("Earth clock",   font_size=42)
        right = Text("Horizon clock", font_size=42)
        group = VGroup(left, right).arrange(RIGHT, buff=1.4)`
      : scene.template === "callout_zoom"
      ? `
        mass  = Dot(color=WHITE).scale(2.6)
        ring  = DashedVMobject(Circle(radius=1.4), num_dashes=24)`
      : scene.template === "diagram_build"
      ? `
        plane = NumberPlane(x_range=[-7, 7, 1], y_range=[-4, 4, 1])`
      : "";

  const inT = (0.25 + scene.motion * 0.6).toFixed(2);
  const holdT = (scene.duration - 0.6).toFixed(2);
  const outT = (0.2 + scene.motion * 0.3).toFixed(2);

  const code = `from manim import *

class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = "${scene.bg}"

        title = Text("${scene.mainText}", font_size=64, weight=BOLD)${setup}

        self.play(FadeIn(title, shift=UP * 0.2), run_time=${inT})
        self.wait(${holdT})
        self.play(title.animate.scale(0.96).set_opacity(0.85),
                  run_time=${outT})`;

  return (
    <div className="flex-1 overflow-auto bg-muted/25">
      <div className="p-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Generated Manim ·{" "}
          <span className="font-mono normal-case tracking-normal">{scene.template}.py</span> · read-only
        </div>
        <pre className="font-mono text-[11px] leading-relaxed bg-muted rounded-md border p-3.5 overflow-x-auto whitespace-pre">
          {code}
        </pre>
      </div>
    </div>
  );
}
