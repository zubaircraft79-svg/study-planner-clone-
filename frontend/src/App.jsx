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
  Sparkles,
  Moon,
  Sun,
  Bell,
  Search,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, createContext, useContext } from "react";

import DashboardPage from "./pages/Dashboard";
import StudyPlannerPage from "./pages/StudyPlanner";
import SubjectManagementPage from "./pages/SubjectManagement";
import CalendarViewPage from "./pages/CalendarView";
import ProgressTrackingPage from "./pages/ProgressTracking";
import { ToastProvider } from "./components/Toast";

// Theme context
const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, description: "Overview & stats" },
  { to: "/planner", label: "Study Planner", icon: Sparkles, description: "Generate plans" },
  { to: "/subjects", label: "Subjects", icon: BookOpen, description: "Manage courses" },
  { to: "/calendar", label: "Calendar", icon: Calendar, description: "Weekly schedule" },
  { to: "/progress", label: "Progress", icon: BarChart3, description: "Track goals" },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

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
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col lg:translate-x-0"
      >
        {/* Brand */}
        <div className="p-6 flex items-center gap-4">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </motion.div>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-foreground tracking-tight">StudyFlow</h1>
            <p className="text-xs text-muted-foreground">Smart Planning</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-secondary rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
          {navigation.map(({ to, label, icon: Icon, description }, index) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 group relative overflow-hidden
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? "bg-white/20" : "bg-secondary group-hover:bg-primary/10"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{label}</p>
                    <p className={`text-xs truncate ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {description}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "opacity-100" : ""}`} />
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer card */}
        <div className="p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border border-primary/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Pro Tip</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use keyboard shortcuts for faster navigation. Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-2xs">?</kbd> for help.
            </p>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}

function TopBar({ onMenuClick, theme, toggleTheme }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-secondary rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          
          {/* Search (desktop) */}
          <div className="hidden md:flex items-center">
            <motion.div 
              className="relative"
              initial={false}
              animate={{ width: showSearch ? 300 : 200 }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                onFocus={() => setShowSearch(true)}
                onBlur={() => setShowSearch(false)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-2xs">
                /
              </kbd>
            </motion.div>
          </div>
        </div>

        {/* Mobile brand */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground">StudyFlow</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search (mobile) */}
          <button className="md:hidden p-2 hover:bg-secondary rounded-xl transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Notifications */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 hover:bg-secondary rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </motion.button>

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 hover:bg-secondary rounded-xl transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </motion.button>

          {/* Profile */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-medium text-sm shadow-md shadow-primary/20"
          >
            S
          </motion.button>
        </div>
      </div>
    </header>
  );
}

function PageTransition({ children }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ToastProvider>
        <div className="flex min-h-screen bg-background">
          {/* Background decorations */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
            <TopBar 
              onMenuClick={() => setSidebarOpen(true)} 
              theme={theme} 
              toggleTheme={toggleTheme}
            />

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
      </ToastProvider>
    </ThemeContext.Provider>
  );
}
