import { Droplets, Waves, TrendingDown, TrendingUp, Timer, AlertTriangle } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { WaterLevelGauge } from "@/components/dashboard/WaterLevelGauge";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const formatRelativeTime = (timestamp?: number | null) => {
  if (!timestamp) return "Waiting for live data";

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
};

const Water = () => {
  const { sensorData, deviceStates, toggleDevice } = useMQTTSimulation();

  const waterStats = [
    { label: "Total Flow", value: `${sensorData.flowTotalLiters.toFixed(2)} L`, change: "Live", positive: true, icon: Droplets },
    { label: "Flow Rate", value: `${sensorData.flowRate.toFixed(2)} L/min`, change: formatRelativeTime(sensorData.flowUpdatedAt), positive: true, icon: Waves },
    { label: "Tank Level", value: `${sensorData.waterLevel}%`, change: sensorData.waterLevel < 30 ? "Low" : "OK", positive: sensorData.waterLevel >= 30, icon: Timer },
    { label: "Pump Status", value: deviceStates.pump ? "Running" : "Stopped", change: deviceStates.pump ? "Active" : "Idle", positive: deviceStates.pump, icon: Droplets },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 md:h-16 lg:h-20 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-6 md:px-8 lg:px-10 backdrop-blur-lg">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Water</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">Tank levels & usage</p>
            </div>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8 lg:p-10 max-w-[2000px] mx-auto">
          {/* Water Stats */}
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            {waterStats.map((stat, index) => (
              <Card key={stat.label} className="animate-fade-up opacity-0" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-info/10">
                      <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-info" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-base sm:text-xl font-bold text-foreground font-mono">{stat.value}</p>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-center gap-1">
                    {stat.positive ? (
                      <TrendingDown className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-warning" />
                    )}
                    <span className={`text-[10px] sm:text-xs ${stat.positive ? "text-success" : "text-warning"}`}>
                      {stat.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Water Level & Pump Control */}
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            <WaterLevelGauge level={sensorData.waterLevel} flowRate={sensorData.flowRate} />
            
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base">Pump Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full ${deviceStates.pump ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Droplets className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-foreground">Water Pump</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {deviceStates.pump ? "Running" : "Stopped"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={deviceStates.pump}
                    onCheckedChange={() => void toggleDevice("pump")}
                  />
                </div>

                {sensorData.waterLevel < 30 && (
                  <div className="flex items-center gap-2 sm:gap-3 rounded-lg bg-warning/10 p-3 sm:p-4">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-warning">Low Water Level</p>
                      <p className="text-xs text-muted-foreground">Turn on pump</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Auto-Fill</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Start below 20%</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Stop above 90%</span>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Flow Details</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Current Rate</p>
                      <p className="text-sm sm:text-lg font-bold text-foreground font-mono">{sensorData.flowRate.toFixed(2)} L/min</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Total Liters</p>
                      <p className="text-sm sm:text-lg font-bold text-foreground font-mono">{sensorData.flowTotalLiters.toFixed(2)} L</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] sm:text-xs text-muted-foreground">
                    {formatRelativeTime(sensorData.flowUpdatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage History */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4 md:pb-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">Weekly Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:gap-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                  const usage = [145, 162, 138, 156, 178, 198, 156][i];
                  const percentage = (usage / 200) * 100;
                  return (
                    <div key={day} className="flex items-center gap-2 sm:gap-4">
                      <span className="w-8 sm:w-10 text-xs sm:text-sm text-muted-foreground">{day}</span>
                      <div className="flex-1 h-2 sm:h-3 rounded-full bg-muted">
                        <div 
                          className="h-2 sm:h-3 rounded-full bg-info transition-all" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                      <span className="w-12 sm:w-16 text-right text-xs sm:text-sm font-medium text-foreground">{usage} L</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Water;
