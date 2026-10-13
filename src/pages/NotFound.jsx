import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 20
    }}>
      <div style={{ textAlign: 'center' }}>
        <AlertTriangle size={64} color="var(--warning)" style={{ marginBottom: 24 }} />
        <h1 style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>404</h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 24 }}>Page not found</p>
        <button
          className="export-btn"
          onClick={() => navigate('/dashboard')}
          style={{ gap: 8 }}
        >
          <Home size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
