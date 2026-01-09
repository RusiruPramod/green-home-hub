import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Database, Zap, CheckCircle2, XCircle, Server } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/services/api';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  category: string;
}

const apiEndpoints: ApiEndpoint[] = [
  // Sensor Endpoints
  { method: 'GET', path: '/api/sensors', description: 'Get all sensor data with optional filters', category: 'Sensors' },
  { method: 'GET', path: '/api/sensors/latest', description: 'Get latest reading for each device', category: 'Sensors' },
  { method: 'GET', path: '/api/sensors/analytics', description: 'Get aggregated sensor analytics', category: 'Sensors' },
  { method: 'GET', path: '/api/sensors/:id', description: 'Get specific sensor data by ID', category: 'Sensors' },
  { method: 'POST', path: '/api/sensors', description: 'Add new sensor data', category: 'Sensors' },
  
  // Device Endpoints
  { method: 'GET', path: '/api/devices', description: 'Get all devices with optional filters', category: 'Devices' },
  { method: 'GET', path: '/api/devices/:id', description: 'Get device by deviceId', category: 'Devices' },
  { method: 'POST', path: '/api/devices', description: 'Create new device', category: 'Devices' },
  { method: 'PUT', path: '/api/devices/:id', description: 'Update device information', category: 'Devices' },
  { method: 'DELETE', path: '/api/devices/:id', description: 'Delete device', category: 'Devices' },
  { method: 'PATCH', path: '/api/devices/:id/toggle', description: 'Toggle device on/off', category: 'Devices' },
];

export default function ServicesPage() {
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    checkApiStatus();
    setApiUrl(api.defaults.baseURL || 'http://localhost:5000/api');
  }, []);

  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      const response = await fetch(api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000');
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500';
      case 'POST':
        return 'bg-blue-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'PATCH':
        return 'bg-purple-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const categories = [...new Set(apiEndpoints.map((e) => e.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">API Services</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your Green Home Hub API endpoints</p>
          </div>
          <Button onClick={checkApiStatus} variant="outline">
            Refresh Status
          </Button>
        </div>

        {/* API Status Card */}
        <Card className="border-l-4" style={{ borderLeftColor: apiStatus === 'online' ? '#22c55e' : '#ef4444' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Server className="h-8 w-8 text-gray-700" />
                <div>
                  <CardTitle>API Server Status</CardTitle>
                  <CardDescription className="font-mono text-sm">{apiUrl}</CardDescription>
                </div>
              </div>
              {apiStatus === 'online' ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Online
                </Badge>
              ) : apiStatus === 'offline' ? (
                <Badge variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Offline
                </Badge>
              ) : (
                <Badge variant="secondary">Checking...</Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Service Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
              <Activity className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiEndpoints.length}</div>
              <p className="text-xs text-gray-600">Available API routes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Database className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-gray-600">Service categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Zap className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiStatus === 'online' ? apiEndpoints.length : 0}</div>
              <p className="text-xs text-gray-600">Ready to use</p>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>Complete list of available REST API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="space-y-4 mt-4">
                  {apiEndpoints
                    .filter((endpoint) => endpoint.category === category)
                    .map((endpoint, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Badge className={`${getMethodColor(endpoint.method)} text-white min-w-[70px] justify-center`}>
                          {endpoint.method}
                        </Badge>
                        <div className="flex-1">
                          <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                          <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>
                        </div>
                      </div>
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Usage Information */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>How to use the API services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Start the Backend Server</h3>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                cd backend && npm install && npm run dev
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Example API Call</h3>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                fetch('{apiUrl}/sensors/latest')
                  <br />
                  &nbsp;&nbsp;.then(res => res.json())
                  <br />
                  &nbsp;&nbsp;.then(data => console.log(data));
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Authentication</h3>
              <p className="text-sm text-gray-600">
                All API requests are currently open. Add authentication tokens in the Authorization header when
                implemented.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
