import { useState, useEffect } from "react";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Building2, Plus, Trash2, MapPin } from "lucide-react";
import { ref, get, set, remove } from "firebase/database";
import { realtimeDb } from "@/services/firebase";

interface Hotel {
  id: string;
  name: string;
  location: string;
  rooms: number;
}

export default function Hotels() {
  const { toast } = useToast();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchHotels = async () => {
      if (!realtimeDb) return;
      const propsRef = ref(realtimeDb, "properties");
      const snap = await get(propsRef);
      if (snap.exists()) {
        const data = snap.val();
        const list: Hotel[] = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          name: val.meta?.name || id.replace(/_/g, " "),
          location: val.meta?.location || "—",
          rooms: val.rooms ? Object.keys(val.rooms).length : 0,
        }));
        setHotels(list);
      }
    };
    void fetchHotels();
  }, []);

  const handleAddHotel = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      if (!realtimeDb) throw new Error("DB not connected");
      const propId = `property_${String(hotels.length + 1).padStart(3, "0")}`;
      
      // Copy global tariffs to the new property
      const globalTariffSnap = await get(ref(realtimeDb, "globalSettings/tariffs"));
      const tariffs = globalTariffSnap.exists() ? globalTariffSnap.val() : null;

      await set(ref(realtimeDb, `properties/${propId}`), {
        meta: { name: newName.trim(), location: newLocation.trim() || "Sri Lanka" },
        rooms: {
          room_001: {
            latest: { power: 0, waterLevel: 0, gas: 0, temperature: 0, humidity: 0, occupancyState: "Vacant" },
          },
        },
        settings: tariffs ? { tariffs } : {},
      });

      setHotels((prev) => [...prev, { id: propId, name: newName.trim(), location: newLocation.trim() || "Sri Lanka", rooms: 1 }]);
      setNewName("");
      setNewLocation("");
      toast({ title: "Hotel Added", description: `${newName.trim()} registered as ${propId}` });
    } catch (error) {
      console.error("Failed to add hotel:", error);
      toast({ title: "Error", description: "Failed to register hotel.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveHotel = async (id: string) => {
    try {
      if (!realtimeDb) throw new Error("DB not connected");
      await remove(ref(realtimeDb, `properties/${id}`));
      setHotels((prev) => prev.filter((h) => h.id !== id));
      toast({ title: "Removed", description: `Property ${id} has been removed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove property.", variant: "destructive" });
    }
  };

  return (
    <SidebarProvider>
      <SuperAdminSidebar />

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Hotel Properties</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Register and manage accommodation sites</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {hotels.length} registered
          </Badge>
        </header>

        <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">

          {/* Add Hotel */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                Register New Property
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="hotel-name" className="text-sm">Hotel Name</Label>
                  <Input id="hotel-name" placeholder="e.g. Ocean View Resort" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="hotel-loc" className="text-sm">Location</Label>
                  <Input id="hotel-loc" placeholder="e.g. Galle, Sri Lanka" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddHotel} disabled={adding || !newName.trim()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {adding ? "Adding..." : "Add Hotel"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hotels List */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm font-medium">All Properties</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Property</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Location</th>
                      <th className="px-6 py-3 text-center font-medium text-muted-foreground">Rooms</th>
                      <th className="px-6 py-3 text-center font-medium text-muted-foreground">ID</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotels.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                          No hotels registered. Use the form above to add one.
                        </td>
                      </tr>
                    ) : (
                      hotels.map((hotel) => (
                        <tr key={hotel.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">{hotel.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {hotel.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-mono">{hotel.rooms}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="secondary" className="font-mono text-xs">{hotel.id}</Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveHotel(hotel.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
