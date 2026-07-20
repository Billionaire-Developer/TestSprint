const { createClient } = require("@libsql/client");
const crypto = require("crypto");
const { CLASSES } = require("./constants");

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

  const seedBank = {
    physics: [
      { question_text: "What is the SI unit of force?", option_a: "Joule", option_b: "Newton", option_c: "Watt", option_d: "Pascal", correct_option: "B" },
      { question_text: "What is the acceleration due to gravity on Earth (approx.)?", option_a: "9.8 m/s²", option_b: "6.6 m/s²", option_c: "3.2 m/s²", option_d: "12.4 m/s²", correct_option: "A" },
      { question_text: "Which law states 'for every action there is an equal and opposite reaction'?", option_a: "Newton's First Law", option_b: "Newton's Second Law", option_c: "Newton's Third Law", option_d: "Law of Conservation of Energy", correct_option: "C" },
      { question_text: "What type of energy is stored in a stretched rubber band?", option_a: "Kinetic", option_b: "Potential", option_c: "Thermal", option_d: "Chemical", correct_option: "B" },
      { question_text: "What is the speed of light in a vacuum (approx.)?", option_a: "3 x 10^5 m/s", option_b: "3 x 10^6 m/s", option_c: "3 x 10^8 m/s", option_d: "3 x 10^10 m/s", correct_option: "C" }
    ],
    math: [
      { question_text: "What is the value of π (pi) rounded to two decimal places?", option_a: "3.14", option_b: "3.41", option_c: "3.12", option_d: "3.16", correct_option: "A" },
      { question_text: "Solve: 7 + 6 x 2 = ?", option_a: "26", option_b: "19", option_c: "13", option_d: "20", correct_option: "B" },
      { question_text: "What is the square root of 144?", option_a: "10", option_b: "11", option_c: "12", option_d: "14", correct_option: "C" },
      { question_text: "What is the sum of angles in a triangle?", option_a: "90°", option_b: "180°", option_c: "270°", option_d: "360°", correct_option: "B" },
      { question_text: "What is 15% of 200?", option_a: "20", option_b: "25", option_c: "30", option_d: "35", correct_option: "C" }
    ],
    chemistry: [
      { question_text: "What is the chemical symbol for Sodium?", option_a: "So", option_b: "S", option_c: "Na", option_d: "Sd", correct_option: "C" },
      { question_text: "What is the pH of pure water at 25°C?", option_a: "0", option_b: "7", option_c: "10", option_d: "14", correct_option: "B" },
      { question_text: "Which gas is most abundant in Earth's atmosphere?", option_a: "Oxygen", option_b: "Carbon dioxide", option_c: "Nitrogen", option_d: "Hydrogen", correct_option: "C" },
      { question_text: "What is the atomic number of Carbon?", option_a: "6", option_b: "8", option_c: "12", option_d: "14", correct_option: "A" },
      { question_text: "What type of bond involves the sharing of electron pairs?", option_a: "Ionic bond", option_b: "Covalent bond", option_c: "Metallic bond", option_d: "Hydrogen bond", correct_option: "B" }
    ],
    biology: [
      { question_text: "What is the basic unit of life?", option_a: "Tissue", option_b: "Organ", option_c: "Cell", option_d: "Molecule", correct_option: "C" },
      { question_text: "Which organelle is known as the powerhouse of the cell?", option_a: "Nucleus", option_b: "Ribosome", option_c: "Mitochondria", option_d: "Golgi apparatus", correct_option: "C" },
      { question_text: "What process do plants use to make their own food?", option_a: "Respiration", option_b: "Photosynthesis", option_c: "Fermentation", option_d: "Digestion", correct_option: "B" },
      { question_text: "What is the main function of red blood cells?", option_a: "Fight infection", option_b: "Clot blood", option_c: "Carry oxygen", option_d: "Digest food", correct_option: "C" },
      { question_text: "Which molecule carries genetic information in most living organisms?", option_a: "RNA", option_b: "DNA", option_c: "ATP", option_d: "Protein", correct_option: "B" }
    ]
  };

  for (const className of CLASSES) {
    for (const [subject, rows] of Object.entries(seedBank)) {
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