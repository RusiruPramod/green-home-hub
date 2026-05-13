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
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      power: Math.floor(Math.random() * 200 + 250),
      voltage: Math.floor(Math.random() * 10 + 225),
    });
  }
  return data;
};

export function EnergyChart({ sensorData }: EnergyChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>(generateInitialData);

  // Update chart with new sensor data
  useEffect(() => {
    if (!sensorData) return;
    
    const now = new Date();
    const newPoint: ChartDataPoint = {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      power: sensorData.power,
      voltage: Math.round(sensorData.voltage),
    };

    setChartData((prev) => {
      const updated = [...prev.slice(1), newPoint];
      return updated;
    });
  }, [sensorData.power, sensorData.voltage]);

  return (
    <div className="sensor-card col-span-full lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-card-foreground">Live Energy Consumption</h3>
          <p className="text-sm text-muted-foreground">Real-time power & voltage data</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-primary" />
            <span className="text-xs text-muted-foreground">Power (W)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-secondary" />
            <span className="text-xs text-muted-foreground">Voltage (V)</span>
          </div>
        </div>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-secondary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="power"
              stroke="hsl(var(--chart-primary))"
              strokeWidth={2}
              fill="url(#powerGradient)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="voltage"
              stroke="hsl(var(--chart-secondary))"
              strokeWidth={2}
              fill="url(#voltageGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
