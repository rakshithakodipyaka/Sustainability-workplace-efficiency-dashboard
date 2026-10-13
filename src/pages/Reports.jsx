import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getEmployeeKPIs, getTeamKPIs, getOrganizationKPIs } from '../services/kpiService';
import {
  getEmployees,
  getManagers,
  getAllOfficeAttendance,
  getAllMeetings,
  getAllLearning,
  getAllHybridWork,
  getCourses,
  getTeamMembers
} from '../services/dataService';
import {
  exportToCSV,
  prepareKPISummaryExport,
  prepareAttendanceExport,
  prepareMeetingExport,
  printReport
} from '../services/exportService';
import ChartCard from '../components/ChartCard';
import ScoreGauge from '../components/ScoreGauge';
import {
  FileText,
  Download,
  Printer,
  BarChart3,
  Search,
  Filter,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Laptop
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('kpi'); // 'kpi' | 'attendance' | 'meetings' | 'learning' | 'hybrid'
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');

  // Determine scoped employees based on role
  const scopedEmployees = useMemo(() => {
    if (!user) return [];

    if (user.role === 'HR') {
      const emps = getEmployees();
      const mgrs = getManagers();
      return [...emps, ...mgrs];
    }

    if (user.role === 'Manager') {
      const reports = getTeamMembers(user.employeeId);
      return [user, ...reports];
    }

    // Employee
    return [user];
  }, [user]);

  // Compute KPI details for scoped employees
  const employeesWithKPIs = useMemo(() => {
    return scopedEmployees.map(emp => ({
      ...emp,
      kpis: getEmployeeKPIs(emp.employeeId)
    }));
  }, [scopedEmployees]);

  // Unique teams/departments for filter dropdown
  const availableTeams = useMemo(() => {
    const teams = new Set();
    scopedEmployees.forEach(e => {
      if (e.team) teams.add(e.team);
      else if (e.department) teams.add(e.department);
    });
    return Array.from(teams);
  }, [scopedEmployees]);

  // Filtered employees list based on search and team
  const filteredEmployeesWithKPIs = useMemo(() => {
    return employeesWithKPIs.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        (emp.team && emp.team.toLowerCase().includes(q));

      const matchesTeam =
        teamFilter === 'ALL' ||
        emp.team === teamFilter ||
        emp.department === teamFilter;

      return matchesSearch && matchesTeam;
    });
  }, [employeesWithKPIs, searchQuery, teamFilter]);

  const filteredEmployeeIds = useMemo(() => {
    return new Set(filteredEmployeesWithKPIs.map(e => e.employeeId));
  }, [filteredEmployeesWithKPIs]);

  // Lookup map for fast name & team resolution
  const empLookup = useMemo(() => {
    const map = {};
    scopedEmployees.forEach(e => {
      map[e.employeeId] = e;
    });
    return map;
  }, [scopedEmployees]);

  // Overall cohort summary metrics
  const cohortSummary = useMemo(() => {
    if (filteredEmployeesWithKPIs.length === 0) {
      return { avgScore: 0, count: 0, highPerformers: 0, needsSupport: 0 };
    }
    const scores = filteredEmployeesWithKPIs.map(e => e.kpis.overallScore);
    const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const highPerformers = filteredEmployeesWithKPIs.filter(e => e.kpis.overallScore >= 7.5).length;
    const needsSupport = filteredEmployeesWithKPIs.filter(e => e.kpis.overallScore < 6.0).length;
    return {
      avgScore,
      count: filteredEmployeesWithKPIs.length,
      highPerformers,
      needsSupport
    };
  }, [filteredEmployeesWithKPIs]);

  // 1. KPI Summary Data & Chart Data
  const kpiChartData = useMemo(() => {
    if (filteredEmployeesWithKPIs.length === 0) return [];

    if (filteredEmployeesWithKPIs.length === 1) {
      const kpis = filteredEmployeesWithKPIs[0].kpis.kpiScores;
      return [
        { category: 'Office Util', score: kpis.officeUtilization },
        { category: 'Meeting Eff', score: kpis.meetingEffectiveness },
        { category: 'Engagement', score: kpis.employeeEngagement },
        { category: 'Learning', score: kpis.learningParticipation },
        { category: 'Hybrid Work', score: kpis.hybridWorkEffectiveness }
      ];
    }

    // Multiple employees: show comparison of Overall and key dimensions
    return filteredEmployeesWithKPIs.map(e => ({
      name: e.name.split(' ')[0],
      overall: e.kpis.overallScore,
      office: e.kpis.kpiScores.officeUtilization,
      meetings: e.kpis.kpiScores.meetingEffectiveness
    }));
  }, [filteredEmployeesWithKPIs]);

  // 2. Attendance Data
  const attendanceRecords = useMemo(() => {
    const allAttendance = getAllOfficeAttendance();
    const rows = [];
    allAttendance.forEach(item => {
      if (filteredEmployeeIds.has(item.employeeId)) {
        const emp = empLookup[item.employeeId] || {};
        (item.records || []).forEach(rec => {
          rows.push({
            employeeId: item.employeeId,
            name: emp.name || item.employeeId,
            team: emp.team || emp.department || 'General',
            date: rec.date,
            day: rec.day,
            planned: rec.planned,
            present: rec.present,
            tapIn: rec.tapIn || '--',
            tapOut: rec.tapOut || (rec.present ? 'Missing' : '--'),
            hoursInOffice: rec.hoursInOffice || 0
          });
        });
      }
    });
    return rows;
  }, [filteredEmployeeIds, empLookup]);

  const attendanceChartData = useMemo(() => {
    const daysMap = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
    const plannedMap = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };

    attendanceRecords.forEach(r => {
      if (daysMap[r.day] !== undefined) {
        if (r.present) daysMap[r.day]++;
        if (r.planned) plannedMap[r.day]++;
      }
    });

    return Object.keys(daysMap).map(day => ({
      day,
      Present: daysMap[day],
      Planned: plannedMap[day]
    }));
  }, [attendanceRecords]);

  // 3. Meeting Data
  const meetingRecords = useMemo(() => {
    const allMeetings = getAllMeetings();
    const rows = [];
    allMeetings.forEach(item => {
      if (filteredEmployeeIds.has(item.employeeId)) {
        const emp = empLookup[item.employeeId] || {};
        (item.meetings || []).forEach(mtg => {
          rows.push({
            employeeId: item.employeeId,
            name: emp.name || item.employeeId,
            team: emp.team || emp.department || 'General',
            date: mtg.date,
            day: mtg.day,
            title: mtg.title,
            time: `${mtg.startTime} - ${mtg.endTime}`,
            duration: mtg.duration,
            scheduled: mtg.scheduled,
            attended: mtg.attended
          });
        });
      }
    });
    return rows;
  }, [filteredEmployeeIds, empLookup]);

  const meetingChartData = useMemo(() => {
    // Aggregate attended vs scheduled hours by employee
    const agg = {};
    meetingRecords.forEach(m => {
      if (!agg[m.name]) {
        agg[m.name] = { name: m.name.split(' ')[0], scheduledHours: 0, attendedHours: 0 };
      }
      if (m.scheduled) agg[m.name].scheduledHours += m.duration;
      if (m.attended) agg[m.name].attendedHours += m.duration;
    });

    return Object.values(agg).map(item => ({
      name: item.name,
      Scheduled: Math.round(item.scheduledHours * 10) / 10,
      Attended: Math.round(item.attendedHours * 10) / 10
    }));
  }, [meetingRecords]);

  // 4. Learning Data
  const learningRecords = useMemo(() => {
    const allLearning = getAllLearning();
    const courses = getCourses() || [];
    const courseMap = {};
    courses.forEach(c => {
      courseMap[c.courseId] = c;
    });

    const rows = [];
    (allLearning.enrollments || []).forEach(enr => {
      if (filteredEmployeeIds.has(enr.employeeId)) {
        const emp = empLookup[enr.employeeId] || {};
        const weeklyTotal = (enr.weeklyLearningHours || []).reduce((s, h) => s + (h.hours || 0), 0);

        (enr.enrolled || []).forEach(courseEnrollment => {
          const courseInfo = courseMap[courseEnrollment.courseId] || {};
          rows.push({
            employeeId: enr.employeeId,
            name: emp.name || enr.employeeId,
            team: emp.team || emp.department || 'General',
            courseId: courseEnrollment.courseId,
            courseTitle: courseInfo.title || courseEnrollment.courseId,
            category: courseInfo.category || 'Professional',
            progress: courseEnrollment.progress,
            hoursCompleted: courseEnrollment.hoursCompleted,
            weeklyHoursLogged: Math.round(weeklyTotal * 10) / 10,
            status: courseEnrollment.status || (courseEnrollment.progress >= 100 ? 'completed' : 'in-progress')
          });
        });
      }
    });
    return rows;
  }, [filteredEmployeeIds, empLookup]);

  const learningChartData = useMemo(() => {
    const courseCounts = {};
    learningRecords.forEach(r => {
      const shortTitle = r.courseTitle.length > 18 ? r.courseTitle.slice(0, 16) + '…' : r.courseTitle;
      if (!courseCounts[shortTitle]) {
        courseCounts[shortTitle] = { name: shortTitle, Completed: 0, 'In Progress': 0 };
      }
      if (r.status === 'completed' || r.progress === 100) {
        courseCounts[shortTitle].Completed++;
      } else {
        courseCounts[shortTitle]['In Progress']++;
      }
    });
    return Object.values(courseCounts);
  }, [learningRecords]);

  // 5. Hybrid Work Data
  const hybridRecords = useMemo(() => {
    const allHybrid = getAllHybridWork();
    const rows = [];
    allHybrid.forEach(item => {
      if (filteredEmployeeIds.has(item.employeeId)) {
        const emp = empLookup[item.employeeId] || {};
        (item.records || []).forEach(rec => {
          rows.push({
            employeeId: item.employeeId,
            name: emp.name || item.employeeId,
            team: emp.team || emp.department || 'General',
            date: rec.date,
            day: rec.day,
            workMode: rec.workMode,
            productiveHours: rec.productiveHours,
            expectedProductiveHours: rec.expectedProductiveHours,
            tasksCompleted: rec.tasksCompleted,
            meetingsAttended: rec.meetingsAttended
          });
        });
      }
    });
    return rows;
  }, [filteredEmployeeIds, empLookup]);

  const hybridChartData = useMemo(() => {
    const workModeCounts = { Office: 0, Remote: 0, Off: 0 };
    hybridRecords.forEach(r => {
      if (r.workMode === 'office') workModeCounts.Office++;
      else if (r.workMode === 'remote') workModeCounts.Remote++;
      else if (r.workMode === 'off') workModeCounts.Off++;
    });

    return [
      { mode: 'In-Office Days', count: workModeCounts.Office },
      { mode: 'Remote Days', count: workModeCounts.Remote },
      { mode: 'Weekend/Off Days', count: workModeCounts.Off }
    ];
  }, [hybridRecords]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (activeTab) {
      case 'kpi': {
        const prepared = prepareKPISummaryExport(filteredEmployeesWithKPIs);
        exportToCSV(prepared, `kpi_summary_report_${timestamp}`);
        break;
      }
      case 'attendance': {
        // prepareAttendanceExport expects [{ employeeId, records: [...] }]
        const allAttendance = getAllOfficeAttendance().filter(a => filteredEmployeeIds.has(a.employeeId));
        const prepared = prepareAttendanceExport(allAttendance);
        exportToCSV(prepared, `attendance_report_${timestamp}`);
        break;
      }
      case 'meetings': {
        const allMeetings = getAllMeetings().filter(m => filteredEmployeeIds.has(m.employeeId));
        const prepared = prepareMeetingExport(allMeetings);
        exportToCSV(prepared, `meetings_report_${timestamp}`);
        break;
      }
      case 'learning': {
        const prepared = learningRecords.map(r => ({
          'Employee ID': r.employeeId,
          'Name': r.name,
          'Team': r.team,
          'Course Title': r.courseTitle,
          'Category': r.category,
          'Progress (%)': `${r.progress}%`,
          'Hours Completed': r.hoursCompleted,
          'Weekly Hours Logged': r.weeklyHoursLogged,
          'Status': r.status
        }));
        exportToCSV(prepared, `learning_report_${timestamp}`);
        break;
      }
      case 'hybrid': {
        const prepared = hybridRecords.map(r => ({
          'Employee ID': r.employeeId,
          'Name': r.name,
          'Team': r.team,
          'Date': r.date,
          'Day': r.day,
          'Work Mode': r.workMode,
          'Productive Hours': r.productiveHours,
          'Expected Hours': r.expectedProductiveHours,
          'Tasks Completed': r.tasksCompleted,
          'Meetings Attended': r.meetingsAttended
        }));
        exportToCSV(prepared, `hybrid_work_report_${timestamp}`);
        break;
      }
      default:
        break;
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 9.0) return 'excellent';
    if (score >= 7.5) return 'good';
    if (score >= 6.0) return 'needs-improvement';
    return 'requires-attention';
  };

  return (
    <div className="reports-page">
      {/* Printable Report Header */}
      <div className="print-header" style={{ display: 'none' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Experian Services - Weekly Performance Report</h1>
        <p style={{ fontSize: 13, color: '#666', margin: '4px 0 16px' }}>
          Report Type: {activeTab.toUpperCase()} | Generated for: {user?.name} ({user?.role}) | Week: Oct 5 - Oct 11, 2026
        </p>
      </div>

      {/* Top Header */}
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={26} color="var(--primary-light)" />
            <h1 className="page-title">Operational Reports</h1>
            <span className={`role-badge ${user?.role ? user.role.toLowerCase() : ''}`}>
              {user?.role} Scope
            </span>
          </div>
          <p className="page-subtitle">
            {user?.role === 'HR' && 'Comprehensive organizational reports across all teams with raw data exports'}
            {user?.role === 'Manager' && 'Team-level activity, attendance, meetings, and learning metrics'}
            {user?.role === 'Employee' && 'Personal weekly activity log and individual performance data'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="btn-group">
          <button
            type="button"
            className="export-btn"
            onClick={handleExportCSV}
            title="Download CSV for current tab"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            type="button"
            className="export-btn secondary"
            onClick={printReport}
            title="Print printable summary view"
          >
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </div>

      {/* Cohort Stats Row */}
      <div className="stats-row no-print" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Active Records</div>
          <div className="stat-value">{filteredEmployeesWithKPIs.length}</div>
          <div className="stat-change neutral">
            <Users size={14} /> {user?.role === 'Employee' ? 'Individual report' : 'Employees tracked'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Cohort Average Score</div>
          <div className="stat-value">{cohortSummary.avgScore} <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>/ 10</span></div>
          <div className="stat-change positive">
            <BarChart3 size={14} /> Overall weighted rating
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Strong Performers (≥ 7.5)</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{cohortSummary.highPerformers}</div>
          <div className="stat-change positive">
            <CheckCircle size={14} /> Meeting or exceeding targets
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Requires Attention (&lt; 6.0)</div>
          <div className="stat-value" style={{ color: cohortSummary.needsSupport > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {cohortSummary.needsSupport}
          </div>
          <div className="stat-change negative">
            <AlertTriangle size={14} /> Support intervention needed
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs no-print">
        <button
          type="button"
          className={`tab ${activeTab === 'kpi' ? 'active' : ''}`}
          onClick={() => setActiveTab('kpi')}
        >
          KPI Summary
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance ({attendanceRecords.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'meetings' ? 'active' : ''}`}
          onClick={() => setActiveTab('meetings')}
        >
          Meetings ({meetingRecords.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'learning' ? 'active' : ''}`}
          onClick={() => setActiveTab('learning')}
        >
          Learning ({learningRecords.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'hybrid' ? 'active' : ''}`}
          onClick={() => setActiveTab('hybrid')}
        >
          Hybrid Work ({hybridRecords.length})
        </button>
      </div>

      {/* Search & Team Filter Toolbar */}
      {user?.role !== 'Employee' && (
        <div className="filter-bar no-print" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search by name, ID, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: 'var(--text-primary)',
                background: 'transparent'
              }}
            />
          </div>

          {availableTeams.length > 1 && (
            <div className="filter-group">
              <label className="filter-label" htmlFor="team-filter">Team / Dept</label>
              <select
                id="team-filter"
                className="filter-select"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="ALL">All Units</option>
                {availableTeams.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {(searchQuery || teamFilter !== 'ALL') && (
            <button
              type="button"
              className="filter-reset"
              onClick={() => {
                setSearchQuery('');
                setTeamFilter('ALL');
              }}
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* TAB CONTENT: 1. KPI SUMMARY */}
      {activeTab === 'kpi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Chart Section */}
          <ChartCard
            title={filteredEmployeesWithKPIs.length === 1 ? 'Personal KPI Breakdown' : 'Employee Performance Overview'}
            subtitle="Calculated performance scores across the 5 core workplace efficiency dimensions"
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                {filteredEmployeesWithKPIs.length === 1 ? (
                  <BarChart data={kpiChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="category" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                      formatter={(val) => [`${val} / 10`, 'Score']}
                    />
                    <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Score" />
                  </BarChart>
                ) : (
                  <BarChart data={kpiChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="overall" fill="#3b82f6" name="Overall" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="office" fill="#10b981" name="Office Util" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="meetings" fill="#f59e0b" name="Meeting Eff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Table Section */}
          <div className="table-container">
            <div className="table-header">
              <span className="table-title">KPI Summary Data Table</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Showing {filteredEmployeesWithKPIs.length} employee{filteredEmployeesWithKPIs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Team</th>
                    <th style={{ textAlign: 'center' }}>Office Util</th>
                    <th style={{ textAlign: 'center' }}>Meeting Eff</th>
                    <th style={{ textAlign: 'center' }}>Engagement</th>
                    <th style={{ textAlign: 'center' }}>Learning</th>
                    <th style={{ textAlign: 'center' }}>Hybrid Work</th>
                    <th style={{ textAlign: 'center' }}>Overall Score</th>
                    <th>Status Band</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployeesWithKPIs.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '32px' }}>
                        No employee KPI records match the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployeesWithKPIs.map(emp => (
                      <tr key={emp.employeeId}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{emp.employeeId}</td>
                        <td style={{ fontWeight: 500 }}>{emp.name}</td>
                        <td>{emp.team || emp.department || 'N/A'}</td>
                        <td style={{ textAlign: 'center' }}>{emp.kpis.kpiScores.officeUtilization}</td>
                        <td style={{ textAlign: 'center' }}>{emp.kpis.kpiScores.meetingEffectiveness}</td>
                        <td style={{ textAlign: 'center' }}>{emp.kpis.kpiScores.employeeEngagement}</td>
                        <td style={{ textAlign: 'center' }}>{emp.kpis.kpiScores.learningParticipation}</td>
                        <td style={{ textAlign: 'center' }}>{emp.kpis.kpiScores.hybridWorkEffectiveness}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 15 }}>
                          {emp.kpis.overallScore}
                        </td>
                        <td>
                          <span className={`score-badge ${getScoreBadgeClass(emp.kpis.overallScore)}`}>
                            {emp.kpis.overallScore >= 9.0 ? 'Excellent' :
                             emp.kpis.overallScore >= 7.5 ? 'Good' :
                             emp.kpis.overallScore >= 6.0 ? 'Needs Improvement' : 'Requires Attention'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ChartCard
            title="Daily Attendance & In-Office Presence"
            subtitle="Comparison of planned office attendance against actual badge tap-in presence"
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Planned" fill="#cbd5e1" name="Planned Attendance" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Present" fill="#10b981" name="Actual Present" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Badge Tap & Attendance Log</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Total Records: {attendanceRecords.length}
              </span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 480 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th style={{ textAlign: 'center' }}>Planned</th>
                    <th style={{ textAlign: 'center' }}>Present</th>
                    <th>Tap In</th>
                    <th>Tap Out</th>
                    <th style={{ textAlign: 'right' }}>Hours In Office</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>
                        No attendance records available.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((r, idx) => (
                      <tr key={`${r.employeeId}-${r.date}-${idx}`}>
                        <td style={{ fontFamily: 'monospace' }}>{r.employeeId}</td>
                        <td style={{ fontWeight: 500 }}>{r.name}</td>
                        <td>{r.date}</td>
                        <td>{r.day}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`tag ${r.planned ? 'success' : ''}`}>
                            {r.planned ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`tag ${r.present ? 'success' : 'warning'}`}>
                            {r.present ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td>{r.tapIn}</td>
                        <td>{r.tapOut}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {r.hoursInOffice > 0 ? `${r.hoursInOffice}h` : '--'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. MEETINGS */}
      {activeTab === 'meetings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ChartCard
            title="Meeting Scheduled vs Attended Hours"
            subtitle="Evaluation of meeting load vs adherence across cohort members"
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meetingChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Scheduled" fill="#93c5fd" name="Scheduled (hrs)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Attended" fill="#3b82f6" name="Attended (hrs)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Scheduled Meetings Log</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Total Meetings: {meetingRecords.length}
              </span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 480 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Meeting Title</th>
                    <th>Time Slot</th>
                    <th style={{ textAlign: 'right' }}>Duration</th>
                    <th style={{ textAlign: 'center' }}>Scheduled</th>
                    <th style={{ textAlign: 'center' }}>Attended</th>
                  </tr>
                </thead>
                <tbody>
                  {meetingRecords.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                        No meeting records found.
                      </td>
                    </tr>
                  ) : (
                    meetingRecords.map((m, idx) => (
                      <tr key={`${m.employeeId}-${m.date}-${idx}`}>
                        <td style={{ fontFamily: 'monospace' }}>{m.employeeId}</td>
                        <td style={{ fontWeight: 500 }}>{m.name}</td>
                        <td>{m.date}</td>
                        <td style={{ fontWeight: 500 }}>{m.title}</td>
                        <td>{m.time}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{m.duration}h</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`tag ${m.scheduled ? 'success' : ''}`}>
                            {m.scheduled ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`tag ${m.attended ? 'success' : 'overloaded'}`}>
                            {m.attended ? 'Attended' : 'Missed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. LEARNING */}
      {activeTab === 'learning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ChartCard
            title="Course Completion & Enrollment Breakdown"
            subtitle="Status of active skill-building enrollments across the organization"
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={learningChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Completed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="In Progress" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Learning & Skill Development Progress</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Total Enrollments: {learningRecords.length}
              </span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 480 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Course Title</th>
                    <th>Category</th>
                    <th style={{ width: 140 }}>Progress</th>
                    <th style={{ textAlign: 'right' }}>Hours Done</th>
                    <th style={{ textAlign: 'right' }}>Weekly Logged</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {learningRecords.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                        No learning records available.
                      </td>
                    </tr>
                  ) : (
                    learningRecords.map((l, idx) => (
                      <tr key={`${l.employeeId}-${l.courseId}-${idx}`}>
                        <td style={{ fontFamily: 'monospace' }}>{l.employeeId}</td>
                        <td style={{ fontWeight: 500 }}>{l.name}</td>
                        <td style={{ fontWeight: 500 }}>{l.courseTitle}</td>
                        <td>{l.category}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${l.progress}%`,
                                  height: '100%',
                                  background: l.progress >= 100 ? 'var(--success)' : 'var(--primary-light)',
                                  borderRadius: 3
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, width: 34, textAlign: 'right' }}>
                              {l.progress}%
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{l.hoursCompleted}h</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: l.weeklyHoursLogged >= 3 ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600 }}>
                            {l.weeklyHoursLogged}h
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}> / 3h</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`tag ${l.status === 'completed' || l.progress === 100 ? 'success' : 'warning'}`}>
                            {l.status === 'completed' || l.progress === 100 ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. HYBRID WORK */}
      {activeTab === 'hybrid' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ChartCard
            title="Work Mode Distribution (Cohort Aggregate)"
            subtitle="Allocation of days worked from office versus remote locations"
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hybridChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="mode" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#6366f1" name="Total Days" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Daily Hybrid Work & Output Record</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Total Records: {hybridRecords.length}
              </span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 480 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Work Mode</th>
                    <th style={{ textAlign: 'right' }}>Productive Hours</th>
                    <th style={{ textAlign: 'right' }}>Expected</th>
                    <th style={{ textAlign: 'center' }}>Tasks Done</th>
                    <th style={{ textAlign: 'center' }}>Meetings</th>
                  </tr>
                </thead>
                <tbody>
                  {hybridRecords.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>
                        No hybrid records available.
                      </td>
                    </tr>
                  ) : (
                    hybridRecords.map((h, idx) => (
                      <tr key={`${h.employeeId}-${h.date}-${idx}`}>
                        <td style={{ fontFamily: 'monospace' }}>{h.employeeId}</td>
                        <td style={{ fontWeight: 500 }}>{h.name}</td>
                        <td>{h.date}</td>
                        <td>{h.day}</td>
                        <td>
                          <span
                            className="tag"
                            style={{
                              background: h.workMode === 'office' ? '#dbeafe' : h.workMode === 'remote' ? '#ede9fe' : '#f1f5f9',
                              color: h.workMode === 'office' ? '#1e40af' : h.workMode === 'remote' ? '#6d28d9' : '#64748b',
                              textTransform: 'capitalize'
                            }}
                          >
                            {h.workMode}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{h.productiveHours}h</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>{h.expectedProductiveHours}h</td>
                        <td style={{ textAlign: 'center', fontWeight: 500 }}>{h.tasksCompleted}</td>
                        <td style={{ textAlign: 'center' }}>{h.meetingsAttended}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
