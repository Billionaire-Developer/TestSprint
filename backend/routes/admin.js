const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

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

module.exports = router;