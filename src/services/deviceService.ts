import api from './api';

export interface Device {
  _id?: string;
  deviceId: string;
  name: string;
  type: 'light' | 'thermostat' | 'fan' | 'lock' | 'camera' | 'outlet' | 'sensor';
  location: string;
  status?: 'online' | 'offline' | 'error';
  isActive?: boolean;
  settings?: Record<string, any>;
  lastActivity?: Date;
}

export const deviceService = {
  // Get all devices
  getAllDevices: async (params?: { type?: string; status?: string }) => {
    const response = await api.get('/devices', { params });
    return response.data;
  },

  // Get device by ID
  getDeviceById: async (id: string) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  // Create new device
  createDevice: async (device: Device) => {
    const response = await api.post('/devices', device);
    return response.data;
  },

  // Update device
  updateDevice: async (id: string, data: Partial<Device>) => {
    const response = await api.put(`/devices/${id}`, data);
    return response.data;
  },

  // Delete device
  deleteDevice: async (id: string) => {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  },

  // Toggle device on/off
  toggleDevice: async (id: string) => {
    const response = await api.patch(`/devices/${id}/toggle`);
    return response.data;
  },
};
