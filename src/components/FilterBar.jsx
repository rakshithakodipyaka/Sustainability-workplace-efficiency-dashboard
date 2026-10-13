import { RotateCcw } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const FilterBar = ({ employees, managers, showManagerFilter, showEmployeeFilter, showDayFilter, showKPIFilter }) => {
  const { filters, updateFilter, resetFilters } = useDashboard();
  
  const days = [
    { value: '', label: 'All Days' },
    { value: '2026-10-05', label: 'Monday' },
    { value: '2026-10-06', label: 'Tuesday' },
    { value: '2026-10-07', label: 'Wednesday' },
    { value: '2026-10-08', label: 'Thursday' },
    { value: '2026-10-09', label: 'Friday' },
    { value: '2026-10-10', label: 'Saturday' },
    { value: '2026-10-11', label: 'Sunday' }
  ];
  
  const kpis = [
    { value: '', label: 'All KPIs' },
    { value: 'officeUtilization', label: 'Office Utilization' },
    { value: 'meetingEffectiveness', label: 'Meeting Effectiveness' },
    { value: 'employeeEngagement', label: 'Employee Engagement' },
    { value: 'learningParticipation', label: 'Learning Participation' },
    { value: 'hybridWorkEffectiveness', label: 'Hybrid Work Effectiveness' }
  ];
  
  return (
    <div className="filter-bar no-print">
      {showManagerFilter && managers && (
        <div className="filter-group">
          <label className="filter-label">Team / Manager</label>
          <select
            className="filter-select"
            value={filters.selectedManager || ''}
            onChange={e => updateFilter('selectedManager', e.target.value || null)}
          >
            <option value="">All Teams</option>
            {managers.map(m => (
              <option key={m.employeeId} value={m.employeeId}>{m.name} ({m.team})</option>
            ))}
          </select>
        </div>
      )}
      
      {showEmployeeFilter && employees && (
        <div className="filter-group">
          <label className="filter-label">Employee</label>
          <select
            className="filter-select"
            value={filters.selectedEmployee || ''}
            onChange={e => updateFilter('selectedEmployee', e.target.value || null)}
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.employeeId} value={emp.employeeId}>{emp.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {showDayFilter && (
        <div className="filter-group">
          <label className="filter-label">Day</label>
          <select
            className="filter-select"
            value={filters.selectedDay || ''}
            onChange={e => updateFilter('selectedDay', e.target.value || null)}
          >
            {days.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      )}
      
      {showKPIFilter && (
        <div className="filter-group">
          <label className="filter-label">KPI Category</label>
          <select
            className="filter-select"
            value={filters.selectedKPI || ''}
            onChange={e => updateFilter('selectedKPI', e.target.value || null)}
          >
            {kpis.map(k => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>
      )}
      
      <button className="filter-reset" onClick={resetFilters}>
        <RotateCcw size={14} /> Reset
      </button>
    </div>
  );
};

export default FilterBar;
