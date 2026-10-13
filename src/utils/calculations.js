// Score band thresholds (configurable)
export const SCORE_BANDS = [
  { min: 9.0, max: 10.0, label: 'Excellent', color: '#10b981' },
  { min: 7.5, max: 8.9, label: 'Good', color: '#3b82f6' },
  { min: 6.0, max: 7.4, label: 'Needs Improvement', color: '#f59e0b' },
  { min: 0, max: 5.9, label: 'Requires Attention', color: '#ef4444' }
];

export const getScoreBand = (score) => {
  return SCORE_BANDS.find(band => score >= band.min && score <= band.max) || SCORE_BANDS[3];
};

export const clampScore = (score) => Math.min(10, Math.max(0, score));
export const roundScore = (score) => Math.round(score * 10) / 10;

// KPI 1: Office Utilization
export const calculateOfficeUtilization = (attendanceRecords) => {
  const weekdayRecords = attendanceRecords.filter(r => r.planned === true);
  const plannedDays = weekdayRecords.length;
  const presentDays = weekdayRecords.filter(r => r.present).length;
  const attendancePercentage = plannedDays > 0 ? (presentDays / plannedDays) * 100 : 0;
  const totalHours = weekdayRecords.filter(r => r.present && r.hoursInOffice).reduce((sum, r) => sum + r.hoursInOffice, 0);
  const avgDailyHours = presentDays > 0 ? totalHours / presentDays : 0;
  const score = clampScore(attendancePercentage / 10);
  
  return {
    plannedDays,
    presentDays,
    attendancePercentage: roundScore(attendancePercentage),
    totalHours: roundScore(totalHours),
    avgDailyHours: roundScore(avgDailyHours),
    score: roundScore(score),
    records: attendanceRecords
  };
};

// KPI 2: Meeting Effectiveness
export const calculateMeetingEffectiveness = (meetingData) => {
  const meetings = meetingData.meetings || [];
  const totalScheduled = meetings.filter(m => m.scheduled).length;
  const totalAttended = meetings.filter(m => m.attended).length;
  const totalMissed = totalScheduled - totalAttended;
  const meetingAttendancePercentage = totalScheduled > 0 ? (totalAttended / totalScheduled) * 100 : 0;
  const totalMeetingHours = meetings.filter(m => m.attended).reduce((sum, m) => sum + (m.duration || 0), 0);
  const avgMeetingDuration = totalAttended > 0 ? totalMeetingHours / totalAttended : 0;
  const weeklyLimit = meetingData.weeklyMeetingHourLimit || 10;
  
  const meetingAttendanceScore = totalScheduled > 0 ? clampScore((totalAttended / totalScheduled) * 10) : 10;
  const meetingLoadScore = clampScore(Math.max(0, 10 - (totalMeetingHours / weeklyLimit) * 10));
  const score = clampScore(0.6 * meetingAttendanceScore + 0.4 * meetingLoadScore);
  
  return {
    totalScheduled,
    totalAttended,
    totalMissed,
    meetingAttendancePercentage: roundScore(meetingAttendancePercentage),
    totalMeetingHours: roundScore(totalMeetingHours),
    avgMeetingDuration: roundScore(avgMeetingDuration),
    meetingAttendanceScore: roundScore(meetingAttendanceScore),
    meetingLoadScore: roundScore(meetingLoadScore),
    isOverloaded: totalMeetingHours > weeklyLimit,
    weeklyLimit,
    score: roundScore(score),
    meetings
  };
};

// KPI 3: Employee Engagement
export const calculateEmployeeEngagement = (engagementData, officeUtilizationScore) => {
  const activities = engagementData.activities || [];
  const totalAvailable = activities.filter(a => a.available).length;
  const totalAttended = activities.filter(a => a.attended).length;
  const participationPercentage = totalAvailable > 0 ? (totalAttended / totalAvailable) * 100 : 0;
  const activityScore = clampScore(participationPercentage / 10);
  const attendanceScore = officeUtilizationScore || 0;
  const score = clampScore(0.7 * activityScore + 0.3 * attendanceScore);
  
  return {
    totalAvailable,
    totalAttended,
    participationPercentage: roundScore(participationPercentage),
    activityScore: roundScore(activityScore),
    attendanceConsistencyScore: roundScore(attendanceScore),
    score: roundScore(score),
    activities
  };
};

// KPI 4: Learning Participation
export const calculateLearningParticipation = (learningData) => {
  const enrolled = learningData.enrolled || [];
  const weeklyHours = learningData.weeklyLearningHours || [];
  const weeklyTarget = learningData.weeklyLearningTarget || 3; // configurable / prorated per range
  
  const totalEnrolled = enrolled.length;
  const totalCompleted = enrolled.filter(c => c.status === 'completed').length;
  const totalInProgress = enrolled.filter(c => c.status === 'in-progress').length;
  const avgProgress = totalEnrolled > 0 ? enrolled.reduce((sum, c) => sum + c.progress, 0) / totalEnrolled : 0;
  const completionPercentage = totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0;
  const totalLearningHours = weeklyHours.reduce((sum, d) => sum + d.hours, 0);
  
  const learningProgressScore = clampScore(avgProgress / 10);
  const learningHoursScore = clampScore(Math.min(10, (totalLearningHours / weeklyTarget) * 10));
  const score = clampScore(0.6 * learningProgressScore + 0.4 * learningHoursScore);
  
  return {
    totalEnrolled,
    totalCompleted,
    totalInProgress,
    avgProgress: roundScore(avgProgress),
    completionPercentage: roundScore(completionPercentage),
    totalLearningHours: roundScore(totalLearningHours),
    weeklyTarget,
    learningProgressScore: roundScore(learningProgressScore),
    learningHoursScore: roundScore(learningHoursScore),
    score: roundScore(score),
    courses: enrolled,
    dailyHours: weeklyHours
  };
};

// KPI 5: Hybrid Work Effectiveness
export const calculateHybridWorkEffectiveness = (hybridRecords) => {
  const records = hybridRecords.records || [];
  const workDayRecords = records.filter(r => r.workMode !== 'off');
  const officeRecords = workDayRecords.filter(r => r.workMode === 'office');
  const remoteRecords = workDayRecords.filter(r => r.workMode === 'remote');
  
  const avgOfficeProductivity = officeRecords.length > 0 
    ? officeRecords.reduce((sum, r) => sum + r.productiveHours, 0) / officeRecords.length : 0;
  const avgRemoteProductivity = remoteRecords.length > 0 
    ? remoteRecords.reduce((sum, r) => sum + r.productiveHours, 0) / remoteRecords.length : 0;
  
  const avgOfficeTasks = officeRecords.length > 0
    ? officeRecords.reduce((sum, r) => sum + r.tasksCompleted, 0) / officeRecords.length : 0;
  const avgRemoteTasks = remoteRecords.length > 0
    ? remoteRecords.reduce((sum, r) => sum + r.tasksCompleted, 0) / remoteRecords.length : 0;
  
  const expectedHours = 7;
  const totalProductiveHours = workDayRecords.reduce((sum, r) => sum + r.productiveHours, 0);
  const totalTasks = workDayRecords.reduce((sum, r) => sum + r.tasksCompleted, 0);
  const productivityIndex = workDayRecords.length > 0 
    ? (totalProductiveHours / (workDayRecords.length * expectedHours)) * 100 : 0;
  
  // Score calculation
  const officeProductivityScore = officeRecords.length > 0 
    ? clampScore((avgOfficeProductivity / expectedHours) * 10) : 0;
  const remoteProductivityScore = remoteRecords.length > 0 
    ? clampScore((avgRemoteProductivity / expectedHours) * 10) : 0;
  
  let score;
  if (officeRecords.length > 0 && remoteRecords.length > 0) {
    score = clampScore((officeProductivityScore + remoteProductivityScore) / 2);
  } else if (officeRecords.length > 0) {
    score = officeProductivityScore;
  } else if (remoteRecords.length > 0) {
    score = remoteProductivityScore;
  } else {
    score = 0;
  }
  
  const comparisonLabel = (officeRecords.length === 0 || remoteRecords.length === 0) 
    ? 'Incomplete comparison (single work mode)' : 'Full comparison available';
  
  return {
    officeDays: officeRecords.length,
    remoteDays: remoteRecords.length,
    avgOfficeProductivity: roundScore(avgOfficeProductivity),
    avgRemoteProductivity: roundScore(avgRemoteProductivity),
    avgOfficeTasks: roundScore(avgOfficeTasks),
    avgRemoteTasks: roundScore(avgRemoteTasks),
    totalProductiveHours: roundScore(totalProductiveHours),
    totalTasks,
    productivityIndex: roundScore(productivityIndex),
    officeProductivityScore: roundScore(officeProductivityScore),
    remoteProductivityScore: roundScore(remoteProductivityScore),
    comparisonLabel,
    score: roundScore(score),
    records
  };
};

// Overall Performance Score
export const calculateOverallScore = (kpiScores, weights) => {
  const w = weights || {
    officeUtilization: 0.20,
    meetingEffectiveness: 0.20,
    employeeEngagement: 0.20,
    learningParticipation: 0.20,
    hybridWorkEffectiveness: 0.20
  };
  
  const overall = 
    w.officeUtilization * (kpiScores.officeUtilization || 0) +
    w.meetingEffectiveness * (kpiScores.meetingEffectiveness || 0) +
    w.employeeEngagement * (kpiScores.employeeEngagement || 0) +
    w.learningParticipation * (kpiScores.learningParticipation || 0) +
    w.hybridWorkEffectiveness * (kpiScores.hybridWorkEffectiveness || 0);
  
  return roundScore(clampScore(overall));
};

// Organization average (employees only, not managers)
export const calculateOrgAverage = (employeeScores) => {
  if (!employeeScores || employeeScores.length === 0) return 0;
  const sum = employeeScores.reduce((acc, s) => acc + s, 0);
  return roundScore(sum / employeeScores.length);
};
