import { Link, useLocation } from "react-router-dom";
import {
  Activity, Film, Folder, Globe, MoreHorizontal, Settings, Users, Wand2, Zap,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const workspace = [
  { id: "videos",    label: "Videos",    href: "/videos",    icon: Film,   badge: "12" },
  { id: "editor",    label: "Editor",    href: "/editor",    icon: Wand2 },
  { id: "channels",  label: "Channels",  href: "/channels",  icon: Users,  badge: "4"  },
  { id: "library",   label: "Library",   href: "/library",   icon: Folder },
];
const insights = [
  { id: "activity",  label: "Activity",  href: "/activity",  icon: Activity },
  { id: "published", label: "Published", href: "/published", icon: Globe },
];

export function AppSidebar() {
  const path = useLocation().pathname;
  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/videos" className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Zap className="size-4" strokeWidth={2.5} />
          </span>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="text-[13px] font-semibold leading-tight">Octoflash</div>
            <div className="text-[10px] text-muted-foreground">AI Video Studio</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspace.map((it) => (
                <SidebarMenuItem key={it.id}>
                  <SidebarMenuButton asChild isActive={isActive(it.href)} tooltip={it.label}>
                    <Link to={it.href}>
                      <it.icon /> <span>{it.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {it.badge && <SidebarMenuBadge>{it.badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insights.map((it) => (
                <SidebarMenuItem key={it.id}>
                  <SidebarMenuButton asChild isActive={isActive(it.href)} tooltip={it.label}>
                    <Link to={it.href}>
                      <it.icon /> <span>{it.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Settings">
                  <Link to="/settings"><Settings /> <span>Settings</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Jamie Strand">
              <Avatar className="size-7"><AvatarFallback>JS</AvatarFallback></Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="font-medium truncate">Jamie Strand</span>
                <span className="text-muted-foreground text-[10px] truncate">jamie@octoflash.ai</span>
              </div>
              <MoreHorizontal className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
