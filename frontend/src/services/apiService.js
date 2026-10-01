// src/services/apiService.js
import axios from 'axios';

// IMPORTANT: Include /api in the URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const API_BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
export const apiUrl = (endpoint) => `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

console.log('🔧 API Service initialized with URL:', API_URL);

// Strip trailing slash to avoid double-slash issues
const BASE_URL = API_BASE_URL;

// Helper: build a path - KEEP THE PATH AS IS
const path = (p) => {
  return p;
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add token to requests
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

// Response interceptor
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
  getAll:          ()                                  => api.get(path('/rewards')),
  getInventory:    ()                                  => api.get(path('/rewards/inventory')),
  updateInventory: (id, stock)                         => api.put(path(`/rewards/${id}/inventory`), { stock }),
  create:          (data)                              => api.post(path('/rewards'), data),
  update:          (id, data)                          => api.put(path(`/rewards/${id}`), data),
  delete:          (id)                                => api.delete(path(`/rewards/${id}`)),
  redeem:          (studentId, rewardId, quantity = 1) => api.post(path('/canteen/redeem'), { studentId, rewardId, quantity }),
};

// ========== STATS API ==========
export const statsAPI = {
  getSystemStats:           ()           => api.get(path('/get-stats')),
  getRecentTransactions:    (limit = 10) => api.get(path(`/transactions?limit=${limit}`)),
  getStats:                 ()           => api.get(path('/get-stats')),
  getGradeLevelPerformance: ()           => api.get(path('/stats/grade-performance')),
};

// ========== TRANSACTIONS API ==========
export const transactionsAPI = {
  getAll:       (limit = 100) => api.get(path(`/transactions?limit=${limit}`)),
  getByStudent: (studentId)   => api.get(path(`/transactions/student/${studentId}`)),
  create:       (data)        => api.post(path('/transactions'), data),
  addPoints:    (data)        => api.post(path('/transactions/add-points'), data),
  getHistory:   (limit = 100) => api.get(path(`/transactions/history?limit=${limit}`)),
};

// ========== STUDENTS API ==========
export const studentsAPI = {
  getMyDashboard: ()            => api.get(path('/students/me/dashboard')),
  getAll:       (params = {}) => api.get(path('/students'), { params }),
  getById:      (id)          => api.get(path(`/students/${id}`)),
  getByBarcode: (barcode)     => api.get(path(`/students/barcode/${barcode}`)),
  getByQR:      (qrValue)     => api.get(path(`/students/qr/${encodeURIComponent(qrValue)}`)),
  updatePoints: (id, points)  => api.put(path(`/students/${id}/points`), { points }),
};

// ========== DASHBOARD API ==========
export const dashboardAPI = {
  getStats:     () => api.get(path('/get-stats')),
  getStudents:  () => api.get(path('/get-students')),
  getRewards:   () => api.get(path('/rewards')),
  getInventory: () => api.get(path('/rewards/inventory')),
};

// ========== AUTH API ==========
export const authAPI = {
  login:          (credentials) => api.post(path('/auth/login'), credentials),
  register:       (userData)    => api.post(path('/auth/register'), userData),
  getMe:          ()            => api.get(path('/auth/me')),
  changePassword: (data)        => api.put(path('/auth/change-password'), data),
  forgotPassword: (data)        => api.post(path('/auth/forgot-password'), data),
  resendOtp:      (data)        => api.post(path('/auth/resend-otp'), data),
  verifyOtp:      (data)        => api.post(path('/auth/verify-otp'), data),
  resetPassword:  (data)        => api.post(path('/auth/reset-password'), data),
};

export default api;