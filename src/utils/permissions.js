export const ROLES = {
  HR: 'HR',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee'
};

export const canViewEmployee = (currentUser, targetEmployeeId, users) => {
  if (!currentUser || !targetEmployeeId) return false;
  
  // HR can view everyone
  if (currentUser.role === ROLES.HR) return true;
  
  // Manager can view their direct reports and themselves
  if (currentUser.role === ROLES.MANAGER) {
    if (currentUser.employeeId === targetEmployeeId) return true;
    return (currentUser.directReports || []).includes(targetEmployeeId);
  }
  
  // Employee can only view themselves
  if (currentUser.role === ROLES.EMPLOYEE) {
    return currentUser.employeeId === targetEmployeeId;
  }
  
  return false;
};

export const canViewTeam = (currentUser, managerId) => {
  if (!currentUser) return false;
  if (currentUser.role === ROLES.HR) return true;
  if (currentUser.role === ROLES.MANAGER) return currentUser.employeeId === managerId;
  return false;
};

export const canViewOrgData = (currentUser) => {
  return currentUser?.role === ROLES.HR;
};

export const canViewReports = (currentUser) => {
  return currentUser?.role === ROLES.HR || currentUser?.role === ROLES.MANAGER;
};

export const canViewAllEmployees = (currentUser) => {
  return currentUser?.role === ROLES.HR;
};

export const getAccessibleEmployeeIds = (currentUser, users) => {
  if (!currentUser) return [];
  
  if (currentUser.role === ROLES.HR) {
    return users.filter(u => u.role !== ROLES.HR).map(u => u.employeeId);
  }
  
  if (currentUser.role === ROLES.MANAGER) {
    return [currentUser.employeeId, ...(currentUser.directReports || [])];
  }
  
  return [currentUser.employeeId];
};
