import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

import { api } from "../api";
import SectionCard from "../components/SectionCard";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { Input, Select } from "../components/Input";

const defaultForm = {
  name: "",
  exam_date: "",
  difficulty: 3,
  priority: 3,
  required_minutes: 600,
  color: "#3B82F6",
};

const presetColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  function resetForm() {
    setForm(defaultForm);
    setEditingId(null);
    setIsFormOpen(false);
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
        setMessage("Subject updated successfully");
      } else {
        await api.createSubject(payload);
        setMessage("Subject created successfully");
      }
      resetForm();
      await loadSubjects();
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
      setMessage("Subject deleted");
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
    setIsFormOpen(true);
  }

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
            Subjects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the courses that feed your study planner
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
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
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:col-span-2"
            >
              <SectionCard
                title={editingId ? "Edit Subject" : "New Subject"}
                subtitle="Fill in the details for your course"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Subject Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Data Structures"
                    required
                  />

                  <Input
                    type="date"
                    label="Exam Date"
                    value={form.exam_date}
                    onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                  />

                  <Input
                    type="number"
                    label="Required Study Minutes"
                    value={form.required_minutes}
                    onChange={(e) =>
                      setForm({ ...form, required_minutes: e.target.value })
                    }
                    min="30"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Difficulty"
                      value={form.difficulty}
                      onChange={(e) =>
                        setForm({ ...form, difficulty: e.target.value })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} - {["Very Easy", "Easy", "Medium", "Hard", "Very Hard"][n - 1]}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label="Priority"
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} - {["Lowest", "Low", "Normal", "High", "Highest"][n - 1]}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm({ ...form, color })}
                          className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                            form.color === color
                              ? "ring-2 ring-ring ring-offset-2 ring-offset-background scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" variant="primary" className="flex-1">
                      {editingId ? "Save Changes" : "Add Subject"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject list */}
        <div className={isFormOpen ? "lg:col-span-3" : "lg:col-span-5"}>
          <SectionCard
            title="Your Subjects"
            subtitle={`${subjects.length} courses tracked`}
          >
            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground mt-4 text-lg">No subjects yet</p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  Add your first subject to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className="group p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge color={subject.color}>{subject.name}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {subject.exam_date || "No exam date"}
                            </span>
                            <span>Difficulty: {subject.difficulty}/5</span>
                            <span>Priority: {subject.priority}/5</span>
                            <span>{subject.required_minutes} min required</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(subject)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(subject.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
