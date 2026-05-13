import { BarChart3, TrendingUp, TrendingDown, Calendar, Download, Zap, Banknote } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHistoryData } from "@/hooks/useHistoryData";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const Analytics = () => {
  const { weeklyData, monthlyData, loading: historyLoading } = useHistoryData();

  // Calculate dynamic insights based on weekly data
  const totalWeeklyKwh = weeklyData.reduce((acc, day) => acc + day.energy, 0);
  const totalWeeklyCost = weeklyData.reduce((acc, day) => acc + day.cost, 0);
  
  // Calculate average daily cost
  const avgDailyCost = totalWeeklyCost / (weeklyData.filter(d => d.cost > 0).length || 1);

  return (
    <SidebarProvider>
      <DashboardSidebar />
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics & Finance</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Historical energy consumption and cost analysis</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex border-primary/20 hover:bg-primary/5">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              Last 7 Days
            </Button>
            <Button variant="default" size="sm" className="shadow-sm">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-6 md:p-8 lg:p-10 max-w-[2000px] mx-auto">
          
          {/* Executive Summary Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border shadow-sm hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Zap className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border px-2 py-1 rounded-md">
                    <TrendingDown className="h-3 w-3" /> 12% vs last week
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Energy (7 Days)</p>
                  <p className="text-3xl font-bold text-foreground font-mono tracking-tight">{totalWeeklyKwh.toFixed(2)} <span className="text-sm font-normal text-muted-foreground tracking-normal">kWh</span></p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Banknote className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3" /> 5% vs last week
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Cost (7 Days)</p>
                  <p className="text-3xl font-bold text-destructive font-mono tracking-tight">Rs {totalWeeklyCost.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-all hidden lg:block">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <BarChart3 className="h-5 w-5 text-foreground" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Average Daily Cost</p>
                  <p className="text-3xl font-bold text-foreground font-mono tracking-tight">Rs {avgDailyCost.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Weekly Usage Chart */}
            <Card className="lg:col-span-2 border-border shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  7-Day Energy Consumption (kWh)
                </CardTitle>
                <CardDescription>Daily energy draw logged from the PZEM-004T node.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}
                        itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="energy" 
                        name="Energy (kWh)"
                        stroke="hsl(var(--primary))" 
                        fill="url(#energyGradient)"
                        strokeWidth={3}
                        activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Daily Cost Analysis */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  Daily Cost (LKR)
                </CardTitle>
                <CardDescription>Calculated using active CEB ToU rates.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}
                        itemStyle={{ color: "hsl(var(--destructive))", fontWeight: "bold" }}
                      />
                      <Bar 
                        dataKey="cost" 
                        name="Cost (LKR)"
                        fill="hsl(var(--destructive))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Analytics;
