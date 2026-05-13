import { Bell, AlertTriangle, CheckCircle, Info, Trash2, Filter, Search } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import {
  acknowledgeAlert,
  clearAlerts,
  deleteAlert,
  listenAlerts,
  type AlertRecord,
} from "@/services/realtimeDbService";

const getRelativeTime = (timestamp?: number) => {
  if (!timestamp) return "Just now";

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day ago`;
};

const Alerts = () => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<"all" | "danger" | "warning" | "info" | "success">("all");

  useEffect(() => {
    const unsubscribe = listenAlerts(
      (items) => {
        setAlerts(items);
        setLoading(false);
        setError(null);
      },
      (listenerError) => {
        setError(listenerError.message || "Failed to sync alerts.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await acknowledgeAlert(id, true);
    } catch (ackError) {
      setError(ackError instanceof Error ? ackError.message : "Failed to acknowledge alert.");
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteAlert(id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete alert.");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAlerts();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Failed to clear alerts.");
    }
  };

  const getAlertIcon = (type: AlertRecord["type"]) => {
    switch (type) {
      case "danger": return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />;
      case "warning": return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />;
      case "info": return <Info className="h-4 w-4 sm:h-5 sm:w-5 text-info" />;
      case "success": return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />;
    }
  };

  const getAlertStyles = (type: AlertRecord["type"]) => {
    switch (type) {
      case "danger": return "border-l-4 border-l-destructive bg-destructive/5";
      case "warning": return "border-l-4 border-l-warning bg-warning/5";
      case "info": return "border-l-4 border-l-info bg-info/5";
      case "success": return "border-l-4 border-l-success bg-success/5";
    }
  };

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesFilter = filter === "all" ? true : alert.type === filter;
      if (!matchesFilter) return false;

      if (!query) return true;

      return (
        alert.title.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        (alert.source || "").toLowerCase().includes(query)
      );
    });
  }, [alerts, filter, search]);

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <SidebarProvider>
      <DashboardSidebar />
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <MobileSidebarTrigger />
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Alerts</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Notifications & logs</p>
              </div>
              {unacknowledgedCount > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                  {unacknowledgedCount}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </header>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8 lg:p-10 max-w-[2000px] mx-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading alerts...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Stats */}
          <div className="grid gap-2 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 sm:grid-cols-4 xl:grid-cols-4">
            {[
              { type: "danger" as const, label: "Critical", count: alerts.filter(a => a.type === "danger").length, color: "bg-destructive" },
              { type: "warning" as const, label: "Warnings", count: alerts.filter(a => a.type === "warning").length, color: "bg-warning" },
              { type: "info" as const, label: "Info", count: alerts.filter(a => a.type === "info").length, color: "bg-info" },
              { type: "success" as const, label: "Success", count: alerts.filter(a => a.type === "success").length, color: "bg-success" },
            ].map((stat) => (
              <Card 
                key={stat.type}
                className={`cursor-pointer transition-all ${filter === stat.type ? "ring-2 ring-primary" : ""}`}
                onClick={() => setFilter(filter === stat.type ? "all" : stat.type)}
              >
                <CardContent className="flex items-center gap-3 sm:gap-4 pt-4 sm:pt-6">
                  <div className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full ${stat.color}`} />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{stat.count}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 text-sm md:text-base"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex md:text-base">
              <Filter className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Filter
            </Button>
          </div>

          {/* Alerts List */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                <span className="text-muted-foreground">({filteredAlerts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
                  <p className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-foreground">No alerts</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`flex items-start justify-between rounded-lg p-3 sm:p-4 ${getAlertStyles(alert.type)} ${alert.acknowledged ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{alert.message}</p>
                        <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">{getRelativeTime(alert.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 shrink-0 ml-2">
                      {!alert.acknowledged && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => void handleAcknowledgeAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => void handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Alerts;
