const { dbGet } = require("../db");

async function requireAdmin(req, res, next) {
  try {
    const user = await dbGet("SELECT is_admin FROM users WHERE id = ?", [req.user.id]);

    if (!user || !user.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { requireAdmin };