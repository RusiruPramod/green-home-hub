import { Droplets, Waves, TrendingDown, TrendingUp, Timer, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { WaterLevelGauge } from "@/components/dashboard/WaterLevelGauge";
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";
import { useWaterData } from "@/hooks/useWaterData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Water = () => {
  const { sensorData, deviceStates, toggleDevice } = useFirebaseRealtime();
  const { todayUsage, weeklyUsage, loading: waterLoading } = useWaterData();

  // Debug: Log when water sensor data updates
  useEffect(() => {
    console.log("💧 Water Data Updated:", {
      waterLevel: sensorData.waterLevel,
      flowRate: sensorData.flowRate,
      totalLiters: sensorData.totalLiters,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [sensorData.waterLevel, sensorData.flowRate, sensorData.totalLiters]);

  const waterLevel = Math.max(0, Math.min(100, sensorData.waterLevel));
  const isEmergency = waterLevel === 0;
  const isWarning = waterLevel > 0 && waterLevel <= 50;

  const waterStats = [
    { label: "Today's Usage", value: `${sensorData.totalLiters.toFixed(2)} L`, change: sensorData.totalLiters > 100 ? "High usage" : "Normal", positive: false, icon: Droplets },
    { label: "Flow Rate", value: `${sensorData.flowRate.toFixed(2)} L/min`, change: "Real-time", positive: true, icon: Waves },
    { label: "Tank Level", value: `${waterLevel}%`, change: isEmergency ? "Emergency" : isWarning ? "Low" : "OK", positive: waterLevel > 50, icon: Timer },
    { label: "Pump Status", value: deviceStates.waterPump ? "Running" : "Stopped", change: deviceStates.waterPump ? "Active" : "Idle", positive: deviceStates.waterPump, icon: Droplets },
  ];

  return (
    <SidebarProvider>
      <DashboardSidebar />
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Water</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Tank levels & usage</p>
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
                {isEmergency ? (
                  <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Emergency Water Level</AlertTitle>
                    <AlertDescription>Tank level is 0%. Refill immediately to avoid downtime.</AlertDescription>
                  </Alert>
                ) : isWarning ? (
                  <Alert className="border-warning/30 bg-warning/10 text-warning-foreground">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertTitle>Low Water Level</AlertTitle>
                    <AlertDescription>Tank level has dropped to 50% or below. Start refilling soon.</AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full ${deviceStates.waterPump ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Droplets className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-foreground">Water Pump</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {deviceStates.waterPump ? "Running" : "Stopped"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={deviceStates.waterPump}
                    onCheckedChange={() => void toggleDevice("waterPump")}
                  />
                </div>

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
                {waterLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading water usage data...</div>
                  </div>
                ) : weeklyUsage.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">No water usage data available yet</div>
                  </div>
                ) : (
                  weeklyUsage.map((day) => {
                    const maxUsage = Math.max(...weeklyUsage.map(d => d.usage), 200);
                    const percentage = (day.usage / maxUsage) * 100;
                    return (
                      <div key={day.day} className="flex items-center gap-2 sm:gap-4">
                        <span className="w-8 sm:w-10 text-xs sm:text-sm text-muted-foreground">{day.day}</span>
                        <div className="flex-1 h-2 sm:h-3 rounded-full bg-muted">
                          <div 
                            className="h-2 sm:h-3 rounded-full bg-info transition-all" 
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                        <span className="w-12 sm:w-16 text-right text-xs sm:text-sm font-medium text-foreground">
                          {Math.round(day.usage)} L
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Water;
