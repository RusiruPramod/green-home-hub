import { BarChart3, TrendingUp, TrendingDown, Calendar, Download, Zap, Droplets, Flame, Gauge } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
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
    { name: "Pump", value: 25, color: "hsl(var(--info))" },
    { name: "Fan", value: 20, color: "hsl(var(--accent))" },
    { name: "Others", value: 20, color: "hsl(var(--muted-foreground))" },
  ];

  const insights = [
    { title: "Energy Saved", value: "18%", change: "+5%", positive: true, icon: Zap, description: "vs last month" },
    { title: "Water Efficiency", value: "92%", change: "+3%", positive: true, icon: Droplets, description: "optimal" },
    { title: "Cost Reduction", value: "₹1,240", change: "-12%", positive: true, icon: TrendingDown, description: "savings" },
    { title: "CO₂ Reduced", value: "45kg", change: "-8%", positive: true, icon: Flame, description: "footprint" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-6 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Analytics</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Usage insights</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Calendar className="mr-2 h-4 w-4" />
              This Month
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
          {/* Live Mechanical Meters */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Gauge className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Live Sensors
                <span className={`ml-auto text-[10px] sm:text-xs px-2 py-1 rounded-full ${
                  connectionStatus === "connected" 
                    ? "bg-success/10 text-success" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {connectionStatus === "connected" ? "● Live" : "..."}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
                <MechanicalMeter
                  value={sensorData.voltage}
                  min={200}
                  max={260}
                  label="Voltage"
                  unit="V"
                  warningThreshold={235}
                  dangerThreshold={245}
                  size="sm"
                />
                <MechanicalMeter
                  value={sensorData.current}
                  min={0}
                  max={10}
                  label="Current"
                  unit="A"
                  warningThreshold={7}
                  dangerThreshold={9}
                  size="sm"
                />
                <MechanicalMeter
                  value={sensorData.power}
                  min={0}
                  max={2000}
                  label="Power"
                  unit="W"
                  warningThreshold={1500}
                  dangerThreshold={1800}
                  size="sm"
                />
                <MechanicalMeter
                  value={sensorData.gas}
                  min={0}
                  max={1000}
                  label="Gas"
                  unit="ppm"
                  warningThreshold={400}
                  dangerThreshold={600}
                  size="sm"
                />
                <MechanicalMeter
                  value={sensorData.waterLevel}
                  min={0}
                  max={100}
                  label="Water"
                  unit="%"
                  warningThreshold={20}
                  dangerThreshold={10}
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {insights.map((insight, index) => (
              <Card key={insight.title} className="animate-fade-up opacity-0" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                      <insight.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <span className={`alert-badge text-[10px] sm:text-xs ${insight.positive ? "alert-badge-success" : "alert-badge-warning"}`}>
                      {insight.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {insight.change}
                    </span>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">{insight.title}</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground font-mono">{insight.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Usage Chart */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Weekly Energy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
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

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {/* Monthly Comparison */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base">Monthly Compare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }} 
                      />
                      <Bar dataKey="previous" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Previous" />
                      <Bar dataKey="current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Current" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Device Usage Distribution */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base">Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                  <div className="h-[150px] w-[150px] sm:h-[200px] sm:w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceUsage}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
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
                            borderRadius: "8px",
                            fontSize: "12px"
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex sm:flex-col gap-3 flex-wrap justify-center">
                    {deviceUsage.map((device) => (
                      <div key={device.name} className="flex items-center gap-2">
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full" style={{ backgroundColor: device.color }} />
                        <span className="text-xs sm:text-sm text-foreground">{device.name}</span>
                        <span className="text-xs font-medium text-muted-foreground">{device.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">Energy Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                {[
                  { tip: "Schedule lights off at 11 PM", savings: "₹120/mo", priority: "High" },
                  { tip: "Reduce pump runtime 30 min", savings: "₹85/mo", priority: "Medium" },
                  { tip: "Enable motion lighting", savings: "₹200/mo", priority: "High" },
                ].map((rec, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded ${rec.priority === "High" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {rec.priority}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-success">{rec.savings}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground">{rec.tip}</p>
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
