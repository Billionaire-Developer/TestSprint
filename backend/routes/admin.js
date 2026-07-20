const express = require("express");
const bcrypt = require("bcryptjs");
const { dbGet, dbAll, dbRun } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { CLASSES } = require("../constants");

const router = express.Router();

router.get("/students", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await dbAll(
      `SELECT id, username, class_name, school_name, phone_number, created_at
       FROM users ORDER BY created_at DESC`
    );

    const students = [];
    for (const u of users) {
      const attempts = await dbAll(
        `SELECT subject, score, total_questions, taken_at
         FROM results WHERE user_id = ? ORDER BY taken_at DESC`,
        [u.id]
      );
      students.push({ ...u, attempts });
    }

    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/students/:id/reset-password", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: "New password must be at least 4 characters" });
    }

    const user = await dbGet("SELECT id FROM users WHERE id = ?", [id]);
    if (!user) {
      return res.status(404).json({ error: "Student not found" });
    }

    const password_hash = bcrypt.hashSync(newPassword, 10);
    await dbRun("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/students/:id/set-class", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { className } = req.body;

    if (!CLASSES.includes(className)) {
      return res.status(400).json({ error: "Invalid class name" });
    }

    const user = await dbGet("SELECT id FROM users WHERE id = ?", [id]);
    if (!user) {
      return res.status(404).json({ error: "Student not found" });
    }

    await dbRun("UPDATE users SET class_name = ? WHERE id = ?", [className, id]);
    res.json({ class_name: className });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;