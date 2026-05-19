import { useState } from "react";
import { Filter, Layout, Link as LinkIcon, Plus, Users, Wand2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/video-card";
import { VIDEOS, type VideoStatus } from "@octoflash/core";

export default function VideosPage() {
  const [filter, setFilter] = useState<VideoStatus | "all">("all");
  const counts = VIDEOS.reduce<Record<string, number>>(
    (a, v) => ((a[v.status] = (a[v.status] || 0) + 1), a), {}
  );
  const visible = filter === "all" ? VIDEOS : VIDEOS.filter((v) => v.status === filter);

  const tabs: { v: VideoStatus | "all"; label: string; count?: number }[] = [
    { v: "all",        label: "All",        count: VIDEOS.length },
    { v: "analyzing",  label: "Analyzing",  count: counts.analyzing  || 0 },
    { v: "analyzed",   label: "Analyzed",   count: counts.analyzed   || 0 },
    { v: "generating", label: "Generating", count: counts.generating || 0 },
    { v: "generated",  label: "Generated",  count: counts.generated  || 0 },
    { v: "published",  label: "Published",  count: counts.published  || 0 },
  ];

  return (
    <div className="px-7 py-6 max-w-[1280px] mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Videos</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Queue YouTube URLs, auto-process, then preview and publish.
          </p>
        </div>
        <Button size="sm"><Plus className="size-3.5 mr-1" /> New video</Button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <LinkIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Paste a YouTube URL or video ID…" className="pl-9 h-9" />
        </div>
        <Button variant="outline" className="h-9"><Wand2 className="size-3.5 mr-1" /> Analyze now</Button>
        <Button className="h-9"><Plus className="size-3.5 mr-1" /> Queue</Button>
      </div>

      <div className="flex items-center justify-between mb-4 gap-3">
        <Tabs value={filter} onValueChange={(v: string) => setFilter(v as VideoStatus | "all")}>
          <TabsList className="h-8">
            {tabs.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="text-xs">
                {t.label}
                {t.count != null && (
                  <span className="ml-1.5 text-muted-foreground text-[10px]">{t.count}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm"><Filter className="size-3 mr-1" /> Filter</Button>
          <Button variant="ghost" size="sm"><Layout className="size-3 mr-1" /> Grid</Button>
        </div>
      </div>

      {visible.length === 0 ? <EmptyState /> : (
        <div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {visible.map((v) => <VideoCard key={v.id} v={v} />)}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed rounded-lg">
      <div className="size-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
        <Film className="size-5" />
      </div>
      <h2 className="text-lg font-semibold">No videos yet</h2>
      <p className="text-[13px] text-muted-foreground max-w-sm mt-1.5 mb-5">
        Paste a YouTube URL above, or follow a channel to discover shorts worth animating.
      </p>
      <div className="flex gap-2">
        <Button><Plus className="size-3.5 mr-1" /> Paste a URL</Button>
        <Button variant="outline"><Users className="size-3.5 mr-1" /> Follow a channel</Button>
      </div>
    </div>
  );
}
