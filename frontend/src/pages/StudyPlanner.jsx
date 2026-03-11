import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Settings,
  Clock,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  Zap,
  CalendarPlus,
} from "lucide-react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { Input, Select } from "../components/Input";

function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StudyPlannerPage() {
  const [preferences, setPreferences] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [preview, setPreview] = useState(null);
  const [savedBlocks, setSavedBlocks] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [range, setRange] = useState({
    start_date: todayPlus(0),
    end_date: todayPlus(14),
  });
  const [overrideForm, setOverrideForm] = useState({
    override_date: todayPlus(1),
    minutes_available: 120,
    is_rest_day: false,
  });
  const [activeTab, setActiveTab] = useState("generate");
  const [isGenerating, setIsGenerating] = useState(false);

  async function loadBaseData() {
    try {
      const [prefs, templateRows] = await Promise.all([
        api.getPreferences(),
        api.listTemplates(),
      ]);
      setPreferences(prefs);
      setTemplates(templateRows.sort((a, b) => a.weekday - b.weekday));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadRangeData(start = range.start_date, end = range.end_date) {
    try {
      const [overrideRows, blockRows] = await Promise.all([
        api.listOverrides(start, end),
        api.listBlocks(start, end),
      ]);
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
      setMessage("Preferences saved");
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
      setMessage("Weekly availability saved");
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
      setMessage("Override saved");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  async function handlePreview() {
    try {
      setIsGenerating(true);
      const data = await api.previewPlan(range);
      setPreview(data);
      setMessage("Preview generated");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateAndSave() {
    try {
      setIsGenerating(true);
      const data = await api.generateAndSavePlan(range);
      setPreview(data);
      await loadRangeData();
      setMessage("Plan generated and saved");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    } finally {
      setIsGenerating(false);
    }
  }

  async function toggleLock(block) {
    try {
      await api.updateBlock(block.id, { locked: !block.locked });
      await loadRangeData();
      setMessage(block.locked ? "Block unlocked" : "Block locked");
      setError("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  }

  const groupedPreview = useMemo(() => {
    if (!preview?.blocks) return [];
    const grouped = new Map();
    preview.blocks.forEach((block) => {
      if (!grouped.has(block.block_date)) {
        grouped.set(block.block_date, []);
      }
      grouped.get(block.block_date).push(block);
    });
    return [...grouped.entries()];
  }, [preview]);

  const tabs = [
    { id: "generate", label: "Generate Plan", icon: Zap },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "availability", label: "Availability", icon: Calendar },
  ];

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
            Study Planner
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your schedule and generate balanced study plans
          </p>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-secondary rounded-lg w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "generate" && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Date range & generate */}
            <SectionCard
              title="Planning Range"
              subtitle="Select the period to generate your study plan"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={range.start_date}
                    onChange={(e) =>
                      setRange({ ...range, start_date: e.target.value })
                    }
                  />
                  <Input
                    type="date"
                    label="End Date"
                    value={range.end_date}
                    onChange={(e) =>
                      setRange({ ...range, end_date: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={handlePreview}
                    disabled={isGenerating}
                  >
                    Preview Plan
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleGenerateAndSave}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="animate-spin">
                          <Clock className="w-4 h-4" />
                        </span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <CalendarPlus className="w-4 h-4" />
                        Generate & Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SectionCard>

            {/* Saved blocks */}
            <SectionCard
              title="Saved Blocks"
              subtitle="Lock important blocks before regenerating"
            >
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {savedBlocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto opacity-30" />
                    <p className="mt-2">No saved blocks in this range</p>
                  </div>
                ) : (
                  savedBlocks.slice(0, 10).map((block) => (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge color={block.subject_color}>
                            {block.subject_name}
                          </Badge>
                          {block.locked && (
                            <Lock className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {block.block_date} at{" "}
                          {new Date(block.starts_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLock(block)}
                      >
                        {block.locked ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </SectionCard>

            {/* Preview */}
            {preview && (
              <div className="lg:col-span-2">
                <SectionCard
                  title="Plan Preview"
                  subtitle={`${preview.blocks?.length || 0} blocks generated`}
                >
                  {preview.warnings?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {preview.warnings.map((w, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2"
                        >
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {w.message}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedPreview.map(([day, items]) => (
                      <div
                        key={day}
                        className="p-4 rounded-lg bg-secondary/30 space-y-2"
                      >
                        <h4 className="font-semibold text-foreground">{day}</h4>
                        {items.map((block, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-md text-xs"
                            style={{
                              backgroundColor: `${block.subject_color}15`,
                              borderLeft: `3px solid ${block.subject_color}`,
                            }}
                          >
                            <p className="font-medium">{block.subject_name}</p>
                            <p className="text-muted-foreground">
                              {block.minutes} min - {block.block_type}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "preferences" && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SectionCard
              title="Schedule Preferences"
              subtitle="Configure session length and break behavior"
            >
              {preferences ? (
                <form onSubmit={handleSavePreferences} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                      type="number"
                      label="Session Duration (min)"
                      value={preferences.session_minutes}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          session_minutes: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      label="Short Break (min)"
                      value={preferences.short_break_minutes}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          short_break_minutes: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      label="Long Break (min)"
                      value={preferences.long_break_minutes}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          long_break_minutes: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      label="Long Break Every N Sessions"
                      value={preferences.long_break_every}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          long_break_every: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      label="Day Start Hour"
                      value={preferences.day_start_hour}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          day_start_hour: e.target.value,
                        })
                      }
                      min="0"
                      max="23"
                    />
                  </div>
                  <Button type="submit" variant="primary">
                    Save Preferences
                  </Button>
                </form>
              ) : (
                <div className="animate-pulse h-40 bg-secondary/50 rounded-lg" />
              )}
            </SectionCard>
          </motion.div>
        )}

        {activeTab === "availability" && (
          <motion.div
            key="availability"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Weekly template */}
            <SectionCard
              title="Weekly Availability"
              subtitle="Set your typical weekly schedule"
            >
              <div className="space-y-3">
                {templates.map((row) => (
                  <div
                    key={row.weekday}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30"
                  >
                    <span className="w-10 font-medium text-foreground">
                      {weekdayLabels[row.weekday]}
                    </span>
                    <input
                      type="number"
                      className="w-24 h-9 px-3 rounded-md border border-border bg-background text-sm"
                      value={row.minutes_available}
                      disabled={row.is_rest_day}
                      onChange={(e) => {
                        setTemplates(
                          templates.map((t) =>
                            t.weekday === row.weekday
                              ? { ...t, minutes_available: e.target.value }
                              : t
                          )
                        );
                      }}
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                    <label className="flex items-center gap-2 ml-auto cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.is_rest_day}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setTemplates(
                            templates.map((t) =>
                              t.weekday === row.weekday
                                ? {
                                    ...t,
                                    is_rest_day: checked,
                                    minutes_available: checked
                                      ? 0
                                      : t.minutes_available || 120,
                                  }
                                : t
                            )
                          );
                        }}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm text-muted-foreground">Rest</span>
                    </label>
                  </div>
                ))}
                <Button
                  variant="primary"
                  onClick={handleSaveTemplates}
                  className="mt-4"
                >
                  Save Weekly Schedule
                </Button>
              </div>
            </SectionCard>

            {/* Overrides */}
            <SectionCard
              title="Date Overrides"
              subtitle="Adjust specific days for extra work or rest"
            >
              <form onSubmit={handleSaveOverride} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Date"
                    value={overrideForm.override_date}
                    onChange={(e) =>
                      setOverrideForm({
                        ...overrideForm,
                        override_date: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="number"
                    label="Available Minutes"
                    value={overrideForm.minutes_available}
                    disabled={overrideForm.is_rest_day}
                    onChange={(e) =>
                      setOverrideForm({
                        ...overrideForm,
                        minutes_available: e.target.value,
                      })
                    }
                  />
                </div>
                <Select
                  label="Rest Day"
                  value={String(overrideForm.is_rest_day)}
                  onChange={(e) =>
                    setOverrideForm({
                      ...overrideForm,
                      is_rest_day: e.target.value === "true",
                    })
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
                <Button type="submit" variant="primary">
                  Add Override
                </Button>
              </form>

              {overrides.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Current Overrides
                  </p>
                  {overrides.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {o.override_date}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {o.is_rest_day
                            ? "Rest day"
                            : `${o.minutes_available} minutes`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
