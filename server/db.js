import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH } from './env.js';

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export { DB_PATH };

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS employees (
  employee_id   TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  email         TEXT,
  department    TEXT,
  team          TEXT,
  manager_id    TEXT REFERENCES employees(employee_id),
  avatar        TEXT,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  employee_id     TEXT NOT NULL REFERENCES employees(employee_id),
  date            TEXT NOT NULL,
  day             TEXT NOT NULL,
  planned         INTEGER NOT NULL,
  present         INTEGER NOT NULL,
  tap_in          TEXT,
  tap_out         TEXT,
  hours_in_office REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (employee_id, date)
);

CREATE TABLE IF NOT EXISTS meetings (
  employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  meeting_id  TEXT NOT NULL,
  date        TEXT NOT NULL,
  day         TEXT NOT NULL,
  title       TEXT,
  start_time  TEXT,
  end_time    TEXT,
  duration    REAL,
  scheduled   INTEGER,
  attended    INTEGER,
  PRIMARY KEY (employee_id, meeting_id)
);

CREATE TABLE IF NOT EXISTS activities (
  employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  activity_id TEXT NOT NULL,
  date        TEXT NOT NULL,
  day         TEXT NOT NULL,
  name        TEXT,
  category    TEXT,
  available   INTEGER,
  attended    INTEGER,
  PRIMARY KEY (employee_id, activity_id)
);

CREATE TABLE IF NOT EXISTS courses (
  course_id   TEXT PRIMARY KEY,
  title       TEXT,
  total_hours REAL,
  category    TEXT
);

CREATE TABLE IF NOT EXISTS enrollments (
  employee_id     TEXT NOT NULL REFERENCES employees(employee_id),
  course_id       TEXT NOT NULL REFERENCES courses(course_id),
  progress        REAL,
  hours_completed REAL,
  status          TEXT,
  start_date      TEXT,
  PRIMARY KEY (employee_id, course_id)
);

CREATE TABLE IF NOT EXISTS learning_hours (
  employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  date        TEXT NOT NULL,
  hours       REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (employee_id, date)
);

CREATE TABLE IF NOT EXISTS hybrid_records (
  employee_id               TEXT NOT NULL REFERENCES employees(employee_id),
  date                      TEXT NOT NULL,
  day                       TEXT NOT NULL,
  work_mode                 TEXT,
  productive_hours          REAL,
  expected_productive_hours REAL,
  tasks_completed           INTEGER,
  meetings_attended         INTEGER,
  learning_hours            REAL,
  PRIMARY KEY (employee_id, date)
);

CREATE TABLE IF NOT EXISTS org_settings (
  id                    INTEGER PRIMARY KEY CHECK (id = 1),
  name                  TEXT,
  total_employees       INTEGER,
  total_managers        INTEGER,
  hr_count              INTEGER,
  office_capacity       INTEGER,
  weekly_work_days      INTEGER,
  departments           TEXT,
  teams                 TEXT,
  week_dates            TEXT,
  week_day_names        TEXT,
  sustainability_config TEXT
);

CREATE TABLE IF NOT EXISTS kpi_settings (
  id                                INTEGER PRIMARY KEY CHECK (id = 1),
  weights                           TEXT,
  score_bands                       TEXT,
  weekly_meeting_hour_limit         REAL,
  weekly_learning_target            REAL,
  expected_productive_hours_per_day REAL
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_statuses (
  rec_id     TEXT PRIMARY KEY,
  status     TEXT NOT NULL,
  updated_at TEXT
);
`;

export const createSchema = () => db.exec(SCHEMA_SQL);

export const isSeeded = () => {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'").get();
  if (!row) return false;
  const count = db.prepare('SELECT COUNT(*) AS n FROM employees').get();
  return count.n > 0;
};
