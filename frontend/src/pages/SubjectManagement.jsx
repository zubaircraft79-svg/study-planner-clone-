import { useEffect, useState } from "react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";

const difficultyOptions = [
  { value: 1, label: "Very Easy" },
  { value: 2, label: "Easy" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Hard" },
  { value: 5, label: "Very Hard" },
];

const priorityOptions = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
  { value: 4, label: "Very High" },
  { value: 5, label: "Urgent" },
];

const defaultForm = {
  name: "",
  exam_date: "",
  difficulty: 3,
  priority: 3,
  required_minutes: 600,
  color: "#4F46E5",
};

function labelFor(options, value) {
  return options.find((item) => Number(item.value) === Number(value))?.label || `Level ${value}`;
}

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSubjects() {
    try {
      const data = await api.listSubjects();
      setSubjects(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  function resetForm() {
    setForm(defaultForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      exam_date: form.exam_date || null,
      difficulty: Number(form.difficulty),
      priority: Number(form.priority),
      required_minutes: Number(form.required_minutes),
    };

    try {
      if (editingId) {
        await api.updateSubject(editingId, payload);
        setMessage("Subject updated.");
      } else {
        await api.createSubject(payload);
        setMessage("Subject created.");
      }
      resetForm();
      await loadSubjects();
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteSubject(id);
      if (editingId === id) {
        resetForm();
      }
      await loadSubjects();
      setMessage("Subject deleted.");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  function startEdit(subject) {
    setEditingId(subject.id);
    setForm({
      name: subject.name,
      exam_date: subject.exam_date || "",
      difficulty: subject.difficulty,
      priority: subject.priority,
      required_minutes: subject.required_minutes,
      color: subject.color,
    });
  }

  return (
    <div className="grid cols-2">
      <div className="grid">
        <div className="page-header">
          <div>
            <h2>Subject Management</h2>
            <p>Add or update the courses that feed the planner algorithm.</p>
          </div>
        </div>

        {error ? <div className="warning">{error}</div> : null}
        {message ? <div className="card">{message}</div> : null}

        <SectionCard title={editingId ? "Edit subject" : "Add subject"} subtitle="Keep inputs simple but useful for better schedules.">
          <form className="grid" onSubmit={handleSubmit}>
            <div className="field">
              <label>Subject name</label>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Data Structures"
                required
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Exam date</label>
                <input
                  type="date"
                  value={form.exam_date}
                  onChange={(event) => setForm({ ...form, exam_date: event.target.value })}
                />
              </div>

              <div className="field">
                <label>Required study minutes</label>
                <input
                  type="number"
                  min="30"
                  value={form.required_minutes}
                  onChange={(event) => setForm({ ...form, required_minutes: event.target.value })}
                />
              </div>

              <div className="field">
                <label>Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(event) => setForm({ ...form, difficulty: Number(event.target.value) })}
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Color</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                />
              </div>
            </div>

            <div className="actions">
              <button className="btn btn-primary" type="submit">{editingId ? "Save changes" : "Add subject"}</button>
              {editingId ? <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button> : null}
            </div>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Current subjects" subtitle="Use these subjects as the planner inputs.">
        <div className="list">
          {subjects.length === 0 ? <p className="empty">No subjects yet.</p> : null}
          {subjects.map((subject) => (
            <div key={subject.id} className="list-item">
              <div>
                <div className="badge">
                  <span className="dot" style={{ background: subject.color }} />
                  {subject.name}
                </div>
                <div className="block-meta">Exam: {subject.exam_date || "Not set"}</div>
                <div className="block-meta">
                  Difficulty {labelFor(difficultyOptions, subject.difficulty)} · Priority {labelFor(priorityOptions, subject.priority)} · {subject.required_minutes} min
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-secondary" onClick={() => startEdit(subject)}>Edit</button>
                <button className="btn btn-danger" onClick={() => handleDelete(subject.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}