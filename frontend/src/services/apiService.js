// src/services/apiService.js
import axios from 'axios';

// Use environment variable or fallback to deployed backend
const API_URL = process.env.REACT_APP_API_URL || 'https://rebot-system.onrender.com';

console.log('🔧 API Service initialized with URL:', API_URL);

// Strip trailing slash to avoid double-slash issues
const BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Detect if the base URL already ends with /api
const hasApiPrefix = BASE_URL.endsWith('/api');

// Helper: build a path that won't double up /api
const path = (p) => {
  if (hasApiPrefix) {
    return p.replace(/^\/api/, '');
  }
  return p;
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add token to requests — check both keys as fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('rebot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — do NOT wipe token or hard-redirect on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized on:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

// ========== REWARDS API ==========
export const rewardsAPI = {
  getAll:          ()                                  => api.get(path('/api/rewards')),
  getInventory:    ()                                  => api.get(path('/api/rewards/inventory')),
  updateInventory: (id, stock)                         => api.put(path(`/api/rewards/${id}/inventory`), { stock }),
  create:          (data)                              => api.post(path('/api/rewards'), data),
  update:          (id, data)                          => api.put(path(`/api/rewards/${id}`), data),
  delete:          (id)                                => api.delete(path(`/api/rewards/${id}`)),
  redeem:          (studentId, rewardId, quantity = 1) => api.post(path('/api/canteen/redeem'), { studentId, rewardId, quantity }),
};

// ========== STATS API ==========
export const statsAPI = {
  getSystemStats:           ()           => api.get(path('/api/get-stats')),
  getRecentTransactions:    (limit = 10) => api.get(path(`/api/transactions?limit=${limit}`)),
  getStats:                 ()           => api.get(path('/api/get-stats')),
  getGradeLevelPerformance: ()           => api.get(path('/api/stats/grade-performance')),
};

// ========== TRANSACTIONS API ==========
export const transactionsAPI = {
  getAll:       (limit = 100) => api.get(path(`/api/transactions?limit=${limit}`)),
  getByStudent: (studentId)   => api.get(path(`/api/transactions/student/${studentId}`)),
  create:       (data)        => api.post(path('/api/transactions'), data),
  getHistory:   (limit = 100) => api.get(path(`/api/transactions/history?limit=${limit}`)),
};

// ========== STUDENTS API ==========
export const studentsAPI = {
  getAll:       (params = {}) => api.get(path('/api/students'), { params }),
  getById:      (id)          => api.get(path(`/api/students/${id}`)),
  getByBarcode: (barcode)     => api.get(path(`/api/students/barcode/${barcode}`)),
  getByQR:      (qrValue)     => api.get(path(`/api/students/barcode/${qrValue}`)),
  updatePoints: (id, points)  => api.put(path(`/api/students/${id}/points`), { points }),
};

// ========== DASHBOARD API ==========
export const dashboardAPI = {
  getStats:     () => api.get(path('/api/get-stats')),
  getStudents:  () => api.get(path('/api/get-students')),
  getRewards:   () => api.get(path('/api/rewards')),
  getInventory: () => api.get(path('/api/rewards/inventory')),
};

// ========== AUTH API ==========
export const authAPI = {
  login:          (credentials) => api.post('/login', credentials),
  register:       (userData)    => api.post(path('/api/auth/register'), userData),
  getMe:          ()            => api.get(path('/api/auth/me')),
  changePassword: (data)        => api.put(path('/api/auth/change-password'), data),
};

export default api;