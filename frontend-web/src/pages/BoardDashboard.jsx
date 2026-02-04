import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

export default function BoardDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showBillsModal, setShowBillsModal] = useState(false);
  const [approveRequestId, setApproveRequestId] = useState(null);
  const [approveForm, setApproveForm] = useState({ unitNumber: '', unitType: '2BHK', floorNumber: 0 });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', category: 'GENERAL', priority: 'MEDIUM' });
  const [billsForm, setBillsForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDate: '' });

  const { data: society, error: societyError, isError: societyIsError } = useQuery({
    queryKey: ['board-society'],
    queryFn: async () => {
      const res = await boardAPI.getSociety();
      return res.data;
    },
    retry: false
  });

  const { data: joinRequestsData } = useQuery({
    queryKey: ['board-join-requests'],
    queryFn: async () => {
      const res = await boardAPI.listJoinRequests();
      return res.data;
    },
    enabled: (activeTab === 'requests' && !!society) || !!approveRequestId
  });

  const { data: members } = useQuery({
    queryKey: ['board-members'],
    queryFn: async () => {
      const res = await boardAPI.listMembers();
      return res.data.members;
    },
    enabled: activeTab === 'members' && !!society
  });

  const { data: maintenance } = useQuery({
    queryKey: ['board-maintenance'],
    queryFn: async () => {
      const res = await boardAPI.listMaintenance();
      return res.data.bills;
    },
    enabled: activeTab === 'maintenance' && !!society
  });

  const { data: visitors } = useQuery({
    queryKey: ['board-visitors'],
    queryFn: async () => {
      const res = await boardAPI.listVisitors();
      return res.data.visitors;
    },
    enabled: activeTab === 'visitors' && !!society
  });

  const { data: notices } = useQuery({
    queryKey: ['board-notices'],
    queryFn: async () => {
      const res = await boardAPI.listNotices();
      return res.data.notices;
    },
    enabled: activeTab === 'notices' && !!society
  });

  const { data: complaints } = useQuery({
    queryKey: ['board-complaints'],
    queryFn: async () => {
      const res = await boardAPI.listComplaints();
      return res.data.complaints;
    },
    enabled: activeTab === 'complaints' && !!society
  });

  const approveVisitorMutation = useMutation({
    mutationFn: boardAPI.approveVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries(['board-visitors']);
    }
  });

  const rejectVisitorMutation = useMutation({
    mutationFn: boardAPI.rejectVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries(['board-visitors']);
    }
  });

  const approveJoinRequestMutation = useMutation({
    mutationFn: ({ id, data }) => boardAPI.approveJoinRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['board-join-requests']);
      queryClient.invalidateQueries(['board-members']);
      setApproveRequestId(null);
      setApproveForm({ unitNumber: '', unitType: '2BHK', floorNumber: 0 });
    }
  });

  const rejectJoinRequestMutation = useMutation({
    mutationFn: (id) => boardAPI.rejectJoinRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['board-join-requests']);
      setApproveRequestId(null);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (profileId) => boardAPI.removeMember(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries(['board-members']);
    }
  });

  const createNoticeMutation = useMutation({
    mutationFn: boardAPI.createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries(['board-notices']);
      setShowNoticeModal(false);
      setNoticeForm({ title: '', content: '', category: 'GENERAL', priority: 'MEDIUM' });
    }
  });

  const generateBillsMutation = useMutation({
    mutationFn: boardAPI.generateMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries(['board-maintenance']);
      setShowBillsModal(false);
      setBillsForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDate: '' });
    }
  });

  const joinRequests = joinRequestsData?.requests ?? [];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Board Member Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, {user?.fullName || user?.email}</span>
          <button onClick={logout} className="btn-secondary">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="tabs">
          <button
            className={activeTab === 'overview' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'requests' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('requests')}
          >
            Member requests
          </button>
          <button
            className={activeTab === 'members' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button
            className={activeTab === 'maintenance' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('maintenance')}
          >
            Maintenance
          </button>
          <button
            className={activeTab === 'visitors' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('visitors')}
          >
            Visitors
          </button>
          <button
            className={activeTab === 'notices' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('notices')}
          >
            Notices
          </button>
          <button
            className={activeTab === 'complaints' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('complaints')}
          >
            Complaints
          </button>
        </div>

        <div className="tab-content">
          {societyIsError ? (
            <div className="overview" style={{ padding: 24 }}>
              <p style={{ color: '#856404', background: '#fff3cd', padding: 16, borderRadius: 8 }}>
                You are not assigned to any society yet. Ask the <strong>Super Admin</strong> to assign you to a society from the Admin dashboard (Societies → Assign Board Member).
              </p>
            </div>
          ) : activeTab === 'overview' && (
            <div className="overview">
              <h2>{society?.name}</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Units</h3>
                  <p>{society?.totalUnits || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Members</h3>
                  <p>{society?.totalMembers || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Board Members</h3>
                  <p>{society?.boardMembers || 0}</p>
                </div>
              </div>
              <div className="info-section">
                <p><strong>Address:</strong> {society?.address}</p>
                <p><strong>City:</strong> {society?.city}</p>
                <p><strong>Pincode:</strong> {society?.pincode}</p>
              </div>
            </div>
          )}

          {activeTab === 'requests' && !societyIsError && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Requested at</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {joinRequests.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}>No pending requests</td></tr>
                  )}
                  {joinRequests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.memberName}</td>
                      <td>{req.memberPhone}</td>
                      <td>{req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '—'}</td>
                      <td>
                        <button
                          onClick={() => setApproveRequestId(req.id)}
                          className="btn-small btn-success"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectJoinRequestMutation.mutate(req.id)}
                          className="btn-small btn-danger"
                          disabled={rejectJoinRequestMutation.isLoading}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'members' && !societyIsError && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Unit Number</th>
                    <th>Unit Type</th>
                    <th>Floor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members?.map((member) => (
                    <tr key={member.id}>
                      <td>{member.fullName}</td>
                      <td>{member.phone}</td>
                      <td>{member.unitNumber}</td>
                      <td>{member.unitType}</td>
                      <td>{member.floorNumber}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-small btn-danger"
                          onClick={() => {
                            if (window.confirm(`Remove ${member.fullName} from the society? Their unit will be vacated.`)) {
                              removeMemberMutation.mutate(member.id);
                            }
                          }}
                          disabled={removeMemberMutation.isLoading}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'maintenance' && !societyIsError && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setShowBillsModal(true)} className="btn-primary">
                  Generate maintenance bills
                </button>
              </div>
              <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Member</th>
                    <th>Month/Year</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance?.map((bill) => (
                    <tr key={bill.id}>
                      <td>{bill.unitNumber}</td>
                      <td>{bill.memberName}</td>
                      <td>{bill.month}/{bill.year}</td>
                      <td>₹{bill.amount}</td>
                      <td>
                        <span className={`status-badge status-${bill.status.toLowerCase()}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td>{new Date(bill.dueDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {activeTab === 'visitors' && !societyIsError && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Visitor Name</th>
                    <th>Phone</th>
                    <th>Purpose</th>
                    <th>Expected Date</th>
                    <th>Requested By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors?.map((visitor) => (
                    <tr key={visitor.id}>
                      <td>{visitor.visitorName}</td>
                      <td>{visitor.visitorPhone}</td>
                      <td>{visitor.purpose}</td>
                      <td>{new Date(visitor.expectedDate).toLocaleDateString()}</td>
                      <td>{visitor.requestedBy?.name} ({visitor.requestedBy?.unitNumber})</td>
                      <td>
                        <span className={`status-badge status-${visitor.status.toLowerCase()}`}>
                          {visitor.status}
                        </span>
                      </td>
                      <td>
                        {visitor.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approveVisitorMutation.mutate(visitor.id)}
                              className="btn-small btn-success"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectVisitorMutation.mutate(visitor.id)}
                              className="btn-small btn-danger"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'notices' && !societyIsError && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setShowNoticeModal(true)} className="btn-primary">
                  Create notice
                </button>
              </div>
              {notices?.map((notice) => (
                <div key={notice.id} className="notice-card">
                  <h3>{notice.title}</h3>
                  <p>{notice.content}</p>
                  <div className="notice-meta">
                    <span className="category">{notice.category}</span>
                    <span className="priority">{notice.priority}</span>
                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'complaints' && !societyIsError && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Raised By</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints?.map((complaint) => (
                    <tr key={complaint.id}>
                      <td>{complaint.title}</td>
                      <td>{complaint.category}</td>
                      <td>{complaint.raisedBy?.name} ({complaint.raisedBy?.unitNumber})</td>
                      <td>
                        <span className={`status-badge status-${complaint.status.toLowerCase().replace('_', '-')}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approve join request modal */}
      {approveRequestId && (
        <div className="modal-overlay" onClick={() => setApproveRequestId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Assign unit</h3>
            <p style={{ marginBottom: 12, color: '#666' }}>Enter unit details for the approved member.</p>
            <div className="form-group">
              <label>Unit number</label>
              <input
                type="text"
                value={approveForm.unitNumber}
                onChange={(e) => setApproveForm((f) => ({ ...f, unitNumber: e.target.value }))}
                placeholder="e.g. 101"
              />
            </div>
            <div className="form-group">
              <label>Unit type</label>
              <select
                value={approveForm.unitType}
                onChange={(e) => setApproveForm((f) => ({ ...f, unitType: e.target.value }))}
              >
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="4BHK">4BHK</option>
              </select>
            </div>
            <div className="form-group">
              <label>Floor number</label>
              <input
                type="number"
                min={0}
                value={approveForm.floorNumber}
                onChange={(e) => setApproveForm((f) => ({ ...f, floorNumber: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn-primary"
                onClick={() => approveJoinRequestMutation.mutate({ id: approveRequestId, data: approveForm })}
                disabled={!approveForm.unitNumber || approveJoinRequestMutation.isLoading}
              >
                {approveJoinRequestMutation.isLoading ? 'Saving…' : 'Approve & assign'}
              </button>
              <button className="btn-secondary" onClick={() => setApproveRequestId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create notice modal */}
      {showNoticeModal && (
        <div className="modal-overlay" onClick={() => setShowNoticeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create notice</h3>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Notice title"
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                rows={4}
                value={noticeForm.content}
                onChange={(e) => setNoticeForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Notice content"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={noticeForm.category}
                onChange={(e) => setNoticeForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="GENERAL">General</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="EVENT">Event</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={noticeForm.priority}
                onChange={(e) => setNoticeForm((f) => ({ ...f, priority: e.target.value }))}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn-primary"
                onClick={() => createNoticeMutation.mutate(noticeForm)}
                disabled={!noticeForm.title || noticeForm.content.length < 10 || createNoticeMutation.isLoading}
              >
                {createNoticeMutation.isLoading ? 'Creating…' : 'Create notice'}
              </button>
              <button className="btn-secondary" onClick={() => setShowNoticeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate bills modal */}
      {showBillsModal && (
        <div className="modal-overlay" onClick={() => setShowBillsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Generate maintenance bills</h3>
            <p style={{ marginBottom: 12, color: '#666' }}>Bills will be created for all occupied units for the selected month.</p>
            <div className="form-group">
              <label>Month</label>
              <select
                value={billsForm.month}
                onChange={(e) => setBillsForm((f) => ({ ...f, month: parseInt(e.target.value, 10) }))}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                min={2020}
                max={2030}
                value={billsForm.year}
                onChange={(e) => setBillsForm((f) => ({ ...f, year: parseInt(e.target.value, 10) || new Date().getFullYear() }))}
              />
            </div>
            <div className="form-group">
              <label>Due date</label>
              <input
                type="date"
                value={billsForm.dueDate}
                onChange={(e) => setBillsForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn-primary"
                onClick={() => generateBillsMutation.mutate({
                  month: billsForm.month,
                  year: billsForm.year,
                  dueDate: billsForm.dueDate || new Date(billsForm.year, billsForm.month, 0).toISOString().slice(0, 10)
                })}
                disabled={!billsForm.dueDate || generateBillsMutation.isLoading}
              >
                {generateBillsMutation.isLoading ? 'Generating…' : 'Generate bills'}
              </button>
              <button className="btn-secondary" onClick={() => setShowBillsModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
