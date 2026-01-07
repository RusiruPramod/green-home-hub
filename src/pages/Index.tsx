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
import { SensorCard } from "@/components/dashboard/SensorCard";
import { DeviceControl } from "@/components/dashboard/DeviceControl";
import { EnergyChart } from "@/components/dashboard/EnergyChart";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { WaterLevelGauge } from "@/components/dashboard/WaterLevelGauge";
import { StatsOverview } from "@/components/dashboard/StatsOverview";

const Index = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring & control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5">
              <span className="status-indicator status-online" />
              <span className="text-sm font-medium text-success">Live</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Stats Overview */}
          <StatsOverview />

          {/* Sensor Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SensorCard
              title="Voltage"
              value={228.5}
              unit="V"
              icon={<Zap className="h-5 w-5" />}
              trend="stable"
              trendValue="0.2%"
              status="online"
            />
            <SensorCard
              title="Current"
              value={1.52}
              unit="A"
              icon={<Activity className="h-5 w-5" />}
              trend="up"
              trendValue="+5.3%"
              status="online"
            />
            <SensorCard
              title="Power"
              value={347}
              unit="W"
              icon={<Gauge className="h-5 w-5" />}
              trend="up"
              trendValue="+8.1%"
              status="online"
            />
            <SensorCard
              title="Gas Level"
              value={320}
              unit="ppm"
              icon={<Flame className="h-5 w-5" />}
              trend="down"
              trendValue="-2.4%"
              status="online"
            />
          </div>

          {/* Charts & Water Level */}
          <div className="grid gap-4 lg:grid-cols-3">
            <EnergyChart />
            <WaterLevelGauge level={78} flowRate={12} />
          </div>

          {/* Device Controls & Alerts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Device Controls */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Device Controls</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <DeviceControl
                  name="Living Room Lights"
                  icon={Lightbulb}
                  initialState={true}
                />
                <DeviceControl
                  name="Water Pump"
                  icon={Droplets}
                  initialState={false}
                />
                <DeviceControl
                  name="Exhaust Fan"
                  icon={Fan}
                  initialState={true}
                />
                <DeviceControl
                  name="Motion Detection"
                  icon={Eye}
                  initialState={true}
                />
              </div>
            </div>

            {/* Alerts */}
            <AlertsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
