import { NavLink, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/Dashboard";
import StudyPlannerPage from "./pages/StudyPlanner";
import SubjectManagementPage from "./pages/SubjectManagement";
import CalendarViewPage from "./pages/CalendarView";
import ProgressTrackingPage from "./pages/ProgressTracking";

const navigation = [
  ["/", "Dashboard"],
  ["/planner", "Study Planner"],
  ["/subjects", "Subject Management"],
  ["/calendar", "Calendar View"],
  ["/progress", "Progress Tracking"],
];

export default function App() {
  return (
    <div className="app-shell">
      <div className="app-noise" />
      <div className="app-orb orb-a" />
      <div className="app-orb orb-b" />
      <div className="app-orb orb-c" />

      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="brand">
            <div className="brand-badge">SS</div>
            <div>
              <h1>Smart Study Planner</h1>
            </div>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <div className="page-shell">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/planner" element={<StudyPlannerPage />} />
            <Route path="/subjects" element={<SubjectManagementPage />} />
            <Route path="/calendar" element={<CalendarViewPage />} />
            <Route path="/progress" element={<ProgressTrackingPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}