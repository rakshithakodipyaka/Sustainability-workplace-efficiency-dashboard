import { getScoreColor, getScoreLabel } from '../utils/formatters';

const ScoreGauge = ({ score, size = 120, label = 'Overall Score' }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 10) * circumference;
  const color = getScoreColor(score);
  const band = getScoreLabel(score);
  
  return (
    <div className="score-gauge">
      <div className="gauge-circle" style={{ width: size, height: size }}>
        <svg className="gauge-svg" width={size} height={size}>
          <circle
            className="gauge-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          <circle
            className="gauge-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="gauge-text">
          <span className="gauge-score">{score}</span>
          <span className="gauge-label">/ 10</span>
        </div>
      </div>
      <div className="gauge-band" style={{ color }}>{band}</div>
      {label && <div className="gauge-label">{label}</div>}
    </div>
  );
};

export default ScoreGauge;
