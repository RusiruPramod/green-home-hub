import { useEffect, useState } from "react";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Zap, Banknote } from "lucide-react";
import { ref, get } from "firebase/database";
import { realtimeDb } from "@/services/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PropertyEnergy {
  name: string;
  kWh: number;
  cost: number;
}

export default function AggregateAnalytics() {
  const [data, setData] = useState<PropertyEnergy[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!realtimeDb) return;
      try {
        const propsRef = ref(realtimeDb, "properties");
        const snap = await get(propsRef);
        if (!snap.exists()) return;

        const tariffRef = ref(realtimeDb, "globalSettings/tariffs");
        const tariffSnap = await get(tariffRef);
        const rate = tariffSnap.exists() ? tariffSnap.val()?.day?.rate || 15 : 15;

        const props = snap.val();
        const list: PropertyEnergy[] = Object.entries(props).map(([id, val]: [string, any]) => {
          const power = val.rooms?.room_001?.latest?.power || 0;
          // Estimate daily kWh from current power draw (simplified)
          const estimatedDailyKwh = (power / 1000) * 24;
          return {
            name: val.meta?.name || id.replace(/_/g, " "),
            kWh: parseFloat(estimatedDailyKwh.toFixed(2)),
            cost: parseFloat((estimatedDailyKwh * rate).toFixed(2)),
          };
        });
        setData(list);
      } catch (error) {
        console.error("Failed to fetch aggregate data:", error);
      }
    };
    void fetchData();
  }, []);

  const totalKwh = data.reduce((s, d) => s + d.kWh, 0);
  const totalCost = data.reduce((s, d) => s + d.cost, 0);

  return (
    <SidebarProvider>
      <SuperAdminSidebar />

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Aggregate Analytics</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Cross-property energy comparison</p>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background mb-3">
                  <BarChart3 className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Properties Analyzed</p>
                <p className="text-3xl font-bold font-mono tracking-tight">{data.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background mb-3">
                  <Zap className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Est. Daily Consumption</p>
                <p className="text-3xl font-bold font-mono tracking-tight">{totalKwh.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kWh</span></p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background mb-3">
                  <Banknote className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Est. Daily Cost</p>
                <p className="text-3xl font-bold font-mono tracking-tight">Rs {totalCost.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Energy by Property (Est. Daily kWh)
              </CardTitle>
              <CardDescription>Based on current real-time power readings projected over 24 hours.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {data.length === 0 ? (
                <div className="flex items-center justify-center h-60 text-muted-foreground">
                  No property data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 14% 89%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(160 10% 45%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(160 10% 45%)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0 0% 100%)",
                        border: "1px solid hsl(150 14% 89%)",
                        borderRadius: "0.75rem",
                        fontSize: "0.875rem",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="kWh" name="Energy (kWh)" fill="hsl(152 60% 42%)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="cost" name="Cost (LKR)" fill="hsl(170 55% 42%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
