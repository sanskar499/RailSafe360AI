const BASE_URL = import.meta.env.VITE_API_URL || 'https://railsafe360ai-api.vercel.app/api';

const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Unified fetch handler
const request = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong with the API request');
  }

  return data;
};

export const api = {
  // Auth API
  auth: {
    login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    forgotPassword: (body: any) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    getProfile: () => request('/auth/profile'),
  },

  // Locomotive API
  locomotives: {
    getAll: (params: { search?: string; model?: string; status?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.model) query.append('model', params.model);
      if (params.status) query.append('status', params.status);
      return request(`/locomotives?${query.toString()}`);
    },
    getOne: (idOrNo: string) => request(`/locomotives/${idOrNo}`),
    create: (body: any) => request('/locomotives', { method: 'POST', body: JSON.stringify(body) }),
    updateMetrics: (id: string, body: any) => request(`/locomotives/${id}/metrics`, { method: 'PUT', body: JSON.stringify(body) }),
    addHistory: (id: string, body: any) => request(`/locomotives/${id}/history`, { method: 'POST', body: JSON.stringify(body) }),
    getAlerts: (locoNo?: string) => request(`/locomotives/alerts${locoNo ? `?locoNo=${locoNo}` : ''}`),
    resolveAlert: (id: string) => request(`/locomotives/alerts/${id}/resolve`, { method: 'PUT' }),
  },

  // Maintenance API
  maintenance: {
    getAll: (params: { status?: string; assignedEngineer?: string; technician?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.assignedEngineer) query.append('assignedEngineer', params.assignedEngineer);
      if (params.technician) query.append('technician', params.technician);
      return request(`/maintenance?${query.toString()}`);
    },
    getOne: (id: string) => request(`/maintenance/${id}`),
    create: (body: any) => request('/maintenance', { method: 'POST', body: JSON.stringify(body) }),
    updateJob: (id: string, body: any) => request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Incident API
  incidents: {
    getAll: (params: { status?: string; priority?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.priority) query.append('priority', params.priority);
      return request(`/incidents?${query.toString()}`);
    },
    getOne: (id: string) => request(`/incidents/${id}`),
    report: (body: any) => request('/incidents', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request(`/incidents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Telemetry API
  telemetry: {
    getRTIS: () => request('/telemetry/rtis'),
    getSLAM: () => request('/telemetry/slam'),
    predictive: (body: any) => request('/telemetry/predictive', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Reports API
  reports: {
    getSummary: () => request('/reports/summary'),
    getCharts: () => request('/reports/charts'),
    export: (type: string, range?: string) => {
      const query = new URLSearchParams({ type });
      if (range) query.append('range', range);
      return request(`/reports/export?${query.toString()}`);
    },
  },

  // Fire Prevention API
  firePrevention: {
    getStatus: (locoNo: string) => request(`/fire-prevention/loco/${locoNo}`),
    overrideSensors: (locoNo: string, body: any) => request(`/fire-prevention/sensor-override/${locoNo}`, { method: 'POST', body: JSON.stringify(body) }),
    getTimeline: (locoNo: string) => request(`/fire-prevention/timeline/${locoNo}`),
    getAnalytics: () => request('/fire-prevention/analytics'),
  },

  // Health Intelligence API
  healthIntel: {
    getStatus: (locoNo: string) => request(`/health-intel/loco/${locoNo}`),
    triggerFault: (locoNo: string, faultType: string) => request(`/health-intel/fault/${locoNo}`, { method: 'POST', body: JSON.stringify({ faultType }) }),
    getKnowledge: () => request('/health-intel/knowledge'),
    getSpareParts: () => request('/health-intel/spare-parts'),
    getReplay: (locoNo: string) => request(`/health-intel/replay/${locoNo}`),
  },
};
