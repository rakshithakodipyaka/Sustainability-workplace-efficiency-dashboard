import { createContext, useState, useContext } from 'react';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    selectedEmployee: null,
    selectedManager: null,
    selectedDay: null,
    selectedKPI: null,
    scoreRange: [0, 10],
    dateRange: {
      start: '2026-10-05',
      end: '2026-10-11'
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      selectedEmployee: null,
      selectedManager: null,
      selectedDay: null,
      selectedKPI: null,
      scoreRange: [0, 10],
      dateRange: {
        start: '2026-10-05',
        end: '2026-10-11'
      }
    });
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <DashboardContext.Provider value={{
      filters,
      updateFilter,
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
