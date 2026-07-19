const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function getLatestAttempt(userId, subject) {
  return db
    .prepare(
      `SELECT * FROM results WHERE user_id = ? AND subject = ? ORDER BY taken_at DESC LIMIT 1`
    )
    .get(userId, subject);
}

// GET /api/quiz/:subject/status
router.get("/:subject/status", requireAuth, (req, res) => {
  const { subject } = req.params;
  const currentHash = db.computeSubjectHash(subject);
  const lastAttempt = getLatestAttempt(req.user.id, subject);

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
});

// GET /api/quiz/:subject  -> returns questions WITHOUT the correct answer
router.get("/:subject", requireAuth, (req, res) => {
  const { subject } = req.params;
  const currentHash = db.computeSubjectHash(subject);
  const lastAttempt = getLatestAttempt(req.user.id, subject);

  if (lastAttempt && lastAttempt.version_hash === currentHash) {
    return res.status(403).json({
      error: "You've already attempted this test. It unlocks again if the questions are updated."
    });
  }

  const questions = db
    .prepare(
      `SELECT id, subject, question_text, option_a, option_b, option_c, option_d
       FROM questions WHERE subject = ?`
    )
    .all(subject);

  if (questions.length === 0) {
    return res.status(404).json({ error: `No questions found for subject "${subject}"` });
  }

  res.json({ subject, questions });
});

// POST /api/quiz/:subject/submit
router.post("/:subject/submit", requireAuth, (req, res) => {
  const { subject } = req.params;
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "answers array is required" });
  }

  const currentHash = db.computeSubjectHash(subject);
  const lastAttempt = getLatestAttempt(req.user.id, subject);
  if (lastAttempt && lastAttempt.version_hash === currentHash) {
    return res.status(403).json({
      error: "You've already attempted this test. It unlocks again if the questions are updated."
    });
  }

  const questionRows = db
    .prepare(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
       FROM questions WHERE subject = ?`
    )
    .all(subject);

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

  db.prepare(
    `INSERT INTO results (user_id, subject, score, total_questions, version_hash, details_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.user.id, subject, score, answers.length, currentHash, JSON.stringify(details));

  res.json({ score, total: answers.length, details });
});

// GET /api/quiz/results/history -> logged-in user's past results
router.get("/results/history", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, subject, score, total_questions, taken_at
       FROM results WHERE user_id = ? ORDER BY taken_at DESC`
    )
    .all(req.user.id);

  res.json({ results: rows });
});

module.exports = router;