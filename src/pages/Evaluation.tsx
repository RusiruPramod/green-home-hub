import { Play, Square, Activity, Save, TrendingDown, CheckCircle2, XCircle, Zap } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { realtimeDb } from "@/services/firebase";
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";

interface RunData {
  startedAt: number | null;
  totalKwh: number;
  totalLkr: number;
  isRunning: boolean;
}

export default function Evaluation() {
  const { toast } = useToast();
  const { sensorData } = useFirebaseRealtime();
  
  const [baseline, setBaseline] = useState<RunData>({ startedAt: null, totalKwh: 0, totalLkr: 0, isRunning: false });
  const [automated, setAutomated] = useState<RunData>({ startedAt: null, totalKwh: 0, totalLkr: 0, isRunning: false });
  const [tariffs, setTariffs] = useState<any>(null);

  // Fetch Evaluation Data
  useEffect(() => {
    const evalRef = ref(realtimeDb, "properties/property_001/evaluation");
    const unsubscribe = onValue(evalRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.baseline) setBaseline(data.baseline);
        if (data.automated) setAutomated(data.automated);
      }
    });

    const tariffsRef = ref(realtimeDb, "globalSettings/tariffs");
    const unsubTariffs = onValue(tariffsRef, (snap) => {
      if (snap.exists()) setTariffs(snap.val());
    });

    return () => {
      unsubscribe();
      unsubTariffs();
    };
  }, []);

  const handleStartRun = async (type: 'baseline' | 'automated') => {
    if (type === 'baseline' && automated.isRunning) {
      toast({ title: "Error", description: "Automated run is currently active.", variant: "destructive" });
      return;
    }
    if (type === 'automated' && baseline.isRunning) {
      toast({ title: "Error", description: "Baseline run is currently active.", variant: "destructive" });
      return;
    }

    const newData: RunData = {
      startedAt: Date.now(),
      totalKwh: 0,
      totalLkr: 0,
      isRunning: true
    };

    const runRef = ref(realtimeDb, `properties/property_001/evaluation/${type}`);
    await set(runRef, newData);
    
    // In a full implementation, we'd also write an "automation_mode" flag to Firebase 
    // so the automationService.ts knows whether to intervene or not.
    const modeRef = ref(realtimeDb, "properties/property_001/settings/automationMode");
    await set(modeRef, type === 'automated' ? 'active' : 'passive');

    toast({ title: "Run Started", description: `The ${type} 24-hour run has started.` });
  };

  const handleStopRun = async (type: 'baseline' | 'automated') => {
    const runRef = ref(realtimeDb, `properties/property_001/evaluation/${type}/isRunning`);
    await set(runRef, false);
    
    const modeRef = ref(realtimeDb, "properties/property_001/settings/automationMode");
    await set(modeRef, 'active'); // Default back to active protection

    toast({ title: "Run Stopped", description: `The ${type} run has been finalized.` });
  };

  const calculateReduction = () => {
    if (baseline.totalKwh === 0) return 0;
    return ((baseline.totalKwh - automated.totalKwh) / baseline.totalKwh) * 100;
  };

  const calculateLkrReduction = () => {
    if (baseline.totalLkr === 0) return 0;
    return ((baseline.totalLkr - automated.totalLkr) / baseline.totalLkr) * 100;
  };

  const energyReduction = calculateReduction();
  const costReduction = calculateLkrReduction();
  const isSuccess = energyReduction >= 20;

  // Simulate incoming energy ticks for demonstration if running
  useEffect(() => {
    if (!baseline.isRunning && !automated.isRunning) return;

    const interval = setInterval(() => {
      // Very basic simulation for UI feedback. 
      // In production, the backend/ESP32 would increment these totals accurately based on sensor delta.
      const activeType = baseline.isRunning ? 'baseline' : 'automated';
      const currentData = activeType === 'baseline' ? baseline : automated;
      
      const kwhTick = sensorData.power > 0 ? (sensorData.power / 1000) * (1/3600) * 1000 : 0; // Accelerated demo
      
      if (kwhTick > 0 && tariffs) {
        const rate = tariffs.peak?.rate || 28; // simplification for demo
        const lkrTick = kwhTick * rate;
        
        const runRef = ref(realtimeDb, `properties/property_001/evaluation/${activeType}`);
        set(runRef, {
          ...currentData,
          totalKwh: currentData.totalKwh + kwhTick,
          totalLkr: currentData.totalLkr + lkrTick
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [baseline, automated, sensorData.power, tariffs]);

  return (
    <SidebarProvider>
      <DashboardSidebar />
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Evaluation Module</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Thesis Experiment Controller</p>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Baseline Controller */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Baseline Run (Passive)</span>
                  {baseline.isRunning && <span className="flex h-3 w-3 rounded-full bg-destructive animate-pulse" />}
                </CardTitle>
                <CardDescription>Records energy waste without any automated system intervention.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex gap-4">
                  <Button 
                    variant={baseline.isRunning ? "outline" : "default"} 
                    className="flex-1"
                    onClick={() => handleStartRun('baseline')}
                    disabled={baseline.isRunning || automated.isRunning}
                  >
                    <Play className="w-4 h-4 mr-2" /> Start 24h Baseline
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleStopRun('baseline')}
                    disabled={!baseline.isRunning}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm font-medium text-muted-foreground">Total Energy</p>
                    <p className="text-2xl font-mono font-bold text-foreground">{baseline.totalKwh.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">kWh</span></p>
                  </div>
                  <div className="space-y-1 p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-mono font-bold text-foreground">Rs {baseline.totalLkr.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Automated Controller */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center justify-between text-foreground">
                  <span>Automated Run (Active)</span>
                  {automated.isRunning && <span className="flex h-3 w-3 rounded-full bg-success animate-pulse" />}
                </CardTitle>
                <CardDescription>Records energy usage with hybrid occupancy detection active.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex gap-4">
                  <Button 
                    variant={automated.isRunning ? "outline" : "default"} 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleStartRun('automated')}
                    disabled={automated.isRunning || baseline.isRunning}
                  >
                    <Play className="w-4 h-4 mr-2" /> Start 24h Automated
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleStopRun('automated')}
                    disabled={!automated.isRunning}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm font-medium text-muted-foreground">Total Energy</p>
                    <p className="text-2xl font-mono font-bold text-foreground">{automated.totalKwh.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">kWh</span></p>
                  </div>
                  <div className="space-y-1 p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-mono font-bold text-foreground">Rs {automated.totalLkr.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Results Display */}
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border">
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-xl font-semibold tracking-tight">Experiment Results</h2>
                <p className="text-sm text-muted-foreground">Objective: Achieve &gt;= 20% aggregate reduction in energy wastage.</p>
              </div>
              
              {baseline.totalKwh > 0 && automated.totalKwh > 0 && !baseline.isRunning && !automated.isRunning ? (
                <div className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 ${isSuccess ? 'border-success bg-success/10 text-success' : 'border-destructive bg-destructive/10 text-destructive'}`}>
                  {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  <span className="font-bold text-lg">{isSuccess ? 'Objective Achieved' : 'Objective Failed'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-6 py-3 rounded-full border-2 border-muted bg-muted/50 text-muted-foreground">
                  <Activity className="w-6 h-6" />
                  <span className="font-medium">Awaiting Data</span>
                </div>
              )}
            </div>
            
            <CardContent className="p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground mb-6">
                    <Zap className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Energy Reduction</h3>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-muted-foreground mb-2">Formula:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">((Base - Auto) / Base) * 100</span>
                  </div>
                  
                  <div className="h-4 bg-muted rounded-full overflow-hidden flex relative">
                    <div className="bg-primary/20 h-full w-full absolute top-0 left-0" />
                    <div 
                      className="bg-primary h-full z-10 transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.max(0, Math.min(100, energyReduction))}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Reduction:</span>
                    <span className={`text-4xl font-bold font-mono ${energyReduction >= 20 ? 'text-success' : 'text-foreground'}`}>
                      {energyReduction.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground mb-6">
                    <TrendingDown className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Cost Savings (LKR)</h3>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-muted-foreground mb-2">Saved Amount:</span>
                    <span className="font-mono text-sm font-bold text-success">
                      +Rs {(baseline.totalLkr - automated.totalLkr).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="h-4 bg-muted rounded-full overflow-hidden flex relative">
                    <div className="bg-success/20 h-full w-full absolute top-0 left-0" />
                    <div 
                      className="bg-success h-full z-10 transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.max(0, Math.min(100, costReduction))}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Financial Impact:</span>
                    <span className="text-4xl font-bold font-mono text-success">
                      {costReduction.toFixed(1)}%
                    </span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
