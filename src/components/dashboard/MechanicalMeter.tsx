import { cn } from "@/lib/utils";

interface MechanicalMeterProps {
  value: number;
  maxValue: number;
  unit: string;
  label: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function MechanicalMeter({ 
  value, 
  maxValue, 
  unit, 
  label, 
  color = "primary",
  size = "md" 
}: MechanicalMeterProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees
  
  const sizeClasses = {
    sm: "w-32 h-20",
    md: "w-44 h-28",
    lg: "w-56 h-36"
  };

  const needleLength = {
    sm: 28,
    md: 40,
    lg: 52
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      
      <div className={cn("relative", sizeClasses[size])}>
        {/* Meter Background */}
        <svg viewBox="0 0 100 60" className="w-full h-full">
          {/* Meter dial background */}
          <defs>
            <linearGradient id={`meterGrad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--success))" />
              <stop offset="50%" stopColor="hsl(var(--warning))" />
              <stop offset="100%" stopColor="hsl(var(--destructive))" />
            </linearGradient>
          </defs>
          
          {/* Outer ring */}
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Colored arc based on value */}
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke={`url(#meterGrad-${label})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.26} 126`}
          />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick, i) => {
            const angle = ((tick / 100) * 180 - 180) * (Math.PI / 180);
            const x1 = 50 + Math.cos(angle) * 35;
            const y1 = 55 + Math.sin(angle) * 35;
            const x2 = 50 + Math.cos(angle) * 42;
            const y2 = 55 + Math.sin(angle) * 42;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--foreground))"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}
          
          {/* Needle */}
          <g transform={`rotate(${rotation}, 50, 55)`}>
            <line
              x1="50"
              y1="55"
              x2="50"
              y2={55 - needleLength[size]}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-transform duration-500 ease-out"
            />
            {/* Needle cap */}
            <circle cx="50" cy="55" r="4" fill="hsl(var(--foreground))" />
            <circle cx="50" cy="55" r="2" fill="hsl(var(--background))" />
          </g>
          
          {/* Min/Max labels */}
          <text x="8" y="58" fontSize="6" fill="hsl(var(--muted-foreground))" textAnchor="start">0</text>
          <text x="92" y="58" fontSize="6" fill="hsl(var(--muted-foreground))" textAnchor="end">{maxValue}</text>
        </svg>
      </div>
      
      {/* Digital readout */}
      <div className="flex items-baseline gap-1 -mt-1">
        <span className="text-2xl font-bold font-mono text-foreground">{value.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
