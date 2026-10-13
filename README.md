# Sustainability & Workplace Efficiency Dashboard

A complete, responsive **localhost** web application for analysing employee productivity,
workplace sustainability, hybrid-work effectiveness, meeting efficiency, employee
engagement and learning participation through interactive KPI dashboards.

It ships with one week of realistic simulated data (**Monday 5 October 2026 – Sunday
11 October 2026**) for **13 users** across **three roles**: HR, Manager and Employee.
All data is stored in a local **SQLite** database and served through a small **Express
REST API**; every KPI, chart and score is **calculated at runtime from data returned by
that API** — no chart value is hardcoded.

---

# QUICK START (do this first)

## Step 0 — What you need before installing

| Requirement | Minimum | How to check |
| --- | --- | --- |
| **Node.js** | v18 or newer (v20 LTS recommended) | `node --version` |
| **npm** | v9 or newer (comes with Node.js) | `npm --version` |
| A modern browser | Chrome / Edge / Firefox | — |
| Internet | Only for the one-time `npm install` | — |

> **Important:** you must install **Node.js** first. Without it, `npm` does not exist and
> the project cannot start. Download Node.js LTS from **<https://nodejs.org>** (choose the
> Windows `.msi` installer), then **close and reopen your terminal** and confirm
> `node --version` prints a version.

No external database service, cloud backend, paid API or external authentication
provider is required. The backend and the SQLite database both run locally.

## Step 1 — Go to the project folder

```bash
cd Sustainability-workplace-efficiency-dashboard
```

## Step 2 — Install dependencies (run once)

```bash
npm install
```

This installs React, React Router, Recharts, Lucide React and Vite. It creates the
`node_modules` folder. You only need to run this again if `package.json` changes.

## Step 3 — Start the development servers

```bash
npm run dev
```

This starts **both** processes together:

- the **Express API** on <http://localhost:4000> (auto-seeds the SQLite database on first run)
- **Vite** on <http://localhost:3000>, which opens your browser automatically and proxies `/api` to the API server

### http://localhost:3000

## Step 4 — Log in with a demo account

Use the **Quick Login** buttons on the login page, or type any credential from the
[table below](#demo-login-credentials).

## Step 5 — Stop the server

Press `Ctrl + C` in the terminal.

---

# COMMANDS

Run all commands from the project root folder.

| Command | What it does |
| --- | --- |
| `npm install` | Install all dependencies (run once, after cloning) |
| `npm run dev` | Start the API (port 4000) **and** the Vite dev server (port 3000) together |
| `npm run server` | Start only the Express API server (port 4000) |
| `npm run web` | Start only the Vite dev server (port 3000) |
| `npm run seed` | (Re)build the SQLite database from `src/data/*.json` (only if empty) |
| `npm run seed:force` | Force a full reseed, overwriting all data and saved statuses |
| `npm run build` | Create an optimised production build in `dist/` |
| `npm run preview` | Serve the production build locally to test it |

**Port already in use?** The frontend port is set in `vite.config.js` (`server.port = 3000`)
and the API port in `server/index.js` (default `4000`, overridable with the `PORT`
environment variable). Close the other process or change the value, then run again.
  
---

# DEMO LOGIN CREDENTIALS

**13 pre-defined accounts.** The login page also provides one-click Quick Login buttons
for HR001, MGR001, MGR002 and EMP001. Employee IDs are **not** case-sensitive
(`emp001`, `EMP001` and `Emp001` all work).

### HR — 1 account

| Employee ID | Name | Role | Password |
| --- | --- | --- | --- |
| `HR001` | Priya Sharma | HR | `hr@demo123` |

### Managers — 2 accounts

| Employee ID | Name | Role | Team | Password |
| --- | --- | --- | --- | --- |
| `MGR001` | Rahul Verma | Manager | Alpha (Engineering) | `mgr@demo123` |
| `MGR002` | Ananya Iyer | Manager | Beta (Product) | `mgr@demo123` |

### Employees — 10 accounts

All employee accounts use the password **`emp@demo123`**.

| Employee ID | Name | Team | Reports to | Password |
| --- | --- | --- | --- | --- |
| `EMP001` | Aditi Reddy | Alpha | MGR001 | `emp@demo123` |
| `EMP002` | Arjun Kumar | Alpha | MGR001 | `emp@demo123` |
| `EMP003` | Sneha Rao | Alpha | MGR001 | `emp@demo123` |
| `EMP004` | Kiran Patel | Alpha | MGR001 | `emp@demo123` |
| `EMP005` | Meera Singh | Alpha | MGR001 | `emp@demo123` |
| `EMP006` | Vikram Das | Beta | MGR002 | `emp@demo123` |
| `EMP007` | Neha Gupta | Beta | MGR002 | `emp@demo123` |
| `EMP008` | Rohan Mehta | Beta | MGR002 | `emp@demo123` |
| `EMP009` | Pooja Nair | Beta | MGR002 | `emp@demo123` |
| `EMP010` | Aditya Joshi | Beta | MGR002 | `emp@demo123` |

### Try these to see how role access differs

| Log in as | What you will see |
| --- | --- |
| `HR001` / `hr@demo123` | Organization-wide KPIs, all 10 employees, both managers, team comparison, sustainability insights, Reports and the Executive Presentation |
| `MGR001` / `mgr@demo123` | Own KPIs plus **only** the 5 Alpha team members (EMP001–EMP005) — Beta staff are inaccessible |
| `MGR002` / `mgr@demo123` | Own KPIs plus **only** the 5 Beta team members (EMP006–EMP010) — Alpha staff are inaccessible |
| `EMP001` / `emp@demo123` | Only Aditi Reddy's personal dashboard — no other employee is visible |
| `EMP009` / `emp@demo123` | Only Pooja Nair's records, showing a low-scoring profile with improvement recommendations |

> **Demo authentication only.** Passwords are stored as **bcrypt hashes** in the SQLite
> database and verified server-side by `POST /api/auth/login`, which returns an opaque
> session token. The plain-text demo passwords below exist only to seed the database and
> power the Quick Login buttons (served by `GET /api/auth/demo-accounts`). The token is
> demo-grade: there is no expiry or refresh. Do **not** use this as-is for production or
> with real credentials.

---

# TECHNOLOGY STACK

- **Frontend:** React 18 with Vite 5
- **Language:** JavaScript (JSX) — no TypeScript
- **Markup / Styling:** HTML5, CSS3 (custom properties, Flexbox, CSS Grid)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router v6
- **State:** React Context API (`AuthContext`, `DashboardContext`)
- **Backend:** Node.js + Express REST API (`server/`)
- **Database:** SQLite via `better-sqlite3` (`server/data/dashboard.db`), seeded from `src/data/*.json`
- **Auth:** bcrypt-hashed passwords, server-issued opaque session tokens (`Authorization: Bearer`)
- **Data flow:** the frontend fetches all datasets from `GET /api/datasets` after login and caches them in memory; KPI maths still runs client-side over the fetched data
- **Persistence:** recommendation statuses are stored in SQLite (server-side); only the session token is kept in `localStorage`

---

# APPLICATION FEATURES

| Capability | Description |
| --- | --- |
| Authentication | Login by Employee ID + password, quick-login buttons, show/hide password, validation and inline error messages |
| Role-based access | HR, Manager and Employee dashboards enforced in routing **and** in the data-access layer |
| Five core KPIs | Office Utilization, Meeting Effectiveness, Employee Engagement, Learning Participation, Hybrid Work Effectiveness |
| Overall score | Weighted composite out of 10 with configurable weights and score bands |
| Interactive analytics | Bar, line, area, pie, donut and composed charts with tooltips, legends and responsive containers |
| KPI detail pages | One route per KPI with definition, formula, key metrics, charts, daily breakdown, insights and recommendations |
| Improvement Roadmap | Rule-based, data-driven recommendations with Not Started / In Progress / Completed statuses persisted to `localStorage` |
| Sustainability insights | Occupancy, unused capacity, avoided commuting days and estimated CO₂ with documented assumptions |
| Reports | Weekly summary, employee and team comparison, meeting, learning, hybrid and sustainability reports with **working CSV export** and print layout |
| Executive Presentation | 12 slides with navigation controls, overview mode and print layout |
| Responsive UI | Desktop, tablet and mobile layouts with a collapsible sidebar |

---

# ROLE PERMISSION RULES

| Capability | HR | Manager | Employee |
| --- | --- | --- | --- |
| Organization-wide KPIs | Yes | No | No |
| Own KPI profile | n/a (administrator) | Yes | Yes |
| Direct reports' individual records | Yes (all staff) | Own 5 reports only | No |
| Other managers' reports | Yes | **No** | No |
| Employee directory (10 employees + 2 managers) | Yes | Own team only | No |
| Team comparison | Yes (both teams) | Own team only | No |
| Improvement Roadmap | Organization level | Team + self | Personal |
| Reports | Organization | Team + self | Personal only |
| Executive Presentation | Yes | No | No |

Enforcement is layered so that hiding UI elements is never the only protection:

1. **Routing** — `src/App.jsx` wraps every route in `ProtectedRoute` with an
   `allowedRoles` allow-list and redirects unauthorised roles to their own dashboard.
2. **Data access** — `src/utils/permissions.js` exposes `canViewEmployee`, `canViewTeam`,
   `canViewOrgData`, `canViewReports`, `canViewAllEmployees` and `getAccessibleEmployeeIds`.
   `src/pages/EmployeeView.jsx` calls these before rendering an individual record and shows
   an access-denied state otherwise.
3. **Navigation** — `src/components/Sidebar.jsx` filters nav items by role.

---

# KPI DEFINITIONS AND FORMULAS

All scores are clamped to **0–10** and rounded to one decimal place. All division-by-zero
cases are guarded.

### KPI 1 — Office Utilization

```
Attendance Percentage     = (Office Days Attended / Planned Office Days) × 100
Office Utilization Score  = min(10, Attendance Percentage / 10)
```

Workspace utilisation is calculated **separately** from employee attendance, using
`organization.json → officeCapacity`:

```
Workspace Utilization % = (Employees Present / Office Capacity) × 100
```

Missing tap-in/tap-out events are surfaced as missing rather than having hours invented.

### KPI 2 — Meeting Effectiveness

```
Meeting Attendance Score = (Meetings Attended / Meetings Scheduled) × 10
Meeting Load Score       = max(0, 10 − (Meeting Hours / Weekly Meeting Hour Limit) × 10)
Meeting Effectiveness    = 0.6 × Attendance Score + 0.4 × Load Score
```

Weekly meeting-hour limit = **10 hours**. With zero scheduled meetings the attendance
component defaults to full marks and the load component to 10, so no division-by-zero
occurs. Employees above the limit are flagged as **overloaded**. Attendance alone is never
treated as a measure of meeting quality.

### KPI 3 — Employee Engagement

```
Activity Participation %     = (Activities Attended / Activities Available) × 100
Activity Participation Score = Activity Participation % / 10
Employee Engagement Score    = 0.7 × Activity Participation Score + 0.3 × Office Attendance Score
```

A **demo engagement indicator** only. Remote work is never penalised and office presence is
never treated as proof of engagement.

### KPI 4 — Learning Participation

```
Course Completion %     = (Courses Completed / Courses Enrolled) × 100
Learning Progress Score = Average progress % across enrolled courses / 10
Learning Hours Score    = min(10, (Learning Hours Completed / Weekly Target) × 10)
Learning Participation  = 0.6 × Learning Progress Score + 0.4 × Learning Hours Score
```

Weekly learning target = **3 hours**. Employees with no enrolments are handled without
division-by-zero errors.

### KPI 5 — Hybrid Work Effectiveness

```
Productivity Index = (Productive Hours / Expected Productive Hours) × 100
```

Expected productive hours = **7 per workday**. The weekly score averages the capped
office-day and remote-day productivity scores:

- both work modes present → average of the two scores;
- only one mode present → that score is used and the comparison is **labelled incomplete**.

The dashboard never assumes remote work is inherently better or worse — it reports the
actual simulated difference.

### Overall Performance Score

```
Overall = 0.20 × Office Utilization
        + 0.20 × Meeting Effectiveness
        + 0.20 × Employee Engagement
        + 0.20 × Learning Participation
        + 0.20 × Hybrid Work Effectiveness
```

Weights are configurable in `src/data/kpiWeights.json` and applied by
`src/utils/calculations.js → calculateOverallScore`.

| Score band | Label |
| --- | --- |
| 9.0 – 10.0 | Excellent |
| 7.5 – 8.9 | Good |
| 6.0 – 7.4 | Needs Improvement |
| Below 6.0 | Requires Attention |

The **organization score** averages the 10 employee scores only. Manager scores are
reported separately and are never silently mixed into the employee average.

---

# DATA FILES

The `src/data/` files are the **seed source**. `npm run seed` (or the first API start)
loads them into the SQLite database; the running frontend reads data only from the API and
does not bundle these JSON files. All tables are joined on `employeeId`.

| File | Contents |
| --- | --- |
| `users.json` | 13 accounts: employee ID, name, role, demo password, email, department, team, manager ID and `directReports` for managers |
| `organization.json` | Organization name, headcount, teams, office capacity, the seven week dates, weekday names and sustainability assumptions (commute distance, CO₂ emission factor) |
| `officeAttendance.json` | Seven daily records per person: `planned`, `present`, `tapIn`, `tapOut`, `hoursInOffice` |
| `meetings.json` | Per-person meeting events with date, title, start/end, duration, `scheduled` and `attended`, plus the weekly meeting-hour limit |
| `engagement.json` | Per-person activities (collaboration, wellness, learning, volunteering, team-building) with `available` / `attended` |
| `learning.json` | Course catalogue and per-person `enrollments` with progress %, hours completed, status and seven days of `weeklyLearningHours` |
| `hybridWork.json` | Seven daily records per person: `workMode` (`office` / `remote` / `off`), `productiveHours`, `tasksCompleted`, `meetingsAttended`, `learningHours` |
| `kpiWeights.json` | KPI weights, score bands, weekly meeting-hour limit, weekly learning target and expected productive hours per day |

Every one of the 12 employees/managers has seven daily records in the attendance and hybrid
files plus weekly learning hours. Weekend days are marked as non-working.

**Data is deliberately varied** so every chart, filter and comparison has meaningful input:
high performers, a strong learner with low office attendance, an employee with meeting
overload, an employee with high attendance but low engagement, balanced hybrid
productivity, and employees needing improvement.

---

# BACKEND & DATABASE

The backend lives in `server/` and is a small Express app backed by SQLite
(`server/data/dashboard.db`, generated and git-ignored).

| File | Purpose |
| --- | --- |
| `server/db.js` | Opens the SQLite database, creates the schema, checks whether it is seeded |
| `server/seed.js` | Reads `src/data/*.json`, hashes passwords and writes everything into SQLite |
| `server/index.js` | Express app: auth middleware, role-filtered datasets and recommendation-status routes |

### Configuration (optional `.env`)

The server runs with **no `.env` file**: dotenv is a no-op when the file is missing and
every setting falls back to a built-in default. Copy `.env.example` to `.env` only if you
want to override:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Port the Express API listens on |
| `DB_PATH` | `server/data/dashboard.db` | SQLite file path (relative paths resolve from the project root) |

`.env` is git-ignored; `.env.example` is committed as a template.

Tables: `employees`, `attendance`, `meetings`, `activities`, `courses`, `enrollments`,
`learning_hours`, `hybrid_records`, `org_settings`, `kpi_settings`, `sessions`,
`recommendation_statuses`. Manager `directReports`, per-person daily records and config
arrays are reassembled into the exact shapes the frontend expects.

### API endpoints

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | no | Verify credentials, return `{ token, user }` |
| `GET` | `/api/auth/me` | yes | Return the current user for a token |
| `POST` | `/api/auth/logout` | yes | Invalidate the current token |
| `GET` | `/api/auth/demo-accounts` | no | Quick-login accounts for the demo login page |
| `GET` | `/api/datasets` | yes | **All datasets, filtered to what the caller may see** |
| `GET` | `/api/recommendation-statuses` | yes | Current recommendation statuses |
| `PUT` | `/api/recommendation-statuses/:recId` | yes | Update one recommendation status |
| `GET` | `/api/health` | no | Liveness check |

**Authorisation is enforced on the server.** `GET /api/datasets` returns only the rows the
signed-in role may see — HR gets everyone, a Manager gets themselves plus their own direct
reports, an Employee gets only themselves. The client-side checks in `src/utils/permissions.js`
remain as a second layer.

Passwords are stored as bcrypt hashes; the plain-text demo passwords never leave the seed
script (they are only re-exposed for the clearly-labelled demo quick-login buttons).

---

# DUMMY DATA ASSUMPTIONS

- Reporting period is **Monday 5 October 2026 to Sunday 11 October 2026**.
- Standard Monday–Friday working week; weekends are non-working with optional learning.
- One employee belongs to one team and reports to one manager (5 reports per manager).
- Office capacity is **20 desks** for 12 staff, used only for workspace utilisation.
- Meeting limit **10 h/week**, learning target **3 h/week**, expected productive hours
  **7 per workday**.
- All tap-in/tap-out, meeting, activity, course and productivity records are **simulated**.
- Distances and emissions are illustrative: commute distance **25 km each way** and an
  emission factor of **0.21 kg CO₂ per km** (car). Formula:
  `remote days × round-trip distance × emission factor`. These are **estimates**, not
  measured savings, and the assumption is shown in the interface.

---

# INTERACTIVE FEATURES

- Click any KPI card (mouse **or** keyboard — cards are focusable and respond to
  Enter/Space) to open its detail page.
- Click an employee to open their individual profile if the role permits it.
- Filter HR views by manager/team, KPI category, day of week and score range.
- **Period filter** (all dashboards): *This Week*, *Weekdays*, or a *Custom Range* with
  From/To calendars constrained to the seeded week. The selection is global — it re-scopes
  every KPI on every page.
- Absolute targets **prorate** to the selected span so short ranges stay meaningful:
  the meeting-hour limit scales by workdays ÷ 5 and the learning target by days ÷ 7
  (a full week leaves both unchanged). Per-day metrics (attendance, productivity) are
  simply filtered to the range.
- Filters affect the visible charts, KPI calculations and summary metrics.
- Switch between chart types where offered and reveal raw metric details behind a KPI.
- Export reports to **CSV** and print reports and presentation slides (print stylesheet
  hides navigation chrome).
- Update recommendation statuses; changes persist in `localStorage`.
- Responsive sidebar with overlay behaviour on tablet and mobile.
- Topbar insights panel (data-derived, role-aware) and profile menu with logout.
- Empty states and error handling, including a 404 page.

---

# PROJECT STRUCTURE

```
src/
  components/    Sidebar, Topbar, KPICard, ScoreGauge, ChartCard, EmployeeTable,
                 FilterBar, RecommendationCard, DashboardLayout
  pages/         Login, HRDashboard, ManagerDashboard, EmployeeDashboard,
                 EmployeeView, KPIDetail, ImprovementRoadmap, Reports,
                 ExecutivePresentation, Profile, NotFound
  context/       AuthContext, DashboardContext
  hooks/         useAuth, useKPIData
  services/      api, dataCache, dataService, kpiService, recommendationService, exportService
  utils/         calculations, formatters, permissions
  data/          users / organization / officeAttendance / meetings / engagement /
                 learning / hybridWork / kpiWeights (.json — seed source only)
  styles/        global.css, dashboard.css, components.css
  App.jsx
  main.jsx

server/
  db.js          SQLite connection + schema
  seed.js        loads src/data/*.json into SQLite
  index.js       Express API (auth, datasets, recommendation statuses)
  data/          generated SQLite database (git-ignored)
```

Data, calculation logic, components and page layouts are kept separate: pages never contain
scoring maths and services never contain markup.

---

# TROUBLESHOOTING

| Problem | Solution |
| --- | --- |
| `'npm' is not recognized` / `'node' is not recognized` | Node.js is not installed or not on `PATH`. Install Node.js LTS from <https://nodejs.org>, then **reopen the terminal**. |
| `npm install` fails or times out | Check your internet connection and re-run `npm install`. |
| Port 3000 is already in use | Close the process using it, or change `server.port` in `vite.config.js`, then run `npm run dev` again. |
| Blank page after start | Confirm you opened **http://localhost:3000** (not a `file://` path). Hard refresh with `Ctrl + Shift + R`. |
| `Cannot find module` errors | Delete `node_modules` and `package-lock.json`, then run `npm install` again. |
| Login says "Employee ID not found" | Use an exact ID from the credentials table above, e.g. `HR001`, `MGR001`, `EMP001`. |
| Recommendation statuses look stale | They are stored in SQLite. Re-run `npm run seed:force` to reset all data and statuses. |
| Login fails with a network/connection error | The API server is not running. Start it with `npm run dev` (runs both) or `npm run server`, then retry. |

---

# LIMITATIONS OF THIS DEMO

- **Demo authentication.** Passwords are bcrypt hashes in SQLite and login is verified
  server-side, but the session token has no expiry or refresh, the demo passwords are
  exposed by `/api/auth/demo-accounts`, and there is no HTTPS. Suitable for a local
  demonstration only.
- **Local backend only.** The API and SQLite database run on your machine. Recommendation
  statuses are written to SQLite, but the underlying `src/data/*.json` seed files are not
  rewritten — re-running `npm run seed:force` resets statuses and data.
- **Simulated data.** All metrics are generated for demonstration. They do not describe any
  real organization, and no conclusion should be drawn about real employee value, morale or
  productivity. Engagement and attendance scores are indicators, not measures of an
  individual's worth.
- **Estimated environmental figures.** CO₂ figures derive from the documented assumptions in
  `organization.json` and are explicitly labelled as estimates.
- **Single-week window.** The dataset covers one week, so trends are day/week based rather
  than multi-month.
- **Demo-grade API.** Authorisation (including role filtering of `/api/datasets`) is
  enforced by the local Express server, which is enough for a demo but is not a hardened
  production gateway (no rate limiting, token expiry, audit logging or HTTPS).

---

# VERIFICATION CHECKLIST

Verified against the running application:

- All 13 demo accounts log in and land on the correct role dashboard.
- HR sees all 10 employees, both managers and organization-wide KPIs.
- Each manager sees exactly their own 5 direct reports and no data from the other team.
- Each employee sees only their own records.
- Direct URL access to another team's or employee's records is blocked.
- All 5 KPI cards open working detail pages with charts, formula, daily breakdown, insights
  and recommendations for HR, Manager and Employee roles.
- Every employee and manager has five calculated KPI scores plus one overall score, all
  within 0–10 and derived from JSON.
- Sidebar navigation works for every role with correct active states.
- Filters change rendered metrics; KPI cards work with mouse and keyboard.
- CSV export downloads a real file; print layouts are available.
- The executive presentation contains all 12 slides.
- No console errors or React warnings on any page at 1440 / 1024 / 768 / 390 px widths.
