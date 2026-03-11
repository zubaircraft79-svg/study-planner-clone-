import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../api";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import Badge from "../components/Badge";
import Button from "../components/Button";

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

  const statCards = summary
    ? [
        {
          label: "Active Subjects",
          value: summary.total_subjects,
          hint: "Courses in your study plan",
          icon: BookOpen,
        },
        {
          label: "Planned Minutes",
          value: summary.total_planned_minutes.toLocaleString(),
          hint: "Total scheduled study time",
          icon: Clock,
        },
        {
          label: "Completed",
          value: summary.total_completed_minutes.toLocaleString(),
          hint: "Minutes of productive study",
          icon: CheckCircle,
        },
        {
          label: "Upcoming Exams",
          value: summary.upcoming_exams,
          hint: "Exams on the horizon",
          icon: Calendar,
        },
        {
          label: "Completion Rate",
          value: `${summary.completion_rate}%`,
          hint: "Progress toward your goals",
          icon: TrendingUp,
        },
        {
          label: "Next Exam",
          value: summary.next_exam_subject || "None",
          hint: summary.next_exam_date || "No upcoming exams",
          icon: AlertCircle,
        },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your study progress and upcoming goals
          </p>
        </div>
        <Link to="/planner">
          <Button variant="primary">
            Plan Study Session
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Stats grid */}
      {!loading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} />
          ))}
        </div>
      )}

      {/* Progress section */}
      {!loading && (
        <SectionCard
          title="Subject Progress"
          subtitle="Track your completion rate for each subject"
          actions={
            <Link to="/progress">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          }
        >
          <div className="space-y-4">
            {progress.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground mt-3">No subjects added yet</p>
                <Link to="/subjects" className="inline-block mt-4">
                  <Button variant="outline" size="sm">
                    Add Your First Subject
                  </Button>
                </Link>
              </div>
            ) : (
              progress.slice(0, 5).map((item, index) => (
                <motion.div
                  key={item.subject_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge color={item.color}>{item.subject_name}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.completed_minutes} / {item.required_minutes} min
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {item.progress_percent}%
                    </span>
                  </div>
                  <ProgressBar value={item.progress_percent} color={item.color} />
                </motion.div>
              ))
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
