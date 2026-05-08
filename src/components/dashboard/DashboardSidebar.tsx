import {
  LayoutDashboard,
  Zap,
  Droplets,
  Flame,
  Lightbulb,
  Bell,
  BarChart3,
  Settings,
  Cpu,
  Wifi,
  ChevronLeft,
  Server,
} from "lucide-react";
import { useState } from "react";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Zap, label: "Energy", path: "/energy" },
  { icon: Droplets, label: "Water", path: "/water" },
  { icon: Flame, label: "Gas & Safety", path: "/gas" },
  { icon: Lightbulb, label: "Devices", path: "/control" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Server, label: "API Services", path: "/services" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function DashboardSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { ledStatus, occupancyState, connectionStatus } = useMQTTSimulation();

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isMobile ? "h-full w-full overflow-hidden" : "hidden lg:sticky lg:top-0 lg:flex lg:h-screen",
        !isMobile && (collapsed ? "w-[72px]" : "w-64")
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-sidebar-border",
          isMobile ? "h-14 sm:h-16 px-4 sm:px-5" : "h-14 sm:h-16 px-4 sm:px-5"
        )}
      >
        {(!collapsed || isMobile) && (
          <div className={cn("flex items-center", isMobile ? "gap-2 sm:gap-3" : "gap-2 sm:gap-3")}>
            <div
              className={cn(
                "flex items-center justify-center rounded-lg bg-sidebar-primary",
                isMobile ? "h-9 w-9 sm:h-10 sm:w-10" : "h-9 w-9 sm:h-10 sm:w-10"
              )}
            >
              <Cpu className={cn("text-sidebar-primary-foreground", isMobile ? "h-5 w-5 sm:h-6 sm:w-6" : "h-5 w-5 sm:h-6 sm:w-6")} />
            </div>
            <div>
              <h1 className={cn("font-bold text-sidebar-foreground", isMobile ? "text-sm sm:text-base" : "text-sm sm:text-base")}>Smart IoT-Based EMS</h1>
              <p className={cn("text-sidebar-foreground/60", isMobile ? "text-[10px] sm:text-xs" : "text-[10px] sm:text-xs")}>Tourist accommodation monitoring</p>
            </div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Cpu className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "space-y-1",
          isMobile ? "hide-scrollbar flex-1 overflow-y-auto p-3 sm:p-4" : "flex-1 p-3 sm:p-4"
        )}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={cn(
                "flex w-full items-center rounded-lg font-medium transition-all",
                isMobile
                  ? "gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base"
                  : "gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground active:scale-95"
              )}
            >
              <item.icon className={cn("shrink-0", isMobile ? "h-5 w-5 sm:h-6 sm:w-6" : "h-5 w-5 sm:h-6 sm:w-6")} />
              {(!collapsed || isMobile) && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className={cn("border-t border-sidebar-border", isMobile ? "p-3 sm:p-4" : "p-3 sm:p-4")}>
        <div
          className={cn(
            "flex items-center rounded-lg bg-sidebar-accent/50",
            isMobile ? "gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3" : "gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3",
            collapsed && !isMobile && "justify-center"
          )}
        >
          <div className="relative">
            <Wifi className={cn("text-sidebar-primary", isMobile ? "h-5 w-5 sm:h-6 sm:w-6" : "h-5 w-5 sm:h-6 sm:w-6")} />
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-sidebar",
                connectionStatus === "connected"
                  ? ledStatus === 1
                    ? "bg-success animate-blink-fast-dot"
                    : "bg-success"
                  : connectionStatus === "connecting"
                  ? "bg-warning animate-pulse"
                  : "bg-muted-foreground/50",
                isMobile ? "h-2 w-2 sm:h-2.5 sm:w-2.5" : "h-2 w-2 sm:h-2.5 sm:w-2.5"
              )}
            />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1">
              <p className={cn("font-medium text-sidebar-foreground", isMobile ? "text-xs sm:text-sm" : "text-xs sm:text-sm")}>ESP32 {connectionStatus === "connected" ? "Connected" : connectionStatus === "connecting" ? "Syncing" : "Offline"}</p>
              <p className={cn("text-sidebar-foreground/60", isMobile ? "text-[10px] sm:text-xs" : "text-[10px] sm:text-xs")}>Room state: {occupancyState.replace(/_/g, " ")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      {!isMobile && (
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                collapsed && "rotate-180"
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
