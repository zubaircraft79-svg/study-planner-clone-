import { useEffect, useState } from "react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [summaryData, progressData] = await Promise.all([api.getDashboard(), api.getProgress()]);
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

  return (
    <div className="surface-stack">
      <section className="page-hero">
        <div className="page-eyebrow">Overview</div>
        <div className="page-header">
          <div>
            <h2>
              Study activity and <span className="glow-text">planning overview</span>
            </h2>
            <p>
              Review your current workload, upcoming exams, saved schedule, and completed study time across all subjects.
            </p>
          </div>
        </div>
      </section>

      {error ? <div className="warning">{error}</div> : null}
      {loading ? <div className="card">Loading dashboard…</div> : null}

      {summary ? (
        <div className="kpi-grid">
          <StatCard index={0} label="Subjects" value={summary.total_subjects} hint="Active courses in your planner" />
          <StatCard index={1} label="Planned minutes" value={summary.total_planned_minutes} hint="Scheduled inside the current horizon" />
          <StatCard index={2} label="Completed minutes" value={summary.total_completed_minutes} hint="Logged through real study activity" />
          <StatCard index={3} label="Completion rate" value={`${summary.completion_rate}%`} hint="Completed versus required workload" />
        </div>
      ) : null}

      <div className="grid cols-2">
        <SectionCard title="Exam focus" subtitle="Keep the nearest deadlines visible and easy to monitor.">
          {summary ? (
            <div className="list">
              <div className="list-item">
                <div>
                  <strong>{summary.next_exam_subject || "No exam added yet"}</strong>
                  <div className="block-meta">
                    {summary.next_exam_date ? `Nearest exam scheduled on ${summary.next_exam_date}` : "Add exam dates to activate deadline-based planning."}
                  </div>
                </div>
                <div className="badge">Upcoming exams: {summary.upcoming_exams}</div>
              </div>

              <div className="list-item">
                <div>
                  <strong>Saved schedule</strong>
                  <div className="block-meta">
                    {summary.total_planned_minutes > 0
                      ? "A study plan is already saved in the current planning range."
                      : "No saved plan yet. Generate one from the Study Planner page."}
                  </div>
                </div>
                <div className="badge">{summary.total_planned_minutes} min</div>
              </div>
            </div>
          ) : (
            <p className="empty">No summary available yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Progress snapshot" subtitle="A quick view of progress across your active subjects.">
          <div className="list">
            {progress.length === 0 ? <p className="empty">No subjects added yet.</p> : null}
            {progress.slice(0, 5).map((item) => (
              <div key={item.subject_id} className="list-item">
                <div>
                  <div className="badge">
                    <span className="dot" style={{ background: item.color }} />
                    {item.subject_name}
                  </div>
                  <div className="block-meta">
                    {item.completed_minutes} / {item.required_minutes} minutes completed
                  </div>
                </div>
                <strong>{item.progress_percent}%</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}