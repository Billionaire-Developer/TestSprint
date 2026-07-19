const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, password_hash);

  const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET, {
    expiresIn: "7d"
  });

  res.status(201).json({ token, username });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d"
  });

  res.json({ token, username: user.username });
});

// GET /api/auth/profile — returns the logged-in user's profile info
router.get("/profile", requireAuth, (req, res) => {
  const user = db
    .prepare("SELECT username, class_name, school_name, phone_number FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ user });
});

// PUT /api/auth/profile — updates the logged-in user's profile info
router.put("/profile", requireAuth, (req, res) => {
  const { class_name, school_name, phone_number } = req.body;

  db.prepare(
    "UPDATE users SET class_name = ?, school_name = ?, phone_number = ? WHERE id = ?"
  ).run(class_name || null, school_name || null, phone_number || null, req.user.id);

  res.json({
    class_name: class_name || null,
    school_name: school_name || null,
    phone_number: phone_number || null
  });
});

module.exports = router;