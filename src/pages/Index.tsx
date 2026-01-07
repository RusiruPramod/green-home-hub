import {
  Zap,
  Gauge,
  Activity,
  Flame,
  Eye,
  Lightbulb,
  Droplets,
  Fan,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { DeviceControl } from "@/components/dashboard/DeviceControl";
import { EnergyChart } from "@/components/dashboard/EnergyChart";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { WaterLevelGauge } from "@/components/dashboard/WaterLevelGauge";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";

const Index = () => {
  const { 
    sensorData, 
    deviceStates, 
    isConnected, 
    connectionStatus,
    lastUpdate,
    toggleDevice 
  } = useMQTTSimulation();

  // Calculate trends based on previous values (simplified for demo)
  const getTrend = (value: number, baseline: number) => {
    const diff = ((value - baseline) / baseline) * 100;
    if (Math.abs(diff) < 1) return { trend: "stable" as const, value: `${diff.toFixed(1)}%` };
    return diff > 0 
      ? { trend: "up" as const, value: `+${diff.toFixed(1)}%` }
      : { trend: "down" as const, value: `${diff.toFixed(1)}%` };
  };

  const voltageTrend = getTrend(sensorData.voltage, 230);
  const currentTrend = getTrend(sensorData.current, 1.5);
  const powerTrend = getTrend(sensorData.power, 345);
  const gasTrend = getTrend(sensorData.gas, 350);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-6 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Real-time monitoring & control
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 ${
              connectionStatus === "connected" 
                ? "bg-success/10" 
                : connectionStatus === "connecting"
                ? "bg-warning/10"
                : "bg-destructive/10"
            }`}>
              <span className={`status-indicator ${
                connectionStatus === "connected" 
                  ? "status-online" 
                  : connectionStatus === "connecting"
                  ? "status-warning"
                  : "status-offline"
              }`} />
              <span className={`text-xs sm:text-sm font-medium ${
                connectionStatus === "connected" 
                  ? "text-success" 
                  : connectionStatus === "connecting"
                  ? "text-warning"
                  : "text-destructive"
              }`}>
                {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "..." : "Off"}
              </span>
            </div>
            {lastUpdate && (
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden md:block">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
          {/* Stats Overview */}
          <StatsOverview />

          {/* Sensor Grid */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <SensorCard
              title="Voltage"
              value={sensorData.voltage}
              unit="V"
              icon={<Zap className="h-5 w-5" />}
              trend={voltageTrend.trend}
              trendValue={voltageTrend.value}
              status={isConnected ? "online" : "offline"}
            />
            <SensorCard
              title="Current"
              value={sensorData.current}
              unit="A"
              icon={<Activity className="h-5 w-5" />}
              trend={currentTrend.trend}
              trendValue={currentTrend.value}
              status={isConnected ? "online" : "offline"}
            />
            <SensorCard
              title="Power"
              value={sensorData.power}
              unit="W"
              icon={<Gauge className="h-5 w-5" />}
              trend={powerTrend.trend}
              trendValue={powerTrend.value}
              status={isConnected ? "online" : "offline"}
            />
            <SensorCard
              title="Gas Level"
              value={sensorData.gas}
              unit="ppm"
              icon={<Flame className="h-5 w-5" />}
              trend={gasTrend.trend}
              trendValue={gasTrend.value}
              status={sensorData.gas > 400 ? "warning" : isConnected ? "online" : "offline"}
            />
          </div>

          {/* Charts & Water Level */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
              <EnergyChart sensorData={sensorData} />
            </div>
            <WaterLevelGauge 
              level={sensorData.waterLevel} 
              flowRate={sensorData.flowRate} 
            />
          </div>

          {/* Device Controls & Alerts */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {/* Device Controls */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Device Controls</h2>
              <div className="grid gap-2 sm:gap-3 grid-cols-2">
                <DeviceControl
                  name="Living Room Lights"
                  icon={Lightbulb}
                  isOn={deviceStates.lights}
                  onToggle={() => toggleDevice("lights")}
                />
                <DeviceControl
                  name="Water Pump"
                  icon={Droplets}
                  isOn={deviceStates.waterPump}
                  onToggle={() => toggleDevice("waterPump")}
                />
                <DeviceControl
                  name="Exhaust Fan"
                  icon={Fan}
                  isOn={deviceStates.exhaustFan}
                  onToggle={() => toggleDevice("exhaustFan")}
                />
                <DeviceControl
                  name="Motion Detection"
                  icon={Eye}
                  isOn={deviceStates.motionDetection}
                  onToggle={() => toggleDevice("motionDetection")}
                />
              </div>
            </div>

            {/* Alerts */}
            <AlertsPanel sensorData={sensorData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
