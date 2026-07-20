const express = require("express");
const cors = require("cors");

require("./db"); // ensures tables exist + seed data runs on startup

const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const adminRoutes = require("./routes/admin");
// ...
app.use("/api/admin", adminRoutes);

const app = express();
const PORT = process.env.PORT || 4000;

// In production, set FRONTEND_ORIGIN to your deployed frontend URL
// (e.g. https://your-app.vercel.app) so only your frontend can call this API.
// Locally, with FRONTEND_ORIGIN unset, all origins are allowed for convenience.
const allowedOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Quiz platform backend running on http://localhost:${PORT}`);
});