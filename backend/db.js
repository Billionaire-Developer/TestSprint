const { DatabaseSync } = require("node:sqlite");
const path = require("path");

// In production on Render, set DB_PATH to a file inside your attached
// persistent Disk (e.g. /var/data/quiz.db) so data survives redeploys.
// Locally, it just defaults to backend/quiz.db.
const dbPath = process.env.DB_PATH || path.join(__dirname, "quiz.db");
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");

// --- Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    taken_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// --- Migration: add class_name / school_name / phone_number columns if they
// don't exist yet (safe to re-run — checks first, never touches existing data) ---
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userColumns.includes("class_name")) {
  db.exec("ALTER TABLE users ADD COLUMN class_name TEXT");
}
if (!userColumns.includes("school_name")) {
  db.exec("ALTER TABLE users ADD COLUMN school_name TEXT");
}
if (!userColumns.includes("phone_number")) {
  db.exec("ALTER TABLE users ADD COLUMN phone_number TEXT");
}

// --- Migration: add version_hash / details_json to results, to support
// "one attempt per question-set version" and full answer review ---
const resultColumns = db.prepare("PRAGMA table_info(results)").all().map((c) => c.name);
if (!resultColumns.includes("version_hash")) {
  db.exec("ALTER TABLE results ADD COLUMN version_hash TEXT");
}
if (!resultColumns.includes("details_json")) {
  db.exec("ALTER TABLE results ADD COLUMN details_json TEXT");
}

// --- Seed questions per subject (only fills in subjects that have no questions yet,
// so re-running this after adding new subjects won't touch your existing data/history) ---
const insert = db.prepare(`
  INSERT INTO questions (subject, question_text, option_a, option_b, option_c, option_d, correct_option)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const countBySubject = db.prepare("SELECT COUNT(*) as c FROM questions WHERE subject = ?");

const seedBank = {
  physics: [
    {
      question_text: "What is the SI unit of force?",
      option_a: "Joule",
      option_b: "Newton",
      option_c: "Watt",
      option_d: "Pascal",
      correct_option: "B"
    },
    {
      question_text: "What is the acceleration due to gravity on Earth (approx.)?",
      option_a: "9.8 m/s²",
      option_b: "6.6 m/s²",
      option_c: "3.2 m/s²",
      option_d: "12.4 m/s²",
      correct_option: "A"
    },
    {
      question_text: "Which law states 'for every action there is an equal and opposite reaction'?",
      option_a: "Newton's First Law",
      option_b: "Newton's Second Law",
      option_c: "Newton's Third Law",
      option_d: "Law of Conservation of Energy",
      correct_option: "C"
    },
    {
      question_text: "What type of energy is stored in a stretched rubber band?",
      option_a: "Kinetic",
      option_b: "Potential",
      option_c: "Thermal",
      option_d: "Chemical",
      correct_option: "B"
    },
    {
      question_text: "What is the speed of light in a vacuum (approx.)?",
      option_a: "3 x 10^5 m/s",
      option_b: "3 x 10^6 m/s",
      option_c: "3 x 10^8 m/s",
      option_d: "3 x 10^10 m/s",
      correct_option: "C"
    }
  ],
  math: [
    {
      question_text: "What is the value of π (pi) rounded to two decimal places?",
      option_a: "3.14",
      option_b: "3.41",
      option_c: "3.12",
      option_d: "3.16",
      correct_option: "A"
    },
    {
      question_text: "Solve: 7 + 6 x 2 = ?",
      option_a: "26",
      option_b: "19",
      option_c: "13",
      option_d: "20",
      correct_option: "B"
    },
    {
      question_text: "What is the square root of 144?",
      option_a: "10",
      option_b: "11",
      option_c: "12",
      option_d: "14",
      correct_option: "C"
    },
    {
      question_text: "What is the sum of angles in a triangle?",
      option_a: "90°",
      option_b: "180°",
      option_c: "270°",
      option_d: "360°",
      correct_option: "B"
    },
    {
      question_text: "What is 15% of 200?",
      option_a: "20",
      option_b: "25",
      option_c: "30",
      option_d: "35",
      correct_option: "C"
    }
  ],
  chemistry: [
    {
      question_text: "What is the chemical symbol for Sodium?",
      option_a: "So",
      option_b: "S",
      option_c: "Na",
      option_d: "Sd",
      correct_option: "C"
    },
    {
      question_text: "What is the pH of pure water at 25°C?",
      option_a: "0",
      option_b: "7",
      option_c: "10",
      option_d: "14",
      correct_option: "B"
    },
    {
      question_text: "Which gas is most abundant in Earth's atmosphere?",
      option_a: "Oxygen",
      option_b: "Carbon dioxide",
      option_c: "Nitrogen",
      option_d: "Hydrogen",
      correct_option: "C"
    },
    {
      question_text: "What is the atomic number of Carbon?",
      option_a: "6",
      option_b: "8",
      option_c: "12",
      option_d: "14",
      correct_option: "A"
    },
    {
      question_text: "What type of bond involves the sharing of electron pairs?",
      option_a: "Ionic bond",
      option_b: "Covalent bond",
      option_c: "Metallic bond",
      option_d: "Hydrogen bond",
      correct_option: "B"
    }
  ],
  biology: [
    {
      question_text: "What is the basic unit of life?",
      option_a: "Tissue",
      option_b: "Organ",
      option_c: "Cell",
      option_d: "Molecule",
      correct_option: "C"
    },
    {
      question_text: "Which organelle is known as the powerhouse of the cell?",
      option_a: "Nucleus",
      option_b: "Ribosome",
      option_c: "Mitochondria",
      option_d: "Golgi apparatus",
      correct_option: "C"
    },
    {
      question_text: "What process do plants use to make their own food?",
      option_a: "Respiration",
      option_b: "Photosynthesis",
      option_c: "Fermentation",
      option_d: "Digestion",
      correct_option: "B"
    },
    {
      question_text: "What is the main function of red blood cells?",
      option_a: "Fight infection",
      option_b: "Clot blood",
      option_c: "Carry oxygen",
      option_d: "Digest food",
      correct_option: "C"
    },
    {
      question_text: "Which molecule carries genetic information in most living organisms?",
      option_a: "RNA",
      option_b: "DNA",
      option_c: "ATP",
      option_d: "Protein",
      correct_option: "B"
    }
  ]
};

db.exec("BEGIN");
for (const [subject, rows] of Object.entries(seedBank)) {
  const existing = countBySubject.get(subject).c;
  if (existing === 0) {
    for (const row of rows) {
      insert.run(
        subject,
        row.question_text,
        row.option_a,
        row.option_b,
        row.option_c,
        row.option_d,
        row.correct_option
      );
    }
    console.log(`Seeded questions for subject: ${subject}`);
  }
}
db.exec("COMMIT");

// --- Helper: hash the current question set for a subject.
// Used to detect when questions have changed (e.g. you edited the seed data
// and restarted), which automatically unlocks a fresh attempt for everyone. ---
const crypto = require("crypto");

function computeSubjectHash(subject) {
  const rows = db
    .prepare(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
       FROM questions WHERE subject = ? ORDER BY id`
    )
    .all(subject);

  const fingerprint = JSON.stringify(rows);
  return crypto.createHash("sha256").update(fingerprint).digest("hex");
}

module.exports = db;
module.exports.computeSubjectHash = computeSubjectHash;