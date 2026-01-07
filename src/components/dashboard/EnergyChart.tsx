import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { time: "00:00", power: 120, voltage: 228 },
  { time: "02:00", power: 85, voltage: 230 },
  { time: "04:00", power: 65, voltage: 232 },
  { time: "06:00", power: 180, voltage: 229 },
  { time: "08:00", power: 320, voltage: 227 },
  { time: "10:00", power: 450, voltage: 225 },
  { time: "12:00", power: 520, voltage: 224 },
  { time: "14:00", power: 480, voltage: 226 },
  { time: "16:00", power: 390, voltage: 228 },
  { time: "18:00", power: 560, voltage: 227 },
  { time: "20:00", power: 420, voltage: 229 },
  { time: "22:00", power: 280, voltage: 231 },
];

export function EnergyChart() {
  return (
    <div className="sensor-card col-span-full lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-card-foreground">Energy Consumption</h3>
          <p className="text-sm text-muted-foreground">Power usage over 24 hours</p>
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            />
            <Area
              type="monotone"
              dataKey="voltage"
              stroke="hsl(var(--chart-secondary))"
              strokeWidth={2}
              fill="url(#voltageGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
