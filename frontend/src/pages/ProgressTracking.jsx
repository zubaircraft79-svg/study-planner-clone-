import { useEffect, useState } from "react";

import { api } from "../api";
import ProgressBar from "../components/ProgressBar";
import SectionCard from "../components/SectionCard";

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
        setForm((current) => ({ ...current, subject_id: String(subjectData[0].id) }));
      }
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
      setMessage("Study session logged successfully.");
      setForm(initialForm());
      await loadData();
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  return (
    <div className="grid split">
      <div className="grid">
        <div className="page-header">
          <div>
            <h2>Progress Tracking</h2>
            <p>Log completed sessions and monitor subject progress.</p>
          </div>
        </div>

        {error ? <div className="warning">{error}</div> : null}
        {message ? <div className="card">{message}</div> : null}

        <SectionCard title="Log a completed study session" subtitle="Update progress after real study work.">
          <form className="grid" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Subject</label>
                <select value={form.subject_id} onChange={(event) => setForm({ ...form, subject_id: event.target.value })}>
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Actual minutes</label>
                <input type="number" min="1" value={form.actual_minutes} onChange={(event) => setForm({ ...form, actual_minutes: event.target.value })} />
              </div>
              <div className="field">
                <label>Started at</label>
                <input type="datetime-local" value={form.started_at} onChange={(event) => setForm({ ...form, started_at: event.target.value })} />
              </div>
              <div className="field">
                <label>Completed at</label>
                <input type="datetime-local" value={form.completed_at} onChange={(event) => setForm({ ...form, completed_at: event.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>
            <div className="actions">
              <button className="btn btn-primary" type="submit">Save session</button>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="grid">
        <SectionCard title="Subject progress" subtitle="Completed workload against target study minutes.">
          <div className="list">
            {progress.length === 0 ? <p className="empty">No progress data yet.</p> : null}
            {progress.map((item) => (
              <div key={item.subject_id} className="list-item" style={{ alignItems: "stretch", flexDirection: "column" }}>
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="badge">
                      <span className="dot" style={{ background: item.color }} />
                      {item.subject_name}
                    </div>
                    <div className="block-meta">{item.completed_minutes} / {item.required_minutes} minutes</div>
                  </div>
                  <strong>{item.progress_percent}%</strong>
                </div>
                <ProgressBar value={item.progress_percent} color={item.color} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent sessions" subtitle="Latest logged study activity.">
          <div className="list">
            {sessions.length === 0 ? <p className="empty">No sessions logged yet.</p> : null}
            {sessions.slice(0, 8).map((session) => {
              const subject = subjects.find((item) => item.id === session.subject_id);
              return (
                <div key={session.id} className="list-item">
                  <div>
                    <strong>{subject?.name || `Subject #${session.subject_id}`}</strong>
                    <div className="block-meta">{new Date(session.started_at).toLocaleString()}</div>
                    {session.notes ? <div className="block-meta">{session.notes}</div> : null}
                  </div>
                  <strong>{session.actual_minutes} min</strong>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}