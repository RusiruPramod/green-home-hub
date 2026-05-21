import {
  LayoutDashboard,
  Zap,
  Droplets,
  Flame,
  Bell,
  BarChart3,
  Settings,
  Cpu,
  Wifi,
  ChevronLeft,
  Server,
  Banknote,
  TestTube,
  LogOut,
  Bug,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Live Overview",    path: "/" },
  { icon: Droplets,        label: "Water Monitoring", path: "/water" },
  { icon: Server,          label: "Room Management",  path: "/rooms" },
  { icon: BarChart3,       label: "Analytics",        path: "/analytics" },
  { icon: Bell,            label: "Alerts",           path: "/alerts" },
  { icon: TestTube,        label: "Evaluation",       path: "/evaluation" },
  { icon: Banknote,        label: "Tariff Info",      path: "/settings/tariffs" },
  { icon: Bug,             label: "Firebase Debug",   path: "/debug" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { ledStatus } = useFirebaseRealtime();
  const { setOpenMobile } = useSidebar();
  const { logout, userRole } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Cpu className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-sm">Green Home Hub</span>
            <span className="text-xs text-muted-foreground">SME Energy Mgmt</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <NavLink to={item.path} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2 p-2">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mx-2 mb-2">
            <div className="relative flex shrink-0 items-center justify-center h-8 w-8">
              <Wifi className="h-4 w-4 text-primary" />
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-background h-2 w-2",
                  ledStatus === 1 ? "bg-success animate-pulse" : "bg-success"
                )}
              />
            </div>
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <span className="font-medium text-xs truncate">ESP32 Node</span>
              <span className="text-[10px] text-muted-foreground truncate">Connected • 45ms</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
