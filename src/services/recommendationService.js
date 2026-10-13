import { getScoreBand } from '../utils/calculations';
import { getData, setRecommendationStatus } from './dataCache';
import { api } from './api';

const getStoredStatuses = () => {
  const data = getData();
  return (data && data.recommendationStatuses) || {};
};

export const updateRecommendationStatus = (recId, status) => {
  setRecommendationStatus(recId, status);
  api.put(`/recommendation-statuses/${encodeURIComponent(recId)}`, { status }).catch(() => {});
};

export const getRecommendationStatus = (recId) => {
  const statuses = getStoredStatuses();
  return statuses[recId] || 'Not Started';
};

export const generateEmployeeRecommendations = (employeeId, kpiData) => {
  const recs = [];
  const scores = kpiData.kpiScores;
  const details = kpiData.details;
  
  // Sort KPIs by score (lowest first)
  const kpiEntries = [
    { key: 'officeUtilization', label: 'Office Utilization', score: scores.officeUtilization },
    { key: 'meetingEffectiveness', label: 'Meeting Effectiveness', score: scores.meetingEffectiveness },
    { key: 'employeeEngagement', label: 'Employee Engagement', score: scores.employeeEngagement },
    { key: 'learningParticipation', label: 'Learning Participation', score: scores.learningParticipation },
    { key: 'hybridWorkEffectiveness', label: 'Hybrid Work Effectiveness', score: scores.hybridWorkEffectiveness }
  ].sort((a, b) => a.score - b.score);
  
  kpiEntries.forEach((kpi, index) => {
    const band = getScoreBand(kpi.score);
    const recId = `${employeeId}_${kpi.key}`;
    const status = getRecommendationStatus(recId);
    
    let action = '';
    let benefit = '';
    let target = Math.min(10, kpi.score + 2);
    
    switch (kpi.key) {
      case 'officeUtilization':
        action = kpi.score < 6 
          ? 'Review planned office days and coordinate attendance with your team. Consider setting fixed office days for collaboration.' 
          : 'Maintain your current office attendance pattern. Use office days for collaborative activities.';
        benefit = 'Better collaboration, stronger team connection, and improved workspace utilization.';
        break;
      case 'meetingEffectiveness':
        if (details.meetingEffectiveness.isOverloaded) {
          action = 'Review recurring meetings and decline unnecessary invitations. Aim to keep meeting hours under 10 per week.';
        } else if (scores.meetingEffectiveness < 7) {
          action = 'Improve meeting attendance by reviewing your schedule early each day. Prioritize critical meetings.';
        } else {
          action = 'Continue maintaining good meeting discipline. Consider suggesting agenda-driven meetings for better outcomes.';
        }
        benefit = 'More focused work time, reduced meeting fatigue, and better meeting outcomes.';
        break;
      case 'employeeEngagement':
        action = kpi.score < 6 
          ? 'Explore voluntary team learning and collaboration activities. Attend at least one wellness or knowledge-sharing session this week.' 
          : 'Stay active in team events. Consider leading or organizing a knowledge-sharing session.';
        benefit = 'Stronger team relationships, broader skill exposure, and improved workplace satisfaction.';
        break;
      case 'learningParticipation':
        action = kpi.score < 6 
          ? 'Complete the next course module and schedule at least 3 learning hours this week. Focus on one course at a time.' 
          : 'Continue your learning momentum. Consider enrolling in a new course to expand your skill set.';
        benefit = 'Enhanced skills, career growth opportunities, and improved adaptability.';
        break;
      case 'hybridWorkEffectiveness':
        action = kpi.score < 6 
          ? 'Compare work patterns across office and remote days. Identify distractions and optimize your remote workspace.' 
          : 'Maintain consistent productivity across work modes. Share your best practices with the team.';
        benefit = 'Consistent output regardless of work location, better work-life balance.';
        break;
    }
    
    recs.push({
      id: recId,
      kpiCategory: kpi.label,
      kpiKey: kpi.key,
      currentScore: kpi.score,
      targetScore: Math.round(target * 10) / 10,
      action,
      priority: index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low',
      timeline: index < 2 ? 'This Week' : 'Next 2 Weeks',
      benefit,
      status,
      band: band.label
    });
  });
  
  return recs;
};

export const generateTeamRecommendations = (managerId, teamKPIs) => {
  const recs = [];
  const teamAvgs = teamKPIs.teamKPIAverages;
  
  // Find team's weakest KPIs
  const kpiLabels = {
    officeUtilization: 'Office Utilization',
    meetingEffectiveness: 'Meeting Effectiveness',
    employeeEngagement: 'Employee Engagement',
    learningParticipation: 'Learning Participation',
    hybridWorkEffectiveness: 'Hybrid Work Effectiveness'
  };
  
  const sortedKPIs = Object.entries(teamAvgs)
    .map(([key, score]) => ({ key, label: kpiLabels[key], score }))
    .sort((a, b) => a.score - b.score);
  
  sortedKPIs.forEach((kpi, index) => {
    const recId = `team_${managerId}_${kpi.key}`;
    recs.push({
      id: recId,
      kpiCategory: kpi.label,
      kpiKey: kpi.key,
      currentScore: kpi.score,
      targetScore: Math.min(10, Math.round((kpi.score + 1.5) * 10) / 10),
      action: getTeamAction(kpi.key, kpi.score),
      priority: index < 2 ? 'High' : 'Medium',
      timeline: index < 2 ? 'This Week' : 'Next 2 Weeks',
      benefit: 'Improved team performance and alignment.',
      status: getRecommendationStatus(recId),
      isTeamLevel: true
    });
  });
  
  // Add employee-specific notes
  if (teamKPIs.needsImprovement && teamKPIs.needsImprovement.length > 0) {
    teamKPIs.needsImprovement.forEach(emp => {
      const recId = `team_support_${managerId}_${emp.employeeId}`;
      recs.push({
        id: recId,
        kpiCategory: 'Employee Support',
        kpiKey: 'support',
        currentScore: emp.kpis.overallScore,
        targetScore: 6.0,
        action: `Schedule a 1:1 with ${emp.name} to discuss challenges and create a development plan. Their overall score is ${emp.kpis.overallScore}/10.`,
        priority: 'High',
        timeline: 'This Week',
        benefit: 'Targeted support leads to faster improvement and higher retention.',
        status: getRecommendationStatus(recId),
        isTeamLevel: true,
        employeeName: emp.name
      });
    });
  }
  
  return recs;
};

const getTeamAction = (kpiKey, score) => {
  const actions = {
    officeUtilization: score < 7 
      ? 'Establish team office days for better collaboration. Review attendance patterns with the team.' 
      : 'Team office utilization is good. Ensure office days are used for high-value collaboration.',
    meetingEffectiveness: score < 7 
      ? 'Audit team meetings for necessity and duration. Consolidate recurring meetings where possible.' 
      : 'Meeting patterns are healthy. Focus on agenda quality and action item follow-up.',
    employeeEngagement: score < 7 
      ? 'Encourage team participation in workplace activities. Lead by example in attending engagement events.' 
      : 'Engagement is solid. Consider team-led initiatives to maintain momentum.',
    learningParticipation: score < 7 
      ? 'Set team learning goals and dedicate time blocks for course completion. Track progress in 1:1s.' 
      : 'Learning participation is strong. Encourage knowledge sharing from completed courses.',
    hybridWorkEffectiveness: score < 7 
      ? 'Review team productivity patterns. Ensure remote work tools and practices support consistent output.' 
      : 'Hybrid effectiveness is good. Document and share best practices across the team.'
  };
  return actions[kpiKey] || 'Review team performance data and create targeted improvement plans.';
};

export const generateOrgRecommendations = (orgKPIs) => {
  const recs = [];
  const avgs = orgKPIs.orgKPIAverages;
  
  const kpiLabels = {
    officeUtilization: 'Office Utilization',
    meetingEffectiveness: 'Meeting Effectiveness',
    employeeEngagement: 'Employee Engagement',
    learningParticipation: 'Learning Participation',
    hybridWorkEffectiveness: 'Hybrid Work Effectiveness'
  };
  
  const sortedKPIs = Object.entries(avgs)
    .map(([key, score]) => ({ key, label: kpiLabels[key], score }))
    .sort((a, b) => a.score - b.score);
  
  sortedKPIs.forEach((kpi, index) => {
    const recId = `org_${kpi.key}`;
    recs.push({
      id: recId,
      kpiCategory: kpi.label,
      kpiKey: kpi.key,
      currentScore: kpi.score,
      targetScore: Math.min(10, Math.round((kpi.score + 1) * 10) / 10),
      action: getOrgAction(kpi.key, kpi.score, orgKPIs),
      priority: index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low',
      timeline: index < 2 ? 'This Week' : 'Next Month',
      benefit: getOrgBenefit(kpi.key),
      status: getRecommendationStatus(recId),
      isOrgLevel: true
    });
  });
  
  // Sustainability recommendation
  const susRecId = 'org_sustainability';
  recs.push({
    id: susRecId,
    kpiCategory: 'Sustainability',
    kpiKey: 'sustainability',
    currentScore: null,
    targetScore: null,
    action: `With ${orgKPIs.sustainability.totalRemoteDays} remote days this week, approximately ${orgKPIs.sustainability.estimatedCO2SavedKg} kg CO₂ was potentially avoided. Consider optimizing office space allocation based on ${orgKPIs.sustainability.avgUtilizationPercent}% average workspace utilization.`,
    priority: 'Medium',
    timeline: 'Ongoing',
    benefit: 'Reduced environmental footprint and optimized real estate costs.',
    status: getRecommendationStatus(susRecId),
    isOrgLevel: true
  });
  
  return recs;
};

const getOrgAction = (kpiKey, score, orgKPIs) => {
  const actions = {
    officeUtilization: `Organization-wide office utilization averages ${score}/10. With ${orgKPIs.sustainability.avgUtilizationPercent}% workspace utilization, consider flexible desk policies or space optimization.`,
    meetingEffectiveness: `Average meeting effectiveness is ${score}/10. Implement organization-wide meeting guidelines: max 45-min meetings, mandatory agendas, and no-meeting blocks.`,
    employeeEngagement: `Engagement score averages ${score}/10. Launch new team activities, recognition programs, or wellness initiatives to boost participation.`,
    learningParticipation: `Learning participation averages ${score}/10. Consider mandatory learning hours, gamified learning challenges, or learning communities.`,
    hybridWorkEffectiveness: `Hybrid work effectiveness averages ${score}/10. Review remote work policies, provide better tools, and establish clear hybrid work guidelines.`
  };
  return actions[kpiKey] || 'Review organization-wide performance data and establish improvement initiatives.';
};

const getOrgBenefit = (kpiKey) => {
  const benefits = {
    officeUtilization: 'Optimized workspace costs and better in-person collaboration.',
    meetingEffectiveness: 'Recovered productive hours and improved decision-making.',
    employeeEngagement: 'Higher retention, better morale, and stronger team culture.',
    learningParticipation: 'Upskilled workforce ready for future challenges.',
    hybridWorkEffectiveness: 'Flexible, productive workforce with consistent output.'
  };
  return benefits[kpiKey] || 'Improved organizational performance.';
};
