import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, createSchema, isSeeded } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDataDir = path.join(__dirname, '..', 'src', 'data');

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(srcDataDir, name), 'utf8'));

const TABLES_IN_DELETE_ORDER = [
  'sessions',
  'recommendation_statuses',
  'learning_hours',
  'enrollments',
  'activities',
  'meetings',
  'attendance',
  'hybrid_records',
  'courses',
  'employees',
  'org_settings',
  'kpi_settings'
];

export const seedDatabase = ({ force = false } = {}) => {
  createSchema();

  if (isSeeded() && !force) {
    return { seeded: false, reason: 'database already seeded' };
  }

  const users = readJson('users.json');
  const organization = readJson('organization.json');
  const officeAttendance = readJson('officeAttendance.json');
  const meetings = readJson('meetings.json');
  const engagement = readJson('engagement.json');
  const learning = readJson('learning.json');
  const hybridWork = readJson('hybridWork.json');
  const kpiWeights = readJson('kpiWeights.json');

  const clear = db.transaction(() => {
    db.pragma('foreign_keys = OFF');
    for (const table of TABLES_IN_DELETE_ORDER) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
    db.pragma('foreign_keys = ON');
  });

  const insertUsers = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO employees
        (employee_id, name, role, email, department, team, manager_id, avatar, password_hash)
      VALUES
        (@employeeId, @name, @role, @email, @department, @team, @managerId, @avatar, @passwordHash)
    `);
    for (const u of users) {
      stmt.run({
        employeeId: u.employeeId,
        name: u.name,
        role: u.role,
        email: u.email ?? null,
        department: u.department ?? null,
        team: u.team ?? null,
        managerId: u.managerId ?? null,
        avatar: u.avatar ?? null,
        passwordHash: bcrypt.hashSync(u.password, 10)
      });
    }
  });

  const insertAttendance = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO attendance
        (employee_id, date, day, planned, present, tap_in, tap_out, hours_in_office)
      VALUES
        (@employeeId, @date, @day, @planned, @present, @tapIn, @tapOut, @hoursInOffice)
    `);
    for (const person of officeAttendance) {
      for (const r of person.records) {
        stmt.run({
          employeeId: person.employeeId,
          date: r.date,
          day: r.day,
          planned: r.planned ? 1 : 0,
          present: r.present ? 1 : 0,
          tapIn: r.tapIn ?? null,
          tapOut: r.tapOut ?? null,
          hoursInOffice: r.hoursInOffice ?? 0
        });
      }
    }
  });

  const insertMeetings = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO meetings
        (employee_id, meeting_id, date, day, title, start_time, end_time, duration, scheduled, attended)
      VALUES
        (@employeeId, @meetingId, @date, @day, @title, @startTime, @endTime, @duration, @scheduled, @attended)
    `);
    for (const person of meetings) {
      for (const m of person.meetings) {
        stmt.run({
          employeeId: person.employeeId,
          meetingId: m.meetingId,
          date: m.date,
          day: m.day ?? null,
          title: m.title ?? null,
          startTime: m.startTime ?? null,
          endTime: m.endTime ?? null,
          duration: m.duration ?? 0,
          scheduled: m.scheduled ? 1 : 0,
          attended: m.attended ? 1 : 0
        });
      }
    }
  });

  const insertActivities = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO activities
        (employee_id, activity_id, date, day, name, category, available, attended)
      VALUES
        (@employeeId, @activityId, @date, @day, @name, @category, @available, @attended)
    `);
    for (const person of engagement) {
      for (const a of person.activities) {
        stmt.run({
          employeeId: person.employeeId,
          activityId: a.activityId,
          date: a.date,
          day: a.day ?? null,
          name: a.name ?? null,
          category: a.category ?? null,
          available: a.available ? 1 : 0,
          attended: a.attended ? 1 : 0
        });
      }
    }
  });

  const insertCourses = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO courses (course_id, title, total_hours, category)
      VALUES (@courseId, @title, @totalHours, @category)
    `);
    for (const c of learning.courses) {
      stmt.run({
        courseId: c.courseId,
        title: c.title,
        totalHours: c.totalHours ?? null,
        category: c.category ?? null
      });
    }
  });

  const insertEnrollments = db.transaction(() => {
    const courseStmt = db.prepare(`
      INSERT INTO enrollments
        (employee_id, course_id, progress, hours_completed, status, start_date)
      VALUES
        (@employeeId, @courseId, @progress, @hoursCompleted, @status, @startDate)
    `);
    const hoursStmt = db.prepare(`
      INSERT INTO learning_hours (employee_id, date, hours)
      VALUES (@employeeId, @date, @hours)
    `);
    for (const person of learning.enrollments) {
      for (const e of person.enrolled) {
        courseStmt.run({
          employeeId: person.employeeId,
          courseId: e.courseId,
          progress: e.progress ?? 0,
          hoursCompleted: e.hoursCompleted ?? 0,
          status: e.status ?? null,
          startDate: e.startDate ?? null
        });
      }
      for (const h of person.weeklyLearningHours) {
        hoursStmt.run({
          employeeId: person.employeeId,
          date: h.date,
          hours: h.hours ?? 0
        });
      }
    }
  });

  const insertHybrid = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO hybrid_records
        (employee_id, date, day, work_mode, productive_hours, expected_productive_hours,
         tasks_completed, meetings_attended, learning_hours)
      VALUES
        (@employeeId, @date, @day, @workMode, @productiveHours, @expectedProductiveHours,
         @tasksCompleted, @meetingsAttended, @learningHours)
    `);
    for (const person of hybridWork) {
      for (const r of person.records) {
        stmt.run({
          employeeId: person.employeeId,
          date: r.date,
          day: r.day ?? null,
          workMode: r.workMode ?? null,
          productiveHours: r.productiveHours ?? 0,
          expectedProductiveHours: r.expectedProductiveHours ?? 0,
          tasksCompleted: r.tasksCompleted ?? 0,
          meetingsAttended: r.meetingsAttended ?? 0,
          learningHours: r.learningHours ?? 0
        });
      }
    }
  });

  const insertOrgSettings = db.transaction(() => {
    db.prepare(`
      INSERT INTO org_settings
        (id, name, total_employees, total_managers, hr_count, office_capacity, weekly_work_days,
         departments, teams, week_dates, week_day_names, sustainability_config)
      VALUES
        (1, @name, @totalEmployees, @totalManagers, @hrCount, @officeCapacity, @weeklyWorkDays,
         @departments, @teams, @weekDates, @weekDayNames, @sustainabilityConfig)
    `).run({
      name: organization.name,
      totalEmployees: organization.totalEmployees,
      totalManagers: organization.totalManagers,
      hrCount: organization.hrCount,
      officeCapacity: organization.officeCapacity,
      weeklyWorkDays: organization.weeklyWorkDays,
      departments: JSON.stringify(organization.departments),
      teams: JSON.stringify(organization.teams),
      weekDates: JSON.stringify(organization.weekDates),
      weekDayNames: JSON.stringify(organization.weekDayNames),
      sustainabilityConfig: JSON.stringify(organization.sustainabilityConfig)
    });
  });

  const insertKpiSettings = db.transaction(() => {
    db.prepare(`
      INSERT INTO kpi_settings
        (id, weights, score_bands, weekly_meeting_hour_limit, weekly_learning_target,
         expected_productive_hours_per_day)
      VALUES
        (1, @weights, @scoreBands, @weeklyMeetingHourLimit, @weeklyLearningTarget,
         @expectedProductiveHoursPerDay)
    `).run({
      weights: JSON.stringify(kpiWeights.weights),
      scoreBands: JSON.stringify(kpiWeights.scoreBands),
      weeklyMeetingHourLimit: kpiWeights.weeklyMeetingHourLimit,
      weeklyLearningTarget: kpiWeights.weeklyLearningTarget,
      expectedProductiveHoursPerDay: kpiWeights.expectedProductiveHoursPerDay
    });
  });

  const runSeed = db.transaction(() => {
    clear();
    insertUsers();
    insertAttendance();
    insertMeetings();
    insertActivities();
    insertCourses();
    insertEnrollments();
    insertHybrid();
    insertOrgSettings();
    insertKpiSettings();
  });

  runSeed();

  return {
    seeded: true,
    counts: {
      users: users.length,
      attendance: db.prepare('SELECT COUNT(*) AS n FROM attendance').get().n,
      meetings: db.prepare('SELECT COUNT(*) AS n FROM meetings').get().n,
      activities: db.prepare('SELECT COUNT(*) AS n FROM activities').get().n,
      courses: db.prepare('SELECT COUNT(*) AS n FROM courses').get().n,
      enrollments: db.prepare('SELECT COUNT(*) AS n FROM enrollments').get().n,
      hybridRecords: db.prepare('SELECT COUNT(*) AS n FROM hybrid_records').get().n
    }
  };
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const force = process.argv.includes('--force');
  const result = seedDatabase({ force });
  console.log('Seed result:', result);
}
