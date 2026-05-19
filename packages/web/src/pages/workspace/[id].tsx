import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Download, History, Link as LinkIcon, RefreshCw, Send, Sparkles, Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle, ResizablePanel, ResizablePanelGroup,
} from "@/components/ui/resizable";
import { StatusPill } from "@/components/status-pill";
import { LeftConfig } from "@/components/workspace/left-config";
import { RightInspector } from "@/components/workspace/right-inspector";
import { AnalyzingState } from "@/components/workspace/states/analyzing";
import { AnalyzedState } from "@/components/workspace/states/analyzed";
import { RenderingState } from "@/components/workspace/states/rendering";
import { CompletedState } from "@/components/workspace/states/completed";
import { PublishDialog } from "@/components/publish-dialog";
import { VIDEOS, type VideoStatus } from "@octoflash/core";

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();
  const stateParam = (sp.get("state") as VideoStatus | null) ?? null;

  const video = VIDEOS.find((v) => v.id === id) ?? VIDEOS[0];
  const status: VideoStatus = stateParam ?? video.status;
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center gap-2 px-3 h-9 border-b text-xs">
        <StatusPill status={status} />
        <Separator orientation="vertical" className="h-4" />
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <LinkIcon className="size-3" />
          {video.source}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {video.duration}s · {video.tag}
        </span>
        <div className="flex-1" />
        <span className="text-muted-foreground text-[11px]">
          id <span className="font-mono">{video.id}</span>
        </span>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Button variant="ghost" size="icon" className="size-7"><History className="size-3.5" /></Button>
        <Button variant="outline" size="sm"><Download className="size-3 mr-1" /> Export</Button>
        {status === "analyzing" && (
          <Button variant="outline" size="sm"><Square className="size-3 mr-1" /> Cancel</Button>
        )}
        {status === "analyzed" && (
          <>
            <Button variant="outline" size="sm"><RefreshCw className="size-3 mr-1" /> Re-analyze</Button>
            <Button size="sm"><Sparkles className="size-3 mr-1" /> Generate</Button>
          </>
        )}
        {status === "generating" && (
          <Button variant="outline" size="sm"><Square className="size-3 mr-1" /> Stop</Button>
        )}
        {status === "generated" && (
          <>
            <Button variant="outline" size="sm"><RefreshCw className="size-3 mr-1" /> Regenerate</Button>
            <Button size="sm" onClick={() => setPublishOpen(true)}>
              <Send className="size-3 mr-1" /> Publish
            </Button>
          </>
        )}
      </div>

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={26} minSize={18} maxSize={36}>
          <LeftConfig />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={28}>
          {status === "analyzing"  && <AnalyzingState />}
          {status === "analyzed"   && <AnalyzedState />}
          {status === "generating" && <RenderingState />}
          {status === "generated"  && <CompletedState onPublish={() => setPublishOpen(true)} />}
          {(status === "queued" || status === "published" || status === "failed") && (
            <AnalyzedState />
          )}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={24} minSize={18} maxSize={36}>
          <RightInspector status={status} />
        </ResizablePanel>
      </ResizablePanelGroup>

      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} video={video} />
    </div>
  );
}
