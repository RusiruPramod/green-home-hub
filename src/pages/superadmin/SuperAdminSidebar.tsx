import {
  LayoutDashboard,
  Building2,
  Banknote,
  BarChart3,
  LogOut,
  Shield,
  Cpu,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/superadmin" },
  { icon: Building2, label: "Hotels", path: "/superadmin/hotels" },
  { icon: Banknote, label: "Global Tariffs", path: "/superadmin/tariffs" },
  { icon: BarChart3, label: "Aggregate Analytics", path: "/superadmin/analytics" },
];

export function SuperAdminSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const { logout } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-sm">EcoHub</span>
            <Badge variant="outline" className="text-[10px] w-fit px-1.5 py-0 font-normal">
              Super Admin
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
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
