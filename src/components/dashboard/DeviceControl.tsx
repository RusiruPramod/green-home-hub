import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { LucideIcon } from "lucide-react";

interface DeviceControlProps {
  name: string;
  icon: LucideIcon;
  initialState?: boolean;
  onToggle?: (state: boolean) => void;
}

export function DeviceControl({
  name,
  icon: Icon,
  initialState = false,
  onToggle,
}: DeviceControlProps) {
  const [isOn, setIsOn] = useState(initialState);

  const handleToggle = (checked: boolean) => {
    setIsOn(checked);
    onToggle?.(checked);
  };

  return (
    <div className={`sensor-card flex items-center justify-between transition-all ${isOn ? 'ring-2 ring-primary/20' : ''}`}>
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
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
