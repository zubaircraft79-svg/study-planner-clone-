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
    <div className="grid">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of workload, exams, and study progress.</p>
        </div>
      </div>

      {error ? <div className="warning">{error}</div> : null}
      {loading ? <div className="card">Loading dashboard…</div> : null}

      {summary ? (
        <div className="grid cols-3">
          <StatCard label="Subjects" value={summary.total_subjects} hint="Active courses tracked in the planner" />
          <StatCard label="Planned minutes" value={summary.total_planned_minutes} hint="Scheduled in the visible planning horizon" />
          <StatCard label="Completed minutes" value={summary.total_completed_minutes} hint="Logged through progress tracking" />
          <StatCard label="Upcoming exams" value={summary.upcoming_exams} hint="Subjects with future exam dates" />
          <StatCard label="Completion rate" value={`${summary.completion_rate}%`} hint="Completed versus required workload" />
          <StatCard
            label="Next exam"
            value={summary.next_exam_subject || "—"}
            hint={summary.next_exam_date ? `Scheduled on ${summary.next_exam_date}` : "No exam date set"}
          />
        </div>
      ) : null}

      <SectionCard title="Progress snapshot" subtitle="Quick look at the remaining work for each subject.">
        <div className="list">
          {progress.length === 0 ? <p className="empty">No subjects added yet.</p> : null}
          {progress.slice(0, 5).map((item) => (
            <div key={item.subject_id} className="list-item">
              <div>
                <div className="badge">
                  <span className="dot" style={{ background: item.color }} />
                  {item.subject_name}
                </div>
                <div className="block-meta">{item.completed_minutes} / {item.required_minutes} minutes completed</div>
              </div>
              <strong>{item.progress_percent}%</strong>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}