import { AlertTriangle, Bell, CheckCircle, Info, X, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import type { SensorData } from "@/hooks/useMQTTSimulation";

interface Alert {
  id: string;
  type: "danger" | "warning" | "success" | "info";
  title: string;
  message: string;
  time: string;
}

interface AlertsPanelProps {
  sensorData: SensorData;
}

export function AlertsPanel({ sensorData }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "initial-1",
      type: "info",
      title: "System Started",
      message: "MQTT simulation initialized successfully",
      time: "Just now",
    },
  ]);

  // Generate alerts based on sensor data
  useEffect(() => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // High gas alert
    if (sensorData.gas > 420) {
      const gasAlertId = `gas-${Date.now()}`;
      setAlerts((prev) => {
        const hasRecentGasAlert = prev.some(a => a.title.includes("Gas") && a.type === "warning");
        if (hasRecentGasAlert) return prev;
        return [
          {
            id: gasAlertId,
            type: "warning",
            title: "High Gas Level Detected",
            message: `Kitchen gas sensor reading above threshold (${Math.round(sensorData.gas)} ppm)`,
            time: now,
          },
          ...prev.slice(0, 4),
        ];
      });
    }

    // Low water alert
    if (sensorData.waterLevel < 25) {
      const waterAlertId = `water-${Date.now()}`;
      setAlerts((prev) => {
        const hasRecentWaterAlert = prev.some(a => a.title.includes("Water") && a.type === "danger");
        if (hasRecentWaterAlert) return prev;
        return [
          {
            id: waterAlertId,
            type: "danger",
            title: "Low Water Level",
            message: `Water tank at ${sensorData.waterLevel.toFixed(0)}% - consider refilling`,
            time: now,
          },
          ...prev.slice(0, 4),
        ];
      });
    }

    // Water tank full
    if (sensorData.waterLevel > 95) {
      const fullAlertId = `full-${Date.now()}`;
      setAlerts((prev) => {
        const hasRecentFullAlert = prev.some(a => a.title.includes("Full"));
        if (hasRecentFullAlert) return prev;
        return [
          {
            id: fullAlertId,
            type: "success",
            title: "Water Tank Full",
            message: `Water level reached ${sensorData.waterLevel.toFixed(0)}% capacity`,
            time: now,
          },
          ...prev.slice(0, 4),
        ];
      });
    }

    // PIR motion detected
    if (sensorData.pir) {
      const pirAlertId = `pir-${Date.now()}`;
      setAlerts((prev) => [
        {
          id: pirAlertId,
          type: "info",
          title: "Motion Detected",
          message: "PIR sensor triggered in living room",
          time: now,
        },
        ...prev.slice(0, 4),
      ]);
    }

    // High power consumption
    if (sensorData.power > 500) {
      const powerAlertId = `power-${Date.now()}`;
      setAlerts((prev) => {
        const hasRecentPowerAlert = prev.some(a => a.title.includes("Power") && a.type === "warning");
        if (hasRecentPowerAlert) return prev;
        return [
          {
            id: powerAlertId,
            type: "warning",
            title: "High Power Consumption",
            message: `Current power usage: ${sensorData.power}W`,
            time: now,
          },
          ...prev.slice(0, 4),
        ];
      });
    }
  }, [sensorData]);

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
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-card-foreground">Live Alerts</h3>
          <Radio className="h-3 w-3 text-success animate-pulse" />
        </div>
        <span className="alert-badge alert-badge-warning">
          {alerts.length} Active
        </span>
      </div>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active alerts
          </p>
        ) : (
          alerts.map((alert) => (
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
