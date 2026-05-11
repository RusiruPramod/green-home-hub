import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Zap, Lock, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { ref, get, onValue } from "firebase/database";
import { realtimeDb } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface TariffRates {
  category: string;
  currency: string;
  fixedCharge: number;
  offPeak: { start: string; end: string; rate: number };
  day: { start: string; end: string; rate: number };
  peak: { start: string; end: string; rate: number };
}

const DEFAULT_TARIFFS: TariffRates = {
  category: "H-2",
  currency: "LKR",
  fixedCharge: 5000,
  offPeak: { start: "22:30", end: "05:30", rate: 12.00 },
  day: { start: "05:30", end: "18:30", rate: 15.00 },
  peak: { start: "18:30", end: "22:30", rate: 28.00 },
};

export default function TariffSettings() {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tariffs, setTariffs] = useState<TariffRates>(DEFAULT_TARIFFS);

  // Hotel Admins always see read-only; Super Admins edit via /superadmin/tariffs
  const isReadOnly = true;

  useEffect(() => {
    if (!realtimeDb) return;

    // Read from globalSettings/tariffs (the single source of truth)
    const globalRef = ref(realtimeDb, "globalSettings/tariffs");
    const unsubscribe = onValue(globalRef, (snapshot) => {
      if (snapshot.exists()) {
        setTariffs(snapshot.val());
      }
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch tariffs:", error);
      // Fallback: try the legacy property-level path
      const legacyRef = ref(realtimeDb!, "properties/property_001/settings/tariffs");
      get(legacyRef).then((snap) => {
        if (snap.exists()) setTariffs(snap.val());
      }).finally(() => setLoading(false));
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Tariff Configuration</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">CEB Time-of-Use Settings</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Lock className="h-3 w-3" />
            Read Only
          </Badge>
        </header>

        <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
          
          {/* Managed notice */}
          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Centrally Managed Tariffs</p>
              <p className="text-xs text-muted-foreground mt-1">
                These rates are configured by the system provider and automatically pushed to your property. 
                Contact your administrator if you believe the rates are incorrect.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Time of Use (ToU) Billing</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Current CEB tariff rates applied to this property's cost calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Off-Peak Block */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    Off-Peak
                  </CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {tariffs.offPeak.start} - {tariffs.offPeak.end}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Rate</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-sm">
                      {tariffs.currency}
                    </div>
                    <Input 
                      type="number" 
                      value={tariffs.offPeak.rate}
                      disabled={isReadOnly}
                      className="pl-12 font-mono bg-muted/30 cursor-not-allowed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Day Block */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    Day
                  </CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {tariffs.day.start} - {tariffs.day.end}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Rate</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-sm">
                      {tariffs.currency}
                    </div>
                    <Input 
                      type="number" 
                      value={tariffs.day.rate}
                      disabled={isReadOnly}
                      className="pl-12 font-mono bg-muted/30 cursor-not-allowed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Peak Block */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Peak
                  </CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs bg-primary/10 text-primary hover:bg-primary/20">
                    {tariffs.peak.start} - {tariffs.peak.end}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Rate</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-sm">
                      {tariffs.currency}
                    </div>
                    <Input 
                      type="number" 
                      value={tariffs.peak.rate}
                      disabled={isReadOnly}
                      className="pl-12 font-mono bg-muted/30 cursor-not-allowed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <Card className="shadow-sm mt-8">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Fixed Monthly Charge</Label>
                  <div className="relative max-w-xs">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-sm">
                      {tariffs.currency}
                    </div>
                    <Input 
                      type="number" 
                      value={tariffs.fixedCharge}
                      disabled={isReadOnly}
                      className="pl-12 font-mono bg-muted/30 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Standard CEB fixed fee applied to the monthly bill.</p>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tariff Category</Label>
                  <Input 
                    value={tariffs.category} 
                    disabled 
                    className="max-w-xs bg-muted/30 text-muted-foreground cursor-not-allowed font-mono" 
                  />
                  <p className="text-xs text-muted-foreground">Tourist Hotels (H-2) category. Managed by system provider.</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
