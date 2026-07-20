const API_BASE = "https://testsprint.onrender.com/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.code = data.error;
    throw err;
  }
  return data;
}

export const api = {
  signup: (username, password) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  getQuizSubjects: () => request("/quiz/subjects"),

  getQuestions: (subject) => request(`/quiz/${subject}`),

  getQuizStatus: (subject) => request(`/quiz/${subject}/status`),

  submitQuiz: (subject, answers) =>
    request(`/quiz/${subject}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),

  getHistory: () => request("/quiz/results/history"),

  getLeaderboard: (subject) => request(`/quiz/leaderboard/${subject}`),

  getProfile: () => request("/auth/profile"),

  updateProfile: (class_name, school_name, phone_number) =>
    request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ class_name, school_name, phone_number })
    }),

  promoteAdmin: (adminSecret) =>
    request("/auth/promote-admin", {
      method: "POST",
      body: JSON.stringify({ adminSecret })
    }),

  getAdminStudents: () => request("/admin/students"),

  adminResetPassword: (userId, newPassword) =>
    request(`/admin/students/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword })
    }),

  adminSetClass: (userId, className) =>
    request(`/admin/students/${userId}/set-class`, {
      method: "POST",
      body: JSON.stringify({ className })
    }),

  saveToken: (token, username, isAdmin, className) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("isAdmin", isAdmin ? "true" : "false");
    localStorage.setItem("userClass", className || "");
  },

  setCachedClass: (className) => {
    localStorage.setItem("userClass", className || "");
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userClass");
  },

  getUsername: () => localStorage.getItem("username"),
  isLoggedIn: () => !!getToken(),
  isAdmin: () => localStorage.getItem("isAdmin") === "true",
  getCachedClass: () => localStorage.getItem("userClass") || ""
};