import { Lightbulb, Droplets, Fan, Eye, Power, Zap, User, UserX, BedDouble, Activity } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";

const Control = () => {
  const { sensorData, deviceStates, toggleDevice, ledStatus, ledError, togglingDevices } = useFirebaseRealtime();
  const [brightness, setBrightness] = useState([75]);
  const [fanSpeed, setFanSpeed] = useState([50]);

  const devices = useMemo(() => [
    { 
      id: "lights" as const, 
      name: "Lights", 
      fullName: "Living Room Lights",
      icon: Lightbulb, 
      isOn: deviceStates.lights,
      hasSlider: true,
      sliderValue: brightness,
      setSliderValue: setBrightness,
      sliderLabel: "Brightness"
    },
    { 
      id: "waterPump" as const, 
      name: "Pump", 
      fullName: "Water Pump",
      icon: Droplets, 
      isOn: deviceStates.waterPump,
      hasSlider: false
    },
    { 
      id: "exhaustFan" as const, 
      name: "Fan", 
      fullName: "Exhaust Fan",
      icon: Fan, 
      isOn: deviceStates.exhaustFan,
      hasSlider: true,
      sliderValue: fanSpeed,
      setSliderValue: setFanSpeed,
      sliderLabel: "Speed"
    },
    { 
      id: "motionDetection" as const, 
      name: "Motion", 
      fullName: "Motion Detection",
      icon: Eye, 
      isOn: deviceStates.motionDetection,
      hasSlider: false
    },
  ], [deviceStates, brightness, fanSpeed]);

  const getOccupancyBadge = (state: string) => {
    switch(state) {
      case 'OCCUPIED_ACTIVE': return { icon: Activity, text: "Active", color: "text-success", bg: "bg-success/10 border-success/20" };
      case 'OCCUPIED_IDLE': return { icon: User, text: "Idle", color: "text-warning", bg: "bg-warning/10 border-warning/20" };
      case 'OCCUPIED_SLEEPING': return { icon: BedDouble, text: "Sleeping", color: "text-primary", bg: "bg-primary/10 border-primary/20" };
      case 'VACANT_CONFIRMED': return { icon: UserX, text: "Vacant", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
      default: return { icon: Eye, text: state || "Unknown", color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const occupancy = getOccupancyBadge(sensorData.occupancyState || 'Unknown');

  return (
    <SidebarProvider>
      <DashboardSidebar />
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Room Management</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Manual override & status</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* LED Status Indicator (Firebase Real-time LED value) */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${occupancy.bg} shadow-sm backdrop-blur-sm`}>
              <occupancy.icon className={`h-4 w-4 ${occupancy.color}`} />
              <span className={`text-sm font-semibold ${occupancy.color}`}>{occupancy.text}</span>
            </div>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8 lg:p-10 max-w-[2000px] mx-auto">
          {/* Quick Status */}
          <div className="grid gap-2 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 sm:grid-cols-4 xl:grid-cols-4">
            {devices.map((device) => (
              <Card 
                key={device.id}
                className={`cursor-pointer transition-all select-none ${togglingDevices.has(device.id) ? "opacity-75 cursor-not-allowed" : ""} ${device.isOn ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={() => !togglingDevices.has(device.id) && void toggleDevice(device.id)}
              >
                <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
                  <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full ${device.isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <device.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-foreground">{device.name}</p>
                  <p className={`text-[10px] sm:text-xs ${device.isOn ? "text-primary" : "text-muted-foreground"}`}>
                    {device.isOn ? "ON" : "OFF"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Controls */}
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl ${device.isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <device.icon className="h-5 w-5 sm:h-7 sm:w-7" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-lg font-medium text-foreground">{device.fullName}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {device.isOn ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={device.isOn}
                      disabled={togglingDevices.has(device.id)}
                      onCheckedChange={() => void toggleDevice(device.id)}
                      className="scale-110 sm:scale-125"
                    />
                  </div>
                  
                  {device.hasSlider && device.isOn && (
                    <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">{device.sliderLabel}</span>
                        <span className="font-medium text-foreground">{device.sliderValue![0]}%</span>
                      </div>
                      <Slider
                        value={device.sliderValue}
                        onValueChange={device.setSliderValue}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="mt-3 sm:mt-4 flex gap-2">
                    {/* Simplified for thesis, removed generic settings/schedule buttons */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Control;
