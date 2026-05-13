import { Droplets } from "lucide-react";
import { useEffect } from "react";

interface WaterLevelGaugeProps {
  level: number;
  flowRate: number;
}

export function WaterLevelGauge({ level, flowRate }: WaterLevelGaugeProps) {
  // Debug: Log when water level updates
  useEffect(() => {
    console.log("🚰 WaterLevelGauge Updated:", {
      level,
      flowRate,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [level, flowRate]);

  const getWaterColor = () => {
    if (level >= 80) return "from-primary to-accent";
    if (level >= 40) return "from-info to-primary";
    return "from-warning to-destructive";
  };

  return (
    <div className="sensor-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Water Tank</h3>
            <p className="text-sm text-muted-foreground">Level & Flow Rate</p>
          </div>
        </div>
        <span className={`status-indicator ${level > 20 ? 'status-online' : 'status-warning'}`} />
      </div>

      <div className="space-y-4">
        {/* Tank Visualization */}
        <div className="relative mx-auto h-32 w-24 overflow-hidden rounded-lg border-2 border-border bg-muted/30">
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getWaterColor()} transition-all duration-700 ease-out`}
            style={{ height: `${level}%` }}
          >
            {/* Wave effect */}
            <div className="absolute inset-x-0 -top-2 h-4 opacity-50">
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
                <path
                  d="M0 10 Q 25 0, 50 10 T 100 10 V 20 H 0 Z"
                  fill="currentColor"
                  className="text-primary-foreground/20"
                />
              </svg>
            </div>
          </div>
          
          {/* Level markers */}
          <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-2 text-[8px] text-muted-foreground">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-card-foreground font-mono">{level}%</p>
            <p className="text-xs text-muted-foreground">Tank Level</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-card-foreground font-mono">{flowRate}</p>
            <p className="text-xs text-muted-foreground">L/min Flow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
