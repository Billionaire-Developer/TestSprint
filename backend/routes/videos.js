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
      "SELECT DISTINCT subject FROM videos WHERE class_name = ? ORDER BY subject",
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

    const videos = await dbAll(
      `SELECT id, title, description, created_at, updated_at FROM videos
       WHERE class_name = ? AND subject = ? ORDER BY created_at DESC`,
      [className, subject]
    );

    res.json({ subject, className, videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:subject/:videoId", requireAuth, async (req, res) => {
  try {
    const { subject, videoId } = req.params;
    const className = await getOwnClass(req.user.id);
    if (!className) return noClassResponse(res);

    const video = await dbGet(
      `SELECT id, title, video_url, description, created_at, updated_at FROM videos
       WHERE id = ? AND class_name = ? AND subject = ?`,
      [videoId, className, subject]
    );

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({ video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;