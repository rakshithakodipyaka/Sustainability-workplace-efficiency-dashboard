import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../context/DashboardContext';
import { getEmployeeKPIs, getTeamKPIs, getOrganizationKPIs } from '../services/kpiService';
import { formatRangeLabel } from '../utils/dateRange';
import { generateEmployeeRecommendations, generateTeamRecommendations, generateOrgRecommendations, getRecommendationStatus } from '../services/recommendationService';
import RecommendationCard from '../components/RecommendationCard';
import ScoreGauge from '../components/ScoreGauge';
import { Map, Target, Users, Building2, CheckCircle2, Clock, AlertTriangle, Layers, Filter } from 'lucide-react';

const ImprovementRoadmap = () => {
  const { user } = useAuth();
  const { filters } = useDashboard();
  const [managerTab, setManagerTab] = useState('team'); // 'team' | 'personal'
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // 'ALL' | 'High' | 'Medium' | 'Low'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Not Started' | 'In Progress' | 'Completed'
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for storage changes or trigger refresh to update summary stats
  useEffect(() => {
    const handleStorage = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('storage', handleStorage);
    // Periodically sync status in case cards update localStorage locally
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 1500);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Compute recommendations and KPI context based on user role
  const {
    recommendations,
    score,
    scoreLabel,
    subtitle,
    roleIcon,
    personalRecs,
    teamRecs
  } = useMemo(() => {
    if (!user) {
      return {
        recommendations: [],
        score: 0,
        scoreLabel: '',
        subtitle: '',
        roleIcon: <Map size={24} />,
        personalRecs: [],
        teamRecs: []
      };
    }

    if (user.role === 'Employee') {
      const empKPIs = getEmployeeKPIs(user.employeeId, filters.dateRange);
      const recs = generateEmployeeRecommendations(user.employeeId, empKPIs).map(rec => ({
        ...rec,
        status: getRecommendationStatus(rec.id)
      }));
      return {
        recommendations: recs,
        score: empKPIs.overallScore,
        scoreLabel: 'Your Overall Score',
        subtitle: 'Personalized action items derived from your lowest KPI categories this week',
        roleIcon: <Target size={24} color="var(--primary-light)" />,
        personalRecs: recs,
        teamRecs: []
      };
    }

    if (user.role === 'Manager') {
      const personalKPIs = getEmployeeKPIs(user.employeeId, filters.dateRange);
      const teamKPIs = getTeamKPIs(user.employeeId, filters.dateRange);

      const pRecs = generateEmployeeRecommendations(user.employeeId, personalKPIs).map(rec => ({
        ...rec,
        status: getRecommendationStatus(rec.id)
      }));

      const tRecs = generateTeamRecommendations(user.employeeId, teamKPIs).map(rec => ({
        ...rec,
        status: getRecommendationStatus(rec.id)
      }));

      const isTeam = managerTab === 'team';
      return {
        recommendations: isTeam ? tRecs : pRecs,
        score: isTeam ? teamKPIs.teamAverage : personalKPIs.overallScore,
        scoreLabel: isTeam ? 'Team Average Score' : 'Your Personal Score',
        subtitle: isTeam
          ? `Team performance roadmap for ${user.department || 'your unit'} with targeted employee interventions`
          : 'Personal efficiency and balance recommendations tailored to your weekly activity',
        roleIcon: isTeam ? <Users size={24} color="var(--primary-light)" /> : <Target size={24} color="var(--primary-light)" />,
        personalRecs: pRecs,
        teamRecs: tRecs
      };
    }

    // HR Role
    const orgKPIs = getOrganizationKPIs(filters.dateRange);
    const orgRecs = generateOrgRecommendations(orgKPIs).map(rec => ({
      ...rec,
      status: getRecommendationStatus(rec.id)
    }));
    return {
      recommendations: orgRecs,
      score: orgKPIs.orgAverage,
      scoreLabel: 'Organization Average',
      subtitle: `Strategic interventions across all departments for ${orgKPIs.organization?.name || 'Experian Services'}`,
      roleIcon: <Building2 size={24} color="var(--primary-light)" />,
      personalRecs: [],
      teamRecs: []
    };
  }, [user, managerTab, refreshKey, filters.dateRange]);

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    return recommendations.filter(rec => {
      const matchesPriority = priorityFilter === 'ALL' || rec.priority === priorityFilter;
      const currentStatus = getRecommendationStatus(rec.id);
      const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
      return matchesPriority && matchesStatus;
    });
  }, [recommendations, priorityFilter, statusFilter, refreshKey]);

  // Group by priority
  const highPriority = useMemo(() => filteredRecs.filter(r => r.priority === 'High'), [filteredRecs]);
  const mediumPriority = useMemo(() => filteredRecs.filter(r => r.priority === 'Medium'), [filteredRecs]);
  const lowPriority = useMemo(() => filteredRecs.filter(r => r.priority === 'Low'), [filteredRecs]);

  // Summary counts (calculated over active recommendation set regardless of active filters)
  const stats = useMemo(() => {
    const total = recommendations.length;
    let high = 0;
    let inProgress = 0;
    let completed = 0;

    recommendations.forEach(r => {
      if (r.priority === 'High') high++;
      const s = getRecommendationStatus(r.id);
      if (s === 'In Progress') inProgress++;
      if (s === 'Completed') completed++;
    });

    return { total, high, inProgress, completed };
  }, [recommendations, refreshKey]);

  return (
    <div className="improvement-roadmap-page">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {roleIcon}
            <h1 className="page-title">Improvement Roadmap</h1>
            <span className={`role-badge ${user?.role ? user.role.toLowerCase() : ''}`}>
              {user?.role} View
            </span>
          </div>
          <p className="page-subtitle">{subtitle}</p>
        </div>

        {/* Top Score Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'var(--bg-card)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <ScoreGauge score={score} size={84} label="" />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {scoreLabel}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              {score} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-tertiary)' }}>/ 10</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Updated for {formatRangeLabel(filters.dateRange)}
            </div>
          </div>
        </div>
      </div>

      {/* Manager Tab Selector */}
      {user?.role === 'Manager' && (
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`tab ${managerTab === 'team' ? 'active' : ''}`}
            onClick={() => setManagerTab('team')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Users size={16} />
            Team Improvement Plan ({teamRecs.length})
          </button>
          <button
            type="button"
            className={`tab ${managerTab === 'personal' ? 'active' : ''}`}
            onClick={() => setManagerTab('personal')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Target size={16} />
            My Personal Roadmap ({personalRecs.length})
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Recommendations</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change neutral">
            <Layers size={14} /> Comprehensive roadmap items
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-label">High Priority</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.high}</div>
          <div className="stat-change negative">
            <AlertTriangle size={14} /> Immediate focus this week
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.inProgress}</div>
          <div className="stat-change" style={{ color: 'var(--warning)' }}>
            <Clock size={14} /> Actively underway
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.completed}</div>
          <div className="stat-change positive">
            <CheckCircle2 size={14} /> Successfully resolved
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <Filter size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Filters:</span>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="priority-filter">Priority</label>
          <select
            id="priority-filter"
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {(priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            type="button"
            className="filter-reset"
            onClick={() => {
              setPriorityFilter('ALL');
              setStatusFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Priority Groups */}
      {filteredRecs.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div className="empty-state-icon">
            <CheckCircle2 size={48} color="var(--success)" />
          </div>
          <div className="empty-state-title">No Recommendations Match Your Filters</div>
          <p className="empty-state-text">
            Try adjusting your priority or status filters above to view other roadmap items.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* High Priority Section */}
          {highPriority.length > 0 && (
            <section className="section" style={{ marginBottom: 0 }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--danger)',
                    display: 'inline-block'
                  }} />
                  <span>High Priority Actions</span>
                  <span className="rec-priority high" style={{ marginLeft: 6 }}>
                    {highPriority.length} item{highPriority.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  Immediate resolution target: Within 7 days
                </span>
              </div>
              <div>
                {highPriority.map(rec => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Medium Priority Section */}
          {mediumPriority.length > 0 && (
            <section className="section" style={{ marginBottom: 0 }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--warning)',
                    display: 'inline-block'
                  }} />
                  <span>Medium Priority Initiatives</span>
                  <span className="rec-priority medium" style={{ marginLeft: 6 }}>
                    {mediumPriority.length} item{mediumPriority.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  Scheduled execution: Next 2 weeks
                </span>
              </div>
              <div>
                {mediumPriority.map(rec => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Low Priority Section */}
          {lowPriority.length > 0 && (
            <section className="section" style={{ marginBottom: 0 }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'inline-block'
                  }} />
                  <span>Low Priority & Maintenance</span>
                  <span className="rec-priority low" style={{ marginLeft: 6 }}>
                    {lowPriority.length} item{lowPriority.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  Continuous optimization & best practices
                </span>
              </div>
              <div>
                {lowPriority.map(rec => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Footer Info Box */}
      <div className="insight-box" style={{ marginTop: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          💡 <strong>Roadmap Persistence:</strong> Changes to recommendation statuses (<em>Not Started</em>, <em>In Progress</em>, <em>Completed</em>) are automatically synchronized with your local session storage and dynamically reflect across all performance reports.
        </div>
      </div>
    </div>
  );
};

export default ImprovementRoadmap;
