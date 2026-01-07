import { useEffect, useState } from "react";

interface MechanicalMeterProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  dangerThreshold?: number;
  warningThreshold?: number;
  size?: "sm" | "md" | "lg";
}

export function MechanicalMeter({
  value,
  min,
  max,
  label,
  unit,
  dangerThreshold,
  warningThreshold,
  size = "md",
}: MechanicalMeterProps) {
  const [animatedValue, setAnimatedValue] = useState(min);
  
  // Smooth needle animation
  useEffect(() => {
    const duration = 500;
    const startValue = animatedValue;
    const endValue = Math.max(min, Math.min(max, value));
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth movement
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setAnimatedValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, min, max]);

  // Calculate needle rotation (-135° to 135° = 270° arc)
  const normalizedValue = (animatedValue - min) / (max - min);
  const rotation = -135 + normalizedValue * 270;
  
  // Determine needle color based on thresholds
  const getNeedleColor = () => {
    if (dangerThreshold && animatedValue >= dangerThreshold) return "hsl(var(--destructive))";
    if (warningThreshold && animatedValue >= warningThreshold) return "hsl(var(--warning))";
    return "hsl(var(--primary))";
  };

  const dimensions = {
    sm: { width: 120, height: 80, fontSize: "text-xs", valueSize: "text-lg" },
    md: { width: 160, height: 100, fontSize: "text-sm", valueSize: "text-xl" },
    lg: { width: 200, height: 120, fontSize: "text-base", valueSize: "text-2xl" },
  };

  const { width, height, fontSize, valueSize } = dimensions[size];
  const centerX = width / 2;
  const centerY = height - 10;
  const radius = height - 25;

  // Generate tick marks
  const ticks = [];
  const numTicks = 9;
  for (let i = 0; i <= numTicks; i++) {
    const angle = (-135 + (i / numTicks) * 270) * (Math.PI / 180);
    const tickLength = i % 2 === 0 ? 8 : 5;
    const outerX = centerX + Math.cos(angle) * radius;
    const outerY = centerY + Math.sin(angle) * radius;
    const innerX = centerX + Math.cos(angle) * (radius - tickLength);
    const innerY = centerY + Math.sin(angle) * (radius - tickLength);
    
    ticks.push(
      <line
        key={i}
        x1={innerX}
        y1={innerY}
        x2={outerX}
        y2={outerY}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={i % 2 === 0 ? 2 : 1}
        strokeLinecap="round"
      />
    );
  }

  // Generate colored arc segments
  const createArc = (startAngle: number, endAngle: number, color: string) => {
    const startRad = startAngle * (Math.PI / 180);
    const endRad = endAngle * (Math.PI / 180);
    const arcRadius = radius - 12;
    
    const startX = centerX + Math.cos(startRad) * arcRadius;
    const startY = centerY + Math.sin(startRad) * arcRadius;
    const endX = centerX + Math.cos(endRad) * arcRadius;
    const endY = centerY + Math.sin(endRad) * arcRadius;
    
    const angleDiff = endAngle - startAngle;
    const largeArc = angleDiff > 180 ? 1 : 0;
    
    // Only render if the arc is visible
    if (angleDiff <= 0) return null;
    
    return (
      <path
        d={`M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${endX} ${endY}`}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.3}
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  // Calculate danger and warning zone angles
  const getZoneAngle = (threshold: number) => {
    const normalized = (threshold - min) / (max - min);
    return -135 + normalized * 270;
  };

  return (
    <div className="flex flex-col items-center w-full min-w-[120px]">
      <svg 
        width={width} 
        height={height} 
        className="overflow-visible mx-auto" 
        style={{ isolation: 'isolate', maxWidth: '100%' }}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id={`meter-clip-${label.replace(/\s/g, '-')}`}>
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>
        </defs>
        
        {/* Background arc */}
        <path
          d={`M ${centerX + Math.cos(-135 * Math.PI / 180) * radius} ${centerY + Math.sin(-135 * Math.PI / 180) * radius} 
              A ${radius} ${radius} 0 1 1 ${centerX + Math.cos(135 * Math.PI / 180) * radius} ${centerY + Math.sin(135 * Math.PI / 180) * radius}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={8}
          strokeLinecap="round"
        />
        
        {/* Colored zones */}
        {warningThreshold && createArc(getZoneAngle(warningThreshold), dangerThreshold ? getZoneAngle(dangerThreshold) : 135, "hsl(var(--warning))")}
        {dangerThreshold && createArc(getZoneAngle(dangerThreshold), 135, "hsl(var(--destructive))")}
        
        {/* Progress arc */}
        {(() => {
          const startAngle = -135;
          const endAngle = Math.max(-135, Math.min(135, rotation));
          const startRad = startAngle * (Math.PI / 180);
          const endRad = endAngle * (Math.PI / 180);
          const startX = centerX + Math.cos(startRad) * radius;
          const startY = centerY + Math.sin(startRad) * radius;
          const endX = centerX + Math.cos(endRad) * radius;
          const endY = centerY + Math.sin(endRad) * radius;
          const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
          
          return (
            <path
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
              fill="none"
              stroke={getNeedleColor()}
              strokeWidth={8}
              strokeLinecap="round"
              className="transition-all duration-100"
            />
          );
        })()}
        
        {/* Tick marks */}
        {ticks}
        
        {/* Needle */}
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${centerX}px ${centerY}px` }}>
          {/* Needle shadow */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + radius - 15}
            y2={centerY}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={4}
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + radius - 15}
            y2={centerY}
            stroke={getNeedleColor()}
            strokeWidth={3}
            strokeLinecap="round"
            className="drop-shadow-md"
          />
          {/* Needle cap */}
          <circle
            cx={centerX}
            cy={centerY}
            r={6}
            fill={getNeedleColor()}
            className="drop-shadow-sm"
          />
        </g>
        
        {/* Center cap highlight */}
        <circle
          cx={centerX - 2}
          cy={centerY - 2}
          r={3}
          fill="white"
          opacity={0.4}
        />
      </svg>
      
      {/* Value display */}
      <div className="mt-2 text-center w-full px-1">
        <div className="flex items-baseline justify-center flex-wrap gap-1">
          <span className={`${valueSize} font-bold font-mono text-foreground whitespace-nowrap`}>
            {animatedValue.toFixed(1)}
          </span>
          <span className={`${fontSize} text-muted-foreground whitespace-nowrap`}>{unit}</span>
        </div>
      </div>
      <p className={`${fontSize} text-muted-foreground mt-1 text-center w-full px-1 break-words`}>{label}</p>
    </div>
  );
}
