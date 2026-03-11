import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  BookOpen,
  TrendingUp,
} from "lucide-react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";
import ProgressBar from "../components/ProgressBar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";

function initialForm() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return {
    subject_id: "",
    actual_minutes: 60,
    started_at: local.toISOString().slice(0, 16),
    completed_at: local.toISOString().slice(0, 16),
    notes: "",
  };
}

export default function ProgressTrackingPage() {
  const [subjects, setSubjects] = useState([]);
  const [progress, setProgress] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(initialForm());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function loadData() {
    try {
      const [subjectData, progressData, sessionData] = await Promise.all([
        api.listSubjects(),
        api.getProgress(),
        api.listSessions(),
      ]);
      setSubjects(subjectData);
      setProgress(progressData);
      setSessions(sessionData);
      if (!form.subject_id && subjectData.length > 0) {
        setForm((current) => ({
          ...current,
          subject_id: String(subjectData[0].id),
        }));
      }
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await api.createSession({
        subject_id: Number(form.subject_id),
        actual_minutes: Number(form.actual_minutes),
        started_at: new Date(form.started_at).toISOString(),
        completed_at: new Date(form.completed_at).toISOString(),
        notes: form.notes || null,
      });
      setMessage("Study session logged successfully");
      setForm(initialForm());
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  const totalCompleted = progress.reduce((sum, p) => sum + p.completed_minutes, 0);
  const totalRequired = progress.reduce((sum, p) => sum + p.required_minutes, 0);
  const overallProgress = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

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
            Progress
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your study sessions and monitor your progress
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Log Session
        </Button>
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall progress card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-foreground text-background"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-background/70 text-sm font-medium">Overall Progress</p>
            <p className="text-4xl font-bold mt-1">{overallProgress}%</p>
            <p className="text-background/60 text-sm mt-2">
              {totalCompleted.toLocaleString()} of {totalRequired.toLocaleString()} minutes completed
            </p>
          </div>
          <div className="flex-1 max-w-md">
            <div className="h-3 bg-background/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-background rounded-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-background/70">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">{sessions.length} sessions logged</span>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SectionCard
              title="Log Study Session"
              subtitle="Record your completed study work"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Subject"
                    value={form.subject_id}
                    onChange={(e) =>
                      setForm({ ...form, subject_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </Select>

                  <Input
                    type="number"
                    label="Minutes Studied"
                    value={form.actual_minutes}
                    onChange={(e) =>
                      setForm({ ...form, actual_minutes: e.target.value })
                    }
                    min="1"
                    required
                  />

                  <Input
                    type="datetime-local"
                    label="Started At"
                    value={form.started_at}
                    onChange={(e) =>
                      setForm({ ...form, started_at: e.target.value })
                    }
                  />

                  <Input
                    type="datetime-local"
                    label="Completed At"
                    value={form.completed_at}
                    onChange={(e) =>
                      setForm({ ...form, completed_at: e.target.value })
                    }
                  />
                </div>

                <Textarea
                  label="Notes (optional)"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="What did you study? Any highlights or challenges?"
                />

                <div className="flex gap-3">
                  <Button type="submit" variant="primary">
                    Save Session
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject progress */}
        <SectionCard
          title="Subject Progress"
          subtitle="Your completion rate for each subject"
        >
          {progress.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground mt-4">No progress data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {progress.map((item, index) => (
                <motion.div
                  key={item.subject_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge color={item.color}>{item.subject_name}</Badge>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {item.progress_percent}%
                    </span>
                  </div>
                  <ProgressBar value={item.progress_percent} color={item.color} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.completed_minutes} / {item.required_minutes} minutes
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent sessions */}
        <SectionCard
          title="Recent Sessions"
          subtitle="Your latest study activity"
        >
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground mt-4">No sessions logged yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 8).map((session, index) => {
                const subject = subjects.find((s) => s.id === session.subject_id);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {subject?.name || `Subject #${session.subject_id}`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(session.started_at).toLocaleDateString()}{" "}
                          {new Date(session.started_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {session.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {session.actual_minutes}
                      </p>
                      <p className="text-xs text-muted-foreground">minutes</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
