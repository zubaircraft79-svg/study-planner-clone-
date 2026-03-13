import { useEffect, useMemo, useState } from "react";

import { api } from "../api";
import ProgressBar from "../components/ProgressBar";
import SectionCard from "../components/SectionCard";

function pad(value) {
  return String(value).padStart(2, "0");
}

function toLocalInputValue(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeLocalDateTime(value) {
  if (!value) {
    return null;
  }
  return value.length === 16 ? `${value}:00` : value;
}

function addMinutesToLocalInput(startValue, minutes) {
  if (!startValue) {
    return "";
  }
  const date = new Date(startValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  date.setMinutes(date.getMinutes() + Number(minutes || 0));
  return toLocalInputValue(date);
}

function formatStoredDateTime(value) {
  if (!value) {
    return "—";
  }
  return value.replace("T", " ").slice(0, 16);
}

function initialForm() {
  return {
    subject_id: "",
    actual_minutes: 60,
    started_at: toLocalInputValue(),
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

  const calculatedCompletedAt = useMemo(
    () => addMinutesToLocalInput(form.started_at, form.actual_minutes),
    [form.started_at, form.actual_minutes]
  );

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
        started_at: normalizeLocalDateTime(form.started_at),
        notes: form.notes || null,
      });

      setMessage("Study session logged successfully.");
      setForm(initialForm());
      await loadData();
      setError("");
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

        <SectionCard title="Log a completed study session" subtitle="The completion time is calculated automatically from start time and duration.">
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
                <input
                  type="number"
                  min="1"
                  value={form.actual_minutes}
                  onChange={(event) => setForm({ ...form, actual_minutes: event.target.value })}
                />
              </div>

              <div className="field">
                <label>Started at</label>
                <input
                  type="datetime-local"
                  value={form.started_at}
                  onChange={(event) => setForm({ ...form, started_at: event.target.value })}
                />
              </div>

              <div className="field">
                <label>Calculated completed at</label>
                <input type="datetime-local" value={calculatedCompletedAt} readOnly />
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
                    <div className="block-meta">
                      {formatStoredDateTime(session.started_at)} → {formatStoredDateTime(session.completed_at)}
                    </div>
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