import { Flame, AlertTriangle, Shield, Eye, Power, History } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const Gas = () => {
  const { sensorData, deviceStates, toggleDevice } = useMQTTSimulation();
  
  const gasLevel = sensorData.gas;
  const isHighGas = gasLevel > 400;
  const isDangerGas = gasLevel > 500;

  const getGasStatus = () => {
    if (isDangerGas) return { label: "DANGER", color: "destructive", bg: "bg-destructive/10" };
    if (isHighGas) return { label: "WARNING", color: "warning", bg: "bg-warning/10" };
    return { label: "SAFE", color: "success", bg: "bg-success/10" };
  };

  const status = getGasStatus();

  const motionLogs = [
    { time: "2 min ago", location: "Living Room", type: "Motion Detected" },
    { time: "15 min ago", location: "Kitchen", type: "Motion Detected" },
    { time: "1 hour ago", location: "Main Door", type: "Entry Detected" },
    { time: "2 hours ago", location: "Backyard", type: "Motion Detected" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
          <div>
            <h1 className="text-xl font-bold text-foreground">Gas & Safety</h1>
            <p className="text-sm text-muted-foreground">Gas detection & security monitoring</p>
          </div>
          {isDangerGas && (
            <Button variant="destructive" className="animate-pulse">
              <Power className="mr-2 h-4 w-4" />
              Emergency Gas OFF
            </Button>
          )}
        </header>

        <div className="space-y-6 p-6">
          {/* Gas Level Card */}
          <Card className={`${status.bg} border-2 ${isDangerGas ? "border-destructive" : isHighGas ? "border-warning" : "border-success"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isDangerGas ? "bg-destructive" : isHighGas ? "bg-warning" : "bg-success"}`}>
                    <Flame className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Sensor Reading</p>
                    <p className="text-4xl font-bold font-mono text-foreground">{gasLevel} <span className="text-lg">ppm</span></p>
                  </div>
                </div>
                <div className={`rounded-full px-6 py-2 ${isDangerGas ? "bg-destructive" : isHighGas ? "bg-warning" : "bg-success"}`}>
                  <span className="text-lg font-bold text-white">{status.label}</span>
                </div>
              </div>
              
              {/* Gas Level Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>0 ppm</span>
                  <span>Safe (&lt;400)</span>
                  <span>Warning (&lt;500)</span>
                  <span>Danger (&gt;500)</span>
                </div>
                <div className="h-4 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-4 transition-all ${isDangerGas ? "bg-destructive" : isHighGas ? "bg-warning" : "bg-success"}`}
                    style={{ width: `${Math.min((gasLevel / 600) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Controls */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-primary" />
                  Safety Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Flame className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Exhaust Fan</p>
                      <p className="text-sm text-muted-foreground">Auto-activates on high gas</p>
                    </div>
                  </div>
                  <Switch
                    checked={deviceStates.exhaustFan}
                    onCheckedChange={() => toggleDevice("exhaustFan")}
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Motion Detection</p>
                      <p className="text-sm text-muted-foreground">PIR sensor active</p>
                    </div>
                  </div>
                  <Switch
                    checked={deviceStates.motionDetection}
                    onCheckedChange={() => toggleDevice("motionDetection")}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Gas Leak Alert</p>
                      <p className="text-sm text-muted-foreground">SMS & Push notifications</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5 text-primary" />
                  Motion Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {motionLogs.map((log, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{log.location}</p>
                          <p className="text-xs text-muted-foreground">{log.type}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PIR Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">PIR Motion Sensor Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${sensorData.pir ? "bg-primary animate-pulse" : "bg-muted"}`}>
                  <Eye className={`h-10 w-10 ${sensorData.pir ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {sensorData.pir ? "Motion Detected!" : "No Motion"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sensorData.pir ? "Movement detected in monitored area" : "All areas clear"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Gas;
