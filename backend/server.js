const express = require("express");
const cors = require("cors");

const { initDb } = require("./db");

const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const adminRoutes = require("./routes/admin");
const notesRoutes = require("./routes/notes");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notes", notesRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

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