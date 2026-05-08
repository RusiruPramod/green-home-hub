import { Settings, User, Bell, Wifi, Moon, Sun, Shield, Database, LogOut } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

const SettingsPage = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 md:h-16 lg:h-20 items-center justify-between border-b border-border bg-background/80 px-3 sm:px-6 md:px-8 lg:px-10 backdrop-blur-lg">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Accommodation Settings</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">Configure Firebase, tariffs, and room monitoring</p>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8 lg:p-10">
          {/* Profile */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Profile
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary text-xl sm:text-2xl font-bold text-primary-foreground shrink-0">
                  JD
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">John Doe</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">john.doe@example.com</p>
                </div>
                <Button variant="outline" size="sm" className="self-start sm:self-auto">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                {isDark ? <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                Appearance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Theme settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Toggle theme</p>
                </div>
                <Switch checked={isDark} onCheckedChange={setIsDark} />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {[
                { title: "Push Notifications", desc: "Browser alerts" },
                { title: "Email Alerts", desc: "Critical via email", defaultChecked: true },
                { title: "SMS Alerts", desc: "Emergency SMS" },
                { title: "Sound Alerts", desc: "Play sound", defaultChecked: true },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Connection */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Connection
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Firebase RTDB & room sync</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-5">
              <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Firebase Realtime DB</Label>
                  <Input defaultValue="https://your-project-default-rtdb.firebaseio.com" className="text-xs sm:text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Room / Property ID</Label>
                  <Input defaultValue="property_001 / room_101" className="text-xs sm:text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3 sm:p-4">
                <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-success animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-success">Room sync active</p>
                  <p className="text-xs text-muted-foreground">Use VITE_FIREBASE_* variables for deployment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Two-Factor Auth</p>
                  <p className="text-xs text-muted-foreground">Extra security</p>
                </div>
                <Switch />
              </div>
              <Button variant="outline" size="sm">Change Password</Button>
            </CardContent>
          </Card>

          {/* Data */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Data
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Export & manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-5">
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">Export All</Button>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">Clear History</Button>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Retention: 90 days • Storage: 24.5 MB / 100 MB
              </p>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 sm:pt-6">
              <div>
                <p className="font-medium text-foreground">Sign Out</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Log out</p>
              </div>
              <Button variant="destructive" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
