
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TRANSCRIPT_TEXT, DESCRIPTION_TEXT } from "@octoflash/core";

export function LeftConfig() {
  const [tab, setTab] = useState("source");
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2.5 border-b">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7">
            <TabsTrigger value="source"   className="text-xs h-5">Source</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs h-5">Analysis</TabsTrigger>
            <TabsTrigger value="config"   className="text-xs h-5">Config</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === "source" && (
          <div className="flex flex-col gap-4">
            <Field label="Source URL" hint="(read-only)">
              <Input defaultValue="https://youtube.com/shorts/abc1xyz" disabled />
            </Field>
            <div
              className="w-[120px] aspect-[9/16] rounded-md border bg-muted relative"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent 0 8px, hsl(var(--border)/.4) 8px 9px)",
              }}
            >
              <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 text-white text-[10px] font-mono px-1.5 py-px">
                0:47
              </span>
            </div>
            <Field label="Title">
              <Input defaultValue="How black holes warp time" />
            </Field>
            <Field label="Channel">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted rounded-md">
                <span className="size-5 rounded-full bg-violet-700 text-white text-[10px] font-semibold flex items-center justify-center">CZ</span>
                <span className="text-xs font-medium">ContextZeroAI</span>
              </div>
            </Field>
            <Field label="Tags">
              <div className="flex flex-wrap gap-1">
                {["Physics", "Spacetime", "+ Add"].map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>
                ))}
              </div>
            </Field>
          </div>
        )}

        {tab === "analysis" && (
          <div className="flex flex-col gap-3.5">
            <SectionHeading>Transcript</SectionHeading>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{TRANSCRIPT_TEXT}</p>
            <SectionHeading>Summary</SectionHeading>
            <p className="text-xs leading-relaxed text-muted-foreground">{DESCRIPTION_TEXT}</p>
            <SectionHeading>Detected concepts</SectionHeading>
            <div className="flex flex-wrap gap-1">
              {["gravitational time dilation", "event horizon", "Schwarzschild metric", "curvature", "satellite clocks"].map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] font-normal">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {tab === "config" && (
          <div className="flex flex-col gap-3.5">
            <Field label="Aspect ratio">
              <div className="flex gap-1.5">
                {["9:16", "1:1", "16:9"].map((r, i) => (
                  <span
                    key={r}
                    className={
                      "text-[11px] px-2 py-0.5 rounded cursor-pointer " +
                      (i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")
                    }
                  >
                    {r}
                  </span>
                ))}
              </div>
            </Field>
            <Field label="Resolution"><Input defaultValue="720 × 1280" /></Field>
            <Field label="Voice"><Input defaultValue="Aria · narration · neutral" /></Field>
            <Field label="Music bed"><Input defaultValue="Ambient — drift_03.mp3" /></Field>
            <ToggleRow label="Auto-captions" defaultChecked />
            <ToggleRow label="Watermark" />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs mb-1.5 block">
        {label}{hint && <span className="ml-1.5 text-muted-foreground font-normal">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </div>
  );
}
function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
