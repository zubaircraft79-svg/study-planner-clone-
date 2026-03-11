import { useEffect, useMemo, useState } from "react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - ((day + 6) % 7);
  return new Date(today.getFullYear(), today.getMonth(), diff);
}

export default function CalendarViewPage() {
  const [rangeStart, setRangeStart] = useState(formatDate(startOfWeek()));
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="grid">
      <div className="page-header">
        <div>
          <h2>Calendar View</h2>
          <p>Review the generated schedule in a weekly layout.</p>
        </div>
      </div>

      <SectionCard
        title="Week selector"
        subtitle="Move through the schedule week by week."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => {
              const date = new Date(rangeStart);
              date.setDate(date.getDate() - 7);
              setRangeStart(formatDate(date));
            }}>
              Previous week
            </button>
            <button className="btn btn-secondary" onClick={() => setRangeStart(formatDate(startOfWeek()))}>
              Current week
            </button>
            <button className="btn btn-secondary" onClick={() => {
              const date = new Date(rangeStart);
              date.setDate(date.getDate() + 7);
              setRangeStart(formatDate(date));
            }}>
              Next week
            </button>
          </>
        }
      >
        <div className="field" style={{ maxWidth: 240 }}>
          <label>Week start</label>
          <input type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} />
        </div>
      </SectionCard>

      {error ? <div className="warning">{error}</div> : null}
      {loading ? <div className="card">Loading calendar…</div> : null}

      <div className="calendar-days">
        {[...grouped.entries()].map(([day, items]) => (
          <div key={day} className="day-column">
            <h4>{day}</h4>
            {items.length === 0 ? <p className="empty">No blocks scheduled.</p> : null}
            {items.map((block) => (
              <div key={block.id} className="block-card" style={{ background: `${block.subject_color}20` }}>
                <strong>{block.subject_name}</strong>
                <div className="block-meta">{new Date(block.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(block.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                <div className="block-meta">{block.minutes} minutes · {block.block_type}</div>
                <div className="block-meta">{block.reason}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}