import { Zap, Activity, Gauge, TrendingUp, TrendingDown, Calendar, Download } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { EnergyChart } from "@/components/dashboard/EnergyChart";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Energy = () => {
  const { sensorData, isConnected } = useMQTTSimulation();

  const energyStats = [
    { label: "Today", value: "24.5 kWh", change: "-12%", positive: true },
    { label: "This Week", value: "156.2 kWh", change: "-8%", positive: true },
    { label: "This Month", value: "542.8 kWh", change: "+3%", positive: false },
    { label: "Est. Bill", value: "₹2,450", change: "-15%", positive: true },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 md:h-16 lg:h-20 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-6 md:px-8 lg:px-10 backdrop-blur-lg">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Energy</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">Power consumption & efficiency</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Calendar className="mr-2 h-4 w-4" />
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8 lg:p-10 max-w-[2000px] mx-auto">
          {/* Energy Stats */}
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            {energyStats.map((stat, index) => (
              <Card key={stat.label} className="animate-fade-up opacity-0" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                    <span className={`alert-badge text-[10px] sm:text-xs ${stat.positive ? "alert-badge-success" : "alert-badge-warning"}`}>
                      {stat.positive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-foreground font-mono">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live Readings */}
          <div>
            <h2 className="mb-3 sm:mb-4 md:mb-5 text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-foreground">Live Readings</h2>
            <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              <SensorCard
                title="Voltage"
                value={sensorData.voltage}
                unit="V"
                icon={<Zap className="h-5 w-5" />}
                status={isConnected ? "online" : "offline"}
                trendValue="Stable"
              />
              <SensorCard
                title="Current"
                value={sensorData.current}
                unit="A"
                icon={<Activity className="h-5 w-5" />}
                status={isConnected ? "online" : "offline"}
                trendValue="+0.2A vs avg"
              />
              <SensorCard
                title="Power"
                value={sensorData.power}
                unit="W"
                icon={<Gauge className="h-5 w-5" />}
                status={isConnected ? "online" : "offline"}
                trendValue="-5% vs yesterday"
              />
            </div>
          </div>

          {/* Energy Chart */}
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            <EnergyChart sensorData={sensorData} />
            
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base">Energy Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Power Factor</span>
                    <span className="font-medium text-foreground">0.95</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: '95%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Load Balance</span>
                    <span className="font-medium text-foreground">87%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-accent" style={{ width: '87%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Efficiency Score</span>
                    <span className="font-medium text-success">A+</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-success" style={{ width: '92%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Usage Hours */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4 md:pb-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">Peak Usage Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                <div className="rounded-lg bg-destructive/10 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-medium text-destructive">High Usage</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">6 PM - 10 PM</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Avg: 850W</p>
                </div>
                <div className="rounded-lg bg-warning/10 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-medium text-warning">Medium Usage</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">8 AM - 6 PM</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Avg: 420W</p>
                </div>
                <div className="rounded-lg bg-success/10 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-medium text-success">Low Usage</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">10 PM - 8 AM</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Avg: 120W</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Energy;
