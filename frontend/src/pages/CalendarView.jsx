import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";
import Button from "../components/Button";
import { Input } from "../components/Input";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - ((day + 6) % 7);
  return new Date(today.getFullYear(), today.getMonth(), diff);
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  const navigateWeek = (direction) => {
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + direction * 7);
    setRangeStart(formatDate(date));
  };

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
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View your weekly study schedule
          </p>
        </div>
      </motion.div>

      {/* Week navigation */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRangeStart(formatDate(startOfWeek()))}
            >
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-foreground">
              {new Date(rangeStart).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(rangeEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="w-40">
            <Input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Calendar grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <AnimatePresence>
            {[...grouped.entries()].map(([day, items], index) => {
              const date = new Date(day);
              const isToday = formatDate(new Date()) === day;

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`rounded-xl border bg-card overflow-hidden ${
                    isToday ? "border-primary ring-1 ring-primary/20" : "border-border"
                  }`}
                >
                  {/* Day header */}
                  <div
                    className={`px-3 py-2 border-b ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 border-border"
                    }`}
                  >
                    <p className="text-xs font-medium uppercase tracking-wider opacity-70">
                      {weekdays[index]}
                    </p>
                    <p className="text-lg font-bold">{date.getDate()}</p>
                  </div>

                  {/* Blocks */}
                  <div className="p-2 space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-muted-foreground/50">
                        <Calendar className="w-6 h-6" />
                      </div>
                    ) : (
                      items.map((block) => (
                        <motion.div
                          key={block.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-2.5 rounded-lg text-xs"
                          style={{
                            backgroundColor: `${block.subject_color}15`,
                            borderLeft: `3px solid ${block.subject_color}`,
                          }}
                        >
                          <p className="font-semibold text-foreground truncate">
                            {block.subject_name}
                          </p>
                          <div className="flex items-center gap-1 text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(block.starts_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            {block.minutes} min
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-bold text-foreground">{blocks.length}</p>
            <p className="text-sm text-muted-foreground">Study blocks</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-bold text-foreground">
              {blocks.reduce((sum, b) => sum + b.minutes, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total minutes</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-bold text-foreground">
              {new Set(blocks.map((b) => b.subject_id)).size}
            </p>
            <p className="text-sm text-muted-foreground">Subjects covered</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-bold text-foreground">
              {Math.round(blocks.reduce((sum, b) => sum + b.minutes, 0) / 60)}h
            </p>
            <p className="text-sm text-muted-foreground">Study hours</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
