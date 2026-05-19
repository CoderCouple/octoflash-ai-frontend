
import { Check, Copy, Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DESCRIPTION_TEXT } from "@octoflash/core";

export function CompletedState({ onPublish }: { onPublish: () => void }) {
  return (
    <div className="h-full flex items-center justify-center bg-muted/30 p-8 gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-[280px] h-[498px] rounded-xl shadow-2xl overflow-hidden relative" style={{ background: "#0b0e2a" }}>
          <svg viewBox="0 0 280 498" className="absolute inset-0">
            <defs>
              <radialGradient id="warpDone" cx="50%" cy="55%" r="60%">
                <stop offset="0%"   stopColor="#fff"     stopOpacity="0.95" />
                <stop offset="20%"  stopColor="#a78bfa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0b0e2a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g stroke="rgba(255,255,255,.3)" strokeWidth="0.7" fill="none">
              {Array.from({ length: 14 }).map((_, i) => (
                <line key={"h" + i} x1="0" x2="280" y1={36 + i * 32} y2={36 + i * 32} />
              ))}
              {Array.from({ length: 10 }).map((_, i) => {
                const x = 14 + i * 28, cx = 140, cy = 280;
                const dx = x - cx;
                const c1x = x + dx * -0.25;
                return <path key={"v" + i} d={`M ${x} 30 Q ${c1x} ${cy} ${x} 470`} />;
              })}
            </g>
            <circle cx="140" cy="280" r="100" fill="url(#warpDone)" />
            <circle cx="140" cy="280" r="7"   fill="white" />
            <circle cx="140" cy="280" r="68"  fill="none" stroke="rgba(167,139,250,.7)" strokeWidth="0.8" strokeDasharray="3 4" />
            <circle cx="206" cy="262" r="3" fill="#fbbf24" />
          </svg>
          <div className="absolute top-3.5 left-3.5 right-3.5 text-white text-sm font-semibold">
            How black holes warp time
          </div>
          <div className="absolute top-3.5 right-3.5 px-1.5 py-0.5 bg-black/50 text-white font-mono text-[10px] rounded">
            00:47
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="size-14 rounded-full bg-white/95 text-[#0b0e2a] flex items-center justify-center shadow-lg">
              <Play className="size-6" />
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm"><Download className="size-3 mr-1" /> Download MP4</Button>
          <Button variant="outline" size="sm"><Copy className="size-3 mr-1" /> Copy link</Button>
        </div>
      </div>

      <div className="w-[320px] flex flex-col gap-3.5">
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="size-8 rounded-full bg-success/15 text-success flex items-center justify-center">
              <Check className="size-4" />
            </span>
            <div>
              <div className="text-sm font-semibold">Render complete</div>
              <div className="text-xs text-muted-foreground">Finished 12 minutes ago.</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            {[
              ["Duration",   "0:47"],
              ["Resolution", "720 × 1280 · 30fps"],
              ["File size",  "6.4 MB · h.264"],
              ["Total cost", "$0.42"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Auto-generated metadata
          </div>
          <div className="flex flex-col gap-2.5">
            <div>
              <Label className="text-xs mb-1.5 block">Title</Label>
              <Input defaultValue="How black holes warp time" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Description</Label>
              <Textarea defaultValue={DESCRIPTION_TEXT} rows={3} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Hashtags</Label>
              <div className="flex flex-wrap gap-1">
                {["#physics", "#blackholes", "#einstein", "#shorts", "#science"].map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Button onClick={onPublish}>Publish to platforms</Button>
      </div>
    </div>
  );
}
