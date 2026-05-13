import { useEffect, useState } from "react";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Zap, Banknote, Activity, TrendingDown, Users } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "@/services/firebase";

interface PropertySummary {
  id: string;
  name: string;
  power: number;
  occupancyState: string;
  waterLevel: number;
}

export default function SuperAdminOverview() {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [globalTariff, setGlobalTariff] = useState<any>(null);

  useEffect(() => {
    if (!realtimeDb) return;

    // Listen to all properties
    const propsRef = ref(realtimeDb, "properties");
    const unsubProps = onValue(propsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: PropertySummary[] = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          name: val.meta?.name || id.replace(/_/g, " "),
          power: val.rooms?.room_001?.latest?.power || 0,
          occupancyState: val.rooms?.room_001?.latest?.occupancyState || "Unknown",
          waterLevel: val.rooms?.room_001?.latest?.waterLevel || 0,
        }));
        setProperties(list);
      }
    });

    // Listen to global tariffs
    const tariffRef = ref(realtimeDb, "globalSettings/tariffs");
    const unsubTariff = onValue(tariffRef, (snap) => {
      if (snap.exists()) setGlobalTariff(snap.val());
    });

    return () => {
      unsubProps();
      unsubTariff();
    };
  }, []);

  const totalPower = properties.reduce((sum, p) => sum + p.power, 0);
  const activeCount = properties.filter(p => p.occupancyState !== "Vacant" && p.occupancyState !== "Unknown").length;

  return (
    <SidebarProvider>
      <SuperAdminSidebar />

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">System Overview</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">All registered properties</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {properties.length} {properties.length === 1 ? "Property" : "Properties"}
          </Badge>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Building2 className="h-5 w-5 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                <p className="text-3xl font-bold font-mono tracking-tight">{properties.length}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Zap className="h-5 w-5 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Power Draw</p>
                <p className="text-3xl font-bold font-mono tracking-tight">{totalPower.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">W</span></p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Users className="h-5 w-5 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Active Rooms</p>
                <p className="text-3xl font-bold font-mono tracking-tight">{activeCount} <span className="text-sm font-normal text-muted-foreground">/ {properties.length}</span></p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Banknote className="h-5 w-5 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Current Tariff</p>
                <p className="text-3xl font-bold font-mono tracking-tight">{globalTariff?.category || "H-2"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Properties Table */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-medium">Registered Properties</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Property</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Power (W)</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Water (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                          No properties registered yet. Add a hotel from the Hotels page.
                        </td>
                      </tr>
                    ) : (
                      properties.map((prop) => (
                        <tr key={prop.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{prop.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{prop.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={prop.occupancyState === "Vacant" ? "secondary" : "default"} className="text-xs">
                              {prop.occupancyState}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right font-mono">{prop.power.toFixed(1)}</td>
                          <td className="px-6 py-4 text-right font-mono">{prop.waterLevel.toFixed(0)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
