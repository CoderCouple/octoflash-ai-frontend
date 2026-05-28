import { Link, useLocation } from "react-router-dom";
import { CreditCard, Film, FlaskConical, KeyRound, Mail, PencilRuler, Rss, Send, Settings, Sparkles, Workflow, Zap } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserSettingsStore } from "@/store/userSettingsStore";

const workspace = [
  { id: "projects",   label: "Projects",   href: "/projects",   icon: Film },
  { id: "editor",     label: "Editor",     href: "/editor",     icon: PencilRuler },
  { id: "workflow",   label: "Workflow",   href: "/workflow",   icon: Workflow },
  { id: "playground", label: "Playground", href: "/playground", icon: FlaskConical },
  { id: "sources",    label: "Sources",    href: "/sources",    icon: Rss },
  { id: "targets",    label: "Targets",    href: "/targets",    icon: Send },
];

export function AppSidebar() {
  const path = useLocation().pathname;
  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  const displayName = useUserSettingsStore((s) => s.displayName);
  const email = useUserSettingsStore((s) => s.email);
  const avatarUrl = useUserSettingsStore((s) => s.avatarUrl);
  const initials =
    displayName
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "??";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/projects" className="flex items-center gap-2.5 px-2 py-1.5">
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
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={path === "/billing/plans"} tooltip="Plans">
                  <Link to="/billing/plans"><Sparkles /> <span>Plans</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={path === "/billing"} tooltip="Billing">
                  <Link to="/billing"><CreditCard /> <span>Billing</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/credentials")} tooltip="Credentials">
                  <Link to="/credentials"><KeyRound /> <span>Credentials</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Settings">
                  <Link to="/settings"><Settings /> <span>Settings</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/contact")} tooltip="Contact">
                  <Link to="/contact"><Mail /> <span>Contact</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={displayName}>
              <Link to="/settings">
                <Avatar className="size-7">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="font-medium truncate">{displayName}</span>
                  <span className="text-muted-foreground text-[10px] truncate">{email}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
