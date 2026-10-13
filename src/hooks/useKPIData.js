import { useState, useEffect, useMemo } from 'react';
import { getEmployeeKPIs, getTeamKPIs, getOrganizationKPIs } from '../services/kpiService';
import { useAuth } from './useAuth';
import { useDashboard } from '../context/DashboardContext';

export const useKPIData = () => {
  const { user } = useAuth();
  const { filters } = useDashboard();
  const range = filters.dateRange;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const data = useMemo(() => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return null;

      const myKPIs = getEmployeeKPIs(user.employeeId, range);
      let teamData = null;
      let orgData = null;

      if (user.role === 'Manager') {
        teamData = getTeamKPIs(user.employeeId, range);
      }

      if (user.role === 'HR') {
        orgData = getOrganizationKPIs(range);
      }

      return { myKPIs, teamData, orgData };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, range]);

  return { data, loading, error };
};

export const useEmployeeKPI = (employeeId) => {
  const { filters } = useDashboard();
  const range = filters.dateRange;

  return useMemo(() => {
    if (!employeeId) return null;
    try {
      return getEmployeeKPIs(employeeId, range);
    } catch {
      return null;
    }
  }, [employeeId, range]);
};
