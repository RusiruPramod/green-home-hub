import { Flame, AlertTriangle, Shield, Eye, Power, History } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
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
    { time: "2 min ago", location: "Living Room", type: "Motion" },
    { time: "15 min ago", location: "Kitchen", type: "Motion" },
    { time: "1 hour ago", location: "Main Door", type: "Entry" },
    { time: "2 hours ago", location: "Backyard", type: "Motion" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 md:h-16 lg:h-20 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-6 md:px-8 lg:px-10 backdrop-blur-lg">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Gas & Safety</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">Detection & security</p>
            </div>
          </div>
          {isDangerGas && (
            <Button variant="destructive" size="sm" className="animate-pulse">
              <Power className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Emergency</span> OFF
            </Button>
          )}
        </header>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8 lg:p-10 max-w-[2000px] mx-auto">
          {/* Gas Level Card */}
          <Card className={`${status.bg} border-2 ${isDangerGas ? "border-destructive" : isHighGas ? "border-warning" : "border-success"}`}>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full ${isDangerGas ? "bg-destructive" : isHighGas ? "bg-warning" : "bg-success"}`}>
                    <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Gas Sensor</p>
                    <p className="text-2xl sm:text-4xl font-bold font-mono text-foreground">{gasLevel} <span className="text-sm sm:text-lg">ppm</span></p>
                  </div>
                </div>
                <div className={`rounded-full px-4 sm:px-6 py-1.5 sm:py-2 self-start sm:self-auto ${isDangerGas ? "bg-destructive" : isHighGas ? "bg-warning" : "bg-success"}`}>
                  <span className="text-sm sm:text-lg font-bold text-white">{status.label}</span>
                </div>
              </div>
              
              {/* Gas Level Bar */}
              <div className="mt-4 sm:mt-6">
                <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mb-2">
                  <span>0</span>
                  <span>Safe</span>
                  <span>Warning</span>
                  <span>Danger</span>
                </div>
                <div className="h-3 sm:h-4 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-3 sm:h-4 transition-all ${isDangerGas ? "bg-destructive" : isHighGas ? "bg-warning" : "bg-success"}`}
                    style={{ width: `${Math.min((gasLevel / 600) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Controls */}
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Safety Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Exhaust Fan</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">Auto on high gas</p>
                    </div>
                  </div>
                  <Switch
                    checked={deviceStates.fan}
                    onCheckedChange={() => void toggleDevice("fan")}
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Motion Detection</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">PIR sensor active</p>
                    </div>
                  </div>
                  <Switch
                    checked={deviceStates.motionDetection}
                    onCheckedChange={() => void toggleDevice("motionDetection")}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Gas Leak Alert</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">SMS & Push</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Motion Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {motionLogs.map((log, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-2 sm:p-3"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-foreground">{log.location}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{log.type}</p>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PIR Status */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4 md:pb-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">PIR Motion Sensor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                <div className={`flex h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center rounded-full ${sensorData.pir ? "bg-primary animate-pulse" : "bg-muted"}`}>
                  <Eye className={`h-7 w-7 sm:h-10 sm:w-10 md:h-12 md:w-12 ${sensorData.pir ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">
                    {sensorData.pir ? "Motion Detected!" : "No Motion"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {sensorData.pir ? "Movement in area" : "All clear"}
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
