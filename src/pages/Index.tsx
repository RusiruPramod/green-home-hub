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
    alerts,
    loading,
    error,
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
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 md:h-16 lg:h-20 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-6 md:px-8 lg:px-10 backdrop-blur-lg">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">
                Real-time monitoring & control
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Single Live Button with LED Indicator - Early Style */}
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 transition-all duration-300 shadow-lg ${
              deviceStates.light 
                ? "bg-green-500/20 border-green-500/70 shadow-green-500/40" 
                : "bg-blue-500/20 border-blue-500/70 shadow-blue-500/40"
            }`}>
              <span className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse transition-all ${
                deviceStates.light 
                  ? "bg-green-500 shadow-md shadow-green-500/60" 
                  : "bg-blue-500 shadow-md shadow-blue-500/60"
              }`} />
              <span className={`text-xs sm:text-sm font-bold transition-all ${
                deviceStates.light 
                  ? "text-green-600" 
                  : "text-blue-600"
              }`}>
                ● Live
              </span>
            </div>
            {loading && (
              <span className="text-xs text-muted-foreground hidden md:block">Syncing data...</span>
            )}
            {error && (
              <span className="text-xs text-destructive hidden lg:block">{error}</span>
            )}
            {lastUpdate && (
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden md:block">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8 lg:p-10 max-w-[2000px] mx-auto">
          {/* Stats Overview */}
          <StatsOverview />

          {/* Sensor Grid */}
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
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
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
              <EnergyChart sensorData={sensorData} />
            </div>
            <WaterLevelGauge 
              level={sensorData.waterLevel} 
              flowRate={sensorData.flowRate} 
            />
          </div>

          {/* Device Controls & Alerts */}
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            {/* Device Controls */}
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-foreground">Device Controls</h2>
              <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-2">
                <DeviceControl
                  name="Living Room Lights"
                  icon={Lightbulb}
                  isOn={deviceStates.light}
                  onToggle={() => void toggleDevice("light")}
                />
                <DeviceControl
                  name="Water Pump"
                  icon={Droplets}
                  isOn={deviceStates.pump}
                  onToggle={() => void toggleDevice("pump")}
                />
                <DeviceControl
                  name="Exhaust Fan"
                  icon={Fan}
                  isOn={deviceStates.fan}
                  onToggle={() => void toggleDevice("fan")}
                />
                <DeviceControl
                  name="Motion Detection"
                  icon={Eye}
                  isOn={deviceStates.motionDetection}
                  onToggle={() => void toggleDevice("motionDetection")}
                />
              </div>
            </div>

            {/* Alerts */}
            <AlertsPanel alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
