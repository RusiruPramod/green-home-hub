import { Zap, Droplets, Flame, Activity, User, BedDouble, UserX, Eye } from "lucide-react";
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const occupancyConfig: Record<string, { text: string; color: string; bg: string; icon: typeof Activity }> = {
  OCCUPIED_ACTIVE:   { text: "Active",   color: "text-success",          bg: "bg-success/10",         icon: Activity },
  OCCUPIED_IDLE:     { text: "Idle",     color: "text-warning",          bg: "bg-warning/10",         icon: User },
  OCCUPIED_SLEEPING: { text: "Sleeping", color: "text-primary",          bg: "bg-primary/10",         icon: BedDouble },
  VACANT_CONFIRMED:  { text: "Vacant",   color: "text-destructive",      bg: "bg-destructive/10",     icon: UserX },
  VACANT:            { text: "Vacant",   color: "text-muted-foreground", bg: "bg-muted",              icon: UserX },
};

export function StatsOverview() {
  const { sensorData } = useFirebaseRealtime();

  const occupancy = occupancyConfig[sensorData.occupancyState ?? ""] ?? {
    text: "Unknown",
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: Eye,
  };
  const OccupancyIcon = occupancy.icon;

  const stats = [
    {
      label: "Live Power Draw",
      value: `${sensorData.power.toFixed(0)} W`,
      icon: Zap,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      valueColor: sensorData.power > 1000 ? "text-destructive" : "text-foreground",
    },
    {
      label: "Room Occupancy",
      value: occupancy.text,
      icon: OccupancyIcon,
      iconBg: occupancy.bg,
      iconColor: occupancy.color,
      valueColor: occupancy.color,
    },
    {
      label: "Water Reserve",
      value: `${(sensorData.waterLevel || 0).toFixed(0)} L`,
      icon: Droplets,
      iconBg: "bg-info/10",
      iconColor: "text-info",
      valueColor: (sensorData.waterLevel || 0) < 20 ? "text-destructive" : "text-foreground",
    },
    {
      label: "Gas / Air Quality",
      value: `${(sensorData.gas || 0)} ppm`,
      icon: Flame,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      valueColor: (sensorData.gas || 0) > 400 ? "text-destructive" : "text-foreground",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          className="animate-fade-up opacity-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          style={{ animationDelay: `${index * 80}ms`, animationFillMode: "forwards" }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", stat.iconBg)}>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
            <p className={cn("font-mono text-2xl font-bold tracking-tight tabular-nums", stat.valueColor)}>
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
