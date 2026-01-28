import { storage } from '../utils/storage';

// For development, use your computer's IP address or localhost
// For production, use your deployed backend URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // Change to your computer's IP if testing on device
  : 'https://your-backend-url.com/api';

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

export default { request };
