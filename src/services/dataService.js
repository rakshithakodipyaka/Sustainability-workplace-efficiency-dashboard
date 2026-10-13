import usersData from '../data/users.json';
import organizationData from '../data/organization.json';
import officeAttendanceData from '../data/officeAttendance.json';
import meetingsData from '../data/meetings.json';
import engagementData from '../data/engagement.json';
import learningData from '../data/learning.json';
import hybridWorkData from '../data/hybridWork.json';
import kpiWeightsData from '../data/kpiWeights.json';

export const getUsers = () => usersData;

export const getUserById = (employeeId) => {
  return usersData.find(u => u.employeeId === employeeId);
};

export const getOrganization = () => organizationData;

export const getOfficeAttendance = (employeeId) => {
  const record = officeAttendanceData.find(r => r.employeeId === employeeId);
  return record ? record.records : [];
};

export const getAllOfficeAttendance = () => officeAttendanceData;

export const getMeetings = (employeeId) => {
  const record = meetingsData.find(r => r.employeeId === employeeId);
  return record || { meetings: [], weeklyMeetingHourLimit: 10 };
};

export const getAllMeetings = () => meetingsData;

export const getEngagement = (employeeId) => {
  const record = engagementData.find(r => r.employeeId === employeeId);
  return record || { activities: [] };
};

export const getAllEngagement = () => engagementData;

export const getLearning = (employeeId) => {
  const enrollment = learningData.enrollments.find(e => e.employeeId === employeeId);
  return enrollment || { enrolled: [], weeklyLearningHours: [] };
};

export const getAllLearning = () => learningData;

export const getCourses = () => learningData.courses;

export const getHybridWork = (employeeId) => {
  const record = hybridWorkData.find(r => r.employeeId === employeeId);
  return record || { records: [] };
};

export const getAllHybridWork = () => hybridWorkData;

export const getKPIWeights = () => kpiWeightsData;

export const getTeamMembers = (managerId) => {
  const manager = usersData.find(u => u.employeeId === managerId);
  if (!manager || !manager.directReports) return [];
  return usersData.filter(u => manager.directReports.includes(u.employeeId));
};

export const getEmployees = () => {
  return usersData.filter(u => u.role === 'Employee');
};

export const getManagers = () => {
  return usersData.filter(u => u.role === 'Manager');
};
