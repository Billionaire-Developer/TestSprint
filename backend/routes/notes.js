const express = require("express");
const { dbGet, dbAll } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

async function getOwnClass(userId) {
  const user = await dbGet("SELECT class_name FROM users WHERE id = ?", [userId]);
  return user ? user.class_name : null;
}

function noClassResponse(res) {
  return res.status(400).json({
    error: "no_class",
    message: "Please select your class first."
  });
}

router.get("/subjects", requireAuth, async (req, res) => {
  try {
    const className = await getOwnClass(req.user.id);
    if (!className) return noClassResponse(res);

    const rows = await dbAll(
      "SELECT DISTINCT subject FROM notes WHERE class_name = ? ORDER BY subject",
      [className]
    );

    res.json({ className, subjects: rows.map((r) => r.subject) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:subject", requireAuth, async (req, res) => {
  try {
    const { subject } = req.params;
    const className = await getOwnClass(req.user.id);
    if (!className) return noClassResponse(res);

    const notes = await dbAll(
      `SELECT id, title, created_at, updated_at FROM notes
       WHERE class_name = ? AND subject = ? ORDER BY created_at DESC`,
      [className, subject]
    );

    res.json({ subject, className, notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:subject/:noteId", requireAuth, async (req, res) => {
  try {
    const { subject, noteId } = req.params;
    const className = await getOwnClass(req.user.id);
    if (!className) return noClassResponse(res);

    const note = await dbGet(
      `SELECT id, title, content, created_at, updated_at FROM notes
       WHERE id = ? AND class_name = ? AND subject = ?`,
      [noteId, className, subject]
    );

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;