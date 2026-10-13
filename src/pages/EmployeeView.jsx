import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canViewEmployee } from '../utils/permissions';
import { getUserById, getCourses } from '../services/dataService';
import { getEmployeeKPIs } from '../services/kpiService';
import { getLearning, getHybridWork, getOfficeAttendance, getMeetings } from '../services/dataService';
import KPICard from '../components/KPICard';
import ScoreGauge from '../components/ScoreGauge';
import ChartCard from '../components/ChartCard';
import { getScoreColor, getScoreLabel } from '../utils/formatters';
import { ArrowLeft, Shield, Award, Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const EmployeeView = () => {
  const { employeeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const targetUser = useMemo(() => getUserById(employeeId), [employeeId]);
  const hasAccess = useMemo(() => canViewEmployee(user, employeeId), [user, employeeId]);
  
  if (!hasAccess) {
    return (
      <div className="empty-state">
        <Shield size={48} className="empty-state-icon" />
        <div className="empty-state-title">Access Denied</div>
        <div className="empty-state-text">You don't have permission to view this employee's data.</div>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }
  
  if (!targetUser) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Employee Not Found</div>
        <div className="empty-state-text">No employee with ID {employeeId} was found.</div>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }
  
  // Get all KPI data for this employee
  const kpiData = useMemo(() => getEmployeeKPIs(employeeId), [employeeId]);
  const learning = useMemo(() => getLearning(employeeId), [employeeId]);
  const hybrid = useMemo(() => getHybridWork(employeeId), [employeeId]);
  const attendance = useMemo(() => getOfficeAttendance(employeeId), [employeeId]);
  const meetings = useMemo(() => getMeetings(employeeId), [employeeId]);
  const coursesCatalog = useMemo(() => getCourses() || [], []);

  const courseTitleMap = useMemo(() => {
    const map = {};
    coursesCatalog.forEach(c => {
      map[c.courseId] = c.title;
    });
    return map;
  }, [coursesCatalog]);
  
  if (!kpiData) return null;
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  const dailyProductivity = (hybrid.records || [])
    .filter(r => r.workMode !== 'off')
    .map(r => ({
      day: r.day.substring(0, 3),
      hours: r.productiveHours,
      tasks: r.tasksCompleted,
      expected: r.expectedProductiveHours || 7
    }));

  const hybridComparison = [
    {
      mode: 'In-Office',
      hours: kpiData.details?.hybridWorkEffectiveness?.avgOfficeProductivity || 0,
      tasks: kpiData.details?.hybridWorkEffectiveness?.avgOfficeTasks || 0
    },
    {
      mode: 'Remote',
      hours: kpiData.details?.hybridWorkEffectiveness?.avgRemoteProductivity || 0,
      tasks: kpiData.details?.hybridWorkEffectiveness?.avgRemoteTasks || 0
    }
  ];

  const meetingPieData = useMemo(() => {
    const totalAttended = kpiData.details?.meetingEffectiveness?.totalAttended || 0;
    const totalMissed = kpiData.details?.meetingEffectiveness?.totalMissed || 0;
    return [
      { name: 'Attended', value: totalAttended, color: '#10b981' },
      { name: 'Missed', value: totalMissed, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [kpiData]);
  
  const kpiNames = {
    officeUtilization: 'Office Utilization',
    meetingEffectiveness: 'Meeting Effectiveness',
    employeeEngagement: 'Employee Engagement',
    learningParticipation: 'Learning Participation',
    hybridWorkEffectiveness: 'Hybrid Work Effectiveness'
  };
  
  const kpiColors = {
    officeUtilization: '#3b82f6',
    meetingEffectiveness: '#ec4899',
    employeeEngagement: '#10b981',
    learningParticipation: '#f59e0b',
    hybridWorkEffectiveness: '#8b5cf6'
  };

  const strengths = Object.entries(kpiData.kpiScores).filter(([, score]) => score >= 7.5);
  const improvements = Object.entries(kpiData.kpiScores).filter(([, score]) => score < 6.0);
  
  return (
    <div>
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>
      
      <div className="welcome-banner">
        <div className="welcome-title">{targetUser.name}</div>
        <div className="welcome-subtitle">{targetUser.role} · {targetUser.department}</div>
        <div className="welcome-meta">
          <span>ID: {targetUser.employeeId}</span>
          <span>Team: {targetUser.team || 'N/A'}</span>
          <span>Email: {targetUser.email}</span>
          {targetUser.managerId && <span>Manager: {targetUser.managerId}</span>}
        </div>
      </div>
      
      {/* Overall Score */}
      <div className="overview-score">
        <div className="overview-score-left">
          <ScoreGauge score={kpiData.overallScore} size={130} />
        </div>
        <div className="overview-score-right">
          <div className="overview-score-title">Overall Performance</div>
          <div className="overview-score-subtitle">Week of Oct 5 - Oct 11, 2026</div>
          <div className="overview-kpi-bars">
            {Object.entries(kpiData.kpiScores).map(([key, score]) => (
              <div className="overview-kpi-row" key={key}>
                <span className="overview-kpi-label">{kpiNames[key]}</span>
                <div className="overview-kpi-bar-track">
                  <div className="overview-kpi-bar-fill" style={{ width: `${score * 10}%`, background: kpiColors[key] }} />
                </div>
                <span className="overview-kpi-score" style={{ color: kpiColors[key] }}>{score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="kpi-grid">
        {Object.entries(kpiData.kpiScores).map(([key, score]) => (
          <KPICard key={key} kpiKey={key} score={score} />
        ))}
      </div>

      {/* Strengths & Improvement Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="chart-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Award size={20} color="#10b981" />
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Strengths (Score ≥ 7.5)</h3>
          </div>
          {strengths.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {strengths.map(([key, score]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{kpiNames[key]}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{score} / 10</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No KPIs currently at 7.5 or higher.</div>
          )}
        </div>

        <div className="chart-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertCircle size={20} color="#ef4444" />
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Areas Needing Improvement (Score &lt; 6.0)</h3>
          </div>
          {improvements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {improvements.map(([key, score]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{kpiNames[key]}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{score} / 10</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>All KPIs meet or exceed 6.0 standard.</div>
          )}
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="charts-grid">
        <ChartCard title="Daily Productivity" subtitle="Productive hours vs Expected hours (Mon - Fri)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyProductivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis domain={[0, 10]} fontSize={12} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Productive Hours" />
              <Bar dataKey="expected" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Expected Target" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Output Trend" subtitle="Daily productive hours and tasks completed">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyProductivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} name="Hours" />
              <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} name="Tasks" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        
        <ChartCard title="Hybrid vs Office Comparison" subtitle="Average productive hours by work mode">
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

        <ChartCard title="Meeting Distribution" subtitle={`Scheduled vs Attended (${kpiData.details?.meetingEffectiveness?.totalMeetingHours || 0}h total)`}>
          {meetingPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={meetingPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {meetingPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No meeting data available</div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Learning Progress" subtitle="Enrolled courses and modules completion" className="chart-full">
          {learning.enrolled && learning.enrolled.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {learning.enrolled.map(course => {
                const title = courseTitleMap[course.courseId] || course.courseId;
                const isCompleted = course.status === 'completed';
                return (
                  <div key={course.courseId} style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Course ID: {course.courseId}</div>
                      </div>
                      <span className={`tag ${isCompleted ? 'success' : 'warning'}`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                      <span style={{ fontWeight: 600 }}>{course.progress}%</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${course.progress}%`,
                          background: isCompleted ? '#10b981' : '#3b82f6',
                          borderRadius: 999,
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {course.hoursCompleted}h completed {course.startDate ? `· Started ${course.startDate}` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No courses enrolled</div></div>
          )}
        </ChartCard>
      </div>

      {/* Office Attendance Detailed Records Table */}
      <div className="table-container" style={{ marginTop: 24 }}>
        <div className="table-header">
          <div className="table-title">Weekly Office Attendance Log</div>
          <span className="tag success">
            {kpiData.details?.officeUtilization?.attendancePercentage || 0}% Office Attendance
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th>Status</th>
              <th>Tap In</th>
              <th>Tap Out</th>
              <th>Hours in Office</th>
            </tr>
          </thead>
          <tbody>
            {(attendance || []).map((record) => (
              <tr key={record.date}>
                <td style={{ fontWeight: 500 }}>{record.day}</td>
                <td>{record.date}</td>
                <td>
                  <span className={`tag ${record.present ? 'success' : record.planned ? 'warning' : 'neutral'}`}>
                    {record.present ? 'Present' : record.planned ? 'Absent' : 'Weekend'}
                  </span>
                </td>
                <td>{record.tapIn || '—'}</td>
                <td>{record.tapOut || '—'}</td>
                <td>{record.hoursInOffice ? `${record.hoursInOffice}h` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeView;
