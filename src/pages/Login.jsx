import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import '../styles/dashboard.css';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    api.get('/auth/demo-accounts').then(setDemoAccounts).catch(() => setDemoAccounts([]));
  }, []);
  
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'HR': navigate('/dashboard/hr'); break;
        case 'Manager': navigate('/dashboard/manager'); break;
        case 'Employee': navigate('/dashboard/employee'); break;
        default: navigate('/dashboard');
      }
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!employeeId.trim()) {
      setError('Please enter your Employee ID.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    
    setLoading(true);
    const result = await login(employeeId.trim().toUpperCase(), password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };
  
  const handleQuickLogin = async (id, pwd) => {
    setEmployeeId(id);
    setPassword(pwd);
    setError('');
    const result = await login(id, pwd);
    if (!result.success) {
      setError(result.error);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <img src="/experian-logo.svg" alt="Experian Services" />
          </div>
          <h1 className="login-title">Experian Services</h1>
          <p className="login-subtitle">Sustainability & Workplace Efficiency</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="employeeId">Employee ID</label>
            <div className="form-input-wrapper">
              <input
                id="employeeId"
                type="text"
                className={`form-input ${error && !employeeId ? 'error' : ''}`}
                placeholder="e.g. HR001, MGR001, EMP001"
                value={employeeId}
                onChange={e => { setEmployeeId(e.target.value); setError(''); }}
                autoComplete="username"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="form-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${error && !password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="form-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="demo-notice">
          <div className="demo-notice-title">
            <Info size={14} />
            Demo Environment
          </div>
          <div className="demo-notice-text">
            This is a demonstration system with simulated data. No real credentials are stored or required. Use the quick-login buttons below or enter any demo account credentials.
          </div>
        </div>
        
        <div className="quick-login">
          <div className="quick-login-title">Quick Login</div>
          <div className="quick-login-grid">
            {demoAccounts.map(account => (
              <button
                key={account.employeeId}
                type="button"
                className="quick-login-btn"
                onClick={() => handleQuickLogin(account.employeeId, account.password)}
              >
                {account.name}
                <span className="role">{account.employeeId} · {account.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
