import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    pincode: '',
    totalUnits: ''
  });

  const { data: societies, isLoading } = useQuery({
    queryKey: ['societies'],
    queryFn: async () => {
      const res = await adminAPI.listSocieties();
      return res.data.societies;
    }
  });

  const createMutation = useMutation({
    mutationFn: adminAPI.createSociety,
    onSuccess: () => {
      queryClient.invalidateQueries(['societies']);
      setShowCreateModal(false);
      setFormData({ name: '', address: '', city: '', pincode: '', totalUnits: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      totalUnits: parseInt(formData.totalUnits)
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, {user?.fullName || user?.email}</span>
          <button onClick={logout} className="btn-secondary">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="section-header">
          <h2>Societies</h2>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            + Create Society
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading societies...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>Pincode</th>
                  <th>Total Units</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {societies?.map((society) => (
                  <tr key={society.id}>
                    <td>{society.name}</td>
                    <td>{society.address}</td>
                    <td>{society.city}</td>
                    <td>{society.pincode}</td>
                    <td>{society.total_units}</td>
                    <td>{new Date(society.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(!societies || societies.length === 0) && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      No societies found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Society</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Units</label>
                <input
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                  required
                  min="1"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
