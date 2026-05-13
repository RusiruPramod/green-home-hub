import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "@/services/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function FirebaseDebugger() {
  const [rootData, setRootData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!realtimeDb) {
      setError("Firebase not initialized");
      setLoading(false);
      return;
    }

    try {
      // Listen to the root of the database
      const rootRef = ref(realtimeDb, "/");
      
      const unsubscribe = onValue(
        rootRef,
        (snapshot) => {
          const data = snapshot.val();
          console.log("📊 Full Firebase Database Structure:", data);
          setRootData(data);
          setLoading(false);
          setError(null);
        },
        (dbError) => {
          console.error("❌ Firebase Read Error:", dbError);
          setError(dbError.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Firebase Setup Error:", errorMsg);
      setError(errorMsg);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-700">Loading Firebase database structure...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Firebase Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const hasProperties = rootData?.properties;
  const hasGlobalSettings = rootData?.globalSettings;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Firebase Database Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Check Global Settings */}
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <div className="flex items-center gap-2 mb-2">
            {hasGlobalSettings ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="font-semibold">globalSettings</span>
          </div>
          {hasGlobalSettings ? (
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(rootData.globalSettings, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-red-600">❌ Not found in database</p>
          )}
        </div>

        {/* Check Properties */}
        <div className="border-l-4 border-purple-500 pl-4 py-2">
          <div className="flex items-center gap-2 mb-2">
            {hasProperties ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="font-semibold">properties</span>
          </div>
          {hasProperties ? (
            <div className="space-y-2">
              {Object.entries(rootData.properties).map(([propertyId, propData]: any) => (
                <div key={propertyId} className="bg-gray-50 p-3 rounded">
                  <p className="font-mono text-sm font-semibold text-purple-700">
                    {propertyId}
                  </p>
                  {propData?.rooms && (
                    <div className="mt-2 ml-4 space-y-1">
                      {Object.entries(propData.rooms).map(([roomId, roomData]: any) => (
                        <div key={roomId}>
                          <p className="font-mono text-xs text-blue-600">📍 {roomId}</p>
                          {roomData?.latest && (
                            <div className="bg-white p-2 rounded mt-1 text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-600">waterLevel:</span>
                                  <span className="font-bold text-blue-600 ml-1">
                                    {roomData.latest.waterLevel ?? "N/A"}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">flowRate:</span>
                                  <span className="font-bold text-blue-600 ml-1">
                                    {roomData.latest.flowRate ?? "N/A"} L/min
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">temperature:</span>
                                  <span className="font-bold text-blue-600 ml-1">
                                    {roomData.latest.temperature ?? "N/A"}°C
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">updatedAt:</span>
                                  <span className="font-bold text-green-600 ml-1">
                                    {roomData.latest.updatedAt
                                      ? new Date(roomData.latest.updatedAt).toLocaleTimeString()
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-600">❌ Not found in database</p>
          )}
        </div>

        {/* Raw JSON View */}
        <div className="border-t pt-4">
          <details>
            <summary className="cursor-pointer font-semibold text-sm">
              📋 Full Raw Data (Click to expand)
            </summary>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96 mt-2">
              {JSON.stringify(rootData, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
