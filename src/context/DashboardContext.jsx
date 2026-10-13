import { createContext, useState, useContext } from 'react';
import { DEFAULT_RANGE } from '../utils/dateRange';

const DashboardContext = createContext(null);

const buildInitialFilters = () => ({
  selectedEmployee: null,
  selectedManager: null,
  selectedDay: null,
  selectedKPI: null,
  scoreRange: [0, 10],
  dateRange: { ...DEFAULT_RANGE }
});

export const DashboardProvider = ({ children }) => {
  const [filters, setFilters] = useState(buildInitialFilters);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const setDateRange = (start, end) => {
    updateFilter('dateRange', { start, end });
  };

  const resetFilters = () => {
    setFilters(buildInitialFilters());
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <DashboardContext.Provider value={{
      filters,
      updateFilter,
      setDateRange,
      resetFilters,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
