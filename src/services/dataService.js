import { getData } from './dataCache';

const data = () => getData() || {
  users: [],
  organization: {},
  officeAttendance: [],
  meetings: [],
  engagement: [],
  learning: { courses: [], enrollments: [] },
  hybridWork: [],
  kpiWeights: {}
};

export const getUsers = () => data().users;

export const getUserById = (employeeId) => {
  return data().users.find(u => u.employeeId === employeeId);
};

export const getOrganization = () => data().organization;

export const getOfficeAttendance = (employeeId) => {
  const record = data().officeAttendance.find(r => r.employeeId === employeeId);
  return record ? record.records : [];
};

export const getAllOfficeAttendance = () => data().officeAttendance;

export const getMeetings = (employeeId) => {
  const record = data().meetings.find(r => r.employeeId === employeeId);
  return record || { meetings: [], weeklyMeetingHourLimit: 10 };
};

export const getAllMeetings = () => data().meetings;

export const getEngagement = (employeeId) => {
  const record = data().engagement.find(r => r.employeeId === employeeId);
  return record || { activities: [] };
};

export const getAllEngagement = () => data().engagement;

export const getLearning = (employeeId) => {
  const learning = data().learning;
  const enrollment = (learning.enrollments || []).find(e => e.employeeId === employeeId);
  return enrollment || { enrolled: [], weeklyLearningHours: [] };
};

export const getAllLearning = () => data().learning;

export const getCourses = () => data().learning.courses || [];

export const getHybridWork = (employeeId) => {
  const record = data().hybridWork.find(r => r.employeeId === employeeId);
  return record || { records: [] };
};

export const getAllHybridWork = () => data().hybridWork;

export const getKPIWeights = () => data().kpiWeights;

export const getTeamMembers = (managerId) => {
  const users = data().users;
  const manager = users.find(u => u.employeeId === managerId);
  if (!manager || !manager.directReports) return [];
  return users.filter(u => manager.directReports.includes(u.employeeId));
};

export const getEmployees = () => {
  return data().users.filter(u => u.role === 'Employee');
};

export const getManagers = () => {
  return data().users.filter(u => u.role === 'Manager');
};
