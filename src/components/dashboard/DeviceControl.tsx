import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceControlProps {
  name: string;
  icon: LucideIcon;
  isOn: boolean;
  onToggle: () => void;
  isToggling?: boolean;
}

export function DeviceControl({
  name,
  icon: Icon,
  isOn,
  onToggle,
  isToggling = false,
}: DeviceControlProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200 select-none cursor-pointer",
        isOn && "ring-1 ring-primary bg-primary/5",
        isToggling && "opacity-60 cursor-not-allowed pointer-events-none"
      )}
      onClick={!isToggling ? onToggle : undefined}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-none mb-0.5">{name}</p>
            <p className={cn("text-xs", isOn ? "text-primary" : "text-muted-foreground")}>
              {isToggling ? "Updating…" : isOn ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
        <Switch
          checked={isOn}
          disabled={isToggling}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="data-[state=checked]:bg-primary"
        />
      </CardContent>
    </Card>
  );
}
