import axios from 'axios';
import { storage } from '../utils/storage';

// For development, use your computer's IP address or localhost
// For production, use your deployed backend URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // Change to your computer's IP if testing on device
  : 'https://your-backend-url.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const memberAPI = {
  getBills: (params) => api.get('/member/bills', { params }),
  getBillDetails: (billId) => api.get(`/member/bills/${billId}`),
  payBill: (billId, data) => api.post(`/member/bills/${billId}/pay`, data),
  getPaymentHistory: () => api.get('/member/payment-history'),
  requestVisitor: (data) => api.post('/member/visitors', data),
  listVisitors: (params) => api.get('/member/visitors', { params }),
  listNotices: (params) => api.get('/member/notices', { params }),
  getNoticeDetails: (noticeId) => api.get(`/member/notices/${noticeId}`),
  raiseComplaint: (data) => api.post('/member/complaints', data),
  listComplaints: (params) => api.get('/member/complaints', { params }),
  getComplaintDetails: (complaintId) => api.get(`/member/complaints/${complaintId}`)
};

export default api;
