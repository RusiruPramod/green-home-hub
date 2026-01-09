import { useState, useEffect } from 'react';
import { deviceService, Device } from '@/services';

export const useDevices = (type?: string, status?: string) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await deviceService.getAllDevices({ type, status });
      setDevices(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [type, status]);

  const toggleDevice = async (deviceId: string) => {
    try {
      await deviceService.toggleDevice(deviceId);
      await fetchDevices(); // Refresh the list
    } catch (err: any) {
      console.error('Error toggling device:', err);
      throw err;
    }
  };

  const updateDevice = async (deviceId: string, data: Partial<Device>) => {
    try {
      await deviceService.updateDevice(deviceId, data);
      await fetchDevices(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating device:', err);
      throw err;
    }
  };

  const createDevice = async (device: Device) => {
    try {
      await deviceService.createDevice(device);
      await fetchDevices(); // Refresh the list
    } catch (err: any) {
      console.error('Error creating device:', err);
      throw err;
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      await deviceService.deleteDevice(deviceId);
      await fetchDevices(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting device:', err);
      throw err;
    }
  };

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
    toggleDevice,
    updateDevice,
    createDevice,
    deleteDevice,
  };
};
