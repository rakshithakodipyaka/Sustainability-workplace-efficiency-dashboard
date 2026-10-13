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
import * as dataService from './dataService';

export const getEmployeeKPIs = (employeeId) => {
  const attendance = dataService.getOfficeAttendance(employeeId);
  const meetings = dataService.getMeetings(employeeId);
  const engagement = dataService.getEngagement(employeeId);
  const learning = dataService.getLearning(employeeId);
  const hybrid = dataService.getHybridWork(employeeId);
  const weights = dataService.getKPIWeights();
  
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

export const getTeamKPIs = (managerId) => {
  const teamMembers = dataService.getTeamMembers(managerId);
  const teamKPIs = teamMembers.map(member => ({
    ...member,
    kpis: getEmployeeKPIs(member.employeeId)
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
    teamMembers: teamKPIs,
    teamAverage: teamAvg,
    teamKPIAverages,
    topPerformers: [...teamKPIs].sort((a, b) => b.kpis.overallScore - a.kpis.overallScore).slice(0, 3),
    needsImprovement: teamKPIs.filter(m => m.kpis.overallScore < 6.0)
  };
};

export const getOrganizationKPIs = () => {
  const employees = dataService.getEmployees();
  const managers = dataService.getManagers();
  const org = dataService.getOrganization();
  
  const allEmployeeKPIs = employees.map(emp => ({
    ...emp,
    kpis: getEmployeeKPIs(emp.employeeId)
  }));
  
  const allManagerKPIs = managers.map(mgr => ({
    ...mgr,
    kpis: getEmployeeKPIs(mgr.employeeId),
    teamKPIs: getTeamKPIs(mgr.employeeId)
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
  
  // Workspace utilization
  const attendance = dataService.getAllOfficeAttendance();
  const weekDates = org.weekDates.slice(0, 5); // weekdays only
  const dailyOccupancy = weekDates.map(date => {
    let presentCount = 0;
    attendance.forEach(emp => {
      const dayRecord = emp.records.find(r => r.date === date);
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
  
  // Sustainability
  const totalRemoteDays = allEmployeeKPIs.reduce((sum, emp) => {
    const hybrid = dataService.getHybridWork(emp.employeeId);
    return sum + (hybrid.records || []).filter(r => r.workMode === 'remote').length;
  }, 0);
  
  const commuteDistance = org.sustainabilityConfig.estimatedCommuteDistanceKm;
  const co2Factor = org.sustainabilityConfig.co2EmissionFactorPerKm;
  const estimatedCO2Saved = roundScore(totalRemoteDays * commuteDistance * 2 * co2Factor);
  
  return {
    organization: org,
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
