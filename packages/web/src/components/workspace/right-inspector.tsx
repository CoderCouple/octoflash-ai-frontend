
import { Check, Edit, Plus, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { VideoStatus } from "@octoflash/core";

export function RightInspector({ status }: { status: VideoStatus }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3.5 py-3 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold">Inspector</h2>
        <Button variant="ghost" size="icon" className="size-7"><X className="size-3.5" /></Button>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-5">
        <Section label="Generation">
          <Row k="Engine"      v="Manim · v0.18" />
          <Row k="Model"       v="claude-sonnet-4.5" />
          <Row k="Cost"        v="$0.42" />
          <Row k="Tokens"      v="14,820 in / 3,104 out" />
          <Row k="Render time" v="2m 14s" />
        </Section>

        <Section label="Selected scene">
          <div className="w-full aspect-[9/16] rounded-md border bg-muted relative max-w-[160px]"
               style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 8px, hsl(var(--border)/.4) 8px 9px)" }}>
            <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 text-white text-[10px] font-mono px-1.5 py-px">0:08</span>
          </div>
          <div className="text-xs font-medium">Scene 02 · Spacetime grid</div>
          <div className="text-[11px] text-muted-foreground">Frames 184–432 · 8.3s</div>
        </Section>

        <Section label="Properties">
          <div>
            <Label className="text-xs mb-1.5 block">Background</Label>
            <div className="flex gap-1">
              {["#0b0e2a", "#000", "#1e1b4b", "#0c0a09"].map((c, i) => (
                <span key={i} className={"size-5 rounded cursor-pointer " + (i === 0 ? "ring-2 ring-ring" : "border")} style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Easing</Label>
            <Input defaultValue="smooth (ease-in-out)" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Run time</Label>
            <Input defaultValue="2.6s" />
          </div>
        </Section>

        <Separator />

        <Section label="History">
          {[
            { t: "Render complete",    when: "2 min ago",  Icon: Check },
            { t: "Prompt edited",      when: "4 min ago",  Icon: Edit },
            { t: "Analysis finished",  when: "12 min ago", Icon: Sparkles },
            { t: "Queued",             when: "13 min ago", Icon: Plus },
          ].map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="size-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <h.Icon className="size-3" />
              </span>
              <span className="flex-1">{h.t}</span>
              <span className="text-[10px] text-muted-foreground">{h.when}</span>
            </div>
          ))}
        </Section>

        {status === "generating" && (
          <p className="text-[11px] text-muted-foreground">
            Render is in progress. Inspector data updates live as scenes complete.
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
