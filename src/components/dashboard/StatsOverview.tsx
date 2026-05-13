import { Zap, Droplets, Flame, Activity, User, BedDouble, UserX, Eye } from "lucide-react";
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";

export function StatsOverview() {
  const { sensorData } = useFirebaseRealtime();

  const getOccupancyInfo = (state: string) => {
    switch(state) {
      case 'OCCUPIED_ACTIVE': return { text: "Active", color: "text-success", icon: Activity };
      case 'OCCUPIED_IDLE': return { text: "Idle", color: "text-warning", icon: User };
      case 'OCCUPIED_SLEEPING': return { text: "Sleeping", color: "text-primary", icon: BedDouble };
      case 'VACANT_CONFIRMED': return { text: "Vacant", color: "text-destructive", icon: UserX };
      default: return { text: state || "Unknown", color: "text-muted-foreground", icon: Eye };
    }
  };

  const occupancy = getOccupancyInfo(sensorData.occupancyState || 'Unknown');

  const stats = [
    {
      label: "Live Power Draw",
      value: sensorData.power.toFixed(0),
      unit: "W",
      icon: Zap,
      statusColor: sensorData.power > 1000 ? "text-destructive" : "text-foreground",
    },
    {
      label: "Room Occupancy",
      value: occupancy.text,
      unit: "",
      icon: occupancy.icon,
      statusColor: occupancy.color,
    },
    {
      label: "Water Reserve",
      value: (sensorData.waterLevel || 0).toString(),
      unit: "%",
      icon: Droplets,
      statusColor: (sensorData.waterLevel || 0) < 20 ? "text-destructive" : "text-foreground",
    },
    {
      label: "Gas / Air Quality",
      value: (sensorData.gas || 0).toString(),
      unit: "ppm",
      icon: Flame,
      statusColor: (sensorData.gas || 0) > 400 ? "text-destructive" : "text-foreground",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-all animate-fade-up opacity-0"
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted`}>
              <stat.icon className="h-6 w-6 text-foreground" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold font-mono tracking-tight ${stat.statusColor}`}>
                {stat.value}
              </span>
              {stat.unit && <span className="text-sm font-normal text-muted-foreground">{stat.unit}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
