import { storage } from '../utils/storage';

// IMPORTANT:
// - On a REAL PHONE, "localhost" points to the phone (not your PC), so set EXPO_PUBLIC_API_URL to your PC IP.
// - You can use either http://IP:3000 or http://IP:3000/api; we normalize to include /api.
function getApiBaseUrl() {
  const raw =
    process.env.EXPO_PUBLIC_API_URL ||
    (__DEV__ ? 'http://localhost:3000' : 'https://your-backend-url.com');
  const base = raw.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}
const API_BASE_URL = getApiBaseUrl();

// Helper function to make API requests with fetch
async function request(endpoint, options = {}) {
  const token = await storage.getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${endpoint}`;
  
  // Handle query parameters
  if (options.params && Object.keys(options.params).length > 0) {
    const queryString = new URLSearchParams(options.params).toString();
    url = `${url}?${queryString}`;
  }

  const config = {
    method: options.method || 'GET',
    headers,
  };

  // Add body for POST, PUT, PATCH requests
  if (options.body) {
    config.body = options.body;
  }

  const response = await fetch(url, config);
  return handleResponse(response);
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let error;
    if (contentType && contentType.includes('application/json')) {
      error = await response.json();
    } else {
      error = { message: response.statusText || 'An error occurred' };
    }
    throw { response: { data: error, status: response.status } };
  }

  if (contentType && contentType.includes('application/json')) {
    return { data: await response.json() };
  }
  
  return { data: await response.text() };
}

export const authAPI = {
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => request('/auth/me'),
};

export const memberAPI = {
  getStatus: () => request('/member/status'),
  getAvailableSocieties: () => request('/member/available-societies'),
  createJoinRequest: (societyId) => request('/member/join-requests', {
    method: 'POST',
    body: JSON.stringify({ societyId }),
  }),
  listJoinRequests: () => request('/member/join-requests'),
  getBills: (params) => request('/member/bills', { params }),
  getBillDetails: (billId) => request(`/member/bills/${billId}`),
  payBill: (billId, data) => request(`/member/bills/${billId}/pay`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPaymentHistory: () => request('/member/payment-history'),
  requestVisitor: (data) => request('/member/visitors', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listVisitors: (params) => request('/member/visitors', { params }),
  listNotices: (params) => request('/member/notices', { params }),
  getNoticeDetails: (noticeId) => request(`/member/notices/${noticeId}`),
  raiseComplaint: (data) => request('/member/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listComplaints: (params) => request('/member/complaints', { params }),
  getComplaintDetails: (complaintId) => request(`/member/complaints/${complaintId}`),
};

export const boardAPI = {
  getSociety: () => request('/board/society'),
  listJoinRequests: () => request('/board/join-requests'),
  approveJoinRequest: (id, data) => request(`/board/join-requests/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  rejectJoinRequest: (id) => request(`/board/join-requests/${id}/reject`, {
    method: 'PUT',
  }),
  createNotice: (data) => request('/board/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateMaintenance: (data) => request('/board/maintenance/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listMembers: () => request('/board/members'),
  listMaintenance: (params) => request('/board/maintenance', { params }),
  listVisitors: (params) => request('/board/visitors', { params }),
  listNotices: (params) => request('/board/notices', { params }),
  listComplaints: (params) => request('/board/complaints', { params }),
  approveVisitor: (visitorId) => request(`/board/visitors/${visitorId}/approve`, { method: 'PUT' }),
  rejectVisitor: (visitorId) => request(`/board/visitors/${visitorId}/reject`, { method: 'PUT' }),
};

export const adminAPI = {
  listSocieties: () => request('/admin/societies'),
  listBoardMembers: () => request('/admin/board-members'),
  assignBoardMember: (societyId, data) => request(`/admin/societies/${societyId}/board-members`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export default { request };
