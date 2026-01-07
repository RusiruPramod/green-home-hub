import { Bell, AlertTriangle, CheckCircle, Info, Trash2, Filter, Search } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Alert {
  id: string;
  type: "danger" | "warning" | "info" | "success";
  title: string;
  message: string;
  time: string;
  acknowledged: boolean;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "1", type: "danger", title: "High Gas Level Detected", message: "Gas sensor reading exceeded 450 ppm in Kitchen", time: "2 min ago", acknowledged: false },
    { id: "2", type: "warning", title: "Low Water Level", message: "Tank level dropped below 25%", time: "15 min ago", acknowledged: false },
    { id: "3", type: "info", title: "Motion Detected", message: "PIR sensor triggered in Living Room", time: "30 min ago", acknowledged: true },
    { id: "4", type: "success", title: "System Online", message: "All sensors connected successfully", time: "1 hour ago", acknowledged: true },
    { id: "5", type: "warning", title: "Power Surge", message: "Voltage spike detected: 248V", time: "2 hours ago", acknowledged: true },
    { id: "6", type: "danger", title: "Gas Leak Alert", message: "Critical gas level detected - 520 ppm", time: "3 hours ago", acknowledged: true },
    { id: "7", type: "info", title: "Device Added", message: "New ESP32 device connected", time: "5 hours ago", acknowledged: true },
  ]);

  const [filter, setFilter] = useState<"all" | "danger" | "warning" | "info" | "success">("all");

  const acknowledgeAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const clearAll = () => {
    setAlerts([]);
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "danger": return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "info": return <Info className="h-5 w-5 text-info" />;
      case "success": return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "danger": return "border-l-4 border-l-destructive bg-destructive/5";
      case "warning": return "border-l-4 border-l-warning bg-warning/5";
      case "info": return "border-l-4 border-l-info bg-info/5";
      case "success": return "border-l-4 border-l-success bg-success/5";
    }
  };

  const filteredAlerts = filter === "all" ? alerts : alerts.filter(a => a.type === filter);
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">Alerts & Logs</h1>
              <p className="text-sm text-muted-foreground">System notifications & event history</p>
            </div>
            {unacknowledgedCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                {unacknowledgedCount}
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </header>

        <div className="space-y-6 p-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
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
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className={`h-3 w-3 rounded-full ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search alerts..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5" />
                {filter === "all" ? "All Alerts" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Alerts`}
                <span className="text-muted-foreground">({filteredAlerts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium text-foreground">No alerts</p>
                  <p className="text-sm text-muted-foreground">You're all caught up!</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`flex items-start justify-between rounded-lg p-4 ${getAlertStyles(alert.type)} ${alert.acknowledged ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className="font-medium text-foreground">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.acknowledged && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
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
      </main>
    </div>
  );
};

export default Alerts;
