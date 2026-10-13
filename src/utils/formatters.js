export const formatScore = (score) => `${score}/10`;

export const formatPercentage = (value) => `${Math.round(value)}%`;

export const formatHours = (hours) => `${hours}h`;

export const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const formatDayShort = (dayName) => dayName.substring(0, 3);

export const getScoreColor = (score) => {
  if (score >= 9.0) return '#10b981';
  if (score >= 7.5) return '#3b82f6';
  if (score >= 6.0) return '#f59e0b';
  return '#ef4444';
};

export const getScoreLabel = (score) => {
  if (score >= 9.0) return 'Excellent';
  if (score >= 7.5) return 'Good';
  if (score >= 6.0) return 'Needs Improvement';
  return 'Requires Attention';
};

export const getTrendIcon = (current, previous) => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
};
