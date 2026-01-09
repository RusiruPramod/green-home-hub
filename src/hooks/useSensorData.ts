import { useState, useEffect } from 'react';
import { sensorService, SensorData } from '@/services';

export const useSensorData = (deviceType?: string, deviceId?: string) => {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await sensorService.getAllSensorData({
          deviceType,
          deviceId,
          limit: 100,
        });
        setData(response.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch sensor data');
        console.error('Error fetching sensor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceType, deviceId]);

  return { data, loading, error };
};

export const useLatestSensorData = () => {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await sensorService.getLatestReadings();
      setData(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch latest sensor data');
      console.error('Error fetching latest sensor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: fetchData };
};

export const useSensorAnalytics = (
  deviceId?: string,
  deviceType?: string,
  period: 'hour' | 'day' | 'week' = 'day'
) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await sensorService.getAnalytics({
          deviceId,
          deviceType,
          period,
        });
        setData(response.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [deviceId, deviceType, period]);

  return { data, loading, error };
};
