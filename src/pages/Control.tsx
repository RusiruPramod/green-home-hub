import { Lightbulb, Droplets, Fan, Eye, Power, Zap, Settings2 } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
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
      name: "Living Room Lights", 
      icon: Lightbulb, 
      isOn: deviceStates.lights,
      hasSlider: true,
      sliderValue: brightness,
      setSliderValue: setBrightness,
      sliderLabel: "Brightness"
    },
    { 
      id: "waterPump" as const, 
      name: "Water Pump", 
      icon: Droplets, 
      isOn: deviceStates.waterPump,
      hasSlider: false
    },
    { 
      id: "exhaustFan" as const, 
      name: "Exhaust Fan", 
      icon: Fan, 
      isOn: deviceStates.exhaustFan,
      hasSlider: true,
      sliderValue: fanSpeed,
      setSliderValue: setFanSpeed,
      sliderLabel: "Speed"
    },
    { 
      id: "motionDetection" as const, 
      name: "Motion Detection", 
      icon: Eye, 
      isOn: deviceStates.motionDetection,
      hasSlider: false
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
          <div>
            <h1 className="text-xl font-bold text-foreground">Device Control</h1>
            <p className="text-sm text-muted-foreground">Manage all connected devices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Power className="mr-2 h-4 w-4" />
              All OFF
            </Button>
            <Button size="sm">
              <Zap className="mr-2 h-4 w-4" />
              All ON
            </Button>
          </div>
        </header>

        <div className="space-y-6 p-6">
          {/* Quick Status */}
          <div className="grid gap-4 sm:grid-cols-4">
            {devices.map((device) => (
              <Card 
                key={device.id}
                className={`cursor-pointer transition-all ${device.isOn ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={() => toggleDevice(device.id)}
              >
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${device.isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <device.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">{device.name}</p>
                  <p className={`text-xs ${device.isOn ? "text-primary" : "text-muted-foreground"}`}>
                    {device.isOn ? "ON" : "OFF"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Controls */}
          <div className="grid gap-4 lg:grid-cols-2">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${device.isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <device.icon className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground">{device.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {device.isOn ? "Currently active" : "Currently inactive"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={device.isOn}
                      onCheckedChange={() => toggleDevice(device.id)}
                      className="scale-125"
                    />
                  </div>
                  
                  {device.hasSlider && device.isOn && (
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between text-sm">
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

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scenes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Scenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { name: "Morning", desc: "Lights ON, Pump OFF", icon: "🌅" },
                  { name: "Away", desc: "All devices OFF", icon: "🏃" },
                  { name: "Night", desc: "Motion ON, Lights OFF", icon: "🌙" },
                  { name: "Party", desc: "All lights ON", icon: "🎉" },
                ].map((scene) => (
                  <Button 
                    key={scene.name} 
                    variant="outline" 
                    className="h-auto flex-col py-4"
                  >
                    <span className="text-2xl mb-1">{scene.icon}</span>
                    <span className="font-medium">{scene.name}</span>
                    <span className="text-xs text-muted-foreground">{scene.desc}</span>
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
