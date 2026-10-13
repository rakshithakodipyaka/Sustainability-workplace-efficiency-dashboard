import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../context/DashboardContext';
import { getEmployeeKPIs, getTeamKPIs, getOrganizationKPIs } from '../services/kpiService';
import { getScoreBand } from '../utils/calculations';
import { Menu, Bell, Calendar, User, Map, FileText, LogOut, AlertTriangle, TrendingUp, Leaf } from 'lucide-react';

const KPI_LABELS = {
  officeUtilization: 'Office Utilization',
  meetingEffectiveness: 'Meeting Effectiveness',
  employeeEngagement: 'Employee Engagement',
  learningParticipation: 'Learning Participation',
  hybridWorkEffectiveness: 'Hybrid Work Effectiveness'
};

const KPI_SLUGS = {
  officeUtilization: 'office-utilization',
  meetingEffectiveness: 'meeting-effectiveness',
  employeeEngagement: 'employee-engagement',
  learningParticipation: 'learning-participation',
  hybridWorkEffectiveness: 'hybrid-work-effectiveness'
};

const bandTone = (score) => {
  const label = getScoreBand(score).label;
  if (label === 'Excellent' || label === 'Good') return 'positive';
  if (label === 'Needs Improvement') return 'warning';
  return 'critical';
};

const insightIcon = (item) => {
  if (item.id.includes('sustainability')) return <Leaf size={14} />;
  if (item.tone === 'positive') return <TrendingUp size={14} />;
  return <AlertTriangle size={14} />;
};

const buildInsights = (user) => {
  if (!user) return [];
  const insights = [];

  if (user.role === 'HR') {
    const org = getOrganizationKPIs();
    insights.push({
      id: 'org-average',
      tone: bandTone(org.orgAverage),
      title: `Organization average: ${org.orgAverage}/10`,
      text: `${getScoreBand(org.orgAverage).label} across ${org.employees.length} employees. Managers are reported separately.`,
      to: '/dashboard/hr'
    });

    if (org.needsImprovement.length > 0) {
      insights.push({
        id: 'org-attention',
        tone: 'critical',
        title: `${org.needsImprovement.length} employee${org.needsImprovement.length > 1 ? 's' : ''} below 6.0`,
        text: org.needsImprovement.map(e => `${e.name} (${e.kpis.overallScore}/10)`).join(', '),
        to: '/dashboard/hr'
      });
    }

    const lowest = Object.entries(org.orgKPIAverages).sort((a, b) => a[1] - b[1])[0];
    if (lowest) {
      insights.push({
        id: 'org-lowest-kpi',
        tone: bandTone(lowest[1]),
        title: `Lowest org KPI: ${KPI_LABELS[lowest[0]]}`,
        text: `Organization average of ${lowest[1]}/10 — review improvement actions for this KPI.`,
        to: `/dashboard/kpis/${KPI_SLUGS[lowest[0]]}`
      });
    }

    insights.push({
      id: 'org-sustainability',
      tone: 'positive',
      title: `Sustainability: ${org.sustainability.totalRemoteDays} remote days recorded`,
      text: `≈${org.sustainability.estimatedCO2SavedKg} kg CO₂e potentially avoided this week (estimate — see assumptions in Reports).`,
      to: '/dashboard/reports'
    });
    return insights;
  }

  const mine = getEmployeeKPIs(user.employeeId);
  const ranked = Object.entries(mine.kpiScores).sort((a, b) => a[1] - b[1]);
  const weakest = ranked[0];
  const strongest = ranked[ranked.length - 1];

  insights.push({
    id: 'my-weakest',
    tone: bandTone(weakest[1]),
    title: `Focus area: ${KPI_LABELS[weakest[0]]} (${weakest[1]}/10)`,
    text: `Your lowest scoring KPI this week. See the improvement roadmap for suggested actions.`,
    to: '/dashboard/improvement-roadmap'
  });

  insights.push({
    id: 'my-strongest',
    tone: 'positive',
    title: `Strength: ${KPI_LABELS[strongest[0]]} (${strongest[1]}/10)`,
    text: `Your highest scoring KPI this week — ${getScoreBand(strongest[1]).label}.`,
    to: `/dashboard/kpis/${KPI_SLUGS[strongest[0]]}`
  });

  const meeting = mine.details.meetingEffectiveness;
  if (meeting.isOverloaded) {
    insights.push({
      id: 'my-meeting-overload',
      tone: 'critical',
      title: `Meeting overload: ${meeting.totalMeetingHours}h this week`,
      text: `You are above the ${meeting.weeklyLimit}h weekly meeting limit. Review recurring invitations.`,
      to: '/dashboard/kpis/meeting-effectiveness'
    });
  }

  const learning = mine.details.learningParticipation;
  if (learning.totalLearningHours < learning.weeklyTarget) {
    insights.push({
      id: 'my-learning',
      tone: 'warning',
      title: `Learning: ${learning.totalLearningHours}h of ${learning.weeklyTarget}h target`,
      text: `${learning.totalEnrolled} course${learning.totalEnrolled === 1 ? '' : 's'} enrolled, ${learning.totalCompleted} completed.`,
      to: '/dashboard/kpis/learning-participation'
    });
  }

  const office = mine.details.officeUtilization;
  if (office.attendancePercentage < 60 && office.plannedDays > 0) {
    insights.push({
      id: 'my-attendance',
      tone: 'warning',
      title: `Office attendance: ${office.attendancePercentage}%`,
      text: `${office.presentDays} of ${office.plannedDays} planned office days attended.`,
      to: '/dashboard/kpis/office-utilization'
    });
  }

  const hybrid = mine.details.hybridWorkEffectiveness;
  if (hybrid.comparisonLabel !== 'Full comparison available') {
    insights.push({
      id: 'my-hybrid',
      tone: 'warning',
      title: 'Hybrid comparison incomplete',
      text: `${hybrid.comparisonLabel} — only ${hybrid.officeDays} office day(s) and ${hybrid.remoteDays} remote day(s) recorded.`,
      to: '/dashboard/kpis/hybrid-work-effectiveness'
    });
  }

  if (user.role === 'Manager') {
    const team = getTeamKPIs(user.employeeId);
    insights.push({
      id: 'team-average',
      tone: bandTone(team.teamAverage),
      title: `Team average: ${team.teamAverage}/10`,
      text: `${team.teamMembers.length} direct reports. ${team.needsImprovement.length} may benefit from support.`,
      to: '/dashboard/manager'
    });
  }

  return insights;
};

const Topbar = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useDashboard();
  const navigate = useNavigate();
  const [panel, setPanel] = useState(null);
  const barRef = useRef(null);

  const insights = useMemo(() => buildInsights(user), [user]);

  useEffect(() => {
    if (!panel) return undefined;
    const onDocClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setPanel(null);
    };
    const onKey = (e) => { if (e.key === 'Escape') setPanel(null); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [panel]);

  if (!user) return null;

  const getRoleBadgeClass = () => {
    switch (user.role) {
      case 'HR': return 'role-badge hr';
      case 'Manager': return 'role-badge manager';
      case 'Employee': return 'role-badge employee';
      default: return 'role-badge';
    }
  };

  const go = (to) => {
    setPanel(null);
    navigate(to);
  };

  const handleLogout = () => {
    setPanel(null);
    logout();
    navigate('/login');
  };

  return (
    <header className={`topbar ${!sidebarOpen ? 'sidebar-collapsed' : ''}`} ref={barRef}>
      <div className="topbar-left">
        <button
          className="topbar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
        >
          <Menu size={22} />
        </button>
        <div>
          <div className="topbar-title">Experian Services</div>
          <div className="topbar-date">
            <Calendar size={14} />
            Oct 5 - Oct 11, 2026
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-dropdown">
          <button
            className="topbar-notification"
            onClick={() => setPanel(panel === 'insights' ? null : 'insights')}
            aria-label={`Notifications and insights (${insights.length})`}
            aria-expanded={panel === 'insights'}
            aria-haspopup="dialog"
          >
            <Bell size={20} />
            {insights.length > 0 && <span className="notification-dot" />}
          </button>

          {panel === 'insights' && (
            <div className="topbar-panel" role="dialog" aria-label="Notifications and insights">
              <div className="topbar-panel-head">
                <span>Insights</span>
                <span className="topbar-panel-count">{insights.length}</span>
              </div>
              <div className="topbar-panel-body">
                {insights.length === 0 && (
                  <div className="topbar-panel-empty">No insights for the current week.</div>
                )}
                {insights.map(item => (
                  <button key={item.id} className="topbar-panel-item" onClick={() => go(item.to)}>
                    <span className={`topbar-panel-icon ${item.tone}`}>
                      {insightIcon(item)}
                    </span>
                    <span className="topbar-panel-text">
                      <strong>{item.title}</strong>
                      <span>{item.text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-dropdown">
          <button
            className="topbar-user"
            onClick={() => setPanel(panel === 'profile' ? null : 'profile')}
            aria-label="Profile menu"
            aria-expanded={panel === 'profile'}
            aria-haspopup="menu"
          >
            <div className="topbar-user-info">
              <div className="topbar-user-name">{user.name}</div>
              <div className="topbar-user-role">{user.employeeId} · <span className={getRoleBadgeClass()}>{user.role}</span></div>
            </div>
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #1e40af, #0d9488)' }}>
              {user.avatar}
            </div>
          </button>

          {panel === 'profile' && (
            <div className="topbar-panel topbar-panel-sm" role="menu" aria-label="Profile menu">
              <div className="topbar-panel-identity">
                <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, #1e40af, #0d9488)' }}>
                  {user.avatar}
                </div>
                <div>
                  <div className="topbar-panel-name">{user.name}</div>
                  <div className="topbar-panel-meta">{user.employeeId} · {user.role}</div>
                </div>
              </div>
              <button className="topbar-panel-link" role="menuitem" onClick={() => go('/dashboard/profile')}>
                <User size={16} /> Profile
              </button>
              <button className="topbar-panel-link" role="menuitem" onClick={() => go('/dashboard/improvement-roadmap')}>
                <Map size={16} /> Improvement Roadmap
              </button>
              <button className="topbar-panel-link" role="menuitem" onClick={() => go('/dashboard/reports')}>
                <FileText size={16} /> Reports
              </button>
              <button className="topbar-panel-link danger" role="menuitem" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
