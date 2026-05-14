import { Droplets } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface WaterLevelGaugeProps {
  level: number;
  flowRate: number;
  onAnimatedLevelChange?: (animatedLevel: number) => void;
}

export function WaterLevelGauge({ level, flowRate, onAnimatedLevelChange }: WaterLevelGaugeProps) {
  // Debug: Log when water level updates
  useEffect(() => {
    console.log("🚰 WaterLevelGauge Updated:", {
      level,
      flowRate,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [level, flowRate]);

  const normalizedLevel = Math.max(0, Math.min(100, level));
  const [displayedLevel, setDisplayedLevel] = useState(normalizedLevel);
  const displayedLevelRef = useRef(normalizedLevel);

  useEffect(() => {
    displayedLevelRef.current = displayedLevel;
    onAnimatedLevelChange?.(displayedLevel);
  }, [displayedLevel, onAnimatedLevelChange]);

  useEffect(() => {
    let frameId = 0;
    const startLevel = displayedLevelRef.current;
    const targetLevel = normalizedLevel;

    if (startLevel === targetLevel) {
      setDisplayedLevel(targetLevel);
      return;
    }

    const distance = Math.abs(targetLevel - startLevel);
    const isFalling = targetLevel < startLevel;
    const durationMs = isFalling
      ? Math.min(9000, Math.max(3200, distance * 140))
      : Math.min(1800, Math.max(700, distance * 50));
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextLevel = startLevel + (targetLevel - startLevel) * easedProgress;
      setDisplayedLevel(nextLevel);
      onAnimatedLevelChange?.(nextLevel);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [normalizedLevel, onAnimatedLevelChange]);

  const getWaterFillClass = () => {
    if (normalizedLevel === 0) return "from-sky-100 via-sky-200 to-sky-300";
    if (normalizedLevel <= 50) return "from-sky-200 via-sky-400 to-blue-500";
    return "from-sky-300 via-blue-500 to-blue-700";
  };

  const getStatusClass = () => {
    if (normalizedLevel === 0) return "status-offline";
    if (normalizedLevel <= 50) return "status-warning";
    return "status-online";
  };

  const getTankState = () => {
    if (normalizedLevel === 0) return "Empty";
    if (normalizedLevel <= 50) return "Watch";
    if (normalizedLevel >= 100) return "Full";
    return "Stable";
  };

  const fillLevel = displayedLevel === 0 ? 0 : Math.max(displayedLevel, 12);

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
        <span className={`status-indicator ${getStatusClass()}`} />
      </div>

      <div className="space-y-4">
        {/* Tank Visualization */}
        <div className="relative mx-auto h-32 w-24 overflow-hidden rounded-lg border-2 border-border bg-slate-950/5">
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getWaterFillClass()}`}
            style={{ height: `${fillLevel}%` }}
          >
            {/* Wave effect */}
            <div
              className="absolute inset-x-0 -top-2 h-4 opacity-50"
              style={{ animation: "water-flow 12s ease-in-out infinite" }}
            >
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
                <path
                  d="M0 10 Q 25 0, 50 10 T 100 10 V 20 H 0 Z"
                  fill="currentColor"
                  className="text-white/30"
                />
              </svg>
            </div>
          </div>

          {normalizedLevel === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/5">
              <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">
                Emergency
              </span>
            </div>
          )}
          
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
            <p className="text-2xl font-bold text-card-foreground font-mono">{Math.round(displayedLevel)}%</p>
            <p className="text-xs text-muted-foreground">Tank Level</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-card-foreground font-mono">{flowRate}</p>
            <p className="text-xs text-muted-foreground">L/min Flow</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          <span>Tank state</span>
          <span className="font-semibold text-card-foreground">{getTankState()}</span>
        </div>
      </div>
    </div>
  );
}
