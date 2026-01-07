import { Lightbulb, Droplets, Fan, Eye, Power, Zap, Settings2 } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const Control = () => {
  const { deviceStates, toggleDevice } = useMQTTSimulation();
  const [brightness, setBrightness] = useState([75]);
  const [fanSpeed, setFanSpeed] = useState([50]);

  const devices = [
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
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-6 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Control</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Manage devices</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Power className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">All OFF</span>
            </Button>
            <Button size="sm">
              <Zap className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">All ON</span>
            </Button>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
          {/* Quick Status */}
          <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            {devices.map((device) => (
              <Card 
                key={device.id}
                className={`cursor-pointer transition-all ${device.isOn ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={() => toggleDevice(device.id)}
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
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
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
                      onCheckedChange={() => toggleDevice(device.id)}
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
                    <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                      <Settings2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scenes */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">Quick Scenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
                {[
                  { name: "Morning", desc: "Lights ON", icon: "🌅" },
                  { name: "Away", desc: "All OFF", icon: "🏃" },
                  { name: "Night", desc: "Motion ON", icon: "🌙" },
                  { name: "Party", desc: "All lights", icon: "🎉" },
                ].map((scene) => (
                  <Button 
                    key={scene.name} 
                    variant="outline" 
                    className="h-auto flex-col py-3 sm:py-4"
                  >
                    <span className="text-xl sm:text-2xl mb-1">{scene.icon}</span>
                    <span className="text-xs sm:text-sm font-medium">{scene.name}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{scene.desc}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Control;
