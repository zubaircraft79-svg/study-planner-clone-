import { useEffect, useMemo, useState } from "react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export default function CalendarViewPage() {
  const [rangeStart, setRangeStart] = useState(formatDate(new Date()));
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const rangeEnd = useMemo(() => {
    const start = new Date(rangeStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return formatDate(end);
  }, [rangeStart]);

  async function loadBlocks() {
    try {
      setLoading(true);
      const data = await api.listBlocks(rangeStart, rangeEnd);
      setBlocks(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlocks();
  }, [rangeStart]);

  async function handleComplete(blockId) {
    try {
      await api.completeBlock(blockId);
      setMessage("Block completed and session logged.");
      setError("");
      await loadBlocks();
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  const grouped = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < 7; i += 1) {
      const current = new Date(rangeStart);
      current.setDate(current.getDate() + i);
      map.set(formatDate(current), []);
    }

    blocks.forEach((block) => {
      const key = block.block_date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(block);
    });

    return map;
  }, [blocks, rangeStart]);

  return (
    <div className="surface-stack">
      <section className="page-hero">
        <div className="page-eyebrow">Calendar</div>
        <div className="page-header">
          <div>
            <h2>
              Calendar <span className="glow-text">schedule view</span>
            </h2>
            <p>
              Review saved study blocks in a seven-day timeline, monitor status, and complete sessions directly from the calendar.
            </p>
          </div>
        </div>
      </section>

      <SectionCard
        title="Schedule window"
        subtitle="Move through the saved plan in seven-day ranges."
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const date = new Date(rangeStart);
                date.setDate(date.getDate() - 7);
                setRangeStart(formatDate(date));
              }}
            >
              Previous 7 days
            </button>

            <button className="btn btn-secondary" onClick={() => setRangeStart(formatDate(new Date()))}>
              Today
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                const date = new Date(rangeStart);
                date.setDate(date.getDate() + 7);
                setRangeStart(formatDate(date));
              }}
            >
              Next 7 days
            </button>
          </>
        }
      >
        <div className="field" style={{ maxWidth: 240 }}>
          <label>Start day</label>
          <input type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} />
        </div>
      </SectionCard>

      {message ? <div className="card">{message}</div> : null}
      {error ? <div className="warning">{error}</div> : null}
      {loading ? <div className="card">Loading calendar…</div> : null}

      <div className="calendar-days">
        {[...grouped.entries()].map(([day, items]) => (
          <div key={day} className="day-column">
            <h4>{day}</h4>

            <div className="day-column-scroll">
              {items.length === 0 ? <p className="empty">No blocks scheduled.</p> : null}

              {items.map((block) => (
                <div key={block.id} className="block-card" style={{ background: `${block.subject_color}22` }}>
                  <strong>{block.subject_name}</strong>
                  <div className="block-meta">
                    {new Date(block.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(block.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="block-meta">{block.minutes} minutes · {block.block_type}</div>
                  <div className="block-meta">{block.reason}</div>
                  <div className="block-meta">Status: {block.status}</div>

                  <div className="actions" style={{ marginTop: 12 }}>
                    {block.status === "planned" ? (
                      <button className="btn btn-primary" onClick={() => handleComplete(block.id)}>
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
          </div>
        ))}
      </div>
    </div>
  );
}