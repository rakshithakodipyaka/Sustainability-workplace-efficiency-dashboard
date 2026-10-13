const ChartCard = ({ title, subtitle, children, action, className = '' }) => {
  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">{title}</div>
          {subtitle && <div className="chart-card-subtitle">{subtitle}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
};

export default ChartCard;
