import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../context/DashboardContext';
import {
  LayoutDashboard, Building2, Users, CalendarCheck, BookOpen,
  Laptop, Map, FileText, Presentation, User, LogOut,
  BarChart3, Target
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useDashboard();
  const navigate = useNavigate();
  const location = useLocation();
  
  if (!user) return null;
  
  const getDashboardPath = () => {
    switch (user.role) {
      case 'HR': return '/dashboard/hr';
      case 'Manager': return '/dashboard/manager';
      case 'Employee': return '/dashboard/employee';
      default: return '/dashboard';
    }
  };
  
  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: getDashboardPath(), roles: ['HR', 'Manager', 'Employee'] },
    { label: 'Office Utilization', icon: Building2, path: '/dashboard/kpis/office-utilization', roles: ['HR', 'Manager', 'Employee'] },
    { label: 'Meeting Effectiveness', icon: CalendarCheck, path: '/dashboard/kpis/meeting-effectiveness', roles: ['HR', 'Manager', 'Employee'] },
    { label: 'Employee Engagement', icon: Users, path: '/dashboard/kpis/employee-engagement', roles: ['HR', 'Manager', 'Employee'] },
    { label: 'Learning Participation', icon: BookOpen, path: '/dashboard/kpis/learning-participation', roles: ['HR', 'Manager', 'Employee'] },
    { label: 'Hybrid Work', icon: Laptop, path: '/dashboard/kpis/hybrid-work-effectiveness', roles: ['HR', 'Manager', 'Employee'] },
  ];
  
  const toolItems = [
    { label: 'Improvement Roadmap', icon: Map, path: '/dashboard/improvement-roadmap', roles: ['HR', 'Manager', 'Employee'] },
    { label: 'Reports', icon: FileText, path: '/dashboard/reports', roles: ['HR', 'Manager', 'Employee'] },
    { label: 'Presentation', icon: Presentation, path: '/dashboard/executive-presentation', roles: ['HR'] },
    { label: 'Profile', icon: User, path: '/dashboard/profile', roles: ['HR', 'Manager', 'Employee'] },
  ];
  
  const handleNav = (path) => {
    navigate(path);
    if (window.innerWidth <= 1024) setSidebarOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/experian-logo.svg" alt="Experian Services" />
        </div>
        <div className="sidebar-brand">
          Experian Services
          <span>Sustainability & Efficiency</span>
        </div>
      </div>
      
      <div className="sidebar-nav">
        <div className="sidebar-section-label">Dashboard</div>
        {navItems.filter(item => item.roles.includes(user.role)).map(item => (
          <button
            key={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <item.icon className="icon" size={18} />
            {item.label}
          </button>
        ))}
        
        <div className="sidebar-section-label">Tools</div>
        {toolItems.filter(item => item.roles.includes(user.role)).map(item => (
          <button
            key={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <item.icon className="icon" size={18} />
            {item.label}
          </button>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={handleLogout}>
          <LogOut className="icon" size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
