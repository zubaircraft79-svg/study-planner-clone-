import { useEffect, useMemo, useState } from "react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";

function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const weekdayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StudyPlannerPage() {
  const [preferences, setPreferences] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [preview, setPreview] = useState(null);
  const [savedBlocks, setSavedBlocks] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [range, setRange] = useState({ start_date: todayPlus(0), end_date: todayPlus(14) });
  const [overrideForm, setOverrideForm] = useState({ override_date: todayPlus(1), minutes_available: 120, is_rest_day: false });

  async function loadBaseData() {
    try {
      const [prefs, templateRows] = await Promise.all([api.getPreferences(), api.listTemplates()]);
      setPreferences(prefs);
      setTemplates(templateRows.sort((a, b) => a.weekday - b.weekday));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadRangeData(start = range.start_date, end = range.end_date) {
    try {
      const [overrideRows, blockRows] = await Promise.all([api.listOverrides(start, end), api.listBlocks(start, end)]);
      setOverrides(overrideRows);
      setSavedBlocks(blockRows);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadRangeData();
  }, [range.start_date, range.end_date]);

  async function handleSavePreferences(event) {
    event.preventDefault();
    try {
      const payload = {
        session_minutes: Number(preferences.session_minutes),
        short_break_minutes: Number(preferences.short_break_minutes),
        long_break_minutes: Number(preferences.long_break_minutes),
        long_break_every: Number(preferences.long_break_every),
        day_start_hour: Number(preferences.day_start_hour),
      };
      const data = await api.savePreferences(payload);
      setPreferences(data);
      setMessage("Preferences saved.");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function handleSaveTemplates() {
    try {
      const payload = templates.map((row) => ({
        weekday: row.weekday,
        minutes_available: Number(row.minutes_available),
        is_rest_day: Boolean(row.is_rest_day),
      }));
      const data = await api.saveTemplates(payload);
      setTemplates(data.sort((a, b) => a.weekday - b.weekday));
      setMessage("Weekly availability saved.");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function handleSaveOverride(event) {
    event.preventDefault();
    try {
      await api.saveOverride({
        override_date: overrideForm.override_date,
        minutes_available: Number(overrideForm.minutes_available),
        is_rest_day: Boolean(overrideForm.is_rest_day),
      });
      await loadRangeData();
      setMessage("Date override saved.");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function handlePreview() {
    try {
      const data = await api.previewPlan(range);
      setPreview(data);
      setMessage("Preview generated.");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function handleGenerateAndSave() {
    try {
      const data = await api.generateAndSavePlan(range);
      setPreview(data);
      await loadRangeData();
      setMessage("Plan generated and saved.");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function toggleLock(block) {
    try {
      await api.updateBlock(block.id, { locked: !block.locked });
      await loadRangeData();
      setMessage(block.locked ? "Block unlocked." : "Block locked.");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function handleComplete(block) {
    try {
      await api.completeBlock(block.id);
      await loadRangeData();
      setMessage("Block completed and session logged.");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  const groupedPreview = useMemo(() => {
    if (!preview?.blocks) {
      return [];
    }

    const grouped = new Map();
    preview.blocks.forEach((block) => {
      if (!grouped.has(block.block_date)) {
        grouped.set(block.block_date, []);
      }
      grouped.get(block.block_date).push(block);
    });

    return [...grouped.entries()];
  }, [preview]);

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <h2>Study Planner</h2>
          <p>Configure schedule preferences, availability, and generate balanced study plans.</p>
        </div>
      </div>

      {error ? <div className="warning">{error}</div> : null}
      {message ? <div className="card">{message}</div> : null}

      <div className="grid cols-2">
        <SectionCard title="Planning range" subtitle="Choose the period the planner should fill.">
          <div className="form-grid">
            <div className="field">
              <label>Start date</label>
              <input type="date" value={range.start_date} onChange={(event) => setRange({ ...range, start_date: event.target.value })} />
            </div>
            <div className="field">
              <label>End date</label>
              <input type="date" value={range.end_date} onChange={(event) => setRange({ ...range, end_date: event.target.value })} />
            </div>
          </div>

          <div className="actions" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={handlePreview}>Preview plan</button>
            <button className="btn btn-primary" onClick={handleGenerateAndSave}>Generate & save</button>
          </div>
        </SectionCard>

        <SectionCard title="Schedule preferences" subtitle="Control session size and break behavior.">
          {preferences ? (
            <form className="grid" onSubmit={handleSavePreferences}>
              <div className="form-grid">
                <div className="field">
                  <label>Session minutes</label>
                  <input type="number" value={preferences.session_minutes} onChange={(event) => setPreferences({ ...preferences, session_minutes: event.target.value })} />
                </div>
                <div className="field">
                  <label>Short break minutes</label>
                  <input type="number" value={preferences.short_break_minutes} onChange={(event) => setPreferences({ ...preferences, short_break_minutes: event.target.value })} />
                </div>
                <div className="field">
                  <label>Long break minutes</label>
                  <input type="number" value={preferences.long_break_minutes} onChange={(event) => setPreferences({ ...preferences, long_break_minutes: event.target.value })} />
                </div>
                <div className="field">
                  <label>Long break every N sessions</label>
                  <input type="number" value={preferences.long_break_every} onChange={(event) => setPreferences({ ...preferences, long_break_every: event.target.value })} />
                </div>
                <div className="field">
                  <label>Day start hour</label>
                  <input type="number" min="0" max="23" value={preferences.day_start_hour} onChange={(event) => setPreferences({ ...preferences, day_start_hour: event.target.value })} />
                </div>
              </div>

              <div className="actions">
                <button className="btn btn-primary" type="submit">Save preferences</button>
              </div>
            </form>
          ) : <p className="empty">Loading preferences…</p>}
        </SectionCard>
      </div>

      <div className="grid cols-2">
        <SectionCard title="Weekly availability" subtitle="Set how many minutes are available on each weekday.">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Available minutes</th>
                  <th>Rest day</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((row) => (
                  <tr key={row.weekday}>
                    <td>{weekdayLabels[row.weekday]}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={row.minutes_available}
                        disabled={row.is_rest_day}
                        onChange={(event) => {
                          const next = templates.map((item) =>
                            item.weekday === row.weekday ? { ...item, minutes_available: event.target.value } : item
                          );
                          setTemplates(next);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.is_rest_day}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          const next = templates.map((item) =>
                            item.weekday === row.weekday
                              ? { ...item, is_rest_day: checked, minutes_available: checked ? 0 : item.minutes_available || 120 }
                              : item
                          );
                          setTemplates(next);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="actions">
            <button className="btn btn-primary" onClick={handleSaveTemplates}>Save weekly availability</button>
          </div>
        </SectionCard>

        <SectionCard title="Date-specific overrides" subtitle="Adjust individual days for extra work or rest.">
          <form className="grid" onSubmit={handleSaveOverride}>
            <div className="form-grid">
              <div className="field">
                <label>Date</label>
                <input type="date" value={overrideForm.override_date} onChange={(event) => setOverrideForm({ ...overrideForm, override_date: event.target.value })} />
              </div>

              <div className="field">
                <label>Available minutes</label>
                <input
                  type="number"
                  min="0"
                  value={overrideForm.minutes_available}
                  disabled={overrideForm.is_rest_day}
                  onChange={(event) => setOverrideForm({ ...overrideForm, minutes_available: event.target.value })}
                />
              </div>

              <div className="field">
                <label>Rest day</label>
                <select value={String(overrideForm.is_rest_day)} onChange={(event) => setOverrideForm({ ...overrideForm, is_rest_day: event.target.value === "true" })}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            <div className="actions">
              <button className="btn btn-primary" type="submit">Save override</button>
            </div>
          </form>

          <div className="list" style={{ marginTop: 16 }}>
            {overrides.length === 0 ? <p className="empty">No overrides in this range.</p> : null}
            {overrides.map((item) => (
              <div key={item.id} className="list-item">
                <div>
                  <strong>{item.override_date}</strong>
                  <div className="block-meta">{item.is_rest_day ? "Rest day" : `${item.minutes_available} minutes available`}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid cols-2">
        <SectionCard title="Planner preview" subtitle="See generated blocks before saving them.">
          {!preview ? <p className="empty">No preview yet.</p> : null}

          {preview?.warnings?.length ? (
            <div className="grid">
              {preview.warnings.map((warning, index) => (
                <div key={`${warning.code}-${index}`} className="warning">{warning.message}</div>
              ))}
            </div>
          ) : null}

          <div className="list">
            {groupedPreview.map(([day, items]) => (
              <div key={day} className="card" style={{ padding: 16 }}>
                <h4>{day}</h4>
                {items.map((block) => (
                  <div key={`${day}-${block.order_index}-${block.subject_id}`} className="list-item">
                    <div>
                      <div className="badge">
                        <span className="dot" style={{ background: block.subject_color }} />
                        {block.subject_name}
                      </div>
                      <div className="block-meta">{block.minutes} minutes · {block.block_type}</div>
                      <div className="block-meta">{block.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Saved blocks" subtitle="Lock important blocks, or complete them after studying.">
          <div className="list">
            {savedBlocks.length === 0 ? <p className="empty">No saved plan blocks in this range.</p> : null}
            {savedBlocks.map((block) => (
              <div key={block.id} className="list-item">
                <div>
                  <div className="badge">
                    <span className="dot" style={{ background: block.subject_color }} />
                    {block.subject_name}
                  </div>
                  <div className="block-meta">
                    {block.block_date} · {new Date(block.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(block.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="block-meta">{block.minutes} minutes · {block.block_type}</div>
                  <div className="block-meta">Status: {block.status}</div>
                </div>

                <div className="actions">
                  <button className="btn btn-secondary" onClick={() => toggleLock(block)}>
                    {block.locked ? "Unlock" : "Lock"}
                  </button>

                  {block.status === "planned" ? (
                    <button className="btn btn-primary" onClick={() => handleComplete(block)}>
                      Complete
                    </button>
                  ) : (
                    <button className="btn btn-secondary" disabled>
                      Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}