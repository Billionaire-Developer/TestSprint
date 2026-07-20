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
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const api = {
  signup: (username, password) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  getQuestions: (subject) => request(`/quiz/${subject}`),

  getQuizStatus: (subject) => request(`/quiz/${subject}/status`),

  submitQuiz: (subject, answers) =>
    request(`/quiz/${subject}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),

  getHistory: () => request("/quiz/results/history"),

  getProfile: () => request("/auth/profile"),

  updateProfile: (class_name, school_name, phone_number) =>
    request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ class_name, school_name, phone_number })
    }),

  saveToken: (token, username) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  },

  getUsername: () => localStorage.getItem("username"),
  isLoggedIn: () => !!getToken()
};