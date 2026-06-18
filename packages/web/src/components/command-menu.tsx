import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Film, Plus, Rss, Send, Settings, Sparkles, Workflow,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import { VIDEOS } from "@octoflash/core";

export function CommandMenu({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const go = (href: string) => { onOpenChange(false); navigate(href); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => go("/projects")}>
            <Plus /><span>New project from URL</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem><Sparkles /><span>Generate from existing analysis</span><CommandShortcut>⌘G</CommandShortcut></CommandItem>
          <CommandItem><Send /><span>Publish current project</span><CommandShortcut>⌘⇧P</CommandShortcut></CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/projects")}>
            <Film /><span>Go to Projects</span><CommandShortcut>G P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/workflow")}>
            <Workflow /><span>Go to Workflows</span><CommandShortcut>G W</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/sources")}>
            <Rss /><span>Go to Sources</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/targets")}>
            <Send /><span>Go to Targets</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings /><span>Go to Settings</span><CommandShortcut>G S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recent videos">
          {VIDEOS.slice(0, 5).map((v) => (
            <CommandItem key={v.id} onSelect={() => go(`/workspace/${v.id}`)}>
              <ArrowRight /><span>{v.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
