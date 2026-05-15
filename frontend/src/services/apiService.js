import axios from 'axios';

const API_URL = 'http://localhost:5000';
console.log('API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('rebot_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Dashboard API - FIXED ENDPOINTS
export const dashboardAPI = {
  getStats: () => api.get('/api/get-stats'),  // Changed from /api/dashboard/stats
  getTransactions: (limit = 10) => api.get(`/api/get-transactions?limit=${limit}`),
  getStudents: () => api.get('/api/get-students'),
  getRewards: () => api.get('/api/get-rewards')
};

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/login', { username, password }),
  forgotPassword: (email) => api.post('/request-reset', { email }),
  resetPassword: (email, otp, newPassword) => api.post('/reset-password', { email, otp, newPassword }),
  changePassword: (currentPassword, newPassword) => api.put('/change-password', { currentPassword, newPassword }),
  getProfile: () => api.get('/profile')
};

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getByQR: (qrCode) => api.get(`/students/qr/${qrCode}`),
  create: (data) => api.post('/students', data),
  bulkCreate: (students) => api.post('/students/bulk', { students }),
  update: (id, data) => api.put(`/students/${id}`, data),
  addPoints: (id, points) => api.patch(`/students/${id}/points`, { points }),
  delete: (id) => api.delete(`/students/${id}`),
  getQRCode: (id) => api.get(`/students/${id}/qrcode`)
};

// Rewards API
export const rewardsAPI = {
  getAll: () => api.get('/rewards'),
  getById: (id) => api.get(`/rewards/${id}`),
  create: (data) => api.post('/rewards', data),
  update: (id, data) => api.put(`/rewards/${id}`, data),
  delete: (id) => api.delete(`/rewards/${id}`),
  getInventory: () => api.get('/rewards/inventory'),
  updateInventory: (rewardId, stockQuantity) => api.put(`/rewards/inventory/${rewardId}`, { stockQuantity }),
  redeem: (studentId, rewardId, quantity = 1) => api.post('/rewards/redeem', { studentId, rewardId, quantity })
};

// Stats API - FIXED to use correct endpoints
export const statsAPI = {
  getSystemStats: () => dashboardAPI.getStats(),
  getRecentTransactions: (limit) => dashboardAPI.getTransactions(limit),
  getGradeLevelPerformance: () => api.get('/stats/points-distribution'),
  getBottlesPerGrade: () => api.get('/stats/bottles-per-grade')
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`)
};

export default api;