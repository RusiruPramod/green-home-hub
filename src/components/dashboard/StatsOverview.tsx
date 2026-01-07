import { Zap, Droplets, Flame, TrendingDown } from "lucide-react";

const stats = [
  {
    label: "Today's Usage",
    value: "24.5",
    unit: "kWh",
    icon: Zap,
    change: "-12%",
    positive: true,
  },
  {
    label: "Water Consumed",
    value: "156",
    unit: "L",
    icon: Droplets,
    change: "+8%",
    positive: false,
  },
  {
    label: "Gas Usage",
    value: "2.4",
    unit: "m³",
    icon: Flame,
    change: "-5%",
    positive: true,
  },
  {
    label: "Cost Savings",
    value: "₹342",
    unit: "/month",
    icon: TrendingDown,
    change: "+18%",
    positive: true,
  },
];

export function StatsOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="sensor-card animate-fade-up opacity-0"
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <span
              className={`alert-badge ${
                stat.positive ? "alert-badge-success" : "alert-badge-warning"
              }`}
            >
              {stat.change}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-card-foreground font-mono">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">{stat.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
