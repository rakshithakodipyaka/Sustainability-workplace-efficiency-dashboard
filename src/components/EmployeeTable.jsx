import { useNavigate } from 'react-router-dom';
import { getScoreColor, getScoreLabel } from '../utils/formatters';
import { canViewEmployee } from '../utils/permissions';
import { useAuth } from '../hooks/useAuth';

const EmployeeTable = ({ employees, title = 'Employee Directory' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleRowClick = (emp) => {
    if (canViewEmployee(user, emp.employeeId)) {
      navigate(`/dashboard/employee/${emp.employeeId}`);
    }
  };
  
  if (!employees || employees.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-title">No Employees Found</div>
          <div className="empty-state-text">No employee data available for the current selection.</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="table-container">
      <div className="table-header">
        <div className="table-title">{title}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{employees.length} members</div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>ID</th>
            <th>Role</th>
            <th>Team</th>
            <th>Office Util.</th>
            <th>Meetings</th>
            <th>Engagement</th>
            <th>Learning</th>
            <th>Hybrid Work</th>
            <th>Overall</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => {
            const scores = emp.kpis?.kpiScores || {};
            const overall = emp.kpis?.overallScore || 0;
            const color = getScoreColor(overall);
            const label = getScoreLabel(overall);
            const clickable = canViewEmployee(user, emp.employeeId);
            
            return (
              <tr key={emp.employeeId}
                className={clickable ? 'clickable-row' : ''}
                onClick={() => handleRowClick(emp)}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, #1e40af, #0d9488)' }}>
                      {emp.avatar}
                    </div>
                    {emp.name}
                  </div>
                </td>
                <td>{emp.employeeId}</td>
                <td><span className={`role-badge ${emp.role.toLowerCase()}`}>{emp.role}</span></td>
                <td>{emp.team || '-'}</td>
                <td>{scores.officeUtilization || '-'}</td>
                <td>{scores.meetingEffectiveness || '-'}</td>
                <td>{scores.employeeEngagement || '-'}</td>
                <td>{scores.learningParticipation || '-'}</td>
                <td>{scores.hybridWorkEffectiveness || '-'}</td>
                <td style={{ fontWeight: 700, color }}>{overall}</td>
                <td>
                  <span className={`score-badge ${label.toLowerCase().replace(/ /g, '-')}`}>
                    {label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
