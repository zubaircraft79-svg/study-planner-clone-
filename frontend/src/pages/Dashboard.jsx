import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Flame,
  Target,
  Trophy,
  Zap,
  ChevronRight,
  Play,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../api";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import ProgressBar, { ProgressRing } from "../components/ProgressBar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { SparklineChart, DonutChart, WeekHeatmap } from "../components/MiniChart";
import { AnimatedCounter } from "../components/AnimatedCounter";

// Greeting based on time of day
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Mock data for charts
const weeklyStudyData = [45, 60, 30, 90, 75, 120, 85];
const recentActivityData = [
  { day: 0, value: 45 },
  { day: 1, value: 60 },
  { day: 2, value: 30 },
  { day: 3, value: 90 },
  { day: 4, value: 75 },
  { day: 5, value: 120 },
  { day: 6, value: 85 },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [summaryData, progressData] = await Promise.all([
          api.getDashboard(),
          api.getProgress(),
        ]);
        setSummary(summaryData);
        setProgress(progressData);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: "Study Streak",
        value: "7",
        suffix: " days",
        hint: "Keep it going!",
        icon: Flame,
        trend: "up",
        trendValue: "+2",
        isNumeric: true,
        sparklineData: weeklyStudyData,
      },
      {
        label: "Hours This Week",
        value: Math.round(summary.total_completed_minutes / 60),
        hint: `${summary.total_planned_minutes} min planned`,
        icon: Clock,
        trend: "up",
        trendValue: "+15%",
        isNumeric: true,
      },
      {
        label: "Completion Rate",
        value: summary.completion_rate,
        suffix: "%",
        hint: "Across all subjects",
        icon: Target,
        trend: summary.completion_rate >= 70 ? "up" : "down",
        trendValue: summary.completion_rate >= 70 ? "On track" : "Needs attention",
        isNumeric: true,
      },
      {
        label: "Active Subjects",
        value: summary.total_subjects,
        hint: "Courses in progress",
        icon: BookOpen,
        isNumeric: true,
      },
    ];
  }, [summary]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-32 rounded-2xl shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-2xl shimmer" />
          <div className="h-80 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 md:p-8 text-white"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/70 text-sm font-medium"
            >
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold tracking-tight"
            >
              {getGreeting()}, Student!
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/80 text-lg"
            >
              {summary?.upcoming_exams > 0 
                ? `You have ${summary.upcoming_exams} upcoming exam${summary.upcoming_exams > 1 ? 's' : ''}.` 
                : "You're all caught up!"}
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link to="/planner">
              <Button variant="secondary" size="lg" icon={Sparkles} className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                Generate Study Plan
              </Button>
            </Link>
            <Button variant="ghost" size="lg" icon={Play} className="w-full sm:w-auto text-white border-2 border-white/30 hover:bg-white/10">
              Start Session
            </Button>
          </motion.div>
        </div>

        {/* Quick stats inside hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Today's Goal", value: "2h 30m", icon: Target },
            { label: "Completed", value: "1h 15m", icon: CheckCircle },
            { label: "Sessions", value: "3", icon: Zap },
            { label: "Focus Score", value: "85%", icon: Trophy },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              <p className="text-xl font-bold text-white">{item.value}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Stats grid */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} />
          ))}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress section - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Subject Progress"
            subtitle="Track your completion rate for each subject"
            gradient
            actions={
              <Link to="/progress">
                <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                  View All
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              {progress.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No subjects yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first subject to start tracking progress</p>
                  <Link to="/subjects">
                    <Button variant="primary" icon={BookOpen}>
                      Add Subject
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                progress.slice(0, 5).map((item, index) => (
                  <motion.div
                    key={item.subject_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ scale: 1.01 }}
                    className="group p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-primary/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.subject_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.subject_name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {item.completed_minutes} / {item.required_minutes} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-foreground">
                          {item.progress_percent}%
                        </span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <ProgressBar 
                      value={item.progress_percent} 
                      color={item.color} 
                      size="md"
                      gradient
                    />
                  </motion.div>
                ))
              )}
            </div>
          </SectionCard>

          {/* Weekly Activity */}
          <SectionCard
            title="Weekly Activity"
            subtitle="Your study pattern this week"
          >
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="h-32">
                  <SparklineChart 
                    data={weeklyStudyData} 
                    height={128}
                    color="hsl(var(--primary))"
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
              <div className="hidden sm:block">
                <DonutChart 
                  value={summary?.total_completed_minutes || 0} 
                  total={summary?.total_planned_minutes || 1}
                  size={100}
                  strokeWidth={10}
                >
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {summary ? Math.round((summary.total_completed_minutes / Math.max(summary.total_planned_minutes, 1)) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Weekly</p>
                  </div>
                </DonutChart>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Exams */}
          <SectionCard
            title="Upcoming Exams"
            subtitle={`${summary?.upcoming_exams || 0} exams scheduled`}
          >
            {summary?.next_exam_subject ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
                  <div className="flex items-start justify-between mb-2">
                    <Badge color="#ef4444">Next Up</Badge>
                    <Calendar className="w-4 h-4 text-destructive" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {summary.next_exam_subject}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {summary.next_exam_date}
                  </p>
                </div>
                <Link to="/calendar" className="block">
                  <Button variant="outline" fullWidth icon={Calendar}>
                    View Calendar
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-success/10 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">No upcoming exams</p>
              </div>
            )}
          </SectionCard>

          {/* Activity Heatmap */}
          <SectionCard
            title="Study Heatmap"
            subtitle="Daily activity intensity"
          >
            <WeekHeatmap data={recentActivityData} />
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.5, 0.7, 1].map((opacity) => (
                  <div 
                    key={opacity}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </SectionCard>

          {/* Quick Actions */}
          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Subject", icon: BookOpen, to: "/subjects", color: "bg-primary/10 text-primary" },
                { label: "New Session", icon: Play, to: "/planner", color: "bg-success/10 text-success" },
                { label: "View Stats", icon: BarChart3, to: "/progress", color: "bg-warning/10 text-warning" },
                { label: "Calendar", icon: Calendar, to: "/calendar", color: "bg-accent/10 text-accent-foreground" },
              ].map((action) => (
                <Link key={action.label} to={action.to}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl ${action.color} flex flex-col items-center gap-2 cursor-pointer transition-shadow hover:shadow-md`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
