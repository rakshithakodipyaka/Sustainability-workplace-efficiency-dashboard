import { Target, Clock, TrendingUp } from 'lucide-react';
import { updateRecommendationStatus } from '../services/recommendationService';
import { useState } from 'react';
import { getScoreColor } from '../utils/formatters';

const RecommendationCard = ({ recommendation }) => {
  const [status, setStatus] = useState(recommendation.status || 'Not Started');
  
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    updateRecommendationStatus(recommendation.id, newStatus);
  };
  
  return (
    <div className="rec-card">
      <div className="rec-header">
        <div>
          <div className="rec-category">{recommendation.kpiCategory}</div>
        </div>
        <span className={`rec-priority ${recommendation.priority.toLowerCase()}`}>
          {recommendation.priority} Priority
        </span>
      </div>
      
      {recommendation.currentScore !== null && (
        <div className="rec-scores">
          <div className="rec-score-item">
            <Target size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Current: <strong style={{ color: getScoreColor(recommendation.currentScore) }}>{recommendation.currentScore}/10</strong>
          </div>
          {recommendation.targetScore && (
            <div className="rec-score-item">
              <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Target: <strong style={{ color: 'var(--success)' }}>{recommendation.targetScore}/10</strong>
            </div>
          )}
          <div className="rec-score-item">
            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {recommendation.timeline}
          </div>
        </div>
      )}
      
      <div className="rec-action">{recommendation.action}</div>
      
      <div className="rec-meta">
        <div className="rec-benefit">✨ {recommendation.benefit}</div>
        <select className="rec-status-select" value={status} onChange={handleStatusChange}>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
    </div>
  );
};

export default RecommendationCard;
