import { useAuth } from '../hooks/useAuth';
import { useEmployeeKPI } from '../hooks/useKPIData';
import ScoreGauge from '../components/ScoreGauge';

const Profile = () => {
  const { user } = useAuth();
  const kpiData = useEmployeeKPI(user?.employeeId);
  
  if (!user) return null;
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Your account details and performance summary</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{user.avatar}</div>
            <div>
              <div className="profile-name">{user.name}</div>
              <div className="profile-role">{user.role}</div>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="profile-field">
              <span className="profile-field-label">Employee ID</span>
              <span className="profile-field-value">{user.employeeId}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Email</span>
              <span className="profile-field-value">{user.email}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Department</span>
              <span className="profile-field-value">{user.department}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Team</span>
              <span className="profile-field-value">{user.team || 'N/A'}</span>
            </div>
            {user.managerId && (
              <div className="profile-field">
                <span className="profile-field-label">Reports To</span>
                <span className="profile-field-value">{user.managerId}</span>
              </div>
            )}
            {user.directReports && (
              <div className="profile-field">
                <span className="profile-field-label">Direct Reports</span>
                <span className="profile-field-value">{user.directReports.length} employees</span>
              </div>
            )}
          </div>
        </div>
        
        {kpiData && (
          <div className="profile-card">
            <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>Performance Overview</h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <ScoreGauge score={kpiData.overallScore} size={140} />
            </div>
            <div className="overview-kpi-bars">
              {Object.entries(kpiData.kpiScores).map(([key, score]) => {
                const labels = {
                  officeUtilization: 'Office Utilization',
                  meetingEffectiveness: 'Meeting Effectiveness',
                  employeeEngagement: 'Employee Engagement',
                  learningParticipation: 'Learning Participation',
                  hybridWorkEffectiveness: 'Hybrid Work Effectiveness'
                };
                const colors = {
                  officeUtilization: '#3b82f6',
                  meetingEffectiveness: '#ec4899',
                  employeeEngagement: '#10b981',
                  learningParticipation: '#f59e0b',
                  hybridWorkEffectiveness: '#8b5cf6'
                };
                return (
                  <div className="overview-kpi-row" key={key}>
                    <span className="overview-kpi-label">{labels[key]}</span>
                    <div className="overview-kpi-bar-track">
                      <div className="overview-kpi-bar-fill" style={{ width: `${score * 10}%`, background: colors[key] }} />
                    </div>
                    <span className="overview-kpi-score" style={{ color: colors[key] }}>{score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
