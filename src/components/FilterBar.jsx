import { useEffect, useState } from 'react';
import { RotateCcw, CalendarRange } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import {
  RANGE_PRESETS,
  DATA_MIN_DATE,
  DATA_MAX_DATE,
  formatRangeLabel
} from '../utils/dateRange';

const FilterBar = ({ employees, managers, showManagerFilter, showEmployeeFilter, showDayFilter, showKPIFilter }) => {
  const { filters, updateFilter, setDateRange, resetFilters } = useDashboard();
  const range = filters.dateRange;

  const isWeek = range.start === RANGE_PRESETS.week.start && range.end === RANGE_PRESETS.week.end;
  const isWeekdays = range.start === RANGE_PRESETS.weekdays.start && range.end === RANGE_PRESETS.weekdays.end;

  const [customOpen, setCustomOpen] = useState(!isWeek && !isWeekdays);

  // If the range is set to a preset elsewhere (e.g. reset), close the custom inputs.
  useEffect(() => {
    if (isWeek || isWeekdays) setCustomOpen(false);
  }, [range.start, range.end, isWeek, isWeekdays]);

  const periodValue = customOpen || (!isWeek && !isWeekdays)
    ? 'custom'
    : isWeek ? 'week' : 'weekdays';

  const handlePeriodChange = (value) => {
    if (value === 'week') {
      setCustomOpen(false);
      setDateRange(RANGE_PRESETS.week.start, RANGE_PRESETS.week.end);
    } else if (value === 'weekdays') {
      setCustomOpen(false);
      setDateRange(RANGE_PRESETS.weekdays.start, RANGE_PRESETS.weekdays.end);
    } else {
      setCustomOpen(true);
    }
  };

  const handleBound = (edge, value) => {
    if (!value) return;
    let start = edge === 'start' ? value : range.start;
    let end = edge === 'end' ? value : range.end;
    if (start > end) {
      if (edge === 'start') end = start;
      else start = end;
    }
    setDateRange(start, end);
  };

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
        <>
          <div className="filter-group">
            <label className="filter-label">Period</label>
            <select
              className="filter-select"
              value={periodValue}
              onChange={e => handlePeriodChange(e.target.value)}
            >
              <option value="week">This Week (Oct 5 – 11)</option>
              <option value="weekdays">Weekdays (Oct 5 – 9)</option>
              <option value="custom">Custom Range…</option>
            </select>
          </div>

          {periodValue === 'custom' && (
            <>
              <div className="filter-group">
                <label className="filter-label">From</label>
                <input
                  type="date"
                  className="filter-select"
                  min={DATA_MIN_DATE}
                  max={DATA_MAX_DATE}
                  value={range.start}
                  onChange={e => handleBound('start', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">To</label>
                <input
                  type="date"
                  className="filter-select"
                  min={DATA_MIN_DATE}
                  max={DATA_MAX_DATE}
                  value={range.end}
                  onChange={e => handleBound('end', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="filter-group">
            <label className="filter-label">Showing</label>
            <span className="filter-range-label">
              <CalendarRange size={14} /> {formatRangeLabel(range)}
            </span>
          </div>
        </>
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
