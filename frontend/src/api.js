const API_BASE = "https://testsprint.onrender.com/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

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
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getQuizSubjects: () => request("/quiz/subjects"),

  getQuestions: (subject) =>
    request(`/quiz/${subject}`),

  getQuizStatus: (subject) =>
    request(`/quiz/${subject}/status`),

  submitQuiz: (subject, answers) =>
    request(`/quiz/${subject}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  getHistory: () =>
    request("/quiz/results/history"),

  getLeaderboard: (subject) =>
    request(`/quiz/leaderboard/${subject}`),

  getProfile: () =>
    request("/auth/profile"),

  updateProfile: (class_name, school_name, phone_number) =>
    request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({
        class_name,
        school_name,
        phone_number,
      }),
    }),

  promoteAdmin: (adminSecret) =>
    request("/auth/promote-admin", {
      method: "POST",
      body: JSON.stringify({ adminSecret }),
    }),

  getAdminStudents: () =>
    request("/admin/students"),

  getAdminSchoolsSummary: () =>
    request("/admin/schools-summary"),

  adminResetPassword: (userId, newPassword) =>
    request(`/admin/students/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    }),

  adminSetClass: (userId, className) =>
    request(`/admin/students/${userId}/set-class`, {
      method: "POST",
      body: JSON.stringify({ className }),
    }),

  adminSetSchool: (userId, schoolName) =>
    request(`/admin/students/${userId}/set-school`, {
      method: "POST",
      body: JSON.stringify({ schoolName }),
    }),

  // --- Notes (student-facing) ---
  getNoteSubjects: () =>
    request("/notes/subjects"),

  getNotesForSubject: (subject) =>
    request(`/notes/${subject}`),

  getNote: (subject, noteId) =>
    request(`/notes/${subject}/${noteId}`),

  // --- Notes (admin management) ---
  adminGetNotes: (classFilter, subjectFilter) => {
    const params = new URLSearchParams();

    if (classFilter) params.set("class", classFilter);
    if (subjectFilter) params.set("subject", subjectFilter);

    const qs = params.toString();

    return request(
      `/admin/notes${qs ? `?${qs}` : ""}`
    );
  },

  adminCreateNote: (subject, className, title, content) =>
    request("/admin/notes", {
      method: "POST",
      body: JSON.stringify({
        subject,
        className,
        title,
        content,
      }),
    }),

  adminUpdateNote: (
    id,
    subject,
    className,
    title,
    content
  ) =>
    request(`/admin/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        subject,
        className,
        title,
        content,
      }),
    }),

  adminDeleteNote: (id) =>
    request(`/admin/notes/${id}`, {
      method: "DELETE",
    }),

  // --- Videos (student-facing) ---
  getVideoSubjects: () =>
    request("/videos/subjects"),

  getVideosForSubject: (subject) =>
    request(`/videos/${subject}`),

  getVideo: (subject, videoId) =>
    request(`/videos/${subject}/${videoId}`),

  // --- Videos (admin management) ---
  adminGetVideos: (classFilter, subjectFilter) => {
    const params = new URLSearchParams();

    if (classFilter) params.set("class", classFilter);
    if (subjectFilter) params.set("subject", subjectFilter);

    const qs = params.toString();

    return request(
      `/admin/videos${qs ? `?${qs}` : ""}`
    );
  },

  adminCreateVideo: (
    subject,
    className,
    title,
    videoUrl,
    description
  ) =>
    request("/admin/videos", {
      method: "POST",
      body: JSON.stringify({
        subject,
        className,
        title,
        videoUrl,
        description,
      }),
    }),

  adminUpdateVideo: (
    id,
    subject,
    className,
    title,
    videoUrl,
    description
  ) =>
    request(`/admin/videos/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        subject,
        className,
        title,
        videoUrl,
        description,
      }),
    }),

  adminDeleteVideo: (id) =>
    request(`/admin/videos/${id}`, {
      method: "DELETE",
    }),

  // --- Local storage ---
  saveToken: (
    token,
    username,
    isAdmin,
    className,
    schoolName
  ) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem(
      "isAdmin",
      isAdmin ? "true" : "false"
    );
    localStorage.setItem(
      "userClass",
      className || ""
    );
    localStorage.setItem(
      "userSchool",
      schoolName || ""
    );
  },

  setCachedClass: (className) => {
    localStorage.setItem(
      "userClass",
      className || ""
    );
  },

  setCachedSchool: (schoolName) => {
    localStorage.setItem(
      "userSchool",
      schoolName || ""
    );
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userClass");
    localStorage.removeItem("userSchool");
  },

  getUsername: () =>
    localStorage.getItem("username"),

  isLoggedIn: () =>
    !!getToken(),

  isAdmin: () =>
    localStorage.getItem("isAdmin") === "true",

  getCachedClass: () =>
    localStorage.getItem("userClass") || "",

  getCachedSchool: () =>
    localStorage.getItem("userSchool") || "",
};