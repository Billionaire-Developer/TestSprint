const express = require("express");
const { dbGet, dbAll, dbRun, computeSubjectHash } = require("../db");
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

async function getLatestAttempt(userId, className, subject) {
  return dbGet(
    `SELECT * FROM results WHERE user_id = ? AND class_name = ? AND subject = ?
     ORDER BY taken_at DESC LIMIT 1`,
    [userId, className, subject]
  );
}

router.get("/subjects", requireAuth, async (req, res) => {
  try {
    const className = await getOwnClass(req.user.id);
    if (!className) return noClassResponse(res);

    const rows = await dbAll(
      "SELECT DISTINCT subject FROM questions WHERE class_name = ? ORDER BY subject",
      [className]
    );

    res.json({ className, subjects: rows.map((r) => r.subject) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/leaderboard/:subject", requireAuth, async (req, res) => {
  try {
    const { subject } = req.params;
    const className = await getOwnClass(req.user.id);
    if (!className) return noClassResponse(res);

    const rows = await dbAll(
      `SELECT u.username, MAX(r.score) as best_score, r.total_questions, r.taken_at
       FROM results r
       JOIN users u ON u.id = r.user_id
       WHERE r.subject = ? AND r.class_name = ?
       GROUP BY r.user_id
       ORDER BY best_score DESC, r.taken_at ASC
       LIMIT 10`,
      [subject, className]
    );

    res.json({ subject, className, leaderboard: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:subject/status", requireAuth, async (req, res) => {
  try {
    const { subject } = req.params;
    const className = await getOwnClass(req.user.id);
    if (!className) return noClassResponse(res);

    const currentHash = await computeSubjectHash(className, subject);
    const lastAttempt = await getLatestAttempt(req.user.id, className, subject);

    const locked = !!lastAttempt && lastAttempt.version_hash === currentHash;

    res.json({
      locked,
      lastResult: lastAttempt
        ? {
            score: lastAttempt.score,
            total: lastAttempt.total_questions,
            taken_at: lastAttempt.taken_at,
            details: lastAttempt.details_json ? JSON.parse(lastAttempt.details_json) : []
          }
        : null
    });
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

    const currentHash = await computeSubjectHash(className, subject);
    const lastAttempt = await getLatestAttempt(req.user.id, className, subject);

    if (lastAttempt && lastAttempt.version_hash === currentHash) {
      return res.status(403).json({
        error: "You've already attempted this test. It unlocks again if the questions are updated."
      });
    }

    const questions = await dbAll(
      `SELECT id, subject, question_text, option_a, option_b, option_c, option_d
       FROM questions WHERE class_name = ? AND subject = ?`,
      [className, subject]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        error: `No questions found for subject "${subject}" in your class`
      });
    }

    res.json({ subject, className, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:subject/submit", requireAuth, async (req, res) => {
  try {
    const { subject } = req.params;
    const { answers } = req.body;
    const className = await getOwnClass(req.user.id);
    if (!className) return noClassResponse(res);

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "answers array is required" });
    }

    const currentHash = await computeSubjectHash(className, subject);
    const lastAttempt = await getLatestAttempt(req.user.id, className, subject);
    if (lastAttempt && lastAttempt.version_hash === currentHash) {
      return res.status(403).json({
        error: "You've already attempted this test. It unlocks again if the questions are updated."
      });
    }

    const questionRows = await dbAll(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
       FROM questions WHERE class_name = ? AND subject = ?`,
      [className, subject]
    );

    const questionLookup = questionRows.reduce((map, q) => {
      map[q.id] = q;
      return map;
    }, {});

    let score = 0;
    const details = answers.map((a) => {
      const q = questionLookup[a.question_id];
      const isCorrect = !!q && q.correct_option === a.selected_option;
      if (isCorrect) score++;

      return {
        question_id: a.question_id,
        question_text: q ? q.question_text : null,
        options: q
          ? { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }
          : null,
        selected_option: a.selected_option,
        correct_option: q ? q.correct_option : null,
        is_correct: isCorrect
      };
    });

    await dbRun(
      `INSERT INTO results (user_id, subject, class_name, score, total_questions, version_hash, details_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, subject, className, score, answers.length, currentHash, JSON.stringify(details)]
    );

    res.json({ score, total: answers.length, details });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/results/history", requireAuth, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT id, subject, score, total_questions, taken_at
       FROM results WHERE user_id = ? ORDER BY taken_at DESC`,
      [req.user.id]
    );

    res.json({ results: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;