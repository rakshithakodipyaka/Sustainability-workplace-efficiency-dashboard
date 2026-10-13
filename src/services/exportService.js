export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ];
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const prepareKPISummaryExport = (employees) => {
  return employees.map(emp => ({
    'Employee ID': emp.employeeId,
    'Name': emp.name,
    'Team': emp.team || 'N/A',
    'Office Utilization': emp.kpis.kpiScores.officeUtilization,
    'Meeting Effectiveness': emp.kpis.kpiScores.meetingEffectiveness,
    'Employee Engagement': emp.kpis.kpiScores.employeeEngagement,
    'Learning Participation': emp.kpis.kpiScores.learningParticipation,
    'Hybrid Work Effectiveness': emp.kpis.kpiScores.hybridWorkEffectiveness,
    'Overall Score': emp.kpis.overallScore
  }));
};

export const prepareAttendanceExport = (attendanceData) => {
  const rows = [];
  attendanceData.forEach(emp => {
    emp.records.forEach(rec => {
      rows.push({
        'Employee ID': emp.employeeId,
        'Date': rec.date,
        'Day': rec.day,
        'Planned': rec.planned ? 'Yes' : 'No',
        'Present': rec.present ? 'Yes' : 'No',
        'Tap In': rec.tapIn || 'N/A',
        'Tap Out': rec.tapOut || 'Missing',
        'Hours': rec.hoursInOffice || 'N/A'
      });
    });
  });
  return rows;
};

export const prepareMeetingExport = (meetingData) => {
  const rows = [];
  meetingData.forEach(emp => {
    (emp.meetings || []).forEach(mtg => {
      rows.push({
        'Employee ID': emp.employeeId,
        'Date': mtg.date,
        'Meeting': mtg.title,
        'Start': mtg.startTime,
        'End': mtg.endTime,
        'Duration (hrs)': mtg.duration,
        'Scheduled': mtg.scheduled ? 'Yes' : 'No',
        'Attended': mtg.attended ? 'Yes' : 'No'
      });
    });
  });
  return rows;
};

export const printReport = () => {
  window.print();
};
