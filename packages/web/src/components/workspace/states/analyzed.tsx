
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Copy, Eye, Maximize2, Play, RefreshCw, Volume2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PROMPT_TEXT, TRANSCRIPT_TEXT, SCRIPT_TEXT } from "@octoflash/core";

export function AnalyzedState() {
  const [tab, setTab] = useState("preview");
  return (
    <div className="h-full flex flex-col bg-muted/30">
      <Tabs value={tab} onValueChange={setTab} className="contents">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b bg-background">
          <TabsList className="h-7">
            <TabsTrigger value="preview" className="text-xs h-5">Preview</TabsTrigger>
            <TabsTrigger value="prompt"  className="text-xs h-5">Prompt</TabsTrigger>
            <TabsTrigger value="script"  className="text-xs h-5">Script</TabsTrigger>
            <TabsTrigger value="scenes"  className="text-xs h-5">Scenes <span className="ml-1 text-muted-foreground">4</span></TabsTrigger>
          </TabsList>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm"><Eye className="size-3 mr-1" /> Compare</Button>
            <Button variant="ghost" size="icon" className="size-7"><Maximize2 className="size-3" /></Button>
          </div>
        </div>

        <TabsContent value="preview" className="flex-1 overflow-auto m-0">
          <PreviewPane />
        </TabsContent>

        <TabsContent value="prompt" className="flex-1 overflow-auto m-0 p-5">
          <div className="max-w-[720px] mx-auto">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Generated prompt — editable
            </div>
            <Textarea defaultValue={PROMPT_TEXT} rows={8} />
            <div className="flex gap-1.5 mt-2 justify-end">
              <Button variant="ghost" size="sm"><RefreshCw className="size-3 mr-1" /> Regenerate</Button>
              <Button variant="outline" size="sm"><Copy className="size-3 mr-1" /> Copy</Button>
            </div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-6 mb-2">
              Voiceover script
            </div>
            <Textarea defaultValue={TRANSCRIPT_TEXT} rows={6} />
          </div>
        </TabsContent>

        <TabsContent value="script" className="flex-1 overflow-auto m-0 p-4">
          <pre className="font-mono text-[11px] leading-relaxed bg-muted border rounded-md p-3.5 overflow-x-auto">
            {SCRIPT_TEXT}
          </pre>
        </TabsContent>

        <TabsContent value="scenes" className="flex-1 overflow-auto m-0 p-6">
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))] max-w-[920px] mx-auto">
            {[
              { t: "Title card",            d: "0:00–0:03" },
              { t: "Spacetime grid intro",  d: "0:03–0:14" },
              { t: "Mass placement & warp", d: "0:14–0:32" },
              { t: "Orbiting clock + horizon", d: "0:32–0:55" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border bg-card overflow-hidden">
                <div className="aspect-[9/16] bg-muted relative"
                     style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 8px, hsl(var(--border)/.4) 8px 9px)" }}>
                  <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 text-white text-[10px] font-mono px-1.5 py-px">
                    {s.d.split("–")[1]}
                  </span>
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-medium">{i + 1}. {s.t}</div>
                  <div className="text-[11px] text-muted-foreground">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PreviewPane() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-[280px] h-[498px] rounded-xl shadow-2xl overflow-hidden relative" style={{ background: "#0b0e2a" }}>
          <svg viewBox="0 0 280 498" className="absolute inset-0">
            <defs>
              <radialGradient id="warp" cx="50%" cy="55%" r="60%">
                <stop offset="0%"   stopColor="#fff"     stopOpacity="0.85" />
                <stop offset="20%"  stopColor="#a78bfa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0b0e2a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g stroke="rgba(255,255,255,.25)" strokeWidth="0.6" fill="none">
              {Array.from({ length: 14 }).map((_, i) => (
                <line key={"h" + i} x1="0" x2="280" y1={36 + i * 32} y2={36 + i * 32} />
              ))}
              {Array.from({ length: 10 }).map((_, i) => {
                const x = 14 + i * 28, cx = 140, cy = 280;
                const dx = x - cx;
                const c1x = x + dx * -0.18;
                return <path key={"v" + i} d={`M ${x} 30 Q ${c1x} ${cy} ${x} 470`} />;
              })}
            </g>
            <circle cx="140" cy="280" r="80" fill="url(#warp)" />
            <circle cx="140" cy="280" r="6"  fill="white" />
            <circle cx="140" cy="280" r="58" fill="none" stroke="rgba(167,139,250,.6)" strokeWidth="0.8" strokeDasharray="3 4" />
          </svg>
          <div className="absolute top-3.5 left-3.5 right-3.5 text-white text-sm font-semibold drop-shadow">
            How black holes warp time
          </div>
          <div className="absolute top-3.5 right-3.5 px-1.5 py-0.5 bg-black/50 text-white font-mono text-[10px] rounded">
            00:08 / 00:55
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-[280px]">
          <Button variant="ghost" size="icon" className="size-7"><ChevronLeft className="size-3.5" /></Button>
          <Button size="icon" className="size-7"><Play className="size-3" /></Button>
          <Button variant="ghost" size="icon" className="size-7"><ChevronRight className="size-3.5" /></Button>
          <Progress value={14} className="flex-1 h-[3px]" />
          <span className="text-[11px] font-mono text-muted-foreground">00:08 / 00:55</span>
          <Button variant="ghost" size="icon" className="size-7"><Volume2 className="size-3.5" /></Button>
        </div>

        <div className="flex gap-1.5 mt-1">
          {[
            { c: "#1e1b4b", l: "0:00" },
            { c: "#312e81", l: "0:08", sel: true },
            { c: "#581c87", l: "0:22" },
            { c: "#0c4a6e", l: "0:38" },
          ].map((s, i) => (
            <div
              key={i}
              className={"w-14 aspect-[9/16] rounded relative cursor-pointer " + (s.sel ? "ring-2 ring-ring" : "border")}
              style={{ background: s.c }}
            >
              <span className="absolute bottom-0.5 left-1 font-mono text-[9px] text-white/85">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
