import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, remove, update } from "firebase/database";
import { realtimeDb } from "@/services/firebase";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  BedDouble,
  Thermometer,
  Wind,
  Zap,
  Flame,
  DoorOpen,
  DoorClosed,
  Activity,
  UserX,
  User,
  BedIcon,
  Eye,
  Lightbulb,
  Fan,
  Droplets,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Power,
  Bell,
  ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
interface RoomLatest {
  temperature: number;
  humidity: number;
  power: number;
  gas: number;
  waterLevel: number;
  pir: boolean;
  doorOpen: boolean;
  occupancyState?: string;
  updatedAt?: number;
}

interface RoomDevices {
  lights: boolean;
  exhaustFan: boolean;
  waterPump: boolean;
  motionDetection: boolean;
  mainRelay: boolean;
  buzzer: boolean;
}

interface Room {
  id: string;
  label: string;
  latest: RoomLatest;
  devices: RoomDevices;
}

// ── Occupancy config ───────────────────────────────────────────────
const occupancyConfig: Record<string, { text: string; color: string; bg: string; icon: typeof Activity }> = {
  OCCUPIED_ACTIVE:   { text: "Active",   color: "text-success",          bg: "bg-success/10",     icon: Activity },
  OCCUPIED_IDLE:     { text: "Idle",     color: "text-warning",          bg: "bg-warning/10",     icon: User },
  OCCUPIED_SLEEPING: { text: "Sleeping", color: "text-primary",          bg: "bg-primary/10",     icon: BedIcon },
  VACANT_CONFIRMED:  { text: "Vacant",   color: "text-destructive",      bg: "bg-destructive/10", icon: UserX },
  VACANT:            { text: "Vacant",   color: "text-muted-foreground", bg: "bg-muted",          icon: UserX },
};

const defaultLatest: RoomLatest = {
  temperature: 0, humidity: 0, power: 0, gas: 0, waterLevel: 0,
  pir: false, doorOpen: false, occupancyState: "VACANT",
};

const defaultDevices: RoomDevices = {
  lights: false, exhaustFan: false, waterPump: false,
  motionDetection: false, mainRelay: false, buzzer: false,
};

// ── Device definitions ─────────────────────────────────────────────
const deviceDefs = [
  { id: "mainRelay",       label: "Main Relay",        desc: "Master power switch",     icon: Power,    danger: false },
  { id: "lights",          label: "Lights",            desc: "Room lighting relay",      icon: Lightbulb,danger: false },
  { id: "exhaustFan",      label: "Exhaust Fan",       desc: "Ventilation fan relay",    icon: Fan,      danger: false },
  { id: "waterPump",       label: "Water Pump",        desc: "Tank pump relay",          icon: Droplets, danger: false },
  { id: "motionDetection", label: "Motion Detection",  desc: "PIR sensor enabled",       icon: Eye,      danger: false },
  { id: "buzzer",          label: "Buzzer",            desc: "Alert buzzer",             icon: Bell,     danger: true  },
] as const;

type DeviceId = (typeof deviceDefs)[number]["id"];

// ── Room Detail Sheet ──────────────────────────────────────────────
function RoomDetailSheet({
  room,
  open,
  onOpenChange,
}: {
  room: Room | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const handleToggle = useCallback(
    async (deviceId: DeviceId) => {
      if (!room || !realtimeDb) return;
      setToggling((prev) => new Set(prev).add(deviceId));
      try {
        const currentVal = room.devices[deviceId];
        await update(
          ref(realtimeDb, `properties/property_001/rooms/${room.id}/devices`),
          { [deviceId]: !currentVal }
        );
      } catch {
        toast({ title: "Error", description: "Failed to update device.", variant: "destructive" });
      } finally {
        setToggling((prev) => {
          const s = new Set(prev);
          s.delete(deviceId);
          return s;
        });
      }
    },
    [room, toast]
  );

  if (!room) return null;

  const state = room.latest.occupancyState ?? "VACANT";
  const occ = occupancyConfig[state] ?? { text: "Unknown", color: "text-muted-foreground", bg: "bg-muted", icon: Eye };
  const OccIcon = occ.icon;
  const isLive = room.latest.updatedAt ? Date.now() - room.latest.updatedAt < 30_000 : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" side="right">
        {/* Sheet Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BedDouble className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">{room.label}</SheetTitle>
              <SheetDescription className="text-[11px] font-mono">{room.id}</SheetDescription>
            </div>
            <span
              className={cn(
                "ml-auto flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
                isLive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              )}
            >
              {isLive ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
              {isLive ? "Live" : "Offline"}
            </span>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">

            {/* Occupancy + Door */}
            <div className={cn("flex items-center gap-3 p-3 rounded-lg", occ.bg)}>
              <OccIcon className={cn("h-5 w-5 shrink-0", occ.color)} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Occupancy</p>
                <p className={cn("font-semibold text-sm", occ.color)}>{occ.text}</p>
              </div>
              <div className={cn("ml-auto flex items-center gap-1.5 text-xs", room.latest.doorOpen ? "text-warning" : "text-muted-foreground")}>
                {room.latest.doorOpen ? <DoorOpen className="h-4 w-4" /> : <DoorClosed className="h-4 w-4" />}
                <span>{room.latest.doorOpen ? "Door Open" : "Door Closed"}</span>
              </div>
            </div>

            {/* Live Sensor Summary */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                Live Sensors
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Thermometer, label: "Temperature", value: `${room.latest.temperature.toFixed(1)}°C`, warn: room.latest.temperature > 32 },
                  { icon: Wind,        label: "Humidity",    value: `${room.latest.humidity.toFixed(0)}%`,     warn: room.latest.humidity > 70 },
                  { icon: Zap,         label: "Power",       value: `${room.latest.power.toFixed(0)} W`,       warn: false },
                  { icon: Flame,       label: "Gas",         value: `${room.latest.gas} ppm`,                  warn: room.latest.gas > 400 },
                ].map(({ icon: Icon, label, value, warn }) => (
                  <div
                    key={label}
                    className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-muted/40", warn && "bg-warning/10")}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", warn ? "text-warning" : "text-muted-foreground")} />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className={cn("font-mono text-sm font-semibold", warn ? "text-warning" : "text-foreground")}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Controls */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                Device Controls
              </p>
              <div className="space-y-2">
                {deviceDefs.map(({ id, label, desc, icon: Icon, danger }) => {
                  const isOn = room.devices[id as DeviceId];
                  const isToggling = toggling.has(id);
                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-lg border transition-all duration-200",
                        isOn
                          ? danger
                            ? "bg-destructive/5 border-destructive/20"
                            : "bg-primary/5 border-primary/20"
                          : "bg-muted/30 border-border/50",
                        isToggling && "opacity-60"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors",
                          isOn
                            ? danger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-[11px] text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={isOn}
                        disabled={isToggling}
                        onCheckedChange={() => void handleToggle(id as DeviceId)}
                        className={cn(danger && isOn && "data-[state=checked]:bg-destructive")}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ── Room Card ──────────────────────────────────────────────────────
function RoomCard({
  room,
  onSelect,
  onRemove,
}: {
  room: Room;
  onSelect: (room: Room) => void;
  onRemove: (id: string) => void;
}) {
  const state = room.latest.occupancyState ?? "VACANT";
  const occ = occupancyConfig[state] ?? { text: "Unknown", color: "text-muted-foreground", bg: "bg-muted", icon: Eye };
  const OccIcon = occ.icon;
  const isLive = room.latest.updatedAt ? Date.now() - room.latest.updatedAt < 30_000 : false;
  const tempWarn  = room.latest.temperature > 32;
  const humidWarn = room.latest.humidity > 70;
  const gasWarn   = room.latest.gas > 400;
  const activeDevices = Object.entries(room.devices).filter(([k, v]) => v && k !== "motionDetection").length;

  return (
    <Card
      className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group"
      onClick={() => onSelect(room)}
    >
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <BedDouble className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{room.label}</CardTitle>
              <p className="text-[10px] text-muted-foreground font-mono">{room.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
              isLive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            )}>
              {isLive ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
              {isLive ? "Live" : "—"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onRemove(room.id); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Occupancy */}
        <div className={cn("flex items-center gap-3 p-3 rounded-lg", occ.bg)}>
          <OccIcon className={cn("h-4 w-4 shrink-0", occ.color)} />
          <p className={cn("font-semibold text-sm", occ.color)}>{occ.text}</p>
          <div className={cn("ml-auto flex items-center gap-1 text-[11px]", room.latest.doorOpen ? "text-warning" : "text-muted-foreground")}>
            {room.latest.doorOpen ? <DoorOpen className="h-3.5 w-3.5" /> : <DoorClosed className="h-3.5 w-3.5" />}
            {room.latest.doorOpen ? "Open" : "Closed"}
          </div>
        </div>

        {/* Sensor grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-muted/40", tempWarn && "bg-warning/10")}>
            <Thermometer className={cn("h-4 w-4 shrink-0", tempWarn ? "text-warning" : "text-muted-foreground")} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Temp</p>
              <p className={cn("font-mono text-sm font-semibold", tempWarn ? "text-warning" : "text-foreground")}>
                {room.latest.temperature.toFixed(1)}°C
              </p>
            </div>
          </div>
          <div className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-muted/40", humidWarn && "bg-warning/10")}>
            <Wind className={cn("h-4 w-4 shrink-0", humidWarn ? "text-warning" : "text-muted-foreground")} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Humidity</p>
              <p className={cn("font-mono text-sm font-semibold", humidWarn ? "text-warning" : "text-foreground")}>
                {room.latest.humidity.toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40">
            <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Power</p>
              <p className="font-mono text-sm font-semibold">{room.latest.power.toFixed(0)} W</p>
            </div>
          </div>
          <div className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-muted/40", gasWarn && "bg-destructive/10")}>
            <Flame className={cn("h-4 w-4 shrink-0", gasWarn ? "text-destructive" : "text-muted-foreground")} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gas</p>
              <p className={cn("font-mono text-sm font-semibold", gasWarn ? "text-destructive" : "text-foreground")}>
                {room.latest.gas} ppm
              </p>
            </div>
          </div>
        </div>

        {/* Footer — device count + open control hint */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            {activeDevices > 0
              ? `${activeDevices} device${activeDevices > 1 ? "s" : ""} active`
              : "All devices off"}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-primary font-medium group-hover:gap-1.5 transition-all">
            Control <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function Rooms() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomLabel, setNewRoomLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Subscribe to all rooms in real-time
  useEffect(() => {
    if (!realtimeDb) { setLoading(false); return; }
    const roomsRef = ref(realtimeDb, "properties/property_001/rooms");
    const unsub = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: Room[] = Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        label: val.meta?.label || `Room ${id.replace("room_", "").replace(/^0+/, "")}`,
        latest: { ...defaultLatest, ...(val.latest || {}) },
        devices: { ...defaultDevices, ...(val.devices || {}) },
      }));
      list.sort((a, b) => a.id.localeCompare(b.id));
      setRooms(list);
      setLoading(false);

      // Keep selected room in sync with live data
      setSelectedRoom((prev) =>
        prev ? (list.find((r) => r.id === prev.id) ?? null) : null
      );
    });
    return () => unsub();
  }, []);

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setSheetOpen(true);
  };

  const handleAddRoom = async () => {
    if (!newRoomLabel.trim() || !realtimeDb) return;
    setAdding(true);
    try {
      const nextNum = String(rooms.length + 1).padStart(3, "0");
      const roomId = `room_${nextNum}`;
      await set(ref(realtimeDb, `properties/property_001/rooms/${roomId}`), {
        meta: { label: newRoomLabel.trim() },
        latest: defaultLatest,
        devices: defaultDevices,
      });
      setNewRoomLabel("");
      toast({ title: "Room Added", description: `${newRoomLabel.trim()} registered as ${roomId}` });
    } catch {
      toast({ title: "Error", description: "Failed to add room.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveRoom = async (id: string) => {
    if (!realtimeDb) return;
    try {
      if (selectedRoom?.id === id) setSheetOpen(false);
      await remove(ref(realtimeDb, `properties/property_001/rooms/${id}`));
      toast({ title: "Removed", description: `${id} removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to remove room.", variant: "destructive" });
    }
  };

  const occupiedCount = rooms.filter((r) =>
    ["OCCUPIED_ACTIVE", "OCCUPIED_IDLE", "OCCUPIED_SLEEPING"].includes(r.latest.occupancyState ?? "")
  ).length;
  const alertCount = rooms.filter((r) => r.latest.gas > 400 || r.latest.temperature > 32).length;

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileSidebarTrigger />
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Room Management</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Click a room to view sensors &amp; control devices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <Activity className="h-3 w-3 text-success" />
              {occupiedCount} occupied
            </Badge>
            {alertCount > 0 && (
              <Badge variant="destructive" className="gap-1.5 text-xs">
                <Flame className="h-3 w-3" />
                {alertCount} alert{alertCount > 1 ? "s" : ""}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">{rooms.length} rooms</Badge>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">

          {/* Add Room */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                Add New Room
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="room-label" className="text-sm">Room Label</Label>
                  <Input
                    id="room-label"
                    placeholder="e.g. Room 101, Suite A, Deluxe Double"
                    value={newRoomLabel}
                    onChange={(e) => setNewRoomLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleAddRoom()}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => void handleAddRoom()}
                    disabled={adding || !newRoomLabel.trim()}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    {adding ? "Adding..." : "Add Room"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Cards */}
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-64 p-5" />
                </Card>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <BedDouble className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="font-medium text-muted-foreground">No rooms found</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Add a room above to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onSelect={handleSelectRoom}
                  onRemove={handleRemoveRoom}
                />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Room Detail Sheet — slides in from right on room click */}
      <RoomDetailSheet
        room={selectedRoom}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </SidebarProvider>
  );
}
