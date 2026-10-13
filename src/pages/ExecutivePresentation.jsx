import { useState, useMemo, useEffect } from 'react';
import { getOrganizationKPIs } from '../services/kpiService';
import { generateOrgRecommendations } from '../services/recommendationService';
import ScoreGauge from '../components/ScoreGauge';
import { getScoreColor } from '../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Printer,
  Leaf,
  ArrowRight,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Building2,
  Users,
  Target,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ExecutivePresentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [overviewMode, setOverviewMode] = useState(false);

  // Compute organization KPI calculations
  const orgKPIs = useMemo(() => getOrganizationKPIs(), []);
  const orgRecs = useMemo(() => generateOrgRecommendations(orgKPIs), [orgKPIs]);

  // Derived datasets for slides
  const {
    organization,
    orgAverage,
    orgKPIAverages,
    dailyOccupancy,
    sustainability,
    employees,
    managers
  } = orgKPIs;

  // Radar chart data for KPI Framework
  const radarData = useMemo(() => [
    { subject: 'Office Util', score: orgKPIAverages.officeUtilization, fullMark: 10 },
    { subject: 'Meeting Eff', score: orgKPIAverages.meetingEffectiveness, fullMark: 10 },
    { subject: 'Engagement', score: orgKPIAverages.employeeEngagement, fullMark: 10 },
    { subject: 'Learning', score: orgKPIAverages.learningParticipation, fullMark: 10 },
    { subject: 'Hybrid Work', score: orgKPIAverages.hybridWorkEffectiveness, fullMark: 10 }
  ], [orgKPIAverages]);

  // Meeting effectiveness data & overloaded employees
  const meetingData = useMemo(() => {
    return employees.map(emp => {
      const details = emp.kpis.details.meetingEffectiveness;
      return {
        name: emp.name.split(' ')[0],
        fullName: emp.name,
        scheduledHours: details.totalScheduled ? details.totalScheduled * (details.avgMeetingDuration || 1) : 0,
        attendedHours: details.totalMeetingHours || 0,
        isOverloaded: details.isOverloaded || details.totalMeetingHours > 10,
        score: details.score
      };
    });
  }, [employees]);

  const overloadedEmployees = useMemo(() => {
    return meetingData.filter(m => m.isOverloaded);
  }, [meetingData]);

  // Employee engagement activity distribution
  const engagementData = useMemo(() => {
    const list = employees.map(emp => {
      const details = emp.kpis.details.employeeEngagement;
      return {
        name: emp.name.split(' ')[0],
        attended: details.totalAttended || 0,
        available: details.totalAvailable || 0,
        rate: details.participationPercentage || 0,
        score: details.score
      };
    });
    return list;
  }, [employees]);

  // Learning data
  const learningData = useMemo(() => {
    return employees.map(emp => {
      const details = emp.kpis.details.learningParticipation;
      return {
        name: emp.name.split(' ')[0],
        hoursCompleted: details.weeklyHoursCompleted || 0,
        target: details.weeklyTarget || 3,
        score: details.score
      };
    });
  }, [employees]);

  // Hybrid work: Office vs Remote productive hours comparison
  const hybridProductivityData = useMemo(() => {
    let officeTotalHours = 0;
    let officeDayCount = 0;
    let remoteTotalHours = 0;
    let remoteDayCount = 0;

    employees.forEach(emp => {
      const records = emp.kpis.details.hybridWorkEffectiveness?.records || [];
      records.forEach(r => {
        if (r.workMode === 'office') {
          officeTotalHours += r.productiveHours || 0;
          officeDayCount++;
        } else if (r.workMode === 'remote') {
          remoteTotalHours += r.productiveHours || 0;
          remoteDayCount++;
        }
      });
    });

    const avgOffice = officeDayCount > 0 ? Math.round((officeTotalHours / officeDayCount) * 10) / 10 : 6.4;
    const avgRemote = remoteDayCount > 0 ? Math.round((remoteTotalHours / remoteDayCount) * 10) / 10 : 6.0;

    return [
      { mode: 'In-Office Days', avgHours: avgOffice, totalDays: officeDayCount },
      { mode: 'Remote Days', avgHours: avgRemote, totalDays: remoteDayCount }
    ];
  }, [employees]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentSlide(prev => Math.min(prev + 1, 11));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slideTitles = [
    { num: 1, title: 'Title & Executive Review', subtitle: 'Overview & Simulated Demo Notice' },
    { num: 2, title: 'The Business Problem', subtitle: 'Modern Hybrid Workplace Challenges' },
    { num: 3, title: 'Organization Overview', subtitle: 'Structure & Overall Performance' },
    { num: 4, title: 'KPI Framework & Weights', subtitle: '5 Balanced Strategic Dimensions' },
    { num: 5, title: 'Office Utilization', subtitle: 'Desk Capacity & In-Office Patterns' },
    { num: 6, title: 'Meeting Effectiveness', subtitle: 'Schedule Adherence & Overload Flags' },
    { num: 7, title: 'Employee Engagement', subtitle: 'Cross-functional Participation Trends' },
    { num: 8, title: 'Learning Participation', subtitle: 'Upskilling Targets & Course Completion' },
    { num: 9, title: 'Hybrid Work Effectiveness', subtitle: 'Remote vs In-Office Consistency' },
    { num: 10, title: 'Sustainability Insights', subtitle: 'Avoided CO₂ Emissions & ESG Footprint' },
    { num: 11, title: 'Improvement Roadmap', subtitle: 'Strategic Interventions & Targets' },
    { num: 12, title: 'Next Steps & Action Items', subtitle: 'Leadership Priorities & Closing Note' }
  ];

  const handlePrev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));
  const handleNext = () => setCurrentSlide(prev => Math.min(prev + 1, 11));

  // Render individual slide contents
  const renderSlideContent = () => {
    switch (currentSlide) {
      // SLIDE 1: Title
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '20px 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ecfdf5', color: '#065f46', padding: '6px 14px', borderRadius: 'var(--radius-full)', width: 'fit-content', marginBottom: 24, fontWeight: 600, fontSize: 13, border: '1px solid #a7f3d0' }}>
              <Leaf size={16} /> Executive Briefing • Q4 2026
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 12 }}>
              Sustainability &amp; Workplace Efficiency Dashboard
            </h1>
            <p style={{ fontSize: 20, color: 'var(--primary-light)', fontWeight: 600, marginBottom: 24 }}>
              Weekly Performance Review — Oct 5–11, 2026
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32, maxWidth: 750 }}>
              <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Enterprise</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{organization.name}</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Workforce Size</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{organization.totalEmployees} Staff ({organization.totalManagers} Managers)</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Org Rating</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: getScoreColor(orgAverage), marginTop: 2 }}>{orgAverage} / 10 Overall</div>
              </div>
            </div>

            <div style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#92400e',
              fontSize: 13
            }}>
              <Info size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Notice:</strong> This executive presentation utilizes simulated enterprise telemetry data designed for stakeholder demonstration, benchmarking, and policy testing.
              </div>
            </div>
          </div>
        );

      // SLIDE 2: Business Problem
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 className="slide-title">The Business Problem</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Organizations navigating hybrid work environments face four interrelated operational inefficiencies:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 8 }}>
              <div style={{ background: 'var(--bg-primary)', padding: 20, borderRadius: 'var(--radius-md)', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} /> 1. Meeting Overload
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Uncontrolled recurring syncs erode deep focus hours. When weekly meetings exceed 10 hours, engineering output declines and employee burnout risks double.
                </p>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: 20, borderRadius: 'var(--radius-md)', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} /> 2. Workspace Inefficiency
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Midweek attendance spikes leave desks congested on Tuesday/Wednesday, while Mondays and Fridays experience 40–50% vacancy, inflating commercial real estate waste.
                </p>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: 20, borderRadius: 'var(--radius-md)', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e40af', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} /> 3. Hybrid Work Tracking Gaps
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Lack of objective, multi-dimensional telemetry leaves managers guessing whether employees perform consistently across home and office work modes.
                </p>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: 20, borderRadius: 'var(--radius-md)', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#065f46', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Leaf size={18} /> 4. ESG &amp; Sustainability Mandates
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Modern enterprises must substantiate Scope 3 employee commuting emissions cuts while maintaining team connectivity and workplace culture.
                </p>
              </div>
            </div>
          </div>
        );

      // SLIDE 3: Organization Overview
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 className="slide-title">Organization Overview</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Current structure, workforce composition, and composite performance benchmark.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-primary)', padding: 24, borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border)' }}>
                <ScoreGauge score={orgAverage} size={130} label="Org Benchmark" />
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Evaluated across 10 active employees &amp; 2 management teams
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div className="stat-card">
                  <div className="stat-label">Company</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{organization.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Headquarters Facility</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Office Desk Capacity</div>
                  <div className="stat-value">{organization.officeCapacity} Desks</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>5-Day Work Week Schedule</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Alpha Team (Engineering)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Manager: MGR001</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>5 Direct Reports (EMP001–EMP005)</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Beta Team (Product)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Manager: MGR002</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>5 Direct Reports (EMP006–EMP010)</div>
                </div>
              </div>
            </div>
          </div>
        );

      // SLIDE 4: KPI Framework
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 className="slide-title">Balanced KPI Framework</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                A 5-pillar balanced scorecard weighted equally at <strong>20% each</strong> to eliminate single-metric distortions.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: '1. Office Utilization (20%)', desc: 'Planned vs actual attendance and badge tap discipline', score: orgKPIAverages.officeUtilization },
                  { name: '2. Meeting Effectiveness (20%)', desc: 'Scheduled attendance ratio and overload avoidance (<10h)', score: orgKPIAverages.meetingEffectiveness },
                  { name: '3. Employee Engagement (20%)', desc: 'Active participation in team knowledge sharing & wellness', score: orgKPIAverages.employeeEngagement },
                  { name: '4. Learning Participation (20%)', desc: 'Weekly target completion (≥3h/week) and curriculum progress', score: orgKPIAverages.learningParticipation },
                  { name: '5. Hybrid Work Effectiveness (20%)', desc: 'Task completion parity across office and remote workdays', score: orgKPIAverages.hybridWorkEffectiveness }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.desc}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(item.score), marginLeft: 12 }}>
                      {item.score}/10
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ height: 260, background: 'var(--bg-card)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="var(--text-tertiary)" />
                    <Radar name="Org Average" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.45} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      // SLIDE 5: Office Utilization
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="slide-title">Office Utilization Analysis</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Evaluating daily badge occupancy against building capacity (20 desks).
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Org Average</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(orgKPIAverages.officeUtilization) }}>
                  {orgKPIAverages.officeUtilization} <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/ 10</span>
                </div>
              </div>
            </div>

            <div style={{ height: 240, width: '100%', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyOccupancy} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis domain={[0, 20]} stroke="var(--text-tertiary)" fontSize={12} label={{ value: 'Occupants', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="occupancy" fill="#10b981" name="Actual Present" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="capacity" fill="#e2e8f0" name="Total Capacity (20)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-label">Average Utilization</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{sustainability.avgUtilizationPercent}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Weekly average desk usage</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-label">Peak Occupancy Day</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>Wednesday (9 / 20)</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Highest collaboration intensity</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-label">Lowest Attendance Day</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>Friday (5 / 20)</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Opportunity for remote energy savings</div>
              </div>
            </div>
          </div>
        );

      // SLIDE 6: Meeting Effectiveness
      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="slide-title">Meeting Effectiveness &amp; Overload Risk</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Attended meeting hours vs scheduled load; monitoring burnout thresholds.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Org Average</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(orgKPIAverages.meetingEffectiveness) }}>
                  {orgKPIAverages.meetingEffectiveness} <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/ 10</span>
                </div>
              </div>
            </div>

            <div style={{ height: 230, width: '100%', background: 'var(--bg-card)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meetingData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={11} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="attendedHours" fill="#3b82f6" name="Attended Hours" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: overloadedEmployees.length > 0 ? '#fee2e2' : '#ecfdf5', padding: '12px 16px', borderRadius: 'var(--radius)', border: `1px solid ${overloadedEmployees.length > 0 ? '#fecaca' : '#a7f3d0'}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: overloadedEmployees.length > 0 ? '#991b1b' : '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={16} />
                {overloadedEmployees.length > 0
                  ? `Overload Alert: ${overloadedEmployees.length} employee(s) logged excessive meeting time (>10h limit)`
                  : 'All employees remained within the 10-hour weekly meeting guideline'}
              </div>
              <div style={{ fontSize: 12, color: overloadedEmployees.length > 0 ? '#7f1d1d' : '#047857', marginTop: 4 }}>
                {overloadedEmployees.length > 0
                  ? `Affected team members: ${overloadedEmployees.map(e => `${e.fullName} (${e.attendedHours}h)`).join(', ')}. Action: Conduct meeting audit.`
                  : 'Meeting discipline is healthy across both Alpha and Beta teams.'}
              </div>
            </div>
          </div>
        );

      // SLIDE 7: Employee Engagement
      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="slide-title">Employee Engagement &amp; Culture</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Tracking participation across wellness, tech talks, and team-building sessions.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Org Average</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(orgKPIAverages.employeeEngagement) }}>
                  {orgKPIAverages.employeeEngagement} <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/ 10</span>
                </div>
              </div>
            </div>

            <div style={{ height: 240, width: '100%', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={11} label={{ value: 'Events', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="available" fill="#e2e8f0" name="Events Offered" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attended" fill="#8b5cf6" name="Events Attended" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="insight-box">
              <div className="insight-text">
                📌 <strong>Key Engagement Pattern:</strong> Employees with higher participation in voluntary knowledge shares showed a 14% higher overall hybrid satisfaction score. Cross-team attendance between Engineering and Product remains the highest growth area.
              </div>
            </div>
          </div>
        );

      // SLIDE 8: Learning Participation
      case 7:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="slide-title">Learning &amp; Continuous Upskilling</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Progress against the corporate mandate of 3 weekly learning hours.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Org Average</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(orgKPIAverages.learningParticipation) }}>
                  {orgKPIAverages.learningParticipation} <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/ 10</span>
                </div>
              </div>
            </div>

            <div style={{ height: 230, width: '100%', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={learningData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={11} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="hoursCompleted" fill="#f59e0b" name="Weekly Hours Logged" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-label">Target Standard</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>3.0h / week</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Professional development target</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-label">Top Enrolled Course</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>Cloud Computing</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>High curriculum progress</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-label">Emerging Topic</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>Sustainable Workplace</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>New ESG learning initiative</div>
              </div>
            </div>
          </div>
        );

      // SLIDE 9: Hybrid Work Effectiveness
      case 8:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="slide-title">Hybrid Work Parity &amp; Output</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Comparing daily productive output between in-office and remote settings.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Org Average</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(orgKPIAverages.hybridWorkEffectiveness) }}>
                  {orgKPIAverages.hybridWorkEffectiveness} <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/ 10</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              <div style={{ height: 240, background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hybridProductivityData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="mode" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis domain={[0, 8]} stroke="var(--text-tertiary)" fontSize={12} label={{ value: 'Avg Hours', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="avgHours" fill="#6366f1" name="Avg Productive Hours / Day" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                <div style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Office Output Profile</div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    6.4 productive hours/day. Peak collaborative problem solving and spontaneous cross-team alignment.
                  </p>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Remote Output Profile</div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    6.0 productive hours/day. Superior deep focus sprint tasks with reduced interruption overhead.
                  </p>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  ✓ Conclusion: Parity confirmed; flexibility does not sacrifice performance.
                </div>
              </div>
            </div>
          </div>
        );

      // SLIDE 10: Sustainability Insights
      case 9:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 className="slide-title">Sustainability &amp; Carbon Footprint Insights</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Quantifying avoided commuting emissions and facilities conservation.
              </p>
            </div>

            <div className="sustainability-card">
              <div className="sustainability-title">
                <Leaf size={22} /> Avoided Commuting Emissions This Week
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '20px 0 16px' }}>
                <div style={{ background: 'white', padding: 16, borderRadius: 'var(--radius)', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 12, color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Remote Workdays</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#065f46', marginTop: 4 }}>
                    {sustainability.totalRemoteDays} <span style={{ fontSize: 14, fontWeight: 500 }}>Days</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#047857' }}>Across 10 team members</div>
                </div>

                <div style={{ background: 'white', padding: 16, borderRadius: 'var(--radius)', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 12, color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Estimated CO₂ Saved</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#065f46', marginTop: 4 }}>
                    {sustainability.estimatedCO2SavedKg} <span style={{ fontSize: 14, fontWeight: 500 }}>kg CO₂</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#047857' }}>Avoided passenger vehicle exhaust</div>
                </div>

                <div style={{ background: 'white', padding: 16, borderRadius: 'var(--radius)', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 12, color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Avg Desk Utilization</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#065f46', marginTop: 4 }}>
                    {sustainability.avgUtilizationPercent}%
                  </div>
                  <div style={{ fontSize: 11, color: '#047857' }}>Physical space efficiency</div>
                </div>
              </div>

              <div className="sustainability-note">
                🌿 <strong>Assumptions Model:</strong> {sustainability.config?.co2EmissionNote || "Estimated using an average car CO2 emission factor of 0.21 kg/km with an assumed 25 km commute (50 km round-trip). This figure is an illustrative demonstration estimate for Scope 3 emissions analysis."}
              </div>
            </div>
          </div>
        );

      // SLIDE 11: Improvement Roadmap
      case 10:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 className="slide-title">Executive Improvement Roadmap</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Top 3 organizational interventions targeted for executive leadership approval.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orgRecs.slice(0, 3).map((rec, idx) => (
                <div key={rec.id || idx} style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`rec-priority ${rec.priority ? rec.priority.toLowerCase() : 'high'}`}>
                        {rec.priority || 'High'} Priority
                      </span>
                      <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{rec.kpiCategory}</strong>
                    </div>
                    {rec.targetScore && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>
                        Target: {rec.targetScore}/10
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 6 }}>
                    {rec.action}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    ✨ Expected Impact: {rec.benefit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // SLIDE 12: Next Steps
      case 11:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 className="slide-title">Leadership Next Steps &amp; Action Plan</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Expected benefits, implementation timeline, and governance cadence.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--bg-primary)', padding: 18, borderRadius: 'var(--radius-md)', borderTop: '4px solid #3b82f6' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#3b82f6" /> 1. Meeting Caps
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Mandate 45-minute maximum meeting blocks and introduce "Focus Friday" with no recurring internal ceremonies.
                </p>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: 18, borderRadius: 'var(--radius-md)', borderTop: '4px solid #10b981' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={16} color="#10b981" /> 2. Flexible Desking
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Transition from fixed desks to designated team zones to optimize energy costs and accommodate future hiring.
                </p>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: 18, borderRadius: 'var(--radius-md)', borderTop: '4px solid #f59e0b' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={16} color="#f59e0b" /> 3. Learning Blocks
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Protect 2 dedicated learning hours during Wednesday afternoons to lift completion rates from 7.2 to 8.5+.
                </p>
              </div>
            </div>

            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46' }}>
                  Projected Organizational Return
                </div>
                <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                  +1.2 pt org rating improvement • 15% meeting reduction • ~250 kg monthly CO₂ savings
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#065f46', background: 'white', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid #a7f3d0', fontWeight: 600 }}>
                Demo Simulation Model
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="executive-presentation-page">
      {/* Top Header with Controls */}
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} color="var(--primary-light)" />
            <h1 className="page-title">Executive Presentation</h1>
            <span className="role-badge hr">HR Executive</span>
          </div>
          <p className="page-subtitle">
            12-Slide Performance Briefing &bull; Oct 5–11, 2026 Telemetry Review
          </p>
        </div>

        <div className="btn-group">
          <button
            type="button"
            className={`export-btn secondary ${overviewMode ? 'active' : ''}`}
            onClick={() => setOverviewMode(!overviewMode)}
            title="Toggle thumbnail grid overview"
          >
            <Grid3x3 size={16} />
            {overviewMode ? 'Back to Slide' : 'Slide Overview'}
          </button>
          <button
            type="button"
            className="export-btn secondary"
            onClick={() => window.print()}
            title="Print or save PDF of slides"
          >
            <Printer size={16} />
            Print Slides
          </button>
        </div>
      </div>

      {/* OVERVIEW MODE (Thumbnail Grid) */}
      {overviewMode ? (
        <div>
          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            Click any slide to jump directly into full view:
          </div>
          <div className="slides-overview">
            {slideTitles.map((slide, idx) => (
              <div
                key={slide.num}
                className={`slide-thumbnail ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => {
                  setCurrentSlide(idx);
                  setOverviewMode(false);
                }}
              >
                <div className="slide-thumbnail-num">Slide {slide.num} of 12</div>
                <div className="slide-thumbnail-title">{slide.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {slide.subtitle}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SINGLE SLIDE VIEW */
        <div className="presentation-container">
          <div className="slide">
            {renderSlideContent()}
          </div>

          {/* Slide Navigation Bar */}
          <div className="slide-nav no-print">
            <button
              type="button"
              className="slide-btn secondary"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: currentSlide === 0 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className="slide-counter">
              Slide {currentSlide + 1} of 12 &bull; <span style={{ color: 'var(--text-secondary)' }}>{slideTitles[currentSlide].title}</span>
            </div>

            <button
              type="button"
              className="slide-btn primary"
              onClick={handleNext}
              disabled={currentSlide === 11}
              style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: currentSlide === 11 ? 0.5 : 1 }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutivePresentation;
