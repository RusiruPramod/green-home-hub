import { BarChart3, TrendingUp, TrendingDown, Calendar, Download, Zap, Droplets, Flame, Gauge } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MechanicalMeter } from "@/components/dashboard/MechanicalMeter";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Analytics = () => {
  const { sensorData, connectionStatus } = useMQTTSimulation();
  const weeklyData = [
    { day: "Mon", energy: 24.5, water: 145, cost: 280 },
    { day: "Tue", energy: 28.2, water: 162, cost: 320 },
    { day: "Wed", energy: 22.1, water: 138, cost: 250 },
    { day: "Thu", energy: 26.8, water: 156, cost: 305 },
    { day: "Fri", energy: 30.5, water: 178, cost: 345 },
    { day: "Sat", energy: 35.2, water: 198, cost: 400 },
    { day: "Sun", energy: 25.4, water: 156, cost: 290 },
  ];

  const monthlyComparison = [
    { month: "Oct", current: 620, previous: 680 },
    { month: "Nov", current: 580, previous: 650 },
    { month: "Dec", current: 720, previous: 710 },
    { month: "Jan", current: 542, previous: 620 },
  ];

  const deviceUsage = [
    { name: "Lights", value: 35, color: "hsl(var(--primary))" },
    { name: "Water Pump", value: 25, color: "hsl(var(--info))" },
    { name: "Exhaust Fan", value: 20, color: "hsl(var(--accent))" },
    { name: "Others", value: 20, color: "hsl(var(--muted-foreground))" },
  ];

  const insights = [
    { title: "Energy Saved", value: "18%", change: "+5%", positive: true, icon: Zap, description: "vs last month" },
    { title: "Water Efficiency", value: "92%", change: "+3%", positive: true, icon: Droplets, description: "optimal usage" },
    { title: "Cost Reduction", value: "₹1,240", change: "-12%", positive: true, icon: TrendingDown, description: "monthly savings" },
    { title: "Carbon Footprint", value: "45kg", change: "-8%", positive: true, icon: Flame, description: "CO₂ reduced" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
          <div>
            <h1 className="text-xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Usage insights & trends</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              This Month
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </header>

        <div className="space-y-6 p-6">
          {/* Live Mechanical Meters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-5 w-5 text-primary" />
                Live Sensor Readings
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                  connectionStatus === "connected" 
                    ? "bg-success/10 text-success" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {connectionStatus === "connected" ? "● Live" : "Connecting..."}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                <MechanicalMeter
                  value={sensorData.voltage}
                  min={200}
                  max={260}
                  label="Voltage"
                  unit="V"
                  warningThreshold={235}
                  dangerThreshold={245}
                  size="md"
                />
                <MechanicalMeter
                  value={sensorData.current}
                  min={0}
                  max={10}
                  label="Current"
                  unit="A"
                  warningThreshold={7}
                  dangerThreshold={9}
                  size="md"
                />
                <MechanicalMeter
                  value={sensorData.power}
                  min={0}
                  max={2000}
                  label="Power"
                  unit="W"
                  warningThreshold={1500}
                  dangerThreshold={1800}
                  size="md"
                />
                <MechanicalMeter
                  value={sensorData.gas}
                  min={0}
                  max={1000}
                  label="Gas Level"
                  unit="ppm"
                  warningThreshold={400}
                  dangerThreshold={600}
                  size="md"
                />
                <MechanicalMeter
                  value={sensorData.waterLevel}
                  min={0}
                  max={100}
                  label="Water Tank"
                  unit="%"
                  warningThreshold={20}
                  dangerThreshold={10}
                  size="md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight, index) => (
              <Card key={insight.title} className="animate-fade-up opacity-0" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <insight.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className={`alert-badge ${insight.positive ? "alert-badge-success" : "alert-badge-warning"}`}>
                      {insight.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {insight.change}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{insight.title}</p>
                    <p className="text-2xl font-bold text-foreground font-mono">{insight.value}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Weekly Energy Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#energyGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                      <Bar dataKey="previous" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Previous Year" />
                      <Bar dataKey="current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Current Year" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Device Usage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="h-[200px] w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceUsage}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {deviceUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {deviceUsage.map((device) => (
                      <div key={device.name} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: device.color }} />
                        <span className="text-sm text-foreground">{device.name}</span>
                        <span className="text-sm font-medium text-muted-foreground">{device.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Energy Saving Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { tip: "Schedule lights to turn off at 11 PM", savings: "₹120/month", priority: "High" },
                  { tip: "Reduce pump runtime by 30 minutes", savings: "₹85/month", priority: "Medium" },
                  { tip: "Enable motion-based lighting", savings: "₹200/month", priority: "High" },
                ].map((rec, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${rec.priority === "High" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {rec.priority}
                      </span>
                      <span className="text-sm font-medium text-success">{rec.savings}</span>
                    </div>
                    <p className="text-sm text-foreground">{rec.tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
