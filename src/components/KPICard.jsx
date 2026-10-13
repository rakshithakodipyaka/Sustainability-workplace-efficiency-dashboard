import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight,
  Building2, CalendarCheck, Users, BookOpen, Laptop } from 'lucide-react';
import { getScoreColor, getScoreLabel } from '../utils/formatters';

const KPI_ICONS = {
  officeUtilization: { icon: Building2, bg: '#dbeafe', color: '#1e40af' },
  meetingEffectiveness: { icon: CalendarCheck, bg: '#fce7f3', color: '#be185d' },
  employeeEngagement: { icon: Users, bg: '#d1fae5', color: '#065f46' },
  learningParticipation: { icon: BookOpen, bg: '#fef3c7', color: '#92400e' },
  hybridWorkEffectiveness: { icon: Laptop, bg: '#ede9fe', color: '#6d28d9' }
};

const KPI_ROUTES = {
  officeUtilization: 'office-utilization',
  meetingEffectiveness: 'meeting-effectiveness',
  employeeEngagement: 'employee-engagement',
  learningParticipation: 'learning-participation',
  hybridWorkEffectiveness: 'hybrid-work-effectiveness'
};

const KPI_NAMES = {
  officeUtilization: 'Office Utilization',
  meetingEffectiveness: 'Meeting Effectiveness',
  employeeEngagement: 'Employee Engagement',
  learningParticipation: 'Learning Participation',
  hybridWorkEffectiveness: 'Hybrid Work Effectiveness'
};

const KPICard = ({ kpiKey, score, previousScore, onClick }) => {
  const navigate = useNavigate();
  const { icon: Icon, bg, color } = KPI_ICONS[kpiKey] || {};
  const scoreColor = getScoreColor(score);
  const label = getScoreLabel(score);
  const route = KPI_ROUTES[kpiKey];
  const name = KPI_NAMES[kpiKey];
  
  const trend = previousScore !== undefined 
    ? (score > previousScore ? 'up' : score < previousScore ? 'down' : 'stable')
    : 'stable';
  
  const trendDiff = previousScore !== undefined 
    ? Math.abs(Math.round((score - previousScore) * 10) / 10)
    : 0;
  
  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/dashboard/kpis/${route}`);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="kpi-card"
      role="button"
      tabIndex={0}
      aria-label={`${name}: ${score} out of 10, ${label}. View details`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="kpi-card-header">
        <div className="kpi-card-icon" style={{ background: bg }}>
          {Icon && <Icon size={20} color={color} />}
        </div>
        <div className={`kpi-card-trend ${trend}`}>
          {trend === 'up' && <><ArrowUpRight size={14} /> +{trendDiff}</>}
          {trend === 'down' && <><ArrowDownRight size={14} /> -{trendDiff}</>}
          {trend === 'stable' && <><Minus size={14} /> Stable</>}
        </div>
      </div>
      <div className="kpi-card-name">{name}</div>
      <div className="kpi-card-score" style={{ color: scoreColor }}>
        {score}<span>/10</span>
      </div>
      <div className="kpi-card-status" style={{ color: scoreColor }}>{label}</div>
      <div className="kpi-card-bar">
        <div className="kpi-card-bar-fill" style={{ width: `${score * 10}%`, background: scoreColor }} />
      </div>
      <div className="kpi-card-action">
        View Details <ChevronRight size={14} />
      </div>
    </div>
  );
};

export default KPICard;
