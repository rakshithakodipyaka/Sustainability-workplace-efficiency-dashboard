# Sustainability & Workplace Efficiency Dashboard

A complete, responsive **localhost** web application for analysing employee productivity,
workplace sustainability, hybrid-work effectiveness, meeting efficiency, employee
engagement and learning participation through interactive KPI dashboards.

It ships with one week of realistic simulated data (**Monday 5 October 2026 – Sunday
11 October 2026**) for **13 users** across **three roles**: HR, Manager and Employee.
Every KPI, chart and score is **calculated at runtime from the local JSON dataset** —
no chart value is hardcoded.

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

No database, no backend server, no paid API and no external authentication service are
required.

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

## Step 3 — Start the development server

```bash
npm run dev
```

Vite starts on a **fixed port** and opens your browser automatically:

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
| `npm run dev` | Start the development server at <http://localhost:3000> |
| `npm run build` | Create an optimised production build in `dist/` |
| `npm run preview` | Serve the production build locally to test it |

**Port already in use?** The port is set in `vite.config.js` (`server.port = 3000`).
Close the other process or change `3000` to another value such as `5173`, then run
`npm run dev` again.

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

> **Demo authentication only.** These passwords are stored in plain text in
> `src/data/users.json` so the demo can run with no backend. Passwords are removed from
> the session object before it is stored. This is **not** production-safe authentication —
> never store real credentials this way.

---

# TECHNOLOGY STACK

- **Frontend:** React 18 with Vite 5
- **Language:** JavaScript (JSX) — no TypeScript
- **Markup / Styling:** HTML5, CSS3 (custom properties, Flexbox, CSS Grid)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router v6
- **State:** React Context API (`AuthContext`, `DashboardContext`)
- **Data:** local JSON files imported into the bundle
- **Persistence:** `localStorage` for demo-only interactive state
- **Backend:** none

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

All data lives in `src/data/` and is joined on `employeeId`.

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
  services/      dataService, kpiService, recommendationService, exportService
  utils/         calculations, formatters, permissions
  data/          users / organization / officeAttendance / meetings / engagement /
                 learning / hybridWork / kpiWeights (.json)
  styles/        global.css, dashboard.css, components.css
  App.jsx
  main.jsx
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
| Recommendation statuses look stale | They are stored in browser `localStorage`. Clear site data for `localhost` to reset them. |

---

# LIMITATIONS OF THIS DEMO

- **Demo authentication.** Passwords are plain text in `users.json` and sessions live in
  `localStorage`. There is no token, expiry, server-side verification or password hashing.
  Suitable for a local demonstration only.
- **No backend.** All data is bundled at build time from local JSON files. Browser changes
  (recommendation statuses) are stored in `localStorage` and **do not rewrite the JSON
  source files**. Clearing storage resets them.
- **Simulated data.** All metrics are generated for demonstration. They do not describe any
  real organization, and no conclusion should be drawn about real employee value, morale or
  productivity. Engagement and attendance scores are indicators, not measures of an
  individual's worth.
- **Estimated environmental figures.** CO₂ figures derive from the documented assumptions in
  `organization.json` and are explicitly labelled as estimates.
- **Single-week window.** The dataset covers one week, so trends are day/week based rather
  than multi-month.
- **Client-side only.** There is no server-side authorization; production use would require
  a real backend with server-enforced access control.

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
