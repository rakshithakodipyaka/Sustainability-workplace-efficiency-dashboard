import {
  calculateOfficeUtilization,
  calculateMeetingEffectiveness,
  calculateEmployeeEngagement,
  calculateLearningParticipation,
  calculateHybridWorkEffectiveness,
  calculateOverallScore,
  calculateOrgAverage,
  roundScore
} from '../utils/calculations';
import {
  normalizeRange,
  filterByRange,
  isInRange,
  isWorkday,
  meetingLimitFactor,
  learningTargetFactor
} from '../utils/dateRange';
import * as dataService from './dataService';

// Build the per-employee record set scoped to a date range, prorating the
// absolute weekly targets (meeting-hour limit, learning target) to the span.
const buildScopedRecords = (employeeId, range) => {
  const weights = dataService.getKPIWeights();

  const attendance = filterByRange(dataService.getOfficeAttendance(employeeId), range);

  const meetingRecord = dataService.getMeetings(employeeId);
  const meetings = {
    ...meetingRecord,
    meetings: filterByRange(meetingRecord.meetings, range),
    weeklyMeetingHourLimit: roundScore(
      (meetingRecord.weeklyMeetingHourLimit || weights.weeklyMeetingHourLimit || 10) *
        meetingLimitFactor(range)
    )
  };

  const engagementRecord = dataService.getEngagement(employeeId);
  const engagement = {
    ...engagementRecord,
    activities: filterByRange(engagementRecord.activities, range)
  };

  const learningRecord = dataService.getLearning(employeeId);
  const learning = {
    ...learningRecord,
    weeklyLearningHours: filterByRange(learningRecord.weeklyLearningHours, range),
    weeklyLearningTarget: roundScore(
      (weights.weeklyLearningTarget || 3) * learningTargetFactor(range)
    )
  };

  const hybridRecord = dataService.getHybridWork(employeeId);
  const hybrid = {
    ...hybridRecord,
    records: filterByRange(hybridRecord.records, range)
  };

  return { weights, attendance, meetings, engagement, learning, hybrid };
};

export const getEmployeeKPIs = (employeeId, range) => {
  const r = normalizeRange(range);
  const { weights, attendance, meetings, engagement, learning, hybrid } =
    buildScopedRecords(employeeId, r);

  const officeUtil = calculateOfficeUtilization(attendance);
  const meetingEff = calculateMeetingEffectiveness(meetings);
  const empEngagement = calculateEmployeeEngagement(engagement, officeUtil.score);
  const learnPart = calculateLearningParticipation(learning);
  const hybridWork = calculateHybridWorkEffectiveness(hybrid);

  const kpiScores = {
    officeUtilization: officeUtil.score,
    meetingEffectiveness: meetingEff.score,
    employeeEngagement: empEngagement.score,
    learningParticipation: learnPart.score,
    hybridWorkEffectiveness: hybridWork.score
  };

  const overallScore = calculateOverallScore(kpiScores, weights.weights);

  return {
    employeeId,
    range: r,
    kpiScores,
    overallScore,
    details: {
      officeUtilization: officeUtil,
      meetingEffectiveness: meetingEff,
      employeeEngagement: empEngagement,
      learningParticipation: learnPart,
      hybridWorkEffectiveness: hybridWork
    }
  };
};

export const getTeamKPIs = (managerId, range) => {
  const r = normalizeRange(range);
  const teamMembers = dataService.getTeamMembers(managerId);
  const teamKPIs = teamMembers.map(member => ({
    ...member,
    kpis: getEmployeeKPIs(member.employeeId, r)
  }));

  const teamScores = teamKPIs.map(m => m.kpis.overallScore);
  const teamAvg = teamScores.length > 0
    ? roundScore(teamScores.reduce((a, b) => a + b, 0) / teamScores.length)
    : 0;

  // Calculate team average for each KPI
  const kpiCategories = ['officeUtilization', 'meetingEffectiveness', 'employeeEngagement', 'learningParticipation', 'hybridWorkEffectiveness'];
  const teamKPIAverages = {};
  kpiCategories.forEach(kpi => {
    const scores = teamKPIs.map(m => m.kpis.kpiScores[kpi]);
    teamKPIAverages[kpi] = scores.length > 0
      ? roundScore(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  });

  return {
    managerId,
    range: r,
    teamMembers: teamKPIs,
    teamAverage: teamAvg,
    teamKPIAverages,
    topPerformers: [...teamKPIs].sort((a, b) => b.kpis.overallScore - a.kpis.overallScore).slice(0, 3),
    needsImprovement: teamKPIs.filter(m => m.kpis.overallScore < 6.0)
  };
};

export const getOrganizationKPIs = (range) => {
  const r = normalizeRange(range);
  const employees = dataService.getEmployees();
  const managers = dataService.getManagers();
  const org = dataService.getOrganization();

  const allEmployeeKPIs = employees.map(emp => ({
    ...emp,
    kpis: getEmployeeKPIs(emp.employeeId, r)
  }));

  const allManagerKPIs = managers.map(mgr => ({
    ...mgr,
    kpis: getEmployeeKPIs(mgr.employeeId, r),
    teamKPIs: getTeamKPIs(mgr.employeeId, r)
  }));

  const employeeScores = allEmployeeKPIs.map(e => e.kpis.overallScore);
  const orgAverage = calculateOrgAverage(employeeScores);

  const kpiCategories = ['officeUtilization', 'meetingEffectiveness', 'employeeEngagement', 'learningParticipation', 'hybridWorkEffectiveness'];
  const orgKPIAverages = {};
  kpiCategories.forEach(kpi => {
    const scores = allEmployeeKPIs.map(e => e.kpis.kpiScores[kpi]);
    orgKPIAverages[kpi] = scores.length > 0
      ? roundScore(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  });

  // Workspace utilization over the selected range (weekdays only)
  const attendance = dataService.getAllOfficeAttendance();
  const weekDates = (org.weekDates || []).filter(date => isInRange(date, r) && isWorkday(date));
  const dailyOccupancy = weekDates.map(date => {
    let presentCount = 0;
    attendance.forEach(emp => {
      const dayRecord = emp.records.find(rec => rec.date === date);
      if (dayRecord && dayRecord.present) presentCount++;
    });
    return {
      date,
      day: org.weekDayNames[org.weekDates.indexOf(date)],
      occupancy: presentCount,
      capacity: org.officeCapacity,
      utilizationPercent: roundScore((presentCount / org.officeCapacity) * 100)
    };
  });

  // Sustainability over the selected range
  const totalRemoteDays = allEmployeeKPIs.reduce((sum, emp) => {
    const hybrid = dataService.getHybridWork(emp.employeeId);
    return sum + filterByRange(hybrid.records || [], r).filter(rec => rec.workMode === 'remote').length;
  }, 0);

  const commuteDistance = org.sustainabilityConfig.estimatedCommuteDistanceKm;
  const co2Factor = org.sustainabilityConfig.co2EmissionFactorPerKm;
  const estimatedCO2Saved = roundScore(totalRemoteDays * commuteDistance * 2 * co2Factor);

  return {
    organization: org,
    range: r,
    orgAverage,
    orgKPIAverages,
    employees: allEmployeeKPIs,
    managers: allManagerKPIs,
    topPerformers: [...allEmployeeKPIs].sort((a, b) => b.kpis.overallScore - a.kpis.overallScore).slice(0, 5),
    needsImprovement: allEmployeeKPIs.filter(e => e.kpis.overallScore < 6.0),
    dailyOccupancy,
    sustainability: {
      totalRemoteDays,
      estimatedCO2SavedKg: estimatedCO2Saved,
      avgDailyOccupancy: dailyOccupancy.length > 0
        ? roundScore(dailyOccupancy.reduce((s, d) => s + d.occupancy, 0) / dailyOccupancy.length)
        : 0,
      avgUtilizationPercent: dailyOccupancy.length > 0
        ? roundScore(dailyOccupancy.reduce((s, d) => s + d.utilizationPercent, 0) / dailyOccupancy.length)
        : 0,
      config: org.sustainabilityConfig
    }
  };
};
