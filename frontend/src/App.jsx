import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  BarChart3,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

import DashboardPage from "./pages/Dashboard";
import StudyPlannerPage from "./pages/StudyPlanner";
import SubjectManagementPage from "./pages/SubjectManagement";
import CalendarViewPage from "./pages/CalendarView";
import ProgressTrackingPage from "./pages/ProgressTracking";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Study Planner", icon: Calendar },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: GraduationCap },
  { to: "/progress", label: "Progress", icon: BarChart3 },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72 
          bg-foreground text-background
          flex flex-col
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-background">StudyFlow</h1>
            <p className="text-sm text-background/60">Smart Planning</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-2 hover:bg-background/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-background/70 hover:bg-background/10 hover:text-background"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-background/10">
          <p className="text-xs text-background/40">
            Achieve more with smart study planning
          </p>
        </div>
      </aside>
    </>
  );
}

function PageTransition({ children }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">StudyFlow</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <PageTransition>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/planner" element={<StudyPlannerPage />} />
              <Route path="/subjects" element={<SubjectManagementPage />} />
              <Route path="/calendar" element={<CalendarViewPage />} />
              <Route path="/progress" element={<ProgressTrackingPage />} />
            </Routes>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
