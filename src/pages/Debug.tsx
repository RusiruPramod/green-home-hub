import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/MobileSidebarTrigger";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { FirebaseDebugger } from "@/components/FirebaseDebugger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const Debug = () => {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <MobileSidebarTrigger />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Firebase Debugger</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">View real-time database structure</p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-3 sm:p-6 md:p-8 lg:p-10 max-w-[2000px] mx-auto">
          {/* Info Card */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-5 w-5" />
                Water Monitoring Real-Time Debug
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-amber-900">
              <p>
                This page shows <strong>exactly what data exists in your Firebase database</strong> right now.
              </p>
              <div className="bg-white p-3 rounded border border-amber-200">
                <p className="font-semibold mb-2">✅ What to look for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <span className="font-mono">properties/property_001/rooms/room_101/latest</span> node with <span className="font-mono">waterLevel</span> and <span className="font-mono">flowRate</span>
                  </li>
                  <li><span className="font-mono">updatedAt</span> timestamp should change every 3 seconds (when ESP32 sends data)</li>
                  <li>If values don't update, <strong>ESP32 is not sending data to Firebase</strong></li>
                </ul>
              </div>
              <p className="text-xs text-amber-800 italic">
                Open Browser Console (F12 → Console tab) to see detailed logs
              </p>
            </CardContent>
          </Card>

          {/* Firebase Debugger */}
          <FirebaseDebugger />

          {/* Troubleshooting Guide */}
          <Card>
            <CardHeader>
              <CardTitle>🔧 Troubleshooting Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-2">❌ If water data is NOT showing:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li><strong>Check ESP32 is connected to WiFi</strong> - Look at serial monitor</li>
                  <li><strong>Verify ESP32 code has correct Firebase path:</strong>
                    <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                      properties/property_001/rooms/room_101/latest
                    </code>
                  </li>
                  <li><strong>Check waterLevel and flowRate sensors</strong> - Are they reading values?</li>
                  <li><strong>Verify Firebase database URL in .env</strong> - Must match your project</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">✅ If data IS showing:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go back to <strong>Water page</strong></li>
                  <li>Open Browser Console (F12)</li>
                  <li>Watch for logs: 💧 Firebase Sensor Update, 🚰 WaterLevelGauge Updated</li>
                  <li>If logs show but UI doesn't update, there's a React component issue</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">📱 ESP32 Code Check:</p>
                <p className="text-xs text-blue-800">Make sure your ESP32 firmware is pushing to the correct path using Firebase REST API or WebSocket with this structure:</p>
                <pre className="bg-white p-2 rounded mt-2 text-xs overflow-auto">
{`POST /properties/property_001/rooms/room_101/latest.json
{
  "waterLevel": 75,
  "flowRate": 12,
  "temperature": 28,
  "updatedAt": 1715000000
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Debug;
