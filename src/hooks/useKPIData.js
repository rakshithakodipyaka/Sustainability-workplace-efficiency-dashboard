import { useState, useEffect, useMemo } from 'react';
import { getEmployeeKPIs, getTeamKPIs, getOrganizationKPIs } from '../services/kpiService';
import { useAuth } from './useAuth';

export const useKPIData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const data = useMemo(() => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) return null;
      
      const myKPIs = getEmployeeKPIs(user.employeeId);
      let teamData = null;
      let orgData = null;
      
      if (user.role === 'Manager') {
        teamData = getTeamKPIs(user.employeeId);
      }
      
      if (user.role === 'HR') {
        orgData = getOrganizationKPIs();
      }
      
      return { myKPIs, teamData, orgData };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { data, loading, error };
};

export const useEmployeeKPI = (employeeId) => {
  return useMemo(() => {
    if (!employeeId) return null;
    try {
      return getEmployeeKPIs(employeeId);
    } catch {
      return null;
    }
  }, [employeeId]);
};
