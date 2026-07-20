const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

// GET /api/admin/students
router.get("/students", requireAuth, requireAdmin, (req, res) => {
  const users = db
    .prepare(
      `SELECT id, username, class_name, school_name, phone_number, created_at
       FROM users ORDER BY created_at DESC`
    )
    .all();

  const attemptsStmt = db.prepare(
    `SELECT subject, score, total_questions, taken_at
     FROM results WHERE user_id = ? ORDER BY taken_at DESC`
  );

  const students = users.map((u) => ({
    ...u,
    attempts: attemptsStmt.all(u.id)
  }));

  res.json({ students });
});

// POST /api/admin/students/:id/reset-password
// Lets an admin set a new password for a student who forgot theirs.
// The admin must then tell the student the new password themselves
// (no email/SMS is sent — there's no email collected for students).
router.post("/students/:id/reset-password", requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "New password must be at least 4 characters" });
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!user) {
    return res.status(404).json({ error: "Student not found" });
  }

  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(password_hash, id);

  res.json({ success: true });
});

module.exports = router;