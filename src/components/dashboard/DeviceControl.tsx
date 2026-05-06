import { Switch } from "@/components/ui/switch";
import { LucideIcon } from "lucide-react";

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
    <div className={`sensor-card flex items-center justify-between transition-all select-none ${isToggling ? "opacity-75 cursor-not-allowed" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          isOn ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-card-foreground">{name}</p>
          <p className={`text-sm ${isOn ? 'text-primary' : 'text-muted-foreground'}`}>
            {isOn ? 'Active' : 'Inactive'}
          </p>
        </div>
      </div>
      <Switch
        checked={isOn}
        disabled={isToggling}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
