import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Admin API
export const adminAPI = {
  listSocieties: () => api.get('/admin/societies'),
  createSociety: (data) => api.post('/admin/societies', data),
  assignBoardMember: (societyId, data) => api.post(`/admin/societies/${societyId}/board-members`, data)
};

// Board API
export const boardAPI = {
  getSociety: () => api.get('/board/society'),
  listMembers: () => api.get('/board/members'),
  addMember: (data) => api.post('/board/members', data),
  generateMaintenance: (data) => api.post('/board/maintenance/generate', data),
  listMaintenance: (params) => api.get('/board/maintenance', { params }),
  listVisitors: (params) => api.get('/board/visitors', { params }),
  approveVisitor: (visitorId) => api.put(`/board/visitors/${visitorId}/approve`),
  rejectVisitor: (visitorId) => api.put(`/board/visitors/${visitorId}/reject`),
  logVisitorEntry: (visitorId) => api.post(`/board/visitors/${visitorId}/log-entry`),
  createNotice: (data) => api.post('/board/notices', data),
  listNotices: (params) => api.get('/board/notices', { params }),
  updateNotice: (noticeId, data) => api.put(`/board/notices/${noticeId}`, data),
  deleteNotice: (noticeId) => api.delete(`/board/notices/${noticeId}`),
  listComplaints: (params) => api.get('/board/complaints', { params }),
  updateComplaintStatus: (complaintId, data) => api.put(`/board/complaints/${complaintId}/status`, data)
};

export default api;
