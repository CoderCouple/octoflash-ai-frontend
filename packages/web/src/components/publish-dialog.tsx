
import { useState } from "react";
import {
  Check, Download, Globe, History, Linkedin, Lock, Play, Send, Youtube,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DESCRIPTION_TEXT, type Video } from "@octoflash/core";
import { cn } from "@/lib/utils";

type Platform = "youtube" | "tiktok" | "instagram" | "linkedin";

const platforms: { v: Platform; label: string; bg: string; Icon: any }[] = [
  { v: "youtube",   label: "YouTube",   bg: "#ff0033", Icon: Youtube },
  { v: "tiktok",    label: "TikTok",    bg: "#000",    Icon: Play },
  { v: "instagram", label: "Instagram", bg: "linear-gradient(135deg,#fa7e1e,#d62976,#962fbf)", Icon: Play },
  { v: "linkedin",  label: "LinkedIn",  bg: "#0a66c2", Icon: Linkedin },
];

export function PublishDialog({
  open, onOpenChange, video,
}: { open: boolean; onOpenChange: (o: boolean) => void; video: Video }) {
  const [tab, setTab] = useState<Platform>("youtube");
  const platform = platforms.find((p) => p.v === tab)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] p-0 gap-0 overflow-hidden"
        style={{ borderRadius: "calc(var(--radius) + 4px)" }}
      >
        <div className="flex items-center px-5 py-3.5 border-b">
          <div>
            <DialogTitle className="text-lg font-semibold">Publish video</DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              {video.title} · {video.duration}s · 720 × 1280
            </DialogDescription>
          </div>
        </div>

        <div className="px-5 pt-3 border-b">
          <Tabs value={tab} onValueChange={(v: string) => setTab(v as Platform)}>
            <TabsList>
              {platforms.map((p) => (
                <TabsTrigger key={p.v} value={p.v}>
                  <p.Icon className="size-3.5 mr-1.5" /> {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-[620px] flex flex-col gap-5">
              <div className="flex items-center gap-2.5 px-3 py-2.5 border rounded-md">
                <div
                  className="size-7 rounded-full text-white flex items-center justify-center shrink-0"
                  style={{ background: platform.bg }}
                >
                  <platform.Icon className="size-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">@octoflash · connected</div>
                  <div className="text-[11px] text-muted-foreground">
                    {tab === "youtube"   && "YouTube Shorts · 12.4K subs"}
                    {tab === "tiktok"    && "TikTok · 4.1K followers"}
                    {tab === "instagram" && "Instagram Reels · 8.7K"}
                    {tab === "linkedin"  && "LinkedIn · personal"}
                  </div>
                </div>
                <Badge className="bg-success/15 text-success border-success/30">Ready</Badge>
              </div>

              <div>
                <Label className="mb-1.5 block">Title</Label>
                <Input defaultValue={`${video.title} #shorts`} />
              </div>
              <div>
                <Label className="mb-1.5 block">Description</Label>
                <Textarea defaultValue={DESCRIPTION_TEXT + "\n\n#physics #shorts #science"} rows={5} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Visibility</Label>
                  <div className="flex flex-col gap-1.5">
                    <RadioRow Icon={Globe} label="Public" selected />
                    <RadioRow Icon={Send}  label="Unlisted" />
                    <RadioRow Icon={Lock}  label="Private" />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Schedule</Label>
                  <div className="flex flex-col gap-1.5">
                    <RadioRow Icon={Send}    label="Publish now" selected />
                    <RadioRow Icon={History} label="Schedule for later" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Hashtags & mentions</Label>
                <div className="flex flex-wrap gap-1">
                  {["#physics", "#blackholes", "#einstein", "#shorts", "#science", "#manim", "@minutephysics"].map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="w-[360px] border-l bg-muted/35 p-6">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
              Preview · {platform.label}
            </div>
            <div className="w-[220px] mx-auto rounded-xl border bg-card overflow-hidden">
              <div className="aspect-[9/16] relative" style={{ background: "linear-gradient(135deg,#1e1b4b,#0b0e2a)" }}>
                <div className="absolute inset-0 flex items-center justify-center text-white/70">
                  <Play className="size-8" />
                </div>
                <div className="absolute top-2 left-2 right-2 text-white text-[11px] font-medium">
                  {video.title}
                </div>
              </div>
              <div className="p-2.5 text-[11px]">
                <div className="font-medium">{video.title} #shorts</div>
                <div className="text-muted-foreground mt-0.5">@octoflash · just now</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              This is how your post will appear on {platform.label}.
            </p>
          </aside>
        </div>

        <div className="flex items-center gap-2 px-5 py-3.5 border-t">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Check className="size-3 text-success" /> Will post to 1 platform
          </span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" size="sm"><Download className="size-3 mr-1" /> Save draft</Button>
          <Button size="sm"><Send className="size-3 mr-1" /> Publish now</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RadioRow({ Icon, label, selected }: { Icon: any; label: string; selected?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-2.5 py-2 rounded-md border cursor-pointer text-[13px]",
      selected ? "border-ring bg-accent" : "hover:bg-accent/50"
    )}>
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {selected && <Check className="size-3.5" />}
    </div>
  );
}
