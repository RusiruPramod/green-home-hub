import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "online" | "warning" | "offline";
  className?: string;
}

export function SensorCard({
  title,
  value,
  unit,
  icon,
  trend = "stable",
  trendValue,
  status = "online",
  className = "",
}: SensorCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3.5 w-3.5 text-success" />;
      case "down":
        return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-success";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={`sensor-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="sensor-value">{value}</span>
              <span className="text-sm font-medium text-muted-foreground">{unit}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-indicator status-${status}`} />
        </div>
      </div>
      
      {trendValue && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3">
          {getTrendIcon()}
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs last hour</span>
        </div>
      )}
    </div>
  );
}
