import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useDashboard } from '../context/DashboardContext';
import '../styles/components.css';
import '../styles/dashboard.css';

const DashboardLayout = () => {
  const { sidebarOpen, setSidebarOpen } = useDashboard();
  
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)} />
      <Topbar />
      <main className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
