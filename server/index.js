import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { PORT } from './env.js';
import { db, createSchema, isSeeded } from './db.js';
import { seedDatabase } from './seed.js';

createSchema();
if (!isSeeded()) {
  const result = seedDatabase();
  console.log('Auto-seeded database on startup:', result);
}

const app = express();
app.use(cors());
app.use(express.json());

const DEMO_ACCOUNTS = [
  { employeeId: 'HR001', password: 'hr@demo123' },
  { employeeId: 'MGR001', password: 'mgr@demo123' },
  { employeeId: 'MGR002', password: 'mgr@demo123' },
  { employeeId: 'EMP001', password: 'emp@demo123' }
];

const reportsByManager = () => {
  const map = new Map();
  for (const e of db.prepare('SELECT employee_id, manager_id FROM employees').all()) {
    if (!e.manager_id) continue;
    if (!map.has(e.manager_id)) map.set(e.manager_id, []);
    map.get(e.manager_id).push(e.employee_id);
  }
  return map;
};

const publicUser = (row, reports = reportsByManager()) => ({
  employeeId: row.employee_id,
  name: row.name,
  role: row.role,
  email: row.email,
  department: row.department,
  team: row.team,
  managerId: row.manager_id,
  avatar: row.avatar,
  ...(row.role === 'Manager' ? { directReports: reports.get(row.employee_id) || [] } : {})
});

const groupBy = (rows, key) => {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row[key])) map.set(row[key], []);
    map.get(row[key]).push(row);
  }
  return map;
};

const getToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const requireAuth = (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  const session = db.prepare('SELECT employee_id FROM sessions WHERE token = ?').get(token);
  if (!session) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  const employee = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(session.employee_id);
  if (!employee) return res.status(401).json({ error: 'Session invalid.' });
  req.employee = employee;
  req.token = token;
  next();
};

const accessibleIds = (me) => {
  if (me.role === 'HR') {
    return db.prepare('SELECT employee_id FROM employees').all().map((e) => e.employee_id);
  }
  if (me.role === 'Manager') {
    return [me.employee_id, ...(reportsByManager().get(me.employee_id) || [])];
  }
  return [me.employee_id];
};

const buildDatasets = (me) => {
  const ids = accessibleIds(me);
  const idSet = new Set(ids);
  const reports = reportsByManager();
  const kpiRow = db.prepare('SELECT * FROM kpi_settings WHERE id = 1').get();
  const weeklyMeetingHourLimit = kpiRow ? kpiRow.weekly_meeting_hour_limit : 10;
  const weeklyLearningTarget = kpiRow ? kpiRow.weekly_learning_target : 3;

  const users = db
    .prepare('SELECT * FROM employees')
    .all()
    .filter((e) => idSet.has(e.employee_id))
    .map((e) => publicUser(e, reports));

  const orgRow = db.prepare('SELECT * FROM org_settings WHERE id = 1').get();
  const organization = orgRow
    ? {
        name: orgRow.name,
        totalEmployees: orgRow.total_employees,
        totalManagers: orgRow.total_managers,
        hrCount: orgRow.hr_count,
        departments: JSON.parse(orgRow.departments),
        teams: JSON.parse(orgRow.teams),
        officeCapacity: orgRow.office_capacity,
        weeklyWorkDays: orgRow.weekly_work_days,
        weekDates: JSON.parse(orgRow.week_dates),
        weekDayNames: JSON.parse(orgRow.week_day_names),
        sustainabilityConfig: JSON.parse(orgRow.sustainability_config)
      }
    : {};

  const kpiWeights = kpiRow
    ? {
        weights: JSON.parse(kpiRow.weights),
        scoreBands: JSON.parse(kpiRow.score_bands),
        weeklyMeetingHourLimit,
        weeklyLearningTarget,
        expectedProductiveHoursPerDay: kpiRow.expected_productive_hours_per_day
      }
    : {};

  const attendanceByEmp = groupBy(
    db.prepare('SELECT * FROM attendance ORDER BY date').all(),
    'employee_id'
  );
  const officeAttendance = ids.map((id) => ({
    employeeId: id,
    records: (attendanceByEmp.get(id) || []).map((a) => ({
      date: a.date,
      day: a.day,
      planned: !!a.planned,
      present: !!a.present,
      tapIn: a.tap_in,
      tapOut: a.tap_out,
      hoursInOffice: a.hours_in_office
    }))
  }));

  const meetingsByEmp = groupBy(
    db.prepare('SELECT * FROM meetings ORDER BY date, start_time').all(),
    'employee_id'
  );
  const meetings = ids.map((id) => ({
    employeeId: id,
    weeklyMeetingHourLimit,
    meetings: (meetingsByEmp.get(id) || []).map((m) => ({
      date: m.date,
      day: m.day,
      meetingId: m.meeting_id,
      title: m.title,
      startTime: m.start_time,
      endTime: m.end_time,
      duration: m.duration,
      scheduled: !!m.scheduled,
      attended: !!m.attended
    }))
  }));

  const activitiesByEmp = groupBy(
    db.prepare('SELECT * FROM activities ORDER BY date').all(),
    'employee_id'
  );
  const engagement = ids.map((id) => ({
    employeeId: id,
    activities: (activitiesByEmp.get(id) || []).map((a) => ({
      date: a.date,
      day: a.day,
      activityId: a.activity_id,
      name: a.name,
      category: a.category,
      available: !!a.available,
      attended: !!a.attended
    }))
  }));

  const courses = db
    .prepare('SELECT * FROM courses')
    .all()
    .map((c) => ({
      courseId: c.course_id,
      title: c.title,
      totalHours: c.total_hours,
      category: c.category
    }));

  const enrollByEmp = groupBy(db.prepare('SELECT * FROM enrollments').all(), 'employee_id');
  const hoursByEmp = groupBy(
    db.prepare('SELECT * FROM learning_hours ORDER BY date').all(),
    'employee_id'
  );
  const enrollments = ids.map((id) => ({
    employeeId: id,
    enrolled: (enrollByEmp.get(id) || []).map((e) => ({
      courseId: e.course_id,
      progress: e.progress,
      hoursCompleted: e.hours_completed,
      status: e.status,
      startDate: e.start_date
    })),
    weeklyLearningHours: (hoursByEmp.get(id) || []).map((h) => ({
      date: h.date,
      hours: h.hours
    }))
  }));
  const learning = { courses, weeklyLearningTarget, enrollments };

  const hybridByEmp = groupBy(
    db.prepare('SELECT * FROM hybrid_records ORDER BY date').all(),
    'employee_id'
  );
  const hybridWork = ids.map((id) => ({
    employeeId: id,
    records: (hybridByEmp.get(id) || []).map((r) => ({
      date: r.date,
      day: r.day,
      workMode: r.work_mode,
      productiveHours: r.productive_hours,
      expectedProductiveHours: r.expected_productive_hours,
      tasksCompleted: r.tasks_completed,
      meetingsAttended: r.meetings_attended,
      learningHours: r.learning_hours
    }))
  }));

  const recommendationStatuses = Object.fromEntries(
    db
      .prepare('SELECT rec_id, status FROM recommendation_statuses')
      .all()
      .map((r) => [r.rec_id, r.status])
  );

  return {
    users,
    organization,
    officeAttendance,
    meetings,
    engagement,
    learning,
    hybridWork,
    kpiWeights,
    recommendationStatuses
  };
};

app.post('/api/auth/login', (req, res) => {
  const { employeeId, password } = req.body || {};
  if (!employeeId || !password) {
    return res.status(400).json({ error: 'Employee ID (or email) and password are required.' });
  }
  const raw = String(employeeId).trim();
  const employee = db
    .prepare('SELECT * FROM employees WHERE employee_id = ? OR lower(email) = lower(?)')
    .get(raw.toUpperCase(), raw);
  if (!employee) {
    return res.status(401).json({ error: 'Employee ID or email not found. Please check your credentials.' });
  }
  if (!bcrypt.compareSync(String(password), employee.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, employee_id, created_at) VALUES (?, ?, ?)').run(
    token,
    employee.employee_id,
    new Date().toISOString()
  );
  res.json({ token, user: publicUser(employee) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.employee) });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  res.json({ ok: true });
});

app.get('/api/auth/demo-accounts', (req, res) => {
  const accounts = DEMO_ACCOUNTS.map((a) => {
    const e = db
      .prepare('SELECT employee_id, name, role FROM employees WHERE employee_id = ?')
      .get(a.employeeId);
    return e ? { employeeId: e.employee_id, name: e.name, role: e.role, password: a.password } : null;
  }).filter(Boolean);
  res.json(accounts);
});

app.get('/api/datasets', requireAuth, (req, res) => {
  res.json(buildDatasets(req.employee));
});

app.get('/api/recommendation-statuses', requireAuth, (req, res) => {
  const statuses = Object.fromEntries(
    db
      .prepare('SELECT rec_id, status FROM recommendation_statuses')
      .all()
      .map((r) => [r.rec_id, r.status])
  );
  res.json(statuses);
});

app.put('/api/recommendation-statuses/:recId', requireAuth, (req, res) => {
  const { recId } = req.params;
  const { status } = req.body || {};
  const allowed = ['Not Started', 'In Progress', 'Completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  db.prepare(`
    INSERT INTO recommendation_statuses (rec_id, status, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(rec_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at
  `).run(recId, status, new Date().toISOString());
  res.json({ recId, status });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
