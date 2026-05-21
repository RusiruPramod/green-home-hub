import {
  Zap,
  Gauge,
  Activity,
  Flame,
  Eye,
  Lightbulb,
  Droplets,
  Fan,
  Thermometer,
  Wind,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { DeviceControl } from "@/components/dashboard/DeviceControl";
import { EnergyChart } from "@/components/dashboard/EnergyChart";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { WaterLevelGauge } from "@/components/dashboard/WaterLevelGauge";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { Separator } from "@/components/ui/separator";
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";
import { cn } from "@/lib/utils";

/** Returns a trend only when there is meaningful delta vs a baseline */
function getTrend(value: number, baseline: number): { trend: "up" | "down" | "stable"; label: string } {
  if (baseline === 0 || value === 0) return { trend: "stable", label: "--" };
  const diff = ((value - baseline) / baseline) * 100;
  if (Math.abs(diff) < 1) return { trend: "stable", label: `${diff.toFixed(1)}%` };
  return diff > 0
    ? { trend: "up", label: `+${diff.toFixed(1)}%` }
    : { trend: "down", label: `${diff.toFixed(1)}%` };
}

const Index = () => {
  const {
    sensorData,
    deviceStates,
    alerts,
    loading,
    error,
    isConnected,
    lastUpdate,
    toggleDevice,
    ledStatus,
    ledError,
    togglingDevices,
  } = useFirebaseRealtime();

  const voltageTrend     = getTrend(sensorData.voltage,     230);
  const currentTrend     = getTrend(sensorData.current,     1.5);
  const powerTrend       = getTrend(sensorData.power,       345);
  const gasTrend         = getTrend(sensorData.gas,         350);
  const temperatureTrend = getTrend(sensorData.temperature, 25);
  const humidityTrend    = getTrend(sensorData.humidity,    55);

  /* LED indicator colour */
  const ledColor = ledError
    ? { bg: "bg-destructive/10 border-destructive/30", dot: "bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.5)]", text: "text-destructive" }
    : ledStatus === 1
    ? { bg: "bg-success/10 border-success/30",     dot: "bg-success shadow-[0_0_8px_hsl(var(--success)/0.5)]",     text: "text-success" }
    : ledStatus === 0
    ? { bg: "bg-info/10 border-info/30",           dot: "bg-info shadow-[0_0_8px_hsl(var(--info)/0.5)]",           text: "text-info" }
    : { bg: "bg-warning/10 border-warning/30",     dot: "bg-warning shadow-[0_0_8px_hsl(var(--warning)/0.5)]",     text: "text-warning" };

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        {/* ── Page Header ─────────────────────────────────── */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileSidebarTrigger />
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Live Overview</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Real-time monitoring &amp; control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status pill */}
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all", ledColor.bg)}>
              <span className={cn("h-2 w-2 rounded-full animate-pulse", ledColor.dot)} />
              <span className={cn("hidden sm:inline", ledColor.text)}>
                {ledError ? "Disconnected" : ledStatus === 1 ? "Live" : ledStatus === 0 ? "Standby" : "Connecting"}
              </span>
            </div>

            {lastUpdate && (
              <span className="text-[11px] text-muted-foreground hidden md:block">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}

            {error && (
              <span className="text-[11px] text-destructive hidden lg:block truncate max-w-[200px]">{error}</span>
            )}
          </div>
        </header>

        {/* ── Page Content ────────────────────────────────── */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">

          {/* KPI strip */}
          <StatsOverview />

          {/* Sensor grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <SensorCard
              title="Voltage"
              value={sensorData.voltage.toFixed(1)}
              unit="V"
              icon={<Zap className="h-5 w-5" />}
              trend={voltageTrend.trend}
              trendValue={voltageTrend.label}
              status={isConnected ? "online" : "offline"}
            />
            <SensorCard
              title="Current"
              value={sensorData.current.toFixed(2)}
              unit="A"
              icon={<Activity className="h-5 w-5" />}
              trend={currentTrend.trend}
              trendValue={currentTrend.label}
              status={isConnected ? "online" : "offline"}
            />
            <SensorCard
              title="Power"
              value={sensorData.power.toFixed(0)}
              unit="W"
              icon={<Gauge className="h-5 w-5" />}
              trend={powerTrend.trend}
              trendValue={powerTrend.label}
              status={isConnected ? "online" : "offline"}
            />
            <SensorCard
              title="Gas Level"
              value={sensorData.gas}
              unit="ppm"
              icon={<Flame className="h-5 w-5" />}
              trend={gasTrend.trend}
              trendValue={gasTrend.label}
              status={sensorData.gas > 400 ? "warning" : isConnected ? "online" : "offline"}
            />
            <SensorCard
              title="Temperature"
              value={sensorData.temperature.toFixed(1)}
              unit="°C"
              icon={<Thermometer className="h-5 w-5" />}
              trend={temperatureTrend.trend}
              trendValue={temperatureTrend.label}
              status={sensorData.temperature > 32 ? "warning" : isConnected ? "online" : "offline"}
            />
            <SensorCard
              title="Humidity"
              value={sensorData.humidity.toFixed(0)}
              unit="%"
              icon={<Wind className="h-5 w-5" />}
              trend={humidityTrend.trend}
              trendValue={humidityTrend.label}
              status={sensorData.humidity > 70 ? "warning" : isConnected ? "online" : "offline"}
            />
          </div>

          {/* Charts + Water */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <EnergyChart sensorData={sensorData} />
            </div>
            <WaterLevelGauge
              level={sensorData.waterLevel}
              flowRate={sensorData.flowRate}
            />
          </div>

          {/* Device Controls + Alerts */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Devices */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase text-muted-foreground">
                Device Controls
              </h2>
              <div className="grid gap-3 grid-cols-2">
                <DeviceControl
                  name="Lights"
                  icon={Lightbulb}
                  isOn={deviceStates.lights}
                  isToggling={togglingDevices.has("lights")}
                  onToggle={() => void toggleDevice("lights")}
                />
                <DeviceControl
                  name="Water Pump"
                  icon={Droplets}
                  isOn={deviceStates.waterPump}
                  isToggling={togglingDevices.has("waterPump")}
                  onToggle={() => void toggleDevice("waterPump")}
                />
                <DeviceControl
                  name="Exhaust Fan"
                  icon={Fan}
                  isOn={deviceStates.exhaustFan}
                  isToggling={togglingDevices.has("exhaustFan")}
                  onToggle={() => void toggleDevice("exhaustFan")}
                />
                <DeviceControl
                  name="Motion Detection"
                  icon={Eye}
                  isOn={deviceStates.motionDetection}
                  isToggling={togglingDevices.has("motionDetection")}
                  onToggle={() => void toggleDevice("motionDetection")}
                />
              </div>
            </div>

            {/* Alerts */}
            <AlertsPanel alerts={alerts} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
