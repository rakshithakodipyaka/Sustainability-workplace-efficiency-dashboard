import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/KPICard';
import ScoreGauge from '../components/ScoreGauge';
import ChartCard from '../components/ChartCard';
import { useAuth } from '../hooks/useAuth';
import { getEmployeeKPIs } from '../services/kpiService';
import { getLearning, getHybridWork, getOfficeAttendance, getMeetings, getCourses } from '../services/dataService';
import { generateEmployeeRecommendations } from '../services/recommendationService';
import { getScoreColor, getScoreLabel } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Award,
  TrendingUp,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Clock,
  Building2,
  CheckSquare,
  Laptop
} from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const KPI_NAMES = {
  officeUtilization: 'Office Utilization',
  meetingEffectiveness: 'Meeting Effectiveness',
  employeeEngagement: 'Employee Engagement',
  learningParticipation: 'Learning Participation',
  hybridWorkEffectiveness: 'Hybrid Work Effectiveness'
};

const KPI_COLORS = {
  officeUtilization: '#3b82f6',
  meetingEffectiveness: '#ec4899',
  employeeEngagement: '#10b981',
  learningParticipation: '#f59e0b',
  hybridWorkEffectiveness: '#8b5cf6'
};

const KPI_DESCRIPTIONS = {
  officeUtilization: 'Consistency of badge tap-ins and planned office attendance',
  meetingEffectiveness: 'Attendance reliability and keeping within the 10h weekly limit',
  employeeEngagement: 'Participation in wellness and knowledge-sharing sessions',
  learningParticipation: 'Course milestone completions and weekly learning hours',
  hybridWorkEffectiveness: 'Productive hours and tasks balance across work modes'
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Retrieve KPI and raw metrics for currently logged in employee
  const kpiData = useMemo(() => {
    if (!user?.employeeId) return null;
    return getEmployeeKPIs(user.employeeId);
  }, [user?.employeeId]);

  const learning = useMemo(() => {
    if (!user?.employeeId) return { enrolled: [], weeklyLearningHours: [] };
    return getLearning(user.employeeId);
  }, [user?.employeeId]);

  const hybrid = useMemo(() => {
    if (!user?.employeeId) return { records: [] };
    return getHybridWork(user.employeeId);
  }, [user?.employeeId]);

  const attendance = useMemo(() => {
    if (!user?.employeeId) return [];
    return getOfficeAttendance(user.employeeId);
  }, [user?.employeeId]);

  const meetings = useMemo(() => {
    if (!user?.employeeId) return { meetings: [], weeklyMeetingHourLimit: 10 };
    return getMeetings(user.employeeId);
  }, [user?.employeeId]);

  const coursesCatalog = useMemo(() => getCourses() || [], []);

  const courseTitleMap = useMemo(() => {
    const map = {};
    coursesCatalog.forEach((c) => {
      map[c.courseId] = c.title;
    });
    return map;
  }, [coursesCatalog]);

  const recommendations = useMemo(() => {
    if (!user?.employeeId || !kpiData) return [];
    return generateEmployeeRecommendations(user.employeeId, kpiData);
  }, [user?.employeeId, kpiData]);

  // Daily performance trend data (Mon-Fri workdays)
  const dailyPerformance = useMemo(() => {
    return (hybrid.records || [])
      .filter((r) => r.workMode !== 'off')
      .map((r) => ({
        day: r.day.substring(0, 3),
        hours: r.productiveHours,
        tasks: r.tasksCompleted,
        expected: r.expectedProductiveHours || 7
      }));
  }, [hybrid]);

  // In-Office vs Remote Comparison
  const hybridComparison = useMemo(() => {
    const hw = kpiData?.details?.hybridWorkEffectiveness || {};
    return [
      {
        mode: 'In-Office',
        hours: hw.avgOfficeProductivity || 0,
        tasks: hw.avgOfficeTasks || 0,
        days: hw.officeDays || 0
      },
      {
        mode: 'Remote',
        hours: hw.avgRemoteProductivity || 0,
        tasks: hw.avgRemoteTasks || 0,
        days: hw.remoteDays || 0
      }
    ];
  }, [kpiData]);

  // Office attendance weekday logs for chart & table
  const officeAttendanceChartData = useMemo(() => {
    return (attendance || [])
      .filter((r) => r.planned)
      .map((r) => ({
        day: r.day.substring(0, 3),
        date: r.date,
        hours: r.hoursInOffice || 0,
        present: r.present,
        tapIn: r.tapIn || '—',
        tapOut: r.tapOut || '—'
      }));
  }, [attendance]);

  // Meeting Distribution Pie Chart
  const meetingPieData = useMemo(() => {
    const me = kpiData?.details?.meetingEffectiveness || {};
    const attended = me.totalAttended || 0;
    const missed = me.totalMissed || 0;
    return [
      { name: 'Attended Meetings', value: attended, color: '#10b981' },
      { name: 'Missed Meetings', value: missed, color: '#ef4444' }
    ].filter((item) => item.value > 0);
  }, [kpiData]);

  // Strengths (KPI score >= 7.5) & Areas needing improvement (KPI score < 6.0)
  const strengths = useMemo(() => {
    if (!kpiData?.kpiScores) return [];
    return Object.entries(kpiData.kpiScores)
      .filter(([, score]) => score >= 7.5)
      .map(([key, score]) => ({
        key,
        name: KPI_NAMES[key],
        score,
        color: KPI_COLORS[key],
        description: KPI_DESCRIPTIONS[key]
      }));
  }, [kpiData]);

  const improvements = useMemo(() => {
    if (!kpiData?.kpiScores) return [];
    return Object.entries(kpiData.kpiScores)
      .filter(([, score]) => score < 6.0)
      .map(([key, score]) => ({
        key,
        name: KPI_NAMES[key],
        score,
        color: KPI_COLORS[key],
        description: KPI_DESCRIPTIONS[key]
      }));
  }, [kpiData]);

  if (!user || !kpiData) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <div className="empty-state-title">Loading Performance Data...</div>
      </div>
    );
  }

  const officeDetails = kpiData.details?.officeUtilization || {};
  const meetingDetails = kpiData.details?.meetingEffectiveness || {};
  const engagementDetails = kpiData.details?.employeeEngagement || {};
  const learningDetails = kpiData.details?.learningParticipation || {};
  const hybridDetails = kpiData.details?.hybridWorkEffectiveness || {};

  return (
    <div>
      {/* 1. Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-title">Welcome back, {user.name}!</div>
        <div className="welcome-subtitle">
          {user.role} · {user.department} · {user.team || 'Core Team'}
        </div>
        <div className="welcome-meta">
          <span>Employee ID: {user.employeeId}</span>
          <span>Period: Week of Oct 5 - Oct 11, 2026</span>
          {user.managerId && <span>Reporting Manager: {user.managerId}</span>}
        </div>
      </div>

      {/* 2. Overall Performance Composite Card */}
      <div className="overview-score">
        <div className="overview-score-left">
          <ScoreGauge score={kpiData.overallScore} size={130} label="Weekly Composite" />
        </div>
        <div className="overview-score-right">
          <div className="overview-score-title">Overall Workplace Efficiency Rating</div>
          <div className="overview-score-subtitle">
            Weighted composite index across your workplace engagement, learning, and efficiency metrics
          </div>
          <div className="overview-kpi-bars">
            {Object.entries(kpiData.kpiScores).map(([key, score]) => (
              <div className="overview-kpi-row" key={key}>
                <span className="overview-kpi-label">{KPI_NAMES[key]}</span>
                <div className="overview-kpi-bar-track">
                  <div
                    className="overview-kpi-bar-fill"
                    style={{
                      width: `${score * 10}%`,
                      background: KPI_COLORS[key]
                    }}
                  />
                </div>
                <span className="overview-kpi-score" style={{ color: KPI_COLORS[key] }}>
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 5 KPI Cards Grid */}
      <div className="section" style={{ marginBottom: 24 }}>
        <div className="section-title">
          <TrendingUp size={20} color="var(--primary)" />
          Performance Pillars
        </div>
        <div className="kpi-grid">
          {Object.entries(kpiData.kpiScores).map(([key, score]) => (
            <KPICard key={key} kpiKey={key} score={score} />
          ))}
        </div>
      </div>

      {/* 4. Personal Weekly Activity Summary */}
      <div className="section" style={{ marginBottom: 24 }}>
        <div className="section-title">
          <Calendar size={20} color="var(--primary)" />
          Personal Weekly Activity Summary
        </div>
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={16} color="#3b82f6" /> Office Attendance
            </div>
            <div className="stat-value">
              {officeDetails.presentDays ?? 0}
              <span style={{ fontSize: 16, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                {' '}/ {officeDetails.plannedDays ?? 5} days
              </span>
            </div>
            <div className="stat-change positive">
              <CheckCircle size={14} /> {officeDetails.attendancePercentage ?? 0}% planned attendance
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#ec4899" /> Meetings Attended
            </div>
            <div className="stat-value">
              {meetingDetails.totalAttended ?? 0}
              <span style={{ fontSize: 16, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                {' '}/ {meetingDetails.totalScheduled ?? 0}
              </span>
            </div>
            <div className={`stat-change ${meetingDetails.isOverloaded ? 'negative' : 'positive'}`}>
              {meetingDetails.totalMeetingHours ?? 0}h logged (limit: {meetingDetails.weeklyLimit ?? 10}h)
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckSquare size={16} color="#10b981" /> Team Activities
            </div>
            <div className="stat-value">
              {engagementDetails.totalAttended ?? 0}
              <span style={{ fontSize: 16, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                {' '}/ {engagementDetails.totalAvailable ?? 0}
              </span>
            </div>
            <div className="stat-change positive">
              {engagementDetails.participationPercentage ?? 0}% participation rate
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={16} color="#f59e0b" /> Learning Hours
            </div>
            <div className="stat-value">
              {learningDetails.totalLearningHours ?? 0}h
              <span style={{ fontSize: 16, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                {' '}/ {learningDetails.weeklyTarget ?? 3}h target
              </span>
            </div>
            <div className="stat-change positive">
              {learningDetails.totalCompleted ?? 0} completed · {learningDetails.totalInProgress ?? 0} in progress
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Laptop size={16} color="#8b5cf6" /> Output & Tasks
            </div>
            <div className="stat-value">
              {hybridDetails.totalTasks ?? 0}
              <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 400 }}> tasks</span>
            </div>
            <div className="stat-change positive">
              {hybridDetails.totalProductiveHours ?? 0}h productive work
            </div>
          </div>
        </div>
      </div>

      {/* 5. Areas of Strength & Improvement */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="chart-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Award size={22} color="#10b981" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Areas of Strength</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>KPIs performing at 7.5 or above</div>
            </div>
          </div>
          {strengths.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {strengths.map((item) => (
                <div
                  key={item.key}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                    <span className="score-badge excellent">{item.score} / 10</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="insight-box">
              <div className="insight-text">
                Keep working toward your target goals. Focus on consistency to raise metrics above 7.5.
              </div>
            </div>
          )}
        </div>

        <div className="chart-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertCircle size={22} color="#ef4444" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Areas Needing Improvement</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>KPIs falling below 6.0 threshold</div>
            </div>
          </div>
          {improvements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {improvements.map((item) => (
                <div
                  key={item.key}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                    <span className="score-badge requires-attention">{item.score} / 10</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="insight-box success">
              <div className="insight-text" style={{ color: '#065f46' }}>
                🎉 Outstanding work! None of your KPIs are currently below 6.0. Maintain your great momentum.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Core Charts Section */}
      <div className="charts-grid">
        {/* Daily Performance Trend */}
        <ChartCard
          title="Daily Performance Trend"
          subtitle="Mon-Fri productive hours vs expected target & tasks completed"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Productive Hours"
              />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Tasks Completed"
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Expected Hours (7h)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Hybrid vs Office Comparison */}
        <ChartCard
          title="Hybrid vs In-Office Comparison"
          subtitle="Average productive hours & tasks between office and remote days"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hybridComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mode" fontSize={12} />
              <YAxis domain={[0, 10]} fontSize={12} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Productive Hours" />
              <Bar dataKey="tasks" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Avg Tasks Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Office Attendance Chart */}
        <ChartCard
          title="Office Attendance & Hours"
          subtitle={`Planned vs logged badge hours (${officeDetails.attendancePercentage || 0}% weekly attendance)`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={officeAttendanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis domain={[0, 12]} fontSize={12} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="hours"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Hours in Office"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Meeting Distribution */}
        <ChartCard
          title="Meeting Distribution & Load"
          subtitle={`Total meeting load: ${meetingDetails.totalMeetingHours || 0}h / ${meetingDetails.weeklyLimit || 10}h limit`}
        >
          {meetingPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={meetingPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {meetingPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No meeting records available</div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* 7. Learning Progress Section */}
      <div className="section">
        <ChartCard
          title="Continuous Learning Progress"
          subtitle={`Enrolled courses, module milestones, and learning hours (${learningDetails.totalLearningHours || 0}h / 3h target)`}
        >
          {learning.enrolled && learning.enrolled.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {learning.enrolled.map((course) => {
                const title = courseTitleMap[course.courseId] || course.courseId;
                const isCompleted = course.status === 'completed';
                return (
                  <div
                    key={course.courseId}
                    style={{
                      padding: 16,
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          Course ID: {course.courseId}
                        </div>
                      </div>
                      <span className={`tag ${isCompleted ? 'success' : 'warning'}`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Module Progress</span>
                      <span style={{ fontWeight: 600, color: isCompleted ? '#10b981' : 'var(--primary)' }}>
                        {course.progress}%
                      </span>
                    </div>

                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${course.progress}%`,
                          background: isCompleted ? '#10b981' : '#3b82f6',
                          borderRadius: 999,
                          transition: 'width 0.6s ease'
                        }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-tertiary)',
                        marginTop: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {course.hoursCompleted}h completed
                      </span>
                      {course.startDate && <span>Started {course.startDate}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No courses enrolled currently.</div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* 8. Personalized Recommendations Summary & Roadmap Link */}
      <div className="section" style={{ marginTop: 24 }}>
        <div
          className="chart-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid var(--border)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                Personalized Improvement Roadmap
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Targeted recommendations generated from your individual performance scores
              </div>
            </div>
            <button
              className="export-btn"
              onClick={() => navigate('/dashboard/improvement-roadmap')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Open Full Roadmap <ArrowRight size={15} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                      {rec.kpiCategory}
                    </span>
                    <span className={`rec-priority ${rec.priority.toLowerCase()}`}>
                      {rec.priority} Priority
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 10 }}>
                    {rec.action}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 8 }}>
                    🎯 Impact: {rec.benefit}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>Target Score: <strong>{rec.targetScore}</strong></span>
                    <span>Timeline: <strong>{rec.timeline}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
