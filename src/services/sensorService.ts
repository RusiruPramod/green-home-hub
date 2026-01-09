import api from './api';

export interface SensorData {
  _id?: string;
  deviceId: string;
  deviceType: 'temperature' | 'humidity' | 'energy' | 'water' | 'gas' | 'motion' | 'light';
  value: number;
  unit: string;
  location?: string;
  status?: 'normal' | 'warning' | 'critical';
  timestamp?: Date;
}

export interface SensorAnalytics {
  _id: any;
  avgValue: number;
  minValue: number;
  maxValue: number;
  count: number;
}

export const sensorService = {
  // Get all sensor data
  getAllSensorData: async (params?: {
    deviceType?: string;
    deviceId?: string;
    limit?: number;
  }) => {
    const response = await api.get('/sensors', { params });
    return response.data;
  },

  // Get latest readings for each device
  getLatestReadings: async () => {
    const response = await api.get('/sensors/latest');
    return response.data;
  },

  // Get sensor analytics
  getAnalytics: async (params?: {
    deviceId?: string;
    deviceType?: string;
    period?: 'hour' | 'day' | 'week';
  }) => {
    const response = await api.get('/sensors/analytics', { params });
    return response.data;
  },

  // Get sensor data by ID
  getSensorById: async (id: string) => {
    const response = await api.get(`/sensors/${id}`);
    return response.data;
  },

  // Add new sensor data
  addSensorData: async (data: SensorData) => {
    const response = await api.post('/sensors', data);
    return response.data;
  },
};
