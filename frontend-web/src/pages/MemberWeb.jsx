import { useAuth } from '../contexts/AuthContext';

export default function MemberWeb() {
  const { logout, user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', padding: 32, background: '#f5f5f5' }}>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          background: 'white',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <h1 style={{ marginTop: 0 }}>Member account</h1>
        <p style={{ color: '#555', lineHeight: 1.6 }}>
          You logged in as <b>{user?.email}</b>. The Member experience is built for the <b>mobile app</b>
          (Expo) and is not available on the web dashboard.
        </p>
        <p style={{ color: '#555', lineHeight: 1.6 }}>
          Use the mobile app to view bills, request visitor passes, read notices, and raise complaints.
        </p>

        <button
          onClick={logout}
          style={{
            marginTop: 12,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

