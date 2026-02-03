import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

export default function BoardDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: society, error: societyError, isError: societyIsError } = useQuery({
    queryKey: ['board-society'],
    queryFn: async () => {
      const res = await boardAPI.getSociety();
      return res.data;
    },
    retry: false
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'maintenance' && !societyIsError && (
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
    </div>
  );
}
