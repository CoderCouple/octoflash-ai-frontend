import { Bell, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocation } from "react-router-dom";

export function SiteHeader({ onOpenCmd }: { onOpenCmd: () => void }) {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = ["Workspace", ...(segments.length ? segments : ["videos"])].map(
    (s) => s.charAt(0).toUpperCase() + s.slice(1)
  );

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4 mx-1" />
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
            <span
              className={
                i === crumbs.length - 1
                  ? "font-medium"
                  : "text-muted-foreground"
              }
            >
              {c}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenCmd}
        className="min-w-[240px] justify-between text-muted-foreground font-normal"
      >
        <span className="inline-flex items-center gap-2">
          <Search className="size-3.5" /> Search videos, channels…
        </span>
        <kbd className="ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Button variant="ghost" size="icon" className="size-8">
        <Bell className="size-4" />
      </Button>
      <ThemeToggle />
    </header>
  );
}
