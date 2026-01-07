import { Droplets, Waves, TrendingDown, TrendingUp, Timer, AlertTriangle } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { WaterLevelGauge } from "@/components/dashboard/WaterLevelGauge";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const Water = () => {
  const { sensorData, deviceStates, toggleDevice } = useMQTTSimulation();

  const waterStats = [
    { label: "Today's Usage", value: "156 L", change: "+8%", positive: false, icon: Droplets },
    { label: "Flow Rate", value: `${sensorData.flowRate} L/min`, change: "Normal", positive: true, icon: Waves },
    { label: "Tank Level", value: `${sensorData.waterLevel}%`, change: sensorData.waterLevel < 30 ? "Low" : "OK", positive: sensorData.waterLevel >= 30, icon: Timer },
    { label: "Pump Status", value: deviceStates.waterPump ? "Running" : "Stopped", change: deviceStates.waterPump ? "Active" : "Idle", positive: deviceStates.waterPump, icon: Droplets },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
          <div>
            <h1 className="text-xl font-bold text-foreground">Water Monitoring</h1>
            <p className="text-sm text-muted-foreground">Tank levels & usage tracking</p>
          </div>
        </header>

        <div className="space-y-6 p-6">
          {/* Water Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {waterStats.map((stat, index) => (
              <Card key={stat.label} className="animate-fade-up opacity-0" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                      <stat.icon className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold text-foreground font-mono">{stat.value}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {stat.positive ? (
                      <TrendingDown className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-warning" />
                    )}
                    <span className={`text-xs ${stat.positive ? "text-success" : "text-warning"}`}>
                      {stat.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Water Level & Pump Control */}
          <div className="grid gap-4 lg:grid-cols-2">
            <WaterLevelGauge level={sensorData.waterLevel} flowRate={sensorData.flowRate} />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pump Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${deviceStates.waterPump ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Droplets className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Water Pump</p>
                      <p className="text-sm text-muted-foreground">
                        {deviceStates.waterPump ? "Currently running" : "Currently stopped"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={deviceStates.waterPump}
                    onCheckedChange={() => toggleDevice("waterPump")}
                  />
                </div>

                {sensorData.waterLevel < 30 && (
                  <div className="flex items-center gap-3 rounded-lg bg-warning/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium text-warning">Low Water Level</p>
                      <p className="text-sm text-muted-foreground">Consider turning on the pump</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Auto-Fill Settings</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Auto-start when below 20%</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Auto-stop when above 90%</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                  const usage = [145, 162, 138, 156, 178, 198, 156][i];
                  const percentage = (usage / 200) * 100;
                  return (
                    <div key={day} className="flex items-center gap-4">
                      <span className="w-10 text-sm text-muted-foreground">{day}</span>
                      <div className="flex-1 h-3 rounded-full bg-muted">
                        <div 
                          className="h-3 rounded-full bg-info transition-all" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                      <span className="w-16 text-right text-sm font-medium text-foreground">{usage} L</span>
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
