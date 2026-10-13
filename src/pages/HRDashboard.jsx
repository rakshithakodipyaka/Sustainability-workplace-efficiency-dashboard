import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Award,
  AlertTriangle,
  Leaf,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line
} from 'recharts';

import KPICard from '../components/KPICard';
import ScoreGauge from '../components/ScoreGauge';
import ChartCard from '../components/ChartCard';
import FilterBar from '../components/FilterBar';
import EmployeeTable from '../components/EmployeeTable';
import { getOrganizationKPIs } from '../services/kpiService';
import { getManagers, getEmployees } from '../services/dataService';
import { getScoreColor, getScoreLabel, formatPercentage } from '../utils/formatters';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../hooks/useAuth';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const KPI_CONFIG = [
  { key: 'officeUtilization', label: 'Office Utilization', short: 'Office Util.', baseline: 7.0 },
  { key: 'meetingEffectiveness', label: 'Meeting Effectiveness', short: 'Meetings', baseline: 7.2 },
  { key: 'employeeEngagement', label: 'Employee Engagement', short: 'Engagement', baseline: 7.5 },
  { key: 'learningParticipation', label: 'Learning Participation', short: 'Learning', baseline: 6.8 },
  { key: 'hybridWorkEffectiveness', label: 'Hybrid Work Effectiveness', short: 'Hybrid Work', baseline: 7.6 }
];

const getLowestKPIInfo = (kpiScores) => {
  if (!kpiScores) return { key: 'N/A', label: 'N/A', score: 0 };
  let minKey = '';
  let minScore = Infinity;

  KPI_CONFIG.forEach(({ key }) => {
    const val = kpiScores[key];
    if (typeof val === 'number' && val < minScore) {
      minScore = val;
      minKey = key;
    }
  });

  const matched = KPI_CONFIG.find(k => k.key === minKey);
  return {
    key: minKey,
    label: matched ? matched.label : minKey,
    score: minScore !== Infinity ? minScore : 0
  };
};

const getHighestKPIInfo = (kpiScores) => {
  if (!kpiScores) return { key: 'N/A', label: 'N/A', score: 0 };
  let maxKey = '';
  let maxScore = -Infinity;

  KPI_CONFIG.forEach(({ key }) => {
    const val = kpiScores[key];
    if (typeof val === 'number' && val > maxScore) {
      maxScore = val;
      maxKey = key;
    }
  });

  const matched = KPI_CONFIG.find(k => k.key === maxKey);
  return {
    key: maxKey,
    label: matched ? matched.label : maxKey,
    score: maxScore !== -Infinity ? maxScore : 0
  };
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-md)',
          fontSize: '12px'
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          {label}
        </div>
        {payload.map((entry, idx) => (
          <div
            key={`tt-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              color: entry.color || 'var(--text-secondary)',
              marginTop: '2px'
            }}
          >
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {entry.value}
              {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const HRDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { filters, updateFilter } = useDashboard();

  // Load calculated org KPI data and entity lists
  const orgKPIs = useMemo(() => getOrganizationKPIs(), []);
  const allManagersList = useMemo(() => getManagers(), []);
  const allEmployeesList = useMemo(() => getEmployees(), []);

  const {
    organization = {},
    orgAverage = 0,
    orgKPIAverages = {},
    employees = [],
    managers = [],
    topPerformers = [],
    needsImprovement = [],
    dailyOccupancy = [],
    sustainability = {}
  } = orgKPIs;

  // Selected manager resolution
  const selectedManagerObj = useMemo(() => {
    if (!filters.selectedManager) return null;
    return managers.find(m => m.employeeId === filters.selectedManager) || null;
  }, [filters.selectedManager, managers]);

  // Combined staff for directory table with manager filter applied
  const displayedEmployees = useMemo(() => {
    const combined = [...managers, ...employees];
    if (!filters.selectedManager) return combined;

    if (selectedManagerObj) {
      const directReportsSet = new Set(selectedManagerObj.directReports || []);
      return combined.filter(
        emp => emp.employeeId === selectedManagerObj.employeeId || directReportsSet.has(emp.employeeId)
      );
    }
    return combined;
  }, [managers, employees, filters.selectedManager, selectedManagerObj]);

  // Team comparison data (Alpha vs Beta)
  const teamComparisonData = useMemo(() => {
    const mgrAlpha = managers.find(m => (m.team || '').toLowerCase().includes('alpha')) || managers[0];
    const mgrBeta = managers.find(m => (m.team || '').toLowerCase().includes('beta')) || managers[1];

    return KPI_CONFIG.map(kpi => ({
      category: kpi.short,
      fullName: kpi.label,
      Alpha: mgrAlpha?.teamKPIs?.teamKPIAverages?.[kpi.key] || 0,
      Beta: mgrBeta?.teamKPIs?.teamKPIAverages?.[kpi.key] || 0
    }));
  }, [managers]);

  // Radar chart data for organizational KPI distribution vs benchmark
  const radarData = useMemo(() => {
    return KPI_CONFIG.map(kpi => ({
      kpi: kpi.short,
      fullName: kpi.label,
      score: orgKPIAverages[kpi.key] || 0,
      benchmark: 7.5,
      fullMark: 10
    }));
  }, [orgKPIAverages]);

  // Daily workspace occupancy data with selectedDay highlighting
  const occupancyChartData = useMemo(() => {
    return (dailyOccupancy || []).map(dayItem => ({
      day: dayItem.day,
      date: dayItem.date,
      occupancy: dayItem.occupancy,
      capacity: dayItem.capacity,
      utilizationPercent: dayItem.utilizationPercent,
      isSelected: filters.selectedDay === dayItem.date
    }));
  }, [dailyOccupancy, filters.selectedDay]);

  // Day filter label helper
  const selectedDayLabel = useMemo(() => {
    if (!filters.selectedDay) return null;
    const match = dailyOccupancy.find(d => d.date === filters.selectedDay);
    return match ? `${match.day} (${match.date})` : filters.selectedDay;
  }, [filters.selectedDay, dailyOccupancy]);

  return (
    <div className="dashboard-content" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      {/* 1. Welcome Banner with User Name */}
      <div className="welcome-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="welcome-title">Welcome back, {user?.name || 'HR Leader'}!</h1>
            <p className="welcome-subtitle">
              Organization-wide Sustainability & Workplace Efficiency Command Center
            </p>
            <div className="welcome-meta">
              <span>
                <strong>Organization:</strong> {organization.name || 'GreenTech Solutions Pvt. Ltd.'}
              </span>
              <span>•</span>
              <span>
                <strong>Evaluation Period:</strong> Oct 5 – Oct 11, 2026 (Week 41)
              </span>
              <span>•</span>
              <span>
                <strong>Status:</strong> All Teams Synchronized
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(4px)',
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            <ShieldCheck size={18} /> Role: {user?.role || 'HR'} Access
          </div>
        </div>
      </div>

      {/* 2. Organization Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label">Total Employees</div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius)',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e40af'
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{organization.totalEmployees || employees.length || 10}</div>
          <div className="stat-change neutral">
            <span>Direct workforce across operational teams</span>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label">Total Managers</div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius)',
                background: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4338ca'
              }}
            >
              <Building2 size={18} />
            </div>
          </div>
          <div className="stat-value">{organization.totalManagers || managers.length || 2}</div>
          <div className="stat-change positive">
            <span>Alpha (Engineering) & Beta (Product)</span>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label">Org Average Score</div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius)',
                background: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#065f46'
              }}
            >
              <Award size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: getScoreColor(orgAverage) }}>
            {orgAverage}
            <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-tertiary)' }}>/10</span>
          </div>
          <div className="stat-change positive">
            <span style={{ fontWeight: 600 }}>{getScoreLabel(orgAverage)}</span>
            <span>• Org composite index</span>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label">Avg Office Utilization</div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius)',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#92400e'
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-value">
            {sustainability.avgUtilizationPercent !== undefined
              ? `${sustainability.avgUtilizationPercent}%`
              : '48%'}
          </div>
          <div className="stat-change neutral">
            <span>{sustainability.avgDailyOccupancy || 9.6} avg present / {organization.officeCapacity || 20} capacity</span>
          </div>
        </div>
      </div>

      {/* 5. FilterBar with Manager and Day Filters */}
      <div style={{ marginBottom: '24px' }}>
        <FilterBar
          managers={allManagersList}
          employees={allEmployeesList}
          showManagerFilter={true}
          showDayFilter={true}
        />

        {/* Active Filter Indicators */}
        {(filters.selectedManager || filters.selectedDay) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '-8px',
              marginBottom: '16px',
              padding: '8px 14px',
              background: '#eff6ff',
              borderRadius: 'var(--radius)',
              border: '1px solid #bfdbfe',
              fontSize: '13px',
              color: '#1e40af'
            }}
          >
            <Filter size={14} />
            <span>
              <strong>Active Filters:</strong>{' '}
              {selectedManagerObj && (
                <span style={{ marginRight: '8px' }}>
                  Team: <strong>{selectedManagerObj.team} ({selectedManagerObj.name})</strong>
                </span>
              )}
              {selectedDayLabel && (
                <span>
                  Day: <strong>{selectedDayLabel}</strong>
                </span>
              )}
            </span>
            <button
              onClick={() => {
                updateFilter('selectedManager', null);
                updateFilter('selectedDay', null);
              }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. 5 KPI Cards in Grid */}
      <div className="section">
        <div className="section-title">
          <Layers size={20} /> Key Performance Indicators (Organization Overview)
        </div>
        <div className="kpi-grid">
          {KPI_CONFIG.map(kpi => (
            <KPICard
              key={kpi.key}
              kpiKey={kpi.key}
              score={orgKPIAverages[kpi.key] || 0}
              previousScore={kpi.baseline}
            />
          ))}
        </div>
      </div>

      {/* 4. OverviewScore Section with ScoreGauge and KPI Bars */}
      <div className="overview-score">
        <div className="overview-score-left">
          <ScoreGauge score={orgAverage} size={140} label="Org Average Score" />
        </div>
        <div className="overview-score-right">
          <div className="overview-score-title">Comprehensive Organizational Performance Index</div>
          <div className="overview-score-subtitle">
            Weighted composite assessment across all 5 operational efficiency and sustainability dimensions
          </div>
          <div className="overview-kpi-bars">
            {KPI_CONFIG.map(kpi => {
              const score = orgKPIAverages[kpi.key] || 0;
              const color = getScoreColor(score);
              return (
                <div key={kpi.key} className="overview-kpi-row">
                  <div className="overview-kpi-label">{kpi.label}</div>
                  <div className="overview-kpi-bar-track">
                    <div
                      className="overview-kpi-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, score * 10))}%`,
                        background: color
                      }}
                    />
                  </div>
                  <div className="overview-kpi-score" style={{ color }}>
                    {score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Multiple Charts: Team Comparison & KPI Distribution Radar */}
      <div className="charts-grid">
        {/* Team Comparison Bar Chart */}
        <ChartCard
          title="Team KPI Comparison (Alpha vs Beta)"
          subtitle="Direct benchmark across all 5 KPI categories for Engineering & Product"
        >
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teamComparisonData}
                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  dataKey="Alpha"
                  name="Team Alpha (Engineering)"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Beta"
                  name="Team Beta (Product)"
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* KPI Distribution Radar Chart */}
        <ChartCard
          title="KPI Performance Radar & Benchmarks"
          subtitle="Current org average compared against target operational benchmark (7.5/10)"
        >
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="kpi" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#cbd5e1" tick={{ fontSize: 10 }} />
                <Radar
                  name="Org Average"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.45}
                />
                <Radar
                  name="Target Benchmark"
                  dataKey="benchmark"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeDasharray="3 3"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Top Performers and Needs Improvement Lists */}
      <div className="charts-grid">
        {/* Top Performers List */}
        <ChartCard
          title="Top Performing Employees"
          subtitle="Highest overall efficiency & engagement ratings across the organization"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topPerformers && topPerformers.length > 0 ? (
              topPerformers.map((emp, idx) => {
                const highest = getHighestKPIInfo(emp.kpis?.kpiScores);
                const score = emp.kpis?.overallScore || 0;
                const scoreColor = getScoreColor(score);
                return (
                  <div
                    key={emp.employeeId}
                    onClick={() => navigate(`/dashboard/employee/${emp.employeeId}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, border-color 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--primary-light)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: 'var(--radius-full)',
                          background: idx === 0 ? '#fef3c7' : idx === 1 ? '#e2e8f0' : '#ede9fe',
                          color: idx === 0 ? '#b45309' : idx === 1 ? '#475569' : '#6d28d9',
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div
                        className="avatar avatar-sm"
                        style={{ background: 'linear-gradient(135deg, #1e40af, #0d9488)' }}
                      >
                        {emp.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Team {emp.team || 'Alpha'} • {emp.department}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right', display: 'none', sm: 'block' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Strongest KPI</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#065f46' }}>
                          {highest.label} ({highest.score})
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: `${scoreColor}15`,
                          color: scoreColor,
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        {score}/10
                      </div>
                      <ChevronRight size={16} color="var(--text-tertiary)" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-state-title">No Top Performers Found</div>
                <div className="empty-state-text">Employee evaluations will appear once submitted.</div>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Needs Improvement List */}
        <ChartCard
          title="Attention & Coaching Focus"
          subtitle="Employees with overall score below 6.0 requiring targeted support"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {needsImprovement && needsImprovement.length > 0 ? (
              needsImprovement.map(emp => {
                const lowest = getLowestKPIInfo(emp.kpis?.kpiScores);
                const score = emp.kpis?.overallScore || 0;
                const scoreColor = getScoreColor(score);
                return (
                  <div
                    key={emp.employeeId}
                    onClick={() => navigate(`/dashboard/employee/${emp.employeeId}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#fff7ed',
                      borderRadius: 'var(--radius)',
                      border: '1px solid #fed7aa',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-full)',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9a3412' }}>
                          Team {emp.team} • Lowest KPI: <strong>{lowest.label} ({lowest.score}/10)</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: '#fee2e2',
                          color: '#dc2626',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        {score}/10
                      </div>
                      <ChevronRight size={16} color="#9a3412" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius)',
                  border: '1px dashed #a7f3d0'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-full)',
                    background: '#d1fae5',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: '#065f46' }}>
                  All Employees Meeting Standards
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  All 10 active team members maintain scores at or above the 6.0 performance threshold.
                </div>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Workspace Occupancy Bar Chart (Daily) */}
      <div className="section">
        <ChartCard
          title="Daily Workspace Occupancy & Desk Utilization"
          subtitle={`Monday to Friday in-office attendance against maximum physical capacity (${organization.officeCapacity || 20} desks)`}
          action={
            filters.selectedDay && (
              <span
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: '#ede9fe',
                  color: '#6d28d9',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600
                }}
              >
                Highlighted: {selectedDayLabel}
              </span>
            )
          }
        >
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={occupancyChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  domain={[0, 25]}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  label={{ value: 'Occupants', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            padding: '10px 14px',
                            boxShadow: 'var(--shadow-md)',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {data.day} ({data.date})
                          </div>
                          <div style={{ marginTop: '4px', color: '#3b82f6' }}>
                            In-Office Present: <strong>{data.occupancy}</strong>
                          </div>
                          <div style={{ color: '#64748b' }}>
                            Capacity: <strong>{data.capacity}</strong>
                          </div>
                          <div style={{ marginTop: '4px', color: '#10b981', fontWeight: 600 }}>
                            Utilization: {data.utilizationPercent}%
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="occupancy" name="Present In-Office" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {occupancyChartData.map((entry, index) => (
                    <Cell
                      key={`occ-${index}`}
                      fill={entry.isSelected ? '#8b5cf6' : '#3b82f6'}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="capacity"
                  name="Office Capacity (20)"
                  fill="#e2e8f0"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-light)',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}
          >
            <span>
              <strong>Utilization Peak:</strong> Wednesday & Thursday (highest in-person collaboration)
            </span>
            <span>
              <strong>Remote Preference:</strong> Mondays & Fridays (highest remote attendance)
            </span>
          </div>
        </ChartCard>
      </div>

      {/* Separate Manager KPI Profiles */}
      <div className="section">
        <div className="section-title">
          <Building2 size={20} /> Team Leadership Profiles & Manager Performance
        </div>
        <div className="section-subtitle">
          Individual manager KPI execution alongside supervisory team averages
        </div>
        <div className="charts-grid">
          {managers.map(mgr => {
            const mgrScores = mgr.kpis?.kpiScores || {};
            const teamAverages = mgr.teamKPIs?.teamKPIAverages || {};
            const isSelected = filters.selectedManager === mgr.employeeId;

            return (
              <div
                key={mgr.employeeId}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--primary-light)' : '1px solid var(--border)',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'var(--transition)'
                }}
              >
                {/* Manager Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      className="avatar avatar-lg"
                      style={{ background: 'linear-gradient(135deg, #1e40af, #6366f1)' }}
                    >
                      {mgr.avatar}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {mgr.name}
                        </span>
                        <span className="role-badge manager">Manager</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Team {mgr.team} • {mgr.department} • {mgr.directReports?.length || 0} Direct Reports
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      updateFilter('selectedManager', isSelected ? null : mgr.employeeId);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-primary)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {isSelected ? 'Selected' : 'Filter by Team'}
                  </button>
                </div>

                {/* Score Comparison Chips */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '10px',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Manager Score
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: getScoreColor(mgr.kpis?.overallScore || 0)
                      }}
                    >
                      {mgr.kpis?.overallScore || 0}
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>/10</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Team Average
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: getScoreColor(mgr.teamKPIs?.teamAverage || 0)
                      }}
                    >
                      {mgr.teamKPIs?.teamAverage || 0}
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>/10</span>
                    </div>
                  </div>
                </div>

                {/* KPI Breakdown Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Individual KPI Breakdown:
                  </div>
                  {KPI_CONFIG.map(kpi => {
                    const score = mgrScores[kpi.key] || 0;
                    const teamScore = teamAverages[kpi.key] || 0;
                    const color = getScoreColor(score);
                    return (
                      <div key={kpi.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <span>{kpi.short}</span>
                          <span>
                            <strong style={{ color }}>{score}</strong>
                            <span style={{ color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                              (Team: {teamScore})
                            </span>
                          </span>
                        </div>
                        <div
                          style={{
                            height: '5px',
                            background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.max(0, score * 10))}%`,
                              background: color,
                              borderRadius: 'var(--radius-full)'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. Sustainability Section */}
      <div className="section">
        <div className="sustainability-card">
          <div className="sustainability-title">
            <Leaf size={22} color="#065f46" /> Environmental Sustainability & Remote Work CO2 Impact
          </div>
          <p style={{ fontSize: '13px', color: '#047857', marginTop: '2px', lineHeight: 1.5 }}>
            Automated workplace efficiency audit measuring carbon offsets derived from employee hybrid schedules
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '16px',
              marginTop: '20px',
              marginBottom: '16px'
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '16px',
                borderRadius: 'var(--radius)',
                border: '1px solid #a7f3d0'
              }}
            >
              <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>Estimated CO2 Saved</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
                {sustainability.estimatedCO2SavedKg !== undefined ? sustainability.estimatedCO2SavedKg : 0}
                <span style={{ fontSize: '14px', fontWeight: 500 }}> kg</span>
              </div>
              <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                Estimated weekly offset
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '16px',
                borderRadius: 'var(--radius)',
                border: '1px solid #a7f3d0'
              }}
            >
              <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>Total Remote Days</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
                {sustainability.totalRemoteDays !== undefined ? sustainability.totalRemoteDays : 0}
                <span style={{ fontSize: '14px', fontWeight: 500 }}> days</span>
              </div>
              <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                Logged this week across staff
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '16px',
                borderRadius: 'var(--radius)',
                border: '1px solid #a7f3d0'
              }}
            >
              <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>Avg Office Utilization</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
                {sustainability.avgUtilizationPercent !== undefined ? sustainability.avgUtilizationPercent : 0}%
              </div>
              <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                Optimal balanced desk usage
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '16px',
                borderRadius: 'var(--radius)',
                border: '1px solid #a7f3d0'
              }}
            >
              <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>Commute Avoided</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
                {(sustainability.totalRemoteDays || 0) * (organization.sustainabilityConfig?.estimatedCommuteDistanceKm || 25) * 2}
                <span style={{ fontSize: '14px', fontWeight: 500 }}> km</span>
              </div>
              <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                Total transit mileage eliminated
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              color: '#065f46',
              flexWrap: 'wrap'
            }}
          >
            <span>
              🌱 <strong>Tree Offset Equivalent:</strong> ~{Math.max(1, Math.round((sustainability.estimatedCO2SavedKg || 0) / 21))} mature tree seedlings grown for 10 years
            </span>
            <span>
              ⛽ <strong>Gasoline Conserved:</strong> ~{Math.round(((sustainability.totalRemoteDays || 0) * 50) / 12)} liters avoided
            </span>
            <span>
              ⚡ <strong>Facility Energy Reduction:</strong> ~18% weekly office kilowatt load conserved
            </span>
          </div>

          <div className="sustainability-note">
            <strong>Calculation Methodology & Assumptions:</strong>{' '}
            {organization.sustainabilityConfig?.co2EmissionNote ||
              'Estimated using average car CO2 emission factor of 0.21 kg/km (round trip = 50km). This is an illustrative estimate only.'}
          </div>
        </div>
      </div>

      {/* 7. EmployeeTable with all Employees and Managers */}
      <div className="section">
        <EmployeeTable
          employees={displayedEmployees}
          title={
            selectedManagerObj
              ? `Team Directory: ${selectedManagerObj.team} Team (${selectedManagerObj.name})`
              : 'Organization Staff Directory (All Employees & Managers)'
          }
        />
      </div>
    </div>
  );
};

export default HRDashboard;
