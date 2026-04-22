import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  forgotPassword: (email, role) => api.post('/auth/forgot-password', { email, role }),
  resetPassword: (email, code, password) => api.post('/auth/reset-password', { email, code, password })
};

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  bulkCreate: (students) => api.post('/students/bulk', { students }),
  update: (id, data) => api.put(`/students/${id}`, data),
  updatePoints: (id, data) => api.put(`/students/${id}/points`, data),
  delete: (id) => api.delete(`/students/${id}`)
};

// Rewards API
export const rewardsAPI = {
  getAll: () => api.get('/rewards'),
  getById: (id) => api.get(`/rewards/${id}`),
  create: (data) => api.post('/rewards', data),
  update: (id, data) => api.put(`/rewards/${id}`, data),
  redeem: (id, studentId) => api.post(`/rewards/${id}/redeem`, { studentId }),
  delete: (id) => api.delete(`/rewards/${id}`)
};

// Donations API
export const donationsAPI = {
  create: (data) => api.post('/donations', data),
  getAll: (params) => api.get('/donations', { params }),
  updateStatus: (id, status) => api.put(`/donations/${id}/status`, { status })
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getByStudent: (studentId) => api.get(`/transactions/student/${studentId}`)
};

// Collections API (Junk Shop)
export const collectionsAPI = {
  getStatus: () => api.get('/collections/status'),
  schedulePickup: (data) => api.post('/collections/pickups', data),
  completePickup: (id) => api.put(`/collections/pickups/${id}/complete`),
  getHistory: () => api.get('/collections/history')
};

// Reports API
export const reportsAPI = {
  recycling: (params) => api.post('/reports/recycling', params),
  donations: (params) => api.post('/reports/donations', params)
};

export default api;