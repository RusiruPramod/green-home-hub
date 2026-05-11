import { useState, useEffect } from "react";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Save, Banknote, Clock, Moon, Sun, Zap } from "lucide-react";
import { ref, get, set } from "firebase/database";
import { realtimeDb } from "@/services/firebase";

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

export default function GlobalTariffs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tariffs, setTariffs] = useState<TariffRates>(DEFAULT_TARIFFS);

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        if (!realtimeDb) return;
        // Read from globalSettings (Super Admin controls this)
        const dbRef = ref(realtimeDb, "globalSettings/tariffs");
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          setTariffs(snapshot.val());
        } else {
          // Also try legacy path
          const legacyRef = ref(realtimeDb, "properties/property_001/settings/tariffs");
          const legacySnap = await get(legacyRef);
          if (legacySnap.exists()) {
            setTariffs(legacySnap.val());
            // Migrate to global
            await set(ref(realtimeDb, "globalSettings/tariffs"), legacySnap.val());
          } else {
            await set(ref(realtimeDb, "globalSettings/tariffs"), DEFAULT_TARIFFS);
          }
        }
      } catch (error) {
        console.error("Failed to fetch tariffs:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchTariffs();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!realtimeDb) throw new Error("DB not connected");
      
      // Write to globalSettings
      await set(ref(realtimeDb, "globalSettings/tariffs"), tariffs);
      
      // Also cascade to all properties so their costCalculators pick it up
      const propsRef = ref(realtimeDb, "properties");
      const propsSnap = await get(propsRef);
      if (propsSnap.exists()) {
        const promises = Object.keys(propsSnap.val()).map((propId) =>
          set(ref(realtimeDb!, `properties/${propId}/settings/tariffs`), tariffs)
        );
        await Promise.all(promises);
      }
      
      toast({
        title: "Tariffs Updated",
        description: `Global rates pushed to ${propsSnap.exists() ? Object.keys(propsSnap.val()).length : 0} properties.`,
      });
    } catch (error) {
      console.error("Failed to save tariffs:", error);
      toast({
        title: "Save Failed",
        description: "Could not sync tariff settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRateChange = (block: "offPeak" | "day" | "peak", value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setTariffs((prev) => ({
        ...prev,
        [block]: { ...prev[block], rate: numValue },
      }));
    }
  };

  return (
    <SidebarProvider>
      <SuperAdminSidebar />

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Global Tariff Configuration</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">CEB rates pushed to all hotels</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading || saving} className="gap-2 shadow-sm">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{saving ? "Pushing..." : "Push to All Hotels"}</span>
          </Button>
        </header>

        <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Time of Use (ToU) Billing</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Configure the CEB tariff rates centrally. When you click "Push to All Hotels", these rates will be written to every registered property's settings node in Firebase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Off-Peak */}
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
                  <Label htmlFor="g-rate-offpeak" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Rate</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-sm">{tariffs.currency}</div>
                    <Input id="g-rate-offpeak" type="number" step="0.01" value={tariffs.offPeak.rate} onChange={(e) => handleRateChange("offPeak", e.target.value)} className="pl-12 font-mono" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Day */}
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
                  <Label htmlFor="g-rate-day" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Rate</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-sm">{tariffs.currency}</div>
                    <Input id="g-rate-day" type="number" step="0.01" value={tariffs.day.rate} onChange={(e) => handleRateChange("day", e.target.value)} className="pl-12 font-mono" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Peak */}
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
                  <Label htmlFor="g-rate-peak" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Rate</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-sm">{tariffs.currency}</div>
                    <Input id="g-rate-peak" type="number" step="0.01" value={tariffs.peak.rate} onChange={(e) => handleRateChange("peak", e.target.value)} className="pl-12 font-mono" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="g-fixed" className="text-sm font-medium">Fixed Monthly Charge</Label>
                  <div className="relative max-w-xs">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-sm">{tariffs.currency}</div>
                    <Input id="g-fixed" type="number" value={tariffs.fixedCharge} onChange={(e) => setTariffs((prev) => ({ ...prev, fixedCharge: parseFloat(e.target.value) || 0 }))} className="pl-12 font-mono" />
                  </div>
                  <p className="text-xs text-muted-foreground">Standard CEB fixed fee applied to the monthly bill.</p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="g-category" className="text-sm font-medium">Tariff Category</Label>
                  <Input id="g-category" value={tariffs.category} onChange={(e) => setTariffs((prev) => ({ ...prev, category: e.target.value }))} className="max-w-xs font-mono" />
                  <p className="text-xs text-muted-foreground">CEB category code (e.g. H-2 for Tourist Hotels).</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
