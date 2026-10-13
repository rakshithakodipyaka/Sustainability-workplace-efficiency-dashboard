import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import HRDashboard from './pages/HRDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import KPIDetail from './pages/KPIDetail';
import ImprovementRoadmap from './pages/ImprovementRoadmap';
import Reports from './pages/Reports';
import ExecutivePresentation from './pages/ExecutivePresentation';
import Profile from './pages/Profile';
import EmployeeView from './pages/EmployeeView';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'HR':
      return <Navigate to="/dashboard/hr" replace />;
    case 'Manager':
      return <Navigate to="/dashboard/manager" replace />;
    case 'Employee':
      return <Navigate to="/dashboard/employee" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// HR has no personal KPI records (they are an administrator), so the personal
// dashboard route always resolves to the organization dashboard for that role.
const PersonalDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'HR') {
    return <Navigate to="/dashboard/hr" replace />;
  }
  return <EmployeeDashboard />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardRedirect />} />
        
        <Route path="hr" element={
          <ProtectedRoute allowedRoles={['HR']}>
            <HRDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="manager" element={
          <ProtectedRoute allowedRoles={['Manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="employee" element={
          <ProtectedRoute allowedRoles={['HR', 'Manager', 'Employee']}>
            <PersonalDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="employee/:employeeId" element={
          <ProtectedRoute>
            <EmployeeView />
          </ProtectedRoute>
        } />
        
        <Route path="kpis/:kpiId" element={
          <ProtectedRoute>
            <KPIDetail />
          </ProtectedRoute>
        } />
        
        <Route path="improvement-roadmap" element={
          <ProtectedRoute>
            <ImprovementRoadmap />
          </ProtectedRoute>
        } />
        
        <Route path="reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        
        <Route path="executive-presentation" element={
          <ProtectedRoute allowedRoles={['HR']}>
            <ExecutivePresentation />
          </ProtectedRoute>
        } />
        
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
