import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SensorData } from "@/hooks/useFirebaseRealtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartDataPoint {
  time: string;
  power: number;
  voltage: number;
}

interface EnergyChartProps {
  sensorData: SensorData;
}

const generateInitialData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 10000);
    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      power: 0,
      voltage: 0,
    });
  }
  return data;
};

export function EnergyChart({ sensorData }: EnergyChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>(generateInitialData);

  useEffect(() => {
    if (!sensorData) return;
    const now = new Date();
    const newPoint: ChartDataPoint = {
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      power: sensorData.power,
      voltage: Math.round(sensorData.voltage),
    };
    setChartData((prev) => [...prev.slice(1), newPoint]);
  }, [sensorData.power, sensorData.voltage]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Live Energy Consumption</CardTitle>
            <CardDescription>Real-time power &amp; voltage — last 2 minutes</CardDescription>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Power (W)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Voltage (V)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--card-shadow)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="power"
                name="Power (W)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#powerGradient)"
                isAnimationActive={false}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="voltage"
                name="Voltage (V)"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#voltageGradient)"
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
