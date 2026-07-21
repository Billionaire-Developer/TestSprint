const { createClient } = require("@libsql/client");
const crypto = require("crypto");
const { CLASSES } = require("./constants");
const seedBank = require("./seedData");

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.warn(
    "WARNING: TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are not set. " +
      "The app will fail to connect to the database."
  );
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function dbRun(sql, args = []) {
  const result = await client.execute({ sql, args });
  return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
}

async function dbGet(sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows[0];
}

async function dbAll(sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows;
}

async function tableColumns(table) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.map((r) => r.name);
}

async function computeSubjectHash(className, subject) {
  const rows = await dbAll(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
     FROM questions WHERE class_name = ? AND subject = ? ORDER BY id`,
    [className, subject]
  );
  return crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

async function initDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      taken_at TEXT DEFAULT CURRENT_TIMESTAMP,
      version_hash TEXT,
      details_json TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  const userColumns = await tableColumns("users");
  if (!userColumns.includes("class_name")) {
    await client.execute("ALTER TABLE users ADD COLUMN class_name TEXT");
  }
  if (!userColumns.includes("school_name")) {
    await client.execute("ALTER TABLE users ADD COLUMN school_name TEXT");
  }
  if (!userColumns.includes("phone_number")) {
    await client.execute("ALTER TABLE users ADD COLUMN phone_number TEXT");
  }
  if (!userColumns.includes("is_admin")) {
    await client.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0");
  }

  const resultColumns = await tableColumns("results");
  if (!resultColumns.includes("version_hash")) {
    await client.execute("ALTER TABLE results ADD COLUMN version_hash TEXT");
  }
  if (!resultColumns.includes("details_json")) {
    await client.execute("ALTER TABLE results ADD COLUMN details_json TEXT");
  }
  if (!resultColumns.includes("class_name")) {
    await client.execute("ALTER TABLE results ADD COLUMN class_name TEXT");
  }

  const questionColumns = await tableColumns("questions");
  if (!questionColumns.includes("class_name")) {
    await client.execute("ALTER TABLE questions ADD COLUMN class_name TEXT");
  }

  // Seed questions per (class, subject) — each class has its OWN distinct
  // question bank, defined in seedData.js. Only fills in combos with no
  // questions yet, so edits to seedData.js are additive, never overwrite
  // existing content.
  for (const className of CLASSES) {
    const subjectsForClass = seedBank[className] || {};
    for (const [subject, rows] of Object.entries(subjectsForClass)) {
      const existing = await dbGet(
        "SELECT COUNT(*) as c FROM questions WHERE class_name = ? AND subject = ?",
        [className, subject]
      );
      if (Number(existing.c) === 0) {
        for (const row of rows) {
          await dbRun(
            `INSERT INTO questions (subject, class_name, question_text, option_a, option_b, option_c, option_d, correct_option)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [subject, className, row.question_text, row.option_a, row.option_b, row.option_c, row.option_d, row.correct_option]
          );
        }
        console.log(`Seeded questions for ${className} / ${subject}`);
      }
    }
  }
}

module.exports = { dbRun, dbGet, dbAll, computeSubjectHash, initDb };