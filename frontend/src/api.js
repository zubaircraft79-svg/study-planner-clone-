const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const USER_ID = import.meta.env.VITE_USER_ID || "demo-user";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": USER_ID,
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Request failed");
  }
  return data;
}

export const api = {
  getDashboard: () => request("/dashboard/summary"),
  getProgress: () => request("/progress/subjects"),
  getPreferences: () => request("/preferences"),
  savePreferences: (payload) => request("/preferences", { method: "PUT", body: JSON.stringify(payload) }),

  listSubjects: () => request("/subjects"),
  createSubject: (payload) => request("/subjects", { method: "POST", body: JSON.stringify(payload) }),
  updateSubject: (id, payload) => request(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: "DELETE" }),

  listTemplates: () => request("/availability/templates"),
  saveTemplates: (payload) => request("/availability/templates", { method: "PUT", body: JSON.stringify(payload) }),
  listOverrides: (start, end) => request(`/availability/overrides?start=${start}&end=${end}`),
  saveOverride: (payload) => request("/availability/overrides", { method: "POST", body: JSON.stringify(payload) }),
  deleteOverride: (id) => request(`/availability/overrides/${id}`, { method: "DELETE" }),

  previewPlan: (payload) => request("/planner/preview", { method: "POST", body: JSON.stringify(payload) }),
  generateAndSavePlan: (payload) => request("/planner/generate-and-save", { method: "POST", body: JSON.stringify(payload) }),
  listBlocks: (start, end) => request(`/blocks?start=${start}&end=${end}`),
  updateBlock: (id, payload) => request(`/blocks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteBlock: (id) => request(`/blocks/${id}`, { method: "DELETE" }),

  listSessions: () => request("/sessions"),
  createSession: (payload) => request("/sessions", { method: "POST", body: JSON.stringify(payload) }),
};