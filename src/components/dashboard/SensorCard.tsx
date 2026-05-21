import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

const statusConfig = {
  online:  { dot: "bg-success", glow: "shadow-[0_0_6px_hsl(var(--success)/0.5)]" },
  warning: { dot: "bg-warning", glow: "shadow-[0_0_6px_hsl(var(--warning)/0.5)]" },
  offline: { dot: "bg-destructive", glow: "shadow-[0_0_6px_hsl(var(--destructive)/0.5)]" },
};

const trendConfig = {
  up:     { icon: TrendingUp,   color: "text-success" },
  down:   { icon: TrendingDown, color: "text-destructive" },
  stable: { icon: Minus,        color: "text-muted-foreground" },
};

export function SensorCard({
  title,
  value,
  unit,
  icon,
  trend = "stable",
  trendValue,
  status = "online",
  className,
}: SensorCardProps) {
  const TrendIcon = trendConfig[trend].icon;
  const { dot, glow } = statusConfig[status];

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-5">
        {/* Top row: icon + status dot */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
          <span className={cn("h-2 w-2 rounded-full mt-1.5", dot, glow)} />
        </div>

        {/* Label — small, uppercase, tracked */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          {title}
        </p>

        {/* Value + Unit row */}
        <div className="flex items-end gap-1.5 leading-none">
          <span className="font-mono text-[26px] font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
          <span className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
            {unit}
          </span>
        </div>

        {/* Trend footer */}
        {trendValue && trendValue !== "--" && (
          <div className="mt-3 pt-3 flex items-center gap-1.5 border-t border-border/40">
            <TrendIcon className={cn("h-3 w-3 shrink-0", trendConfig[trend].color)} />
            <span className={cn("text-[11px] font-semibold tabular-nums", trendConfig[trend].color)}>
              {trendValue}
            </span>
            <span className="text-[11px] text-muted-foreground">vs baseline</span>
          </div>
        )}

        {/* No-data state */}
        {trendValue === "--" && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <span className="text-[11px] text-muted-foreground/60">Awaiting data…</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
