import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../context/DashboardContext';
import { getEmployeeKPIs, getOrganizationKPIs, getTeamKPIs } from '../services/kpiService';
import { 
  getOfficeAttendance, 
  getMeetings, 
  getEngagement, 
  getLearning, 
  getHybridWork, 
  getManagers, 
  getEmployees,
  getCourses,
  getUserById,
  getOrganization
} from '../services/dataService';
import ScoreGauge from '../components/ScoreGauge';
import ChartCard from '../components/ChartCard';
import { getScoreColor, getScoreLabel, formatDate, formatHours, formatPercentage } from '../utils/formatters';
import { 
  ArrowLeft, 
  Building2, 
  CalendarCheck, 
  Users, 
  BookOpen, 
  Laptop, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldAlert, 
  Award, 
  UserCheck, 
  ChevronRight, 
  BarChart2, 
  Layers, 
  Calendar,
  ExternalLink
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
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  ReferenceLine 
} from 'recharts';

const KPI_CONFIG = {
  'office-utilization': {
    key: 'officeUtilization',
    title: 'Office Utilization',
    icon: Building2,
    color: '#3b82f6',
    description: 'Measures workplace attendance and usage of available office capacity.',
    formula: 'Attendance % = (Office Days Attended / Planned Office Days) × 100\nScore = min(10, Attendance % / 10)'
  },
  'meeting-effectiveness': {
    key: 'meetingEffectiveness',
    title: 'Meeting Effectiveness',
    icon: CalendarCheck,
    color: '#ec4899',
    description: 'Measures meeting participation, productivity, and meeting overload.',
    formula: 'Attendance Score = (Attended / Scheduled) × 10\nLoad Score = max(0, 10 - (Meeting Hours / 10) × 10)\nEffectiveness = 0.6 × Attendance Score + 0.4 × Load Score'
  },
  'employee-engagement': {
    key: 'employeeEngagement',
    title: 'Employee Engagement',
    icon: Users,
    color: '#10b981',
    description: 'Estimates participation in workplace activities and attendance-related engagement.',
    formula: 'Activity Score = (Activities Attended / Available) × 100 / 10\nEngagement = 0.7 × Activity Score + 0.3 × Office Attendance Score'
  },
  'learning-participation': {
    key: 'learningParticipation',
    title: 'Learning Participation',
    icon: BookOpen,
    color: '#f59e0b',
    description: 'Tracks employee learning activity, course enrollment, and progress.',
    formula: 'Progress Score = Average Progress / 10\nHours Score = min(10, (Hours / 3) × 10)\nParticipation = 0.6 × Progress Score + 0.4 × Hours Score'
  },
  'hybrid-work-effectiveness': {
    key: 'hybridWorkEffectiveness',
    title: 'Hybrid Work Effectiveness',
    icon: Laptop,
    color: '#8b5cf6',
    description: 'Compares employee activity on remote days with office-attended days.',
    formula: 'Productivity Index = (Productive Hours / Expected Hours) × 100\nScore = average of capped remote-day and office-day productivity scores'
  }
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Time converter for timeline chart (e.g. "09:05" -> 9.08)
const timeToDecimal = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return Math.round((hours + minutes / 60) * 100) / 100;
};

export default function KPIDetail() {
  const { kpiId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { filters } = useDashboard();

  const config = KPI_CONFIG[kpiId];

  // Employee selection state for Managers and HR
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Load Organization & Team context
  const orgData = useMemo(() => getOrganizationKPIs(filters.dateRange), [filters.dateRange]);
  const allEmployees = useMemo(() => getEmployees(), []);
  const allManagers = useMemo(() => getManagers(), []);
  const courseCatalog = useMemo(() => getCourses(), []);

  // Determine active employee to inspect
  const activeEmployeeId = useMemo(() => {
    if (!user) return 'EMP001';
    if (user.role === 'Employee') return user.employeeId;
    if (selectedEmployeeId) return selectedEmployeeId;
    // For manager: default to themselves or first report
    if (user.role === 'Manager') return user.employeeId;
    // For HR: default to first employee
    return allEmployees[0]?.employeeId || 'EMP001';
  }, [user, selectedEmployeeId, allEmployees]);

  const activeEmployee = useMemo(() => {
    return getUserById(activeEmployeeId) || { employeeId: activeEmployeeId, name: 'Employee', role: 'Employee' };
  }, [activeEmployeeId]);

  // Employee KPI data
  const employeeKPIData = useMemo(() => {
    return getEmployeeKPIs(activeEmployeeId, filters.dateRange);
  }, [activeEmployeeId, filters.dateRange]);

  // Manager's own KPI and Team KPI
  const managerTeamData = useMemo(() => {
    if (user?.role === 'Manager') {
      return getTeamKPIs(user.employeeId, filters.dateRange);
    }
    // If viewing an employee, get their manager's team data for benchmarking
    if (activeEmployee?.managerId) {
      return getTeamKPIs(activeEmployee.managerId, filters.dateRange);
    }
    return null;
  }, [user, activeEmployee, filters.dateRange]);

  // If KPI route is invalid
  if (!config) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} className="empty-state-icon" style={{ color: '#ef4444' }} />
        <h2 className="empty-state-title">KPI Not Found</h2>
        <p className="empty-state-text">The requested KPI metric "{kpiId}" does not exist.</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const kpiKey = config.key;
  const currentDetails = employeeKPIData?.details?.[kpiKey];
  const userScore = employeeKPIData?.kpiScores?.[kpiKey] || 0;
  const orgAvgScore = orgData.orgKPIAverages[kpiKey] || 0;
  const teamAvgScore = managerTeamData?.teamKPIAverages?.[kpiKey] || orgAvgScore;

  const KpiIcon = config.icon;

  // Generate dynamic contextual insights
  const insights = useMemo(() => {
    const list = [];
    if (!currentDetails) return list;

    if (kpiKey === 'officeUtilization') {
      const { attendancePercentage, plannedDays, presentDays, avgDailyHours, records } = currentDetails;
      const missingTapOut = records?.some(r => r.present && !r.tapOut);

      if (attendancePercentage >= 80) {
        list.push({
          type: 'positive',
          text: `Strong in-office consistency: Attended ${presentDays} of ${plannedDays} planned days (${attendancePercentage}%), exceeding the organization average (${orgAvgScore * 10}%).`
        });
      } else {
        list.push({
          type: 'warning',
          text: `In-office attendance is at ${attendancePercentage}%, falling short of the recommended 80% workplace attendance benchmark.`
        });
      }

      list.push({
        type: 'info',
        text: `Average logged office duration is ${avgDailyHours} hours per present day, supporting collaborative team touchpoints.`
      });

      if (missingTapOut) {
        list.push({
          type: 'danger',
          text: `Unrecorded tap-out event detected during the week. Daily hours could not be fully reconciled for that record.`
        });
      }
    } else if (kpiKey === 'meetingEffectiveness') {
      const { totalScheduled, totalAttended, totalMeetingHours, isOverloaded, meetingAttendancePercentage } = currentDetails;
      if (meetingAttendancePercentage >= 85) {
        list.push({
          type: 'positive',
          text: `High meeting attendance fidelity: Attended ${totalAttended} of ${totalScheduled} scheduled sessions (${meetingAttendancePercentage}%).`
        });
      } else {
        list.push({
          type: 'warning',
          text: `Missed ${totalScheduled - totalAttended} meetings this week. Consider re-evaluating meeting invites and conflict management.`
        });
      }

      if (isOverloaded) {
        list.push({
          type: 'danger',
          text: `Meeting overload detected: ${totalMeetingHours} hours spent in meetings exceeds the healthy 10-hour weekly threshold. High risk of meeting fatigue.`
        });
      } else {
        list.push({
          type: 'positive',
          text: `Balanced meeting load: ${totalMeetingHours} hours logged, remaining within the safe weekly ceiling of 10 hours.`
        });
      }
    } else if (kpiKey === 'employeeEngagement') {
      const { totalAvailable, totalAttended, participationPercentage } = currentDetails;
      list.push({
        type: participationPercentage >= 70 ? 'positive' : 'warning',
        text: `Activity participation reached ${participationPercentage}% (${totalAttended}/${totalAvailable} events attended).`
      });
      list.push({
        type: 'info',
        text: `The engagement metric is weighted by workplace activity attendance (70%) and office presence consistency (30%).`
      });
      if (totalAvailable - totalAttended > 2) {
        list.push({
          type: 'warning',
          text: `Multiple wellness, networking, or volunteering initiatives were missed this week.`
        });
      }
    } else if (kpiKey === 'learningParticipation') {
      const { totalEnrolled, totalCompleted, totalLearningHours, weeklyTarget, avgProgress } = currentDetails;
      if (totalLearningHours >= weeklyTarget) {
        list.push({
          type: 'positive',
          text: `Met continuous learning objective: Completed ${totalLearningHours}h of skill development, satisfying the 3.0h target.`
        });
      } else {
        list.push({
          type: 'warning',
          text: `Logged ${totalLearningHours}h of learning, which is ${(weeklyTarget - totalLearningHours).toFixed(1)}h shy of the weekly target.`
        });
      }
      list.push({
        type: 'info',
        text: `${totalCompleted} course(s) finished and enrolled in ${totalEnrolled} total modules with an average progress rate of ${avgProgress}%.`
      });
    } else if (kpiKey === 'hybridWorkEffectiveness') {
      const { officeDays, remoteDays, avgOfficeProductivity, avgRemoteProductivity, productivityIndex } = currentDetails;
      list.push({
        type: 'info',
        text: `Hybrid cadence: Balanced between ${officeDays} office days and ${remoteDays} remote work days.`
      });
      if (Math.abs(avgOfficeProductivity - avgRemoteProductivity) <= 0.5) {
        list.push({
          type: 'positive',
          text: `Consistent output parity: Office productivity (${avgOfficeProductivity}h) and Remote productivity (${avgRemoteProductivity}h) are evenly balanced.`
        });
      } else if (avgOfficeProductivity > avgRemoteProductivity) {
        list.push({
          type: 'warning',
          text: `Higher productivity logged in-office (${avgOfficeProductivity}h) than on remote days (${avgRemoteProductivity}h).`
        });
      } else {
        list.push({
          type: 'positive',
          text: `Remote focus days yielded superior productive output (${avgRemoteProductivity}h) compared to office days (${avgOfficeProductivity}h).`
        });
      }
      list.push({
        type: 'info',
        text: `Overall productivity index stands at ${productivityIndex}% against expected productive hours.`
      });
    }

    return list;
  }, [kpiKey, currentDetails, orgAvgScore]);

  // Generate tailored recommendations
  const recommendations = useMemo(() => {
    const list = [];
    if (!currentDetails) return list;

    if (kpiKey === 'officeUtilization') {
      const { attendancePercentage, records } = currentDetails;
      const hasMissingTapOut = records?.some(r => r.present && !r.tapOut);

      if (hasMissingTapOut) {
        list.push({
          priority: 'high',
          action: 'Regularize Missing Tap-Out Records',
          description: 'Submit an attendance regularization request for missing swipe records to avoid payroll and utilization tracking discrepancies.',
          benefit: 'Restores data integrity and accurate workplace utilization reporting.'
        });
      }
      if (attendancePercentage < 80) {
        list.push({
          priority: 'high',
          action: 'Align In-Office Schedule with Team Collaboration Days',
          description: 'Coordinate planned office days with core team sync days (Tuesday & Thursday) to maximize in-person synergy and fulfill the 80% target.',
          benefit: 'Improves team collaboration and raises utilization score to 8.0+.'
        });
      }
      list.push({
        priority: 'medium',
        action: 'Maintain Consistent Core Hours',
        description: 'Aim for a steady 8.5–9 hour presence on office days to ensure predictable availability for cross-functional initiatives.',
        benefit: 'Boosts average daily workplace engagement.'
      });
    } else if (kpiKey === 'meetingEffectiveness') {
      const { totalMeetingHours, isOverloaded, totalMissed } = currentDetails;
      if (isOverloaded) {
        list.push({
          priority: 'high',
          action: 'Audit and Rationalize Weekly Meeting Commitments',
          description: `Total meeting load is ${totalMeetingHours}h (>10h cap). Delegate status updates to asynchronous channels (Slack/Jira) and decline non-essential invites.`,
          benefit: 'Protects deep-work time and prevents cognitive overload.'
        });
      }
      if (totalMissed > 0) {
        list.push({
          priority: 'medium',
          action: 'Send Advance Decline or Proxy Delegate',
          description: 'Notify meeting organizers with 24h notice when calendar conflicts arise, and review meeting recordings or summaries asynchronously.',
          benefit: 'Ensures accountability and keeps attendance score at 9.0+.'
        });
      }
      list.push({
        priority: 'low',
        action: 'Adopt 25/50 Minute Meeting Standards',
        description: 'Shorten 30-minute meetings to 25 minutes and 60-minute sessions to 50 minutes to allow biological breaks between consecutive sessions.',
        benefit: 'Reduces fatigue and enhances engagement during calls.'
      });
    } else if (kpiKey === 'employeeEngagement') {
      list.push({
        priority: 'high',
        action: 'Join Weekly Wellness and Collaboration Sessions',
        description: 'Reserve 30 minutes on calendar for mid-week wellness walks, yoga, or team knowledge-sharing sessions.',
        benefit: 'Elevates engagement score and strengthens workplace camaraderie.'
      });
      list.push({
        priority: 'medium',
        action: 'Participate in Cross-Team Social Initiatives',
        description: 'Sign up for company volunteering or innovation hackathons to network outside immediate project silos.',
        benefit: 'Fosters organizational cross-pollination and innovation.'
      });
      list.push({
        priority: 'low',
        action: 'Provide Feedback in Post-Event Retrospectives',
        description: 'Share recommendations on event formats and topics to align future workplace programs with team interests.',
        benefit: 'Ensures workplace activities remain relevant and impactful.'
      });
    } else if (kpiKey === 'learningParticipation') {
      const { totalLearningHours, weeklyTarget } = currentDetails;
      if (totalLearningHours < weeklyTarget) {
        list.push({
          priority: 'high',
          action: 'Schedule Dedicated "Focus Learning" Timeblocks',
          description: 'Reserve a 45-minute calendar slot on Friday afternoons or Tuesday mornings specifically for online course modules.',
          benefit: 'Guarantees attainment of the 3-hour weekly skill advancement goal.'
        });
      }
      list.push({
        priority: 'medium',
        action: 'Prioritize In-Progress Course Completion',
        description: 'Complete remaining quizzes and exercises for active courses before enrolling in additional certifications.',
        benefit: 'Improves completion rate percentage and boosts overall KPI score.'
      });
      list.push({
        priority: 'low',
        action: 'Leverage Experian Sustainable Workplace Curriculum',
        description: 'Complete the short 4-hour module on Sustainable Workplace Practices to align technical workflows with green goals.',
        benefit: 'Supports both sustainability literacy and professional growth.'
      });
    } else if (kpiKey === 'hybridWorkEffectiveness') {
      const { avgRemoteProductivity, avgOfficeProductivity } = currentDetails;
      list.push({
        priority: 'high',
        action: 'Structure Task Types by Work Mode',
        description: 'Reserve deep programming, writing, and analytical tasks for remote days; reserve collaborative design, 1:1s, and planning for office days.',
        benefit: 'Maximizes mode-specific productivity advantages.'
      });
      if (avgRemoteProductivity < 6.0) {
        list.push({
          priority: 'medium',
          action: 'Optimize Remote Ergonomics and Focus Environment',
          description: 'Establish structured daily standup goals and reduce domestic interruptions during remote working hours.',
          benefit: 'Brings remote productive output on par with office days.'
        });
      }
      list.push({
        priority: 'medium',
        action: 'Maintain Transparent Task Logging',
        description: 'Log completed tasks daily in the tracker to ensure visibility across distributed cross-functional teams.',
        benefit: 'Enhances productivity index and team coordination.'
      });
    }

    return list;
  }, [kpiKey, currentDetails]);

  // HR Team Comparison Data for this KPI
  const hrTeamComparisonData = useMemo(() => {
    if (user?.role !== 'HR') return [];
    return (orgData.managers || []).map(mgr => ({
      team: mgr.team || mgr.name,
      managerName: mgr.name,
      teamAverage: mgr.teamKPIs?.teamKPIAverages?.[kpiKey] || 0,
      memberCount: mgr.directReports?.length || 0
    }));
  }, [user, orgData, kpiKey]);

  // Manager Direct Reports Data for this KPI
  const managerDirectReportsKPIs = useMemo(() => {
    if (user?.role !== 'Manager' || !managerTeamData) return [];
    return (managerTeamData.teamMembers || []).map(member => ({
      employeeId: member.employeeId,
      name: member.name,
      score: member.kpis?.kpiScores?.[kpiKey] || 0,
      overallScore: member.kpis?.overallScore || 0,
      band: getScoreLabel(member.kpis?.kpiScores?.[kpiKey] || 0)
    }));
  }, [user, managerTeamData, kpiKey]);

  // Helper for dynamic formula explanation
  const renderFormulaBreakdown = () => {
    if (!currentDetails) return null;

    if (kpiKey === 'officeUtilization') {
      const { plannedDays, presentDays, attendancePercentage, score } = currentDetails;
      return (
        <div className="formula-calc-step">
          <strong>Current Calculation:</strong>
          <div>Attendance % = ({presentDays} Days Present / {plannedDays} Planned Days) × 100 = <strong>{attendancePercentage}%</strong></div>
          <div>Score = min(10, {attendancePercentage} / 10) = <strong style={{ color: getScoreColor(score) }}>{score} / 10</strong></div>
        </div>
      );
    }
    if (kpiKey === 'meetingEffectiveness') {
      const { totalScheduled, totalAttended, totalMeetingHours, meetingAttendanceScore, meetingLoadScore, score } = currentDetails;
      return (
        <div className="formula-calc-step">
          <strong>Current Calculation:</strong>
          <div>Attendance Score = ({totalAttended} / {totalScheduled || 1}) × 10 = <strong>{meetingAttendanceScore} / 10</strong></div>
          <div>Load Score = max(0, 10 - ({totalMeetingHours}h / 10h) × 10) = <strong>{meetingLoadScore} / 10</strong></div>
          <div>Effectiveness = (0.6 × {meetingAttendanceScore}) + (0.4 × {meetingLoadScore}) = <strong style={{ color: getScoreColor(score) }}>{score} / 10</strong></div>
        </div>
      );
    }
    if (kpiKey === 'employeeEngagement') {
      const { totalAvailable, totalAttended, activityScore, attendanceConsistencyScore, score } = currentDetails;
      return (
        <div className="formula-calc-step">
          <strong>Current Calculation:</strong>
          <div>Activity Score = ({totalAttended} / {totalAvailable || 1}) × 100 / 10 = <strong>{activityScore} / 10</strong></div>
          <div>Attendance Factor = <strong>{attendanceConsistencyScore} / 10</strong></div>
          <div>Engagement = (0.7 × {activityScore}) + (0.3 × {attendanceConsistencyScore}) = <strong style={{ color: getScoreColor(score) }}>{score} / 10</strong></div>
        </div>
      );
    }
    if (kpiKey === 'learningParticipation') {
      const { avgProgress, totalLearningHours, learningProgressScore, learningHoursScore, score } = currentDetails;
      return (
        <div className="formula-calc-step">
          <strong>Current Calculation:</strong>
          <div>Progress Score = {avgProgress}% / 10 = <strong>{learningProgressScore} / 10</strong></div>
          <div>Hours Score = min(10, ({totalLearningHours}h / 3h) × 10) = <strong>{learningHoursScore} / 10</strong></div>
          <div>Participation = (0.6 × {learningProgressScore}) + (0.4 × {learningHoursScore}) = <strong style={{ color: getScoreColor(score) }}>{score} / 10</strong></div>
        </div>
      );
    }
    if (kpiKey === 'hybridWorkEffectiveness') {
      const { productivityIndex, officeProductivityScore, remoteProductivityScore, score } = currentDetails;
      return (
        <div className="formula-calc-step">
          <strong>Current Calculation:</strong>
          <div>Productivity Index = <strong>{productivityIndex}%</strong></div>
          <div>Office Component = {officeProductivityScore} / 10 | Remote Component = {remoteProductivityScore} / 10</div>
          <div>Combined Score = <strong style={{ color: getScoreColor(score) }}>{score} / 10</strong></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="kpi-detail-page">
      <style>{`
        .kpi-detail-page {
          padding-bottom: 40px;
        }
        .kpi-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        .kpi-title-block {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .kpi-icon-badge {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.12);
        }
        .kpi-title-text h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .kpi-title-text p {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .role-control-box {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          max-width: 100%;
          min-width: 0;
          gap: 12px;
          background: var(--bg-card);
          padding: 8px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        .role-control-box select,
        .role-control-box button {
          max-width: 100%;
          min-width: 0;
        }
        .role-control-box label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
        }
        .role-control-box select {
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 13px;
          background: white;
          color: var(--text-primary);
          outline: none;
        }
        .top-overview-grid {
          display: grid;
          grid-template-columns: 280px 1fr 280px;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 1100px) {
          .top-overview-grid {
            grid-template-columns: 1fr;
          }
        }
        .score-display-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          text-align: center;
        }
        .formula-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-left: 5px solid ${config.color};
          border-radius: var(--radius-md);
          padding: 20px 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .formula-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        .formula-code-box {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          background: #f8fafc;
          border: 1px solid var(--border-light);
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          color: var(--text-secondary);
          white-space: pre-line;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .formula-calc-step {
          font-size: 12.5px;
          color: var(--text-secondary);
          background: #f1f5f9;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          line-height: 1.6;
        }
        .benchmark-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .benchmark-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .benchmark-row {
          margin-bottom: 12px;
        }
        .benchmark-row:last-child {
          margin-bottom: 0;
        }
        .benchmark-row-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .benchmark-bar-track {
          height: 6px;
          background: var(--bg-primary);
          border-radius: 999px;
          overflow: hidden;
        }
        .benchmark-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.5s ease;
        }
        .alert-banner-custom {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: var(--radius);
          margin-bottom: 24px;
          font-size: 13.5px;
          font-weight: 500;
        }
        .alert-banner-custom.warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
        }
        .alert-banner-custom.danger {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }
        .custom-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 900px) {
          .custom-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .custom-stats-grid {
            grid-template-columns: 1fr;
          }
        }
        .insight-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .insight-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius);
          background: var(--bg-primary);
          font-size: 13.5px;
          color: var(--text-primary);
          line-height: 1.5;
        }
        .insight-item.positive {
          border-left: 3px solid #10b981;
        }
        .insight-item.warning {
          border-left: 3px solid #f59e0b;
        }
        .insight-item.danger {
          border-left: 3px solid #ef4444;
        }
        .insight-item.info {
          border-left: 3px solid #3b82f6;
        }
        .badge-missing {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 600;
        }
      `}</style>

      {/* Back Button */}
      <button 
        className="back-btn" 
        onClick={() => {
          if (user?.role === 'HR') navigate('/dashboard/hr');
          else if (user?.role === 'Manager') navigate('/dashboard/manager');
          else navigate('/dashboard/employee');
        }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Page Header */}
      <div className="kpi-header-row">
        <div className="kpi-title-block">
          <div className="kpi-icon-badge" style={{ backgroundColor: config.color }}>
            <KpiIcon size={28} />
          </div>
          <div className="kpi-title-text">
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
        </div>

        {/* Role & Context Selector */}
        <div className="role-control-box">
          <label>Viewing Mode:</label>
          {user?.role === 'HR' ? (
            <select 
              value={activeEmployeeId} 
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <optgroup label="Organization Employees">
                {allEmployees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId}) - Team {emp.team}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Managers">
                {allManagers.map(mgr => (
                  <option key={mgr.employeeId} value={mgr.employeeId}>
                    {mgr.name} ({mgr.employeeId}) - Manager
                  </option>
                ))}
              </optgroup>
            </select>
          ) : user?.role === 'Manager' ? (
            <select 
              value={activeEmployeeId} 
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value={user.employeeId}>{user.name} (My KPI - Manager)</option>
              <optgroup label="Direct Reports">
                {(managerTeamData?.teamMembers || []).map(member => (
                  <option key={member.employeeId} value={member.employeeId}>
                    {member.name} ({member.employeeId})
                  </option>
                ))}
              </optgroup>
            </select>
          ) : (
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.name} ({user?.employeeId})
            </span>
          )}
        </div>
      </div>

      {/* Meeting Overload Alert Banner */}
      {kpiKey === 'meetingEffectiveness' && currentDetails?.isOverloaded && (
        <div className="alert-banner-custom danger">
          <AlertTriangle size={20} />
          <div>
            <strong>Meeting Overload Detected:</strong> Logged {currentDetails.totalMeetingHours} hours in meetings this week, exceeding the healthy threshold of {currentDetails.weeklyLimit} hours. Consider declining or delegating non-critical syncs.
          </div>
        </div>
      )}

      {/* Missing Tap-Out Alert Banner */}
      {kpiKey === 'officeUtilization' && currentDetails?.records?.some(r => r.present && !r.tapOut) && (
        <div className="alert-banner-custom warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Missing Tap-Out Detected:</strong> A missing tap-out event was recorded on{' '}
            {currentDetails.records.filter(r => r.present && !r.tapOut).map(r => `${r.day} (${r.date})`).join(', ')}.
            Please submit an attendance regularization request.
          </div>
        </div>
      )}

      {/* TOP ROW: Score Gauge, Formula Box, Benchmark Comparison */}
      <div className="top-overview-grid">
        {/* Score Card */}
        <div className="score-display-card">
          <ScoreGauge 
            score={userScore} 
            size={130} 
            label={activeEmployeeId === user?.employeeId ? "My KPI Score" : `${activeEmployee.name.split(' ')[0]}'s Score`} 
          />
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Status: <strong style={{ color: getScoreColor(userScore) }}>{getScoreLabel(userScore)}</strong>
          </div>
        </div>

        {/* Formula Box */}
        <div className="formula-card">
          <div>
            <div className="formula-card-header">
              <Info size={18} style={{ color: config.color }} />
              Scoring Formula & Methodology
            </div>
            <div className="formula-code-box">
              {config.formula}
            </div>
          </div>
          {renderFormulaBreakdown()}
        </div>

        {/* Benchmark Card */}
        <div className="benchmark-card">
          <div className="benchmark-title">
            <BarChart2 size={16} /> Comparative Benchmarks
          </div>
          <div>
            <div className="benchmark-row">
              <div className="benchmark-row-header">
                <span>{activeEmployeeId === user?.employeeId ? "You" : activeEmployee.name.split(' ')[0]}</span>
                <strong>{userScore} / 10</strong>
              </div>
              <div className="benchmark-bar-track">
                <div 
                  className="benchmark-bar-fill" 
                  style={{ width: `${userScore * 10}%`, backgroundColor: getScoreColor(userScore) }}
                />
              </div>
            </div>

            <div className="benchmark-row">
              <div className="benchmark-row-header">
                <span>Team Average</span>
                <strong>{teamAvgScore} / 10</strong>
              </div>
              <div className="benchmark-bar-track">
                <div 
                  className="benchmark-bar-fill" 
                  style={{ width: `${teamAvgScore * 10}%`, backgroundColor: getScoreColor(teamAvgScore) }}
                />
              </div>
            </div>

            <div className="benchmark-row">
              <div className="benchmark-row-header">
                <span>Org Average</span>
                <strong>{orgAvgScore} / 10</strong>
              </div>
              <div className="benchmark-bar-track">
                <div 
                  className="benchmark-bar-fill" 
                  style={{ width: `${orgAvgScore * 10}%`, backgroundColor: getScoreColor(orgAvgScore) }}
                />
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '12px', textAlign: 'center' }}>
            {userScore >= teamAvgScore ? (
              <span style={{ color: '#10b981', fontWeight: 600 }}>▲ {(userScore - teamAvgScore).toFixed(1)} pts above Team Avg</span>
            ) : (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>▼ {(teamAvgScore - userScore).toFixed(1)} pts below Team Avg</span>
            )}
          </div>
        </div>
      </div>

      {/* KEY METRIC CARDS (4 per row) */}
      {renderMetricCards(kpiKey, currentDetails)}

      {/* HR / MANAGER SPECIAL SECTIONS */}
      {user?.role === 'HR' && renderHRTeamComparison(kpiKey, hrTeamComparisonData, config)}
      {user?.role === 'Manager' && renderManagerTeamSection(managerDirectReportsKPIs, activeEmployeeId, setSelectedEmployeeId, config)}

      {/* INTERACTIVE CHARTS SPECIFIC TO EACH KPI */}
      {renderKPICharts(kpiKey, currentDetails, orgData, user)}

      {/* DAILY BREAKDOWN TABLE */}
      {renderDailyBreakdown(kpiKey, currentDetails, courseCatalog)}

      {/* INSIGHTS GENERATED FROM DATA */}
      <div className="section" style={{ marginTop: '32px' }}>
        <h2 className="section-title">
          <TrendingUp size={20} style={{ color: config.color }} /> Automated Performance Insights
        </h2>
        <div className="chart-card">
          <div className="insight-list">
            {insights.map((ins, idx) => (
              <div key={idx} className={`insight-item ${ins.type}`}>
                {ins.type === 'positive' && <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />}
                {ins.type === 'warning' && <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />}
                {ins.type === 'danger' && <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />}
                {ins.type === 'info' && <Info size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />}
                <div>{ins.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIONABLE RECOMMENDATIONS */}
      <div className="section" style={{ marginTop: '32px' }}>
        <h2 className="section-title">
          <Award size={20} style={{ color: config.color }} /> Actionable Recommendations
        </h2>
        <div>
          {recommendations.map((rec, idx) => (
            <div key={idx} className="rec-card">
              <div className="rec-header">
                <span className="rec-category">{config.title} Improvement</span>
                <span className={`rec-priority ${rec.priority}`}>
                  {rec.priority.toUpperCase()} PRIORITY
                </span>
              </div>
              <div className="rec-action" style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
                {rec.action}
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                {rec.description}
              </div>
              <div className="rec-meta">
                <span className="rec-benefit">
                  <strong>Expected Impact:</strong> {rec.benefit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// RENDER KEY METRICS (4 PER ROW)
// -------------------------------------------------------------
function renderMetricCards(kpiKey, details) {
  if (!details) return null;

  if (kpiKey === 'officeUtilization') {
    return (
      <div className="custom-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Planned Office Days</div>
          <div className="stat-value">{details.plannedDays} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)' }}>days</span></div>
          <div className="stat-change neutral">Standard work week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Present Days</div>
          <div className="stat-value">{details.presentDays} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)' }}>days</span></div>
          <div className="stat-change positive">Verified badge swipes</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Attendance Rate</div>
          <div className="stat-value" style={{ color: getScoreColor(details.score) }}>{details.attendancePercentage}%</div>
          <div className="stat-change positive">Target: ≥ 80%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Daily Hours</div>
          <div className="stat-value">{details.avgDailyHours}h</div>
          <div className="stat-change neutral">Total: {details.totalHours}h logged</div>
        </div>
      </div>
    );
  }

  if (kpiKey === 'meetingEffectiveness') {
    return (
      <>
        <div className="custom-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Scheduled Meetings</div>
            <div className="stat-value">{details.totalScheduled}</div>
            <div className="stat-change neutral">Total calendar invites</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Attended Meetings</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{details.totalAttended}</div>
            <div className="stat-change positive">{details.meetingAttendancePercentage}% attendance</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Missed Meetings</div>
            <div className="stat-value" style={{ color: details.totalMissed > 0 ? '#ef4444' : '#10b981' }}>{details.totalMissed}</div>
            <div className="stat-change neutral">{details.totalMissed === 0 ? 'No missed syncs' : 'Unattended invites'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Meeting Hours</div>
            <div className="stat-value" style={{ color: details.isOverloaded ? '#ef4444' : 'var(--text-primary)' }}>
              {details.totalMeetingHours}h
            </div>
            <div className={`stat-change ${details.isOverloaded ? 'negative' : 'positive'}`}>
              Limit: {details.weeklyLimit}h / week
            </div>
          </div>
        </div>

        <div className="custom-stats-grid" style={{ marginTop: '-8px' }}>
          <div className="stat-card">
            <div className="stat-label">Attendance Score</div>
            <div className="stat-value">{details.meetingAttendanceScore} <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>/ 10</span></div>
            <div className="stat-change neutral">60% of total score</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Meeting Load Score</div>
            <div className="stat-value">{details.meetingLoadScore} <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>/ 10</span></div>
            <div className="stat-change neutral">40% of total score</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Meeting Duration</div>
            <div className="stat-value">{details.avgMeetingDuration}h</div>
            <div className="stat-change neutral">Per attended call</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Load Status</div>
            <div className="stat-value" style={{ fontSize: '20px', color: details.isOverloaded ? '#ef4444' : '#10b981' }}>
              {details.isOverloaded ? 'Overloaded' : 'Optimal'}
            </div>
            <div className="stat-change neutral">{details.isOverloaded ? 'Exceeds 10h' : 'Within healthy range'}</div>
          </div>
        </div>
      </>
    );
  }

  if (kpiKey === 'employeeEngagement') {
    return (
      <div className="custom-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Available Activities</div>
          <div className="stat-value">{details.totalAvailable}</div>
          <div className="stat-change neutral">Scheduled company initiatives</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activities Attended</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{details.totalAttended}</div>
          <div className="stat-change positive">Verified participation</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Participation Rate</div>
          <div className="stat-value" style={{ color: getScoreColor(details.score) }}>{details.participationPercentage}%</div>
          <div className="stat-change positive">Target: ≥ 70%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activity Score</div>
          <div className="stat-value">{details.activityScore} <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>/ 10</span></div>
          <div className="stat-change neutral">Weighted 70% in metric</div>
        </div>
      </div>
    );
  }

  if (kpiKey === 'learningParticipation') {
    return (
      <>
        <div className="custom-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Enrolled Courses</div>
            <div className="stat-value">{details.totalEnrolled}</div>
            <div className="stat-change neutral">Active skill modules</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed Courses</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{details.totalCompleted}</div>
            <div className="stat-change positive">{details.completionPercentage}% completion rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{details.totalInProgress}</div>
            <div className="stat-change neutral">Active progression</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Progress</div>
            <div className="stat-value">{details.avgProgress}%</div>
            <div className="stat-change positive">Across all enrollments</div>
          </div>
        </div>

        <div className="custom-stats-grid" style={{ marginTop: '-8px' }}>
          <div className="stat-card">
            <div className="stat-label">Learning Hours</div>
            <div className="stat-value">{details.totalLearningHours}h</div>
            <div className="stat-change neutral">Weekly target: {details.weeklyTarget}h</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Weekly Target Progress</div>
            <div className="stat-value" style={{ color: details.totalLearningHours >= details.weeklyTarget ? '#10b981' : '#f59e0b' }}>
              {Math.min(100, Math.round((details.totalLearningHours / details.weeklyTarget) * 100))}%
            </div>
            <div className="stat-change neutral">{details.totalLearningHours >= details.weeklyTarget ? 'Goal accomplished' : 'In progress'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Progress Score</div>
            <div className="stat-value">{details.learningProgressScore} <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>/ 10</span></div>
            <div className="stat-change neutral">60% of score</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Hours Score</div>
            <div className="stat-value">{details.learningHoursScore} <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>/ 10</span></div>
            <div className="stat-change neutral">40% of score</div>
          </div>
        </div>
      </>
    );
  }

  if (kpiKey === 'hybridWorkEffectiveness') {
    return (
      <div className="custom-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Office Days</div>
          <div className="stat-value">{details.officeDays} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)' }}>days</span></div>
          <div className="stat-change neutral">In-person focus</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remote Days</div>
          <div className="stat-value">{details.remoteDays} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-tertiary)' }}>days</span></div>
          <div className="stat-change neutral">Remote focus</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Office vs Remote Hours</div>
          <div className="stat-value">{details.avgOfficeProductivity}h / {details.avgRemoteProductivity}h</div>
          <div className="stat-change positive">Benchmark: 7.0h expected</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tasks Completed</div>
          <div className="stat-value">{details.totalTasks}</div>
          <div className="stat-change positive">Index: {details.productivityIndex}%</div>
        </div>
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------------
// HR TEAM COMPARISON SECTION
// -------------------------------------------------------------
function renderHRTeamComparison(kpiKey, teamData, config) {
  if (!teamData || teamData.length === 0) return null;

  return (
    <div className="section" style={{ marginBottom: '24px' }}>
      <h2 className="section-title">
        <Users size={20} style={{ color: config.color }} /> Organization Team Comparison ({config.title})
      </h2>
      <div className="charts-grid">
        <ChartCard 
          title="Team Average Score Comparison" 
          subtitle="Cross-team performance distribution for this metric"
        >
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="team" stroke="#64748b" />
                <YAxis domain={[0, 10]} stroke="#64748b" />
                <Tooltip 
                  formatter={(val) => [`${val} / 10`, 'Average Score']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="teamAverage" fill={config.color} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard 
          title="Team Breakdown & Headcount" 
          subtitle="Team leadership and average rating summary"
        >
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Manager</th>
                  <th>Members</th>
                  <th>Team Score</th>
                  <th>Performance Band</th>
                </tr>
              </thead>
              <tbody>
                {teamData.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.team}</td>
                    <td>{item.managerName}</td>
                    <td>{item.memberCount} employees</td>
                    <td style={{ fontWeight: 700, color: getScoreColor(item.teamAverage) }}>
                      {item.teamAverage} / 10
                    </td>
                    <td>
                      <span className={`score-badge ${getScoreLabel(item.teamAverage).toLowerCase().replace(' ', '-')}`}>
                        {getScoreLabel(item.teamAverage)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MANAGER TEAM SECTION
// -------------------------------------------------------------
function renderManagerTeamSection(teamMembers, activeEmployeeId, onSelect, config) {
  if (!teamMembers || teamMembers.length === 0) return null;

  return (
    <div className="section" style={{ marginBottom: '24px' }}>
      <h2 className="section-title">
        <Users size={20} style={{ color: config.color }} /> Team Member KPI Performance ({config.title})
      </h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>{config.title} Score</th>
              <th>Overall Score</th>
              <th>Performance Band</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map(member => (
              <tr 
                key={member.employeeId} 
                style={{ backgroundColor: member.employeeId === activeEmployeeId ? '#eff6ff' : undefined }}
              >
                <td style={{ fontWeight: 600 }}>{member.employeeId}</td>
                <td>{member.name}</td>
                <td style={{ fontWeight: 700, color: getScoreColor(member.score) }}>
                  {member.score} / 10
                </td>
                <td>{member.overallScore} / 10</td>
                <td>
                  <span className={`score-badge ${member.band.toLowerCase().replace(' ', '-')}`}>
                    {member.band}
                  </span>
                </td>
                <td>
                  <button 
                    className="export-btn secondary"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={() => onSelect(member.employeeId)}
                  >
                    {member.employeeId === activeEmployeeId ? 'Viewing' : 'Inspect'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// INTERACTIVE CHARTS (KPI SPECIFIC)
// -------------------------------------------------------------
function renderKPICharts(kpiKey, details, orgData, user) {
  if (!details) return null;

  if (kpiKey === 'officeUtilization') {
    const weeklyData = (details.records || []).map(r => ({
      day: r.day.substring(0, 3),
      date: r.date,
      hours: r.hoursInOffice || 0,
      planned: r.planned ? 8 : 0,
      present: r.present ? 1 : 0
    }));

    const timelineData = (details.records || []).filter(r => r.planned).map(r => ({
      day: r.day.substring(0, 3),
      date: r.date,
      tapIn: timeToDecimal(r.tapIn) || 0,
      tapOut: timeToDecimal(r.tapOut) || 0,
      hours: r.hoursInOffice || 0,
      tapInStr: r.tapIn || 'None',
      tapOutStr: r.tapOut || 'None',
      missingTapOut: r.present && !r.tapOut
    }));

    const attendancePieData = [
      { name: 'Present Days', value: details.presentDays, color: '#10b981' },
      { name: 'Absent Days', value: Math.max(0, details.plannedDays - details.presentDays), color: '#ef4444' }
    ];

    const isHR = user?.role === 'HR';

    return (
      <div className="charts-grid">
        {/* Chart 1: Weekly Hours In Office */}
        <ChartCard 
          title="Weekly In-Office Attendance Hours" 
          subtitle="Hours logged per day vs planned 8.0h expectation"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 11]} />
                <Tooltip 
                  formatter={(val, name) => [`${val}h`, name === 'hours' ? 'Hours in Office' : 'Standard Expected']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <ReferenceLine y={8} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target: 8h', fill: '#f59e0b', fontSize: 11 }} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} name="hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 2: Daily Tap-in / Tap-out Timeline */}
        <ChartCard 
          title="Daily Tap-In & Tap-Out Schedule" 
          subtitle="Time of entry and departure (24-hour decimal format)"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis domain={[8, 20]} stroke="#64748b" ticks={[8, 10, 12, 14, 16, 18, 20]} />
                <Tooltip 
                  content={({ payload, label }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{label} ({d.date})</div>
                        <div>Tap In: <strong>{d.tapInStr}</strong></div>
                        <div>Tap Out: <strong>{d.tapOutStr}</strong></div>
                        <div>Duration: <strong>{d.hours}h</strong></div>
                        {d.missingTapOut && <div style={{ color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>⚠️ Missing Tap-Out Recorded</div>}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="tapIn" fill="#3b82f6" name="Tap In (Arrival)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tapOut" fill="#10b981" name="Tap Out (Departure)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 3: Attendance vs Planned Days Donut */}
        <ChartCard 
          title="Attendance vs Planned Days" 
          subtitle={`Attended ${details.presentDays} of ${details.plannedDays} planned office days`}
        >
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Days`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 4: Workspace Occupancy vs Capacity (HR Exclusive) or Weekly Hours Area */}
        {isHR ? (
          <ChartCard 
            title="Org Workspace Occupancy vs Capacity (HR)" 
            subtitle={`Office Capacity: ${orgData.organization.officeCapacity} Desks`}
          >
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgData.dailyOccupancy} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis domain={[0, orgData.organization.officeCapacity + 4]} stroke="#64748b" />
                  <Tooltip 
                    formatter={(val, name) => [
                      name === 'occupancy' ? `${val} Present (${Math.round((val/orgData.organization.officeCapacity)*100)}%)` : val,
                      name === 'occupancy' ? 'Occupancy' : 'Capacity'
                    ]}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <ReferenceLine 
                    y={orgData.organization.officeCapacity} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    label={{ value: `Max: ${orgData.organization.officeCapacity}`, fill: '#ef4444', fontSize: 11 }} 
                  />
                  <Bar dataKey="occupancy" fill="#6366f1" radius={[6, 6, 0, 0]} name="occupancy" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        ) : (
          <ChartCard 
            title="Weekly Attendance Consistency" 
            subtitle="Cumulative office hours logged across the 7-day period"
          >
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="officeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 11]} />
                  <Tooltip formatter={(val) => [`${val}h`, 'Logged Office Hours']} />
                  <Area type="monotone" dataKey="hours" stroke="#3b82f6" fillOpacity={1} fill="url(#officeGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>
    );
  }

  if (kpiKey === 'meetingEffectiveness') {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const meetingsByDay = days.map(dayName => {
      const dayMeetings = (details.meetings || []).filter(m => m.day === dayName);
      const scheduled = dayMeetings.filter(m => m.scheduled).length;
      const attended = dayMeetings.filter(m => m.attended).length;
      const hours = dayMeetings.filter(m => m.attended).reduce((sum, m) => sum + (m.duration || 0), 0);
      return {
        day: dayName.substring(0, 3),
        scheduled,
        attended,
        hours: Math.round(hours * 10) / 10
      };
    });

    const attendancePie = [
      { name: 'Attended Meetings', value: details.totalAttended, color: '#10b981' },
      { name: 'Missed Meetings', value: details.totalMissed, color: '#ef4444' }
    ];

    return (
      <div className="charts-grid">
        {/* Chart 1: Scheduled vs Attended */}
        <ChartCard 
          title="Scheduled vs Attended Meetings by Day" 
          subtitle="Daily comparison of planned invites vs verified participation"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meetingsByDay} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="scheduled" fill="#94a3b8" name="Scheduled" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attended" fill="#ec4899" name="Attended" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 2: Daily Meeting Hours */}
        <ChartCard 
          title="Daily Meeting Duration (Hours)" 
          subtitle="Hours spent on call vs daily healthy recommendation"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meetingsByDay} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 5]} />
                <Tooltip 
                  formatter={(val) => [`${val} hrs`, 'Meeting Hours']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Daily Max: 2.0h', fill: '#f59e0b', fontSize: 11 }} />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 3: Meeting Attendance Pie */}
        <ChartCard 
          title="Meeting Attendance Breakdown" 
          subtitle={`Attendance Fidelity: ${details.meetingAttendancePercentage}%`}
        >
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {attendancePie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Sessions`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 4: Cumulative Meeting Load Trend */}
        <ChartCard 
          title="Meeting Load Accumulation" 
          subtitle={`Current total: ${details.totalMeetingHours}h (Weekly limit: ${details.weeklyLimit}h)`}
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={meetingsByDay} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip formatter={(val) => [`${val}h`, 'Meeting Time']} />
                <Area type="monotone" dataKey="hours" stroke="#ec4899" fill="#fce7f3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  }

  if (kpiKey === 'employeeEngagement') {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const activitiesByDay = days.map(dayName => {
      const dayActivities = (details.activities || []).filter(a => a.day === dayName);
      const available = dayActivities.filter(a => a.available).length;
      const attended = dayActivities.filter(a => a.attended).length;
      return {
        day: dayName.substring(0, 3),
        available,
        attended
      };
    });

    const categoryMap = {};
    (details.activities || []).forEach(a => {
      const cat = a.category || 'other';
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, available: 0, attended: 0 };
      if (a.available) categoryMap[cat].available++;
      if (a.attended) categoryMap[cat].attended++;
    });
    const categoryData = Object.values(categoryMap);

    const participationPie = [
      { name: 'Attended', value: details.totalAttended, color: '#10b981' },
      { name: 'Missed', value: Math.max(0, details.totalAvailable - details.totalAttended), color: '#94a3b8' }
    ];

    return (
      <div className="charts-grid">
        {/* Chart 1: Activity Participation Donut */}
        <ChartCard 
          title="Activity Participation Donut" 
          subtitle={`Overall Rate: ${details.participationPercentage}%`}
        >
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={participationPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {participationPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Events`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 2: Activities by Day */}
        <ChartCard 
          title="Activities Available vs Attended by Day" 
          subtitle="Daily employee activity attendance rhythm"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activitiesByDay} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="available" fill="#cbd5e1" name="Available" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attended" fill="#10b981" name="Attended" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 3: Category Breakdown */}
        <ChartCard 
          title="Engagement by Activity Category" 
          subtitle="Participation spread across wellness, collaboration, and learning"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" allowDecimals={false} />
                <YAxis type="category" dataKey="category" stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="available" fill="#cbd5e1" name="Available" radius={[0, 4, 4, 0]} />
                <Bar dataKey="attended" fill="#0d9488" name="Attended" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 4: Engagement Composition */}
        <ChartCard 
          title="Engagement Metric Composition" 
          subtitle="Activity participation (70%) + Office presence (30%)"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  { component: 'Activity Score', score: details.activityScore, weight: '70% Weight' },
                  { component: 'Office Attendance', score: details.attendanceConsistencyScore, weight: '30% Weight' },
                  { component: 'Final Engagement', score: details.score, weight: 'Composite' }
                ]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="component" stroke="#64748b" />
                <YAxis domain={[0, 10]} stroke="#64748b" />
                <Tooltip formatter={(val) => [`${val} / 10`, 'Score']} />
                <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  }

  if (kpiKey === 'learningParticipation') {
    const courseProgressData = (details.courses || []).map(c => ({
      courseId: c.courseId,
      progress: c.progress,
      hours: c.hoursCompleted,
      status: c.status
    }));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyHoursData = (details.dailyHours || []).map((d, idx) => ({
      day: days[idx] || d.date,
      date: d.date,
      hours: d.hours
    }));

    const completionPie = [
      { name: 'Completed', value: details.totalCompleted, color: '#10b981' },
      { name: 'In Progress', value: details.totalInProgress, color: '#f59e0b' }
    ];

    return (
      <div className="charts-grid">
        {/* Chart 1: Course Progress Bars */}
        <ChartCard 
          title="Individual Course Progress (%)" 
          subtitle="Completion progress for actively enrolled modules"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseProgressData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                <YAxis type="category" dataKey="courseId" stroke="#64748b" />
                <Tooltip 
                  formatter={(val) => [`${val}%`, 'Progress']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="progress" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 2: Daily Learning Hours */}
        <ChartCard 
          title="Daily Learning Hours Logged" 
          subtitle={`Total: ${details.totalLearningHours}h (Target: ${details.weeklyTarget}h)`}
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyHoursData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 2]} />
                <Tooltip 
                  formatter={(val) => [`${val}h`, 'Learning Hours']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 3: Completion Donut */}
        <ChartCard 
          title="Course Completion Ratio" 
          subtitle={`${details.totalCompleted} Completed vs ${details.totalInProgress} In Progress`}
        >
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {completionPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Courses`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 4: Target Progress Cumulative */}
        <ChartCard 
          title="Weekly Target Fulfillment" 
          subtitle="Hours completed against the 3.0h standard target"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  { label: 'Logged Hours', hours: details.totalLearningHours },
                  { label: 'Weekly Target', hours: details.weeklyTarget }
                ]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis domain={[0, 4]} stroke="#64748b" />
                <Tooltip formatter={(val) => [`${val}h`, 'Hours']} />
                <Bar dataKey="hours" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  }

  if (kpiKey === 'hybridWorkEffectiveness') {
    const records = details.records || [];
    const dailyProductive = records.filter(r => r.workMode !== 'off').map(r => ({
      day: r.day.substring(0, 3),
      mode: r.workMode === 'office' ? 'Office' : 'Remote',
      productiveHours: r.productiveHours,
      expected: r.expectedProductiveHours || 7,
      tasks: r.tasksCompleted
    }));

    const modePie = [
      { name: 'Office Days', value: details.officeDays, color: '#3b82f6' },
      { name: 'Remote Days', value: details.remoteDays, color: '#8b5cf6' },
      { name: 'Off Days', value: records.filter(r => r.workMode === 'off').length, color: '#cbd5e1' }
    ];

    const modeComparison = [
      { metric: 'Avg Productive Hours', Office: details.avgOfficeProductivity, Remote: details.avgRemoteProductivity },
      { metric: 'Avg Tasks Done', Office: details.avgOfficeTasks, Remote: details.avgRemoteTasks }
    ];

    return (
      <div className="charts-grid">
        {/* Chart 1: Remote vs Office Productivity Bar */}
        <ChartCard 
          title="Remote vs Office Productivity Metrics" 
          subtitle="Side-by-side comparison of daily productive hours and task completions"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modeComparison} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="metric" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="Office" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Remote" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 2: Daily Productive Hours Line */}
        <ChartCard 
          title="Daily Productive Hours vs 7.0h Benchmark" 
          subtitle="Tracked focus output over the weekly schedule"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyProductive} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis domain={[4, 8]} stroke="#64748b" />
                <Tooltip 
                  formatter={(val, name) => [`${val}h`, name === 'productiveHours' ? 'Productive Output' : 'Target']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <ReferenceLine y={7.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Target: 7h', fill: '#f59e0b', fontSize: 11 }} />
                <Line type="monotone" dataKey="productiveHours" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 3: Tasks by Mode Bar */}
        <ChartCard 
          title="Tasks Completed Across Daily Work Modes" 
          subtitle="Work output volume across office and remote settings"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyProductive} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip 
                  formatter={(val, name, item) => [`${val} tasks (${item.payload.mode})`, 'Output']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="tasks" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 4: Work Mode Donut */}
        <ChartCard 
          title="Weekly Work Mode Allocation" 
          subtitle="Distribution of working environments over 7 days"
        >
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {modePie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Days`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------------
// DAILY BREAKDOWN TABLE (7-DAY PERIOD)
// -------------------------------------------------------------
function renderDailyBreakdown(kpiKey, details, courseCatalog) {
  if (!details) return null;

  if (kpiKey === 'officeUtilization') {
    return (
      <div className="section" style={{ marginTop: '32px' }}>
        <h2 className="section-title">
          <Calendar size={20} style={{ color: '#3b82f6' }} /> 7-Day Office Attendance Breakdown
        </h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Planned</th>
                <th>Status</th>
                <th>Tap In</th>
                <th>Tap Out</th>
                <th>Hours in Office</th>
                <th>Anomalies / Notes</th>
              </tr>
            </thead>
            <tbody>
              {(details.records || []).map((r, idx) => {
                const isMissingTapOut = r.present && !r.tapOut;
                return (
                  <tr key={idx} style={{ backgroundColor: isMissingTapOut ? '#fff7ed' : undefined }}>
                    <td>{formatDate(r.date)}</td>
                    <td style={{ fontWeight: 600 }}>{r.day}</td>
                    <td>{r.planned ? <span className="tag success">Planned</span> : <span className="tag neutral">Off Day</span>}</td>
                    <td>
                      {r.present ? (
                        <span className="tag success">Present</span>
                      ) : r.planned ? (
                        <span className="tag overloaded">Absent</span>
                      ) : (
                        <span className="tag neutral">Weekend</span>
                      )}
                    </td>
                    <td>{r.tapIn || '—'}</td>
                    <td>{r.tapOut || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{r.hoursInOffice ? `${r.hoursInOffice}h` : '0h'}</td>
                    <td>
                      {isMissingTapOut ? (
                        <span className="badge-missing">
                          <AlertTriangle size={12} /> Missing Tap-Out
                        </span>
                      ) : r.present ? (
                        <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Swipes Reconciled
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No swipes required</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (kpiKey === 'meetingEffectiveness') {
    return (
      <div className="section" style={{ marginTop: '32px' }}>
        <h2 className="section-title">
          <Calendar size={20} style={{ color: '#ec4899' }} /> Weekly Meeting Schedule & Attendance Log
        </h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Day</th>
                <th>Meeting ID</th>
                <th>Meeting Title</th>
                <th>Scheduled Time</th>
                <th>Duration</th>
                <th>Scheduled</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {(details.meetings || []).map((m, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.day}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{m.date}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{m.meetingId}</td>
                  <td style={{ fontWeight: 600 }}>{m.title}</td>
                  <td>{m.startTime} – {m.endTime}</td>
                  <td>{m.duration}h</td>
                  <td>{m.scheduled ? 'Yes' : 'No'}</td>
                  <td>
                    {m.attended ? (
                      <span className="tag success">
                        <CheckCircle size={11} style={{ marginRight: '4px' }} /> Attended
                      </span>
                    ) : (
                      <span className="tag overloaded">
                        <AlertTriangle size={11} style={{ marginRight: '4px' }} /> Missed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (kpiKey === 'employeeEngagement') {
    return (
      <div className="section" style={{ marginTop: '32px' }}>
        <h2 className="section-title">
          <Calendar size={20} style={{ color: '#10b981' }} /> Workplace Initiatives & Activity Participation
        </h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Day</th>
                <th>Activity ID</th>
                <th>Activity Title</th>
                <th>Category</th>
                <th>Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(details.activities || []).map((a, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.day}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{a.date}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{a.activityId}</td>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td>
                    <span className="tag neutral" style={{ textTransform: 'capitalize' }}>
                      {a.category}
                    </span>
                  </td>
                  <td>{a.available ? 'Yes' : 'No'}</td>
                  <td>
                    {a.attended ? (
                      <span className="tag success">
                        <CheckCircle size={11} style={{ marginRight: '4px' }} /> Attended
                      </span>
                    ) : (
                      <span className="tag warning">
                        Not Attended
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (kpiKey === 'learningParticipation') {
    return (
      <div className="section" style={{ marginTop: '32px' }}>
        <h2 className="section-title">
          <BookOpen size={20} style={{ color: '#f59e0b' }} /> Enrolled Course Progress & Daily Hours Log
        </h2>
        <div className="table-container" style={{ marginBottom: '24px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Course ID</th>
                <th>Course Title</th>
                <th>Category</th>
                <th>Total Course Hours</th>
                <th>Hours Completed</th>
                <th>Progress (%)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(details.courses || []).map((c, idx) => {
                const meta = (courseCatalog || []).find(item => item.courseId === c.courseId) || {};
                return (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{c.courseId}</td>
                    <td style={{ fontWeight: 600 }}>{meta.title || c.courseId}</td>
                    <td>
                      <span className="tag neutral">{meta.category || 'General'}</span>
                    </td>
                    <td>{meta.totalHours ? `${meta.totalHours}h` : '—'}</td>
                    <td>{c.hoursCompleted}h</td>
                    <td style={{ width: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${c.progress}%`, height: '100%', background: c.status === 'completed' ? '#10b981' : '#f59e0b', borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{c.progress}%</span>
                      </div>
                    </td>
                    <td>
                      {c.status === 'completed' ? (
                        <span className="tag success">
                          <CheckCircle size={11} style={{ marginRight: '4px' }} /> Completed
                        </span>
                      ) : (
                        <span className="tag warning">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Daily Skill Development Time Log</div>
            <div className="chart-card-subtitle">Tracking hours logged towards weekly 3.0h standard target</div>
          </div>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours Logged</th>
                  <th>Contribution to 3h Weekly Target</th>
                </tr>
              </thead>
              <tbody>
                {(details.dailyHours || []).map((d, idx) => (
                  <tr key={idx}>
                    <td>{formatDate(d.date)}</td>
                    <td style={{ fontWeight: 600 }}>{d.hours}h</td>
                    <td>
                      {d.hours > 0 ? (
                        <span style={{ color: '#10b981', fontWeight: 500 }}>
                          +{Math.round((d.hours / details.weeklyTarget) * 100)}% of weekly goal
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>No hours logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (kpiKey === 'hybridWorkEffectiveness') {
    return (
      <div className="section" style={{ marginTop: '32px' }}>
        <h2 className="section-title">
          <Laptop size={20} style={{ color: '#8b5cf6' }} /> 7-Day Hybrid Work & Productivity Log
        </h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Work Mode</th>
                <th>Productive Hours</th>
                <th>Expected Hours</th>
                <th>Tasks Completed</th>
                <th>Meetings Attended</th>
                <th>Learning Hours</th>
              </tr>
            </thead>
            <tbody>
              {(details.records || []).map((r, idx) => (
                <tr key={idx}>
                  <td>{formatDate(r.date)}</td>
                  <td style={{ fontWeight: 600 }}>{r.day}</td>
                  <td>
                    {r.workMode === 'office' ? (
                      <span className="tag" style={{ background: '#dbeafe', color: '#1e40af' }}>Office</span>
                    ) : r.workMode === 'remote' ? (
                      <span className="tag" style={{ background: '#ede9fe', color: '#6d28d9' }}>Remote</span>
                    ) : (
                      <span className="tag neutral">Off Day</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700 }}>{r.productiveHours}h</td>
                  <td>{r.expectedProductiveHours}h</td>
                  <td>{r.tasksCompleted}</td>
                  <td>{r.meetingsAttended}</td>
                  <td>{r.learningHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
