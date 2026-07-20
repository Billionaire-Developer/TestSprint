const express = require("express");
const cors = require("cors");

const { initDb } = require("./db");

const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const adminRoutes = require("./routes/admin");

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
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Database setup (schema + migrations + seeding) must finish before we
// start accepting requests, since Turso is a network database.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Quiz platform backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });