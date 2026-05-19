
import { Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const stages = [
  { label: "Render scene 1",            pct: 100, done: true },
  { label: "Render scene 2",            pct: 62,  active: true },
  { label: "Render scene 3",            pct: 0 },
  { label: "Render scene 4",            pct: 0 },
  { label: "Compose & encode (h.264)",  pct: 0, after: true },
  { label: "Upload to library",         pct: 0 },
];

export function RenderingState() {
  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="flex-1 flex items-center justify-center p-8 gap-8">
        <div className="w-[280px] h-[498px] rounded-xl shadow-2xl bg-black relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(45deg,#111 0 8px,#000 8px 16px)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-7 text-white/70 animate-spin" />
            <div className="text-white text-xs font-medium">Rendering frame 184 / 1320</div>
          </div>
          <div className="absolute inset-x-3.5 bottom-3.5">
            <Progress value={14} className="h-[3px] bg-white/15" />
          </div>
        </div>

        <Card className="w-[360px] p-5">
          <div className="text-sm font-semibold mb-1">Generating animation</div>
          <p className="text-xs text-muted-foreground mb-4">
            Manim is rendering scene 2 of 4. ETA 1m 48s.
          </p>

          <div className="flex flex-col gap-3.5">
            {stages.map((s, i) => (
              <div key={i}>
                {s.after && <Separator className="mb-3.5" />}
                <div className="flex justify-between text-xs mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={
                      "size-[14px] rounded-full text-[9px] flex items-center justify-center " +
                      (s.done ? "bg-success text-white"
                              : s.active ? "bg-violet-500/20" : "bg-muted")
                    }>
                      {s.done && <Check className="size-2" />}
                    </span>
                    {s.label}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">{s.pct}%</span>
                </div>
                <Progress
                  value={s.active ? undefined : s.pct}
                  className={cn("h-[3px]", s.active && "animate-pulse")}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[11px] text-muted-foreground mt-4 pt-3 border-t">
            <span>Worker · render-3 · GPU 4090</span>
            <span className="font-mono">02:14 elapsed</span>
          </div>
        </Card>
      </div>

      <div className="border-t bg-background h-[132px] overflow-auto px-3.5 py-2 font-mono text-[11px] text-muted-foreground">
        <div>[00:01.2]  scene_1.construct() entered</div>
        <div>[00:14.7]  scene_1 rendered 312 frames in 13.5s</div>
        <div>[00:14.8]  scene_2.construct() entered</div>
        <div>[00:18.1]  warp grid: applying transform …</div>
        <div className="text-foreground">[01:24.0]  scene_2 progress 62%</div>
      </div>
    </div>
  );
}
