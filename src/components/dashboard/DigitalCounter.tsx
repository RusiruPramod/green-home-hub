import { cn } from "@/lib/utils";

interface DigitalCounterProps {
  value: number;
  digits?: number;
  label: string;
  unit: string;
  icon?: React.ReactNode;
}

export function DigitalCounter({ value, digits = 6, label, unit, icon }: DigitalCounterProps) {
  // Format value to fixed digits with leading zeros
  const formattedValue = Math.floor(value).toString().padStart(digits, '0');
  const digitArray = formattedValue.split('');

  return (
    <div className="flex flex-col items-center gap-3">
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      )}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      
      {/* Digital meter display */}
      <div className="relative bg-gradient-to-b from-muted to-muted/50 rounded-lg p-3 border border-border shadow-inner">
        <div className="flex gap-0.5">
          {digitArray.map((digit, index) => (
            <div
              key={index}
              className={cn(
                "relative w-7 h-10 bg-gradient-to-b from-card to-background rounded border border-border shadow-sm overflow-hidden",
                index === digits - 2 && "mr-1"
              )}
            >
              {/* Digit background lines */}
              <div className="absolute inset-0 flex flex-col justify-center">
                <div className="h-px w-full bg-border/50" />
              </div>
              
              {/* Digit */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold font-mono text-foreground">
                  {digit}
                </span>
              </div>
              
              {/* Glossy effect */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
            </div>
          ))}
        </div>
        
        {/* Decimal point indicator */}
        {digits > 2 && (
          <div className="absolute bottom-3 right-12 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </div>
      
      <span className="text-sm font-medium text-muted-foreground">{unit}</span>
    </div>
  );
}
