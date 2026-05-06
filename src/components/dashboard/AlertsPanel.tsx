import { AlertTriangle, Bell, CheckCircle, Info, Radio } from "lucide-react";
import type { AlertRecord } from "@/services/realtimeDbService";

interface AlertsPanelProps {
  alerts: AlertRecord[];
}

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

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged).slice(0, 5);

  const getAlertIcon = (type: AlertRecord["type"]) => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <Bell className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertStyles = (type: AlertRecord["type"]) => {
    switch (type) {
      case "danger":
        return "border-destructive/30 bg-destructive/5";
      case "warning":
        return "border-warning/30 bg-warning/5";
      case "success":
        return "border-success/30 bg-success/5";
      default:
        return "border-info/30 bg-info/5";
    }
  };

  const getIconStyles = (type: AlertRecord["type"]) => {
    switch (type) {
      case "danger":
        return "text-destructive";
      case "warning":
        return "text-warning";
      case "success":
        return "text-success";
      default:
        return "text-info";
    }
  };

  return (
    <div className="sensor-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-card-foreground">Live Alerts</h3>
          <Radio className="h-3 w-3 text-success animate-pulse" />
        </div>
        <span className="alert-badge alert-badge-warning">
          {activeAlerts.length} Active
        </span>
      </div>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {activeAlerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active alerts
          </p>
        ) : (
          activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-sm animate-fade-in ${getAlertStyles(alert.type)}`}
            >
              <div className={`mt-0.5 ${getIconStyles(alert.type)}`}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-card-foreground">
                    {alert.title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground/70">{getRelativeTime(alert.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
