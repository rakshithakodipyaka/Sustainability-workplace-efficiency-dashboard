import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/KPICard';
import ScoreGauge from '../components/ScoreGauge';
import ChartCard from '../components/ChartCard';
import EmployeeTable from '../components/EmployeeTable';
import { useAuth } from '../hooks/useAuth';
import { getEmployeeKPIs, getTeamKPIs } from '../services/kpiService';
import { getScoreColor } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  Building2,
  CalendarCheck,
  BookOpen,
  Laptop,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const KPI_CONFIG = [
  { key: 'officeUtilization', name: 'Office Utilization', shortName: 'Office Util', icon: Building2 },
  { key: 'meetingEffectiveness', name: 'Meeting Effectiveness', shortName: 'Meetings', icon: CalendarCheck },
  { key: 'employeeEngagement', name: 'Employee Engagement', shortName: 'Engagement', icon: Users },
  { key: 'learningParticipation', name: 'Learning Participation', shortName: 'Learning', icon: BookOpen },
  { key: 'hybridWorkEffectiveness', name: 'Hybrid Work Effectiveness', shortName: 'Hybrid Work', icon: Laptop }
];

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTrendMetric, setActiveTrendMetric] = useState('hours'); // 'hours' | 'tasks'

  // Fetch Manager's own KPIs and Team data
  const managerKPIs = useMemo(() => {
    if (!user?.employeeId) return null;
    return getEmployeeKPIs(user.employeeId);
  }, [user?.employeeId]);

  const teamKPIs = useMemo(() => {
    if (!user?.employeeId) return null;
    return getTeamKPIs(user.employeeId);
  }, [user?.employeeId]);

  // Direct Reports employee scores for BarChart
  const employeeScoresData = useMemo(() => {
    if (!teamKPIs?.teamMembers) return [];
    return teamKPIs.teamMembers.map(member => ({
      name: member.name.split(' ')[0],
      fullName: member.name,
      employeeId: member.employeeId,
      score: member.kpis?.overallScore || 0,
      avatar: member.avatar
    }));
  }, [teamKPIs]);

  // Team KPI Radar data (Manager vs Team Average)
  const radarData = useMemo(() => {
    if (!managerKPIs || !teamKPIs) return [];
    return KPI_CONFIG.map(kpi => ({
      subject: kpi.shortName,
      Manager: managerKPIs.kpiScores[kpi.key] || 0,
      TeamAvg: teamKPIs.teamKPIAverages[kpi.key] || 0,
      fullMark: 10
    }));
  }, [managerKPIs, teamKPIs]);

  // Weekly performance trends across direct reports (Mon - Fri)
  const weeklyTrendsData = useMemo(() => {
    if (!teamKPIs?.teamMembers?.length) return [];
    const days = [
      { name: 'Monday', short: 'Mon' },
      { name: 'Tuesday', short: 'Tue' },
      { name: 'Wednesday', short: 'Wed' },
      { name: 'Thursday', short: 'Thu' },
      { name: 'Friday', short: 'Fri' }
    ];

    return days.map(d => {
      let totalProductiveHours = 0;
      let totalTasks = 0;
      let presentOfficeCount = 0;
      const count = teamKPIs.teamMembers.length;

      teamKPIs.teamMembers.forEach(member => {
        const hybridRecord = member.kpis?.details?.hybridWorkEffectiveness?.records?.find(
          r => r.day === d.name
        );
        if (hybridRecord) {
          totalProductiveHours += hybridRecord.productiveHours || 0;
          totalTasks += hybridRecord.tasksCompleted || 0;
        }

        const attendanceRecord = member.kpis?.details?.officeUtilization?.records?.find(
          r => r.day === d.name
        );
        if (attendanceRecord && attendanceRecord.present) {
          presentOfficeCount++;
        }
      });

      const avgHours = count > 0 ? Math.round((totalProductiveHours / count) * 10) / 10 : 0;
      const attendanceRate = count > 0 ? Math.round((presentOfficeCount / count) * 100) : 0;

      return {
        day: d.short,
        fullDay: d.name,
        avgProductiveHours: avgHours,
        totalTasks,
        attendanceRate
      };
    });
  }, [teamKPIs]);

  // Hybrid Work and Office Utilization summary
  const hybridSummary = useMemo(() => {
    if (!teamKPIs?.teamMembers?.length) {
      return { officeDays: 0, remoteDays: 0, officeRate: 0, dayBreakdown: [], co2SavedKg: 0 };
    }

    let officeDays = 0;
    let remoteDays = 0;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayCounts = {
      Monday: { office: 0, remote: 0 },
      Tuesday: { office: 0, remote: 0 },
      Wednesday: { office: 0, remote: 0 },
      Thursday: { office: 0, remote: 0 },
      Friday: { office: 0, remote: 0 }
    };

    teamKPIs.teamMembers.forEach(member => {
      const records = member.kpis?.details?.hybridWorkEffectiveness?.records || [];
      records.forEach(r => {
        if (r.workMode === 'office') {
          officeDays++;
          if (dayCounts[r.day]) dayCounts[r.day].office++;
        } else if (r.workMode === 'remote') {
          remoteDays++;
          if (dayCounts[r.day]) dayCounts[r.day].remote++;
        }
      });
    });

    const totalDays = officeDays + remoteDays;
    const officeRate = totalDays > 0 ? Math.round((officeDays / totalDays) * 100) : 0;
    // Estimated round-trip commute distance: 50 km * 0.21 kg CO2/km
    const co2SavedKg = Math.round(remoteDays * 25 * 2 * 0.21 * 10) / 10;

    const dayBreakdown = days.map(d => ({
      day: d.substring(0, 3),
      office: dayCounts[d].office,
      remote: dayCounts[d].remote
    }));

    return {
      officeDays,
      remoteDays,
      officeRate,
      dayBreakdown,
      co2SavedKg
    };
  }, [teamKPIs]);

  // Engagement and Learning summaries
  const engagementAndLearningSummary = useMemo(() => {
    if (!teamKPIs?.teamMembers?.length) {
      return {
        totalLearningHours: 0,
        avgLearningHours: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalActivitiesAttended: 0,
        totalActivitiesAvailable: 0,
        engagementRate: 0
      };
    }

    let totalLearningHours = 0;
    let completedCourses = 0;
    let inProgressCourses = 0;
    let totalActivitiesAttended = 0;
    let totalActivitiesAvailable = 0;

    teamKPIs.teamMembers.forEach(member => {
      const learning = member.kpis?.details?.learningParticipation;
      if (learning) {
        totalLearningHours += learning.totalLearningHours || 0;
        completedCourses += learning.totalCompleted || 0;
        inProgressCourses += learning.totalInProgress || 0;
      }

      const engagement = member.kpis?.details?.employeeEngagement;
      if (engagement) {
        totalActivitiesAttended += engagement.totalAttended || 0;
        totalActivitiesAvailable += engagement.totalAvailable || 0;
      }
    });

    const count = teamKPIs.teamMembers.length;
    const avgLearningHours = count > 0 ? Math.round((totalLearningHours / count) * 10) / 10 : 0;
    const engagementRate = totalActivitiesAvailable > 0
      ? Math.round((totalActivitiesAttended / totalActivitiesAvailable) * 100)
      : 0;

    return {
      totalLearningHours: Math.round(totalLearningHours * 10) / 10,
      avgLearningHours,
      completedCourses,
      inProgressCourses,
      totalActivitiesAttended,
      totalActivitiesAvailable,
      engagementRate
    };
  }, [teamKPIs]);

  // Employees needing support (< 6.0)
  const employeesNeedingSupport = useMemo(() => {
    return teamKPIs?.needsImprovement || [];
  }, [teamKPIs]);

  // Watchlist for employees between 6.0 and 7.4 (Needs Improvement band)
  const employeesOnWatchlist = useMemo(() => {
    if (!teamKPIs?.teamMembers) return [];
    return teamKPIs.teamMembers.filter(
      m => m.kpis?.overallScore >= 6.0 && m.kpis?.overallScore < 7.5
    );
  }, [teamKPIs]);

  if (!user || !managerKPIs || !teamKPIs) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const teamName = user.team || 'Alpha';
  const departmentName = user.department || 'Engineering';
  const managerScore = managerKPIs.overallScore;
  const teamAverageScore = teamKPIs.teamAverage;
  const scoreDiff = Math.round((managerScore - teamAverageScore) * 10) / 10;

  // Custom tooltips
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
            {data.fullName} ({data.employeeId})
          </div>
          <div style={{ marginTop: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Overall Score:</span>
            <span style={{ fontWeight: 700, color: getScoreColor(data.score) }}>{data.score} / 10</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="manager-dashboard" style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* 1. Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0d9488 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          color: 'white',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                Team Lead & Management View
              </span>
              <span style={{ fontSize: '12px', opacity: 0.85 }}>Oct 5 - Oct 11, 2026</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Welcome back, {user.name}
            </h1>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span><strong>Team:</strong> {teamName}</span>
              <span>•</span>
              <span><strong>Department:</strong> {departmentName}</span>
              <span>•</span>
              <span><strong>Direct Reports:</strong> {teamKPIs.teamMembers.length} Employees</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 20px',
                textAlign: 'center',
                minWidth: '130px'
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 600 }}>
                Manager Score
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '2px' }}>
                {managerScore}
                <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>/10</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 20px',
                textAlign: 'center',
                minWidth: '130px'
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 600 }}>
                Team Average
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '2px' }}>
                {teamAverageScore}
                <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 & 3. Manager's Own Performance & Overall Score Overview */}
      <div className="section">
        <div className="section-title">
          <Award size={20} color="var(--primary)" />
          <span>Manager Performance & KPI Overview</span>
        </div>

        {/* Hero Score Overview with ScoreGauge */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            alignItems: 'center',
            gap: '32px'
          }}
        >
          {/* Manager Overall Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid var(--border-light)', paddingRight: '28px' }}>
            <ScoreGauge score={managerScore} size={130} label="Manager Overall" />
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Individual Performance
            </div>
          </div>

          {/* Comparative Summary & KPI Bar Breakdown */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Personal Benchmark vs. Team Average
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Leading Team {teamName} • {scoreDiff >= 0 ? `+${scoreDiff} pts ahead of team average` : `${Math.abs(scoreDiff)} pts behind team average`}
                </p>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: scoreDiff >= 0 ? 'var(--success-light)' : 'var(--warning-light)',
                  color: scoreDiff >= 0 ? '#065f46' : '#92400e',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {scoreDiff >= 0 ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
                Delta: {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}
              </div>
            </div>

            {/* Quick KPI Bars Comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
              {KPI_CONFIG.map(kpi => {
                const mScore = managerKPIs.kpiScores[kpi.key] || 0;
                const tScore = teamKPIs.teamKPIAverages[kpi.key] || 0;
                const mColor = getScoreColor(mScore);
                const tColor = getScoreColor(tScore);

                return (
                  <div key={kpi.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                    <span style={{ width: '130px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {kpi.shortName}
                    </span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${mScore * 10}%`, height: '100%', background: mColor, borderRadius: '3px' }} />
                        </div>
                        <span style={{ width: '40px', textAlign: 'right', fontWeight: 600, color: mColor }}>{mScore}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.75 }}>
                        <div style={{ flex: 1, height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${tScore * 10}%`, height: '100%', background: tColor, borderRadius: '2px' }} />
                        </div>
                        <span style={{ width: '40px', textAlign: 'right', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          Team: {tScore}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Overall Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '28px' }}>
            <ScoreGauge score={teamAverageScore} size={130} label="Team Average" />
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Direct Reports Avg
            </div>
          </div>
        </div>

        {/* 5 Manager KPI Cards */}
        <div className="kpi-grid">
          {KPI_CONFIG.map(kpi => (
            <KPICard
              key={kpi.key}
              kpiKey={kpi.key}
              score={managerKPIs.kpiScores[kpi.key]}
              onClick={() => navigate(`/dashboard/kpis/${kpi.key.replace(/([A-Z])/g, '-$1').toLowerCase()}`)}
            />
          ))}
        </div>
      </div>

      {/* 5. Team Summary Cards & KPI Benchmarks */}
      <div className="section">
        <div className="section-title">
          <Users size={20} color="var(--primary)" />
          <span>Team Average & Metric Benchmarks</span>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Team Overall Average</div>
            <div className="stat-value" style={{ color: getScoreColor(teamAverageScore) }}>
              {teamAverageScore}
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-tertiary)' }}>/10</span>
            </div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              Across 5 Direct Reports
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Top Performer</div>
            <div className="stat-value" style={{ fontSize: '20px', color: 'var(--text-primary)' }}>
              {teamKPIs.topPerformers[0]?.name || 'N/A'}
            </div>
            <div className="stat-change positive">
              <Award size={14} />
              Score: {teamKPIs.topPerformers[0]?.kpis?.overallScore || 0}/10
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Needs Support (&lt; 6.0)</div>
            <div className="stat-value" style={{ color: employeesNeedingSupport.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {employeesNeedingSupport.length}
            </div>
            <div className={`stat-change ${employeesNeedingSupport.length > 0 ? 'negative' : 'positive'}`}>
              {employeesNeedingSupport.length > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              {employeesNeedingSupport.length > 0 ? 'Action Recommended' : 'All Meeting Threshold'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Hybrid Work Balance</div>
            <div className="stat-value">
              {hybridSummary.officeRate}%
            </div>
            <div className="stat-change positive">
              <Building2 size={14} />
              Office Utilization Rate
            </div>
          </div>
        </div>

        {/* Side-by-Side KPI Averages Comparison Grid */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Detailed KPI Side-by-Side Comparison
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Side-by-side comparison between Manager scores and Team aggregate averages
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary-light)' }} />
                <span>Manager Score</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--secondary)' }} />
                <span>Team Average</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {KPI_CONFIG.map(kpi => {
              const mVal = managerKPIs.kpiScores[kpi.key] || 0;
              const tVal = teamKPIs.teamKPIAverages[kpi.key] || 0;
              const diff = Math.round((mVal - tVal) * 10) / 10;
              const Icon = kpi.icon;

              return (
                <div
                  key={kpi.key}
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius)',
                    padding: '14px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Icon size={16} color="var(--primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {kpi.shortName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Manager:</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: getScoreColor(mVal) }}>{mVal}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Team Avg:</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: getScoreColor(tVal) }}>{tVal}</span>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px'
                    }}
                  >
                    <span style={{ color: 'var(--text-tertiary)' }}>Variance:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: diff >= 0 ? 'var(--success)' : 'var(--danger)'
                      }}
                    >
                      {diff >= 0 ? `+${diff}` : diff}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Team Comparison Charts */}
      <div className="section">
        <div className="section-title">
          <TrendingUp size={20} color="var(--primary)" />
          <span>Team Analytics & Comparison Charts</span>
        </div>

        <div className="charts-grid-3">
          {/* Chart 1: Individual Employee Scores Bar Chart */}
          <ChartCard
            title="Direct Reports Scores"
            subtitle="Overall efficiency score per team member"
            action={
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Avg: {teamAverageScore}
              </span>
            }
          >
            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeScoresData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="score"
                    name="Overall Score"
                    radius={[6, 6, 0, 0]}
                    onClick={(entry) => entry && navigate(`/dashboard/employee/${entry.employeeId}`)}
                    cursor="pointer"
                  >
                    {employeeScoresData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '6px' }}>
              Click on any bar to open employee detailed dashboard
            </div>
          </ChartCard>

          {/* Chart 2: Team KPI Radar Chart */}
          <ChartCard
            title="Team KPI Radar"
            subtitle="Manager score vs Team KPI averages"
          >
            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 10]}
                    angle={30}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Radar
                    name="Manager"
                    dataKey="Manager"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Team Avg"
                    dataKey="TeamAvg"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '6px' }}>
              Compares category mastery against team aggregate
            </div>
          </ChartCard>

          {/* Chart 3: Weekly Performance Trends */}
          <ChartCard
            title="Weekly Performance Trends"
            subtitle="Monday - Friday team activity metrics"
            action={
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setActiveTrendMetric('hours')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-sm)',
                    background: activeTrendMetric === 'hours' ? 'var(--primary-light)' : 'var(--bg-primary)',
                    color: activeTrendMetric === 'hours' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  Hours
                </button>
                <button
                  onClick={() => setActiveTrendMetric('tasks')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-sm)',
                    background: activeTrendMetric === 'tasks' ? 'var(--primary-light)' : 'var(--bg-primary)',
                    color: activeTrendMetric === 'tasks' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  Tasks
                </button>
              </div>
            }
          >
            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrendsData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'avgProductiveHours' ? `${value} hrs` : `${value}`,
                      name === 'avgProductiveHours' ? 'Avg Productive Hours' : 'Tasks Completed'
                    ]}
                  />
                  {activeTrendMetric === 'hours' ? (
                    <Bar
                      dataKey="avgProductiveHours"
                      name="Avg Productive Hours"
                      fill="#8b5cf6"
                      radius={[6, 6, 0, 0]}
                    />
                  ) : (
                    <Bar
                      dataKey="totalTasks"
                      name="Tasks Completed"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '6px' }}>
              Daily productive output recorded across Monday - Friday
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 7. Employees Who Need Support (< 6.0) */}
      <div className="section">
        <div className="section-title">
          <AlertTriangle size={20} color={employeesNeedingSupport.length > 0 ? 'var(--danger)' : 'var(--warning)'} />
          <span>Support & Coaching Watchlist</span>
        </div>

        {employeesNeedingSupport.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}
          >
            {employeesNeedingSupport.map(emp => {
              const scores = emp.kpis?.kpiScores || {};
              // Find lowest KPI
              const sortedKpis = Object.entries(scores).sort((a, b) => a[1] - b[1]);
              const lowestKpi = sortedKpis[0];
              const kpiConfigItem = KPI_CONFIG.find(c => c.key === lowestKpi?.[0]);

              return (
                <div
                  key={emp.employeeId}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          className="avatar"
                          style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
                        >
                          {emp.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {emp.employeeId} • {emp.role}
                          </div>
                        </div>
                      </div>
                      <span className="score-badge requires-attention">
                        {emp.kpis?.overallScore} / 10
                      </span>
                    </div>

                    <div style={{ background: '#fef2f2', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={14} />
                        Primary Focus: {kpiConfigItem?.name || lowestKpi?.[0]} ({lowestKpi?.[1]}/10)
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f1d1d', lineHeight: 1.4 }}>
                        Score is below the 6.0 intervention threshold. Recommend scheduling a 1-on-1 check-in to review workload distribution and hybrid routine.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/dashboard/employee/${emp.employeeId}`)}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: 'var(--radius)',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'var(--transition)'
                    }}
                  >
                    Open Employee Review <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success)',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={26} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  All 5 Direct Reports Are Performing Above 6.0
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  No team members currently require critical intervention. {employeesOnWatchlist.length > 0 ? `${employeesOnWatchlist.length} employee(s) are in the moderate improvement zone (6.0 - 7.4).` : 'All team members maintain high baseline efficiency.'}
                </div>
              </div>
            </div>

            {employeesOnWatchlist.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {employeesOnWatchlist.map(emp => (
                  <button
                    key={emp.employeeId}
                    onClick={() => navigate(`/dashboard/employee/${emp.employeeId}`)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {emp.name} ({emp.kpis?.overallScore}) <ChevronRight size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8 & 9. Team Engagement, Learning & Hybrid Workplace Patterns */}
      <div className="section">
        <div className="section-title">
          <Laptop size={20} color="var(--primary)" />
          <span>Workplace Patterns, Engagement & Sustainability</span>
        </div>

        <div className="charts-grid">
          {/* Hybrid Work & Office Utilization Patterns */}
          <ChartCard
            title="Workplace Patterns & Sustainability"
            subtitle="Distribution of in-office vs remote workdays across the team"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'In-Office Days', value: hybridSummary.officeDays },
                        { name: 'Remote Days', value: hybridSummary.remoteDays }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    In-Office Total
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6', marginTop: '2px' }}>
                    {hybridSummary.officeDays} days ({hybridSummary.officeRate}%)
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Remote Total
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                    {hybridSummary.remoteDays} days ({100 - hybridSummary.officeRate}%)
                  </div>
                </div>

                <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '11px', color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>
                    CO2 Avoided This Week
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#047857', marginTop: '2px' }}>
                    🌱 ~{hybridSummary.co2SavedKg} kg CO2
                  </div>
                </div>
              </div>
            </div>

            {/* Daily In-Office Attendance Breakdown */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Day-of-Week In-Office Attendance:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                {hybridSummary.dayBreakdown.map(item => (
                  <div
                    key={item.day}
                    style={{
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{item.day}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {item.office} <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>/ 5</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Team Engagement & Learning Summaries */}
          <ChartCard
            title="Engagement & Continuous Learning"
            subtitle="Direct reports participation in workshops, activities, and courses"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <BookOpen size={18} color="var(--warning)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Learning Hours
                  </span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {engagementAndLearningSummary.totalLearningHours}h
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Avg: {engagementAndLearningSummary.avgLearningHours}h / employee (Target: 3h)
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', fontSize: '11px' }}>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {engagementAndLearningSummary.completedCourses} Completed
                  </span>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {engagementAndLearningSummary.inProgressCourses} In Progress
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Users size={18} color="var(--secondary)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Engagement Rate
                  </span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {engagementAndLearningSummary.engagementRate}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {engagementAndLearningSummary.totalActivitiesAttended} of {engagementAndLearningSummary.totalActivitiesAvailable} activities attended
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${engagementAndLearningSummary.engagementRate}%`,
                        height: '100%',
                        background: 'var(--secondary)',
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Top Highlights / Action note */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <Target size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Manager Coaching Tip:</strong> Encourage members below the 3.0h weekly learning threshold to utilize designated Friday afternoon learning slots to boost skill growth and team engagement metrics.
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 4. Manager's Direct Reports Performance Table */}
      <div className="section">
        <EmployeeTable
          employees={teamKPIs.teamMembers}
          title={`Direct Reports (${teamKPIs.teamMembers.length} Employees - Team ${teamName})`}
        />
      </div>
    </div>
  );
};

export default ManagerDashboard;
