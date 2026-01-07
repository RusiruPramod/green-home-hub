import { AlertTriangle, Bell, CheckCircle, Info, X } from "lucide-react";
import { useState } from "react";

interface Alert {
  id: string;
  type: "danger" | "warning" | "success" | "info";
  title: string;
  message: string;
  time: string;
}

const initialAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    title: "High Gas Level Detected",
    message: "Kitchen gas sensor reading above threshold (420 ppm)",
    time: "2 min ago",
  },
  {
    id: "2",
    type: "success",
    title: "Water Tank Full",
    message: "Water level reached 95% capacity",
    time: "15 min ago",
  },
  {
    id: "3",
    type: "info",
    title: "Motion Detected",
    message: "PIR sensor triggered in living room",
    time: "32 min ago",
  },
];

export function AlertsPanel() {
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const getAlertIcon = (type: Alert["type"]) => {
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

  const getAlertStyles = (type: Alert["type"]) => {
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

  const getIconStyles = (type: Alert["type"]) => {
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
        <h3 className="font-semibold text-card-foreground">Recent Alerts</h3>
        <span className="alert-badge alert-badge-warning">
          {alerts.length} Active
        </span>
      </div>
      
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active alerts
          </p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-sm ${getAlertStyles(alert.type)}`}
            >
              <div className={`mt-0.5 ${getIconStyles(alert.type)}`}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-card-foreground">
                    {alert.title}
                  </p>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground/70">{alert.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
