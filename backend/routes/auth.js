const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dbGet, dbRun } = require("../db");
const { JWT_SECRET, requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }

    const existing = await dbGet("SELECT id FROM users WHERE username = ?", [username]);
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const info = await dbRun(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, password_hash]
    );

    const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET, {
      expiresIn: "7d"
    });

    res.status(201).json({ token, username, is_admin: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);
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

    res.json({ token, username: user.username, is_admin: !!user.is_admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await dbGet(
      "SELECT username, class_name, school_name, phone_number, is_admin FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: { ...user, is_admin: !!user.is_admin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { class_name, school_name, phone_number } = req.body;

    await dbRun(
      "UPDATE users SET class_name = ?, school_name = ?, phone_number = ? WHERE id = ?",
      [class_name || null, school_name || null, phone_number || null, req.user.id]
    );

    res.json({
      class_name: class_name || null,
      school_name: school_name || null,
      phone_number: phone_number || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/promote-admin", requireAuth, async (req, res) => {
  try {
    const { adminSecret } = req.body;

    if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Invalid admin secret" });
    }

    await dbRun("UPDATE users SET is_admin = 1 WHERE id = ?", [req.user.id]);
    res.json({ is_admin: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;