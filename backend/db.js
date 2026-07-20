const { createClient } = require("@libsql/client");
const crypto = require("crypto");

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

async function computeSubjectHash(subject) {
  const rows = await dbAll(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
     FROM questions WHERE subject = ? ORDER BY id`,
    [subject]
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

  const seedBank = {
   physics: [
  { question_text: "A body moving with constant velocity has:", option_a: "Constant acceleration", option_b: "Zero acceleration", option_c: "Increasing acceleration", option_d: "Negative acceleration", correct_option: "B" },
  { question_text: "The slope of a velocity-time graph represents:", option_a: "Distance", option_b: "Speed", option_c: "Acceleration", option_d: "Momentum", correct_option: "C" },
  { question_text: "The area under a velocity-time graph gives:", option_a: "Acceleration", option_b: "Displacement", option_c: "Force", option_d: "Momentum", correct_option: "B" },
  { question_text: "The SI unit of pressure is:", option_a: "Newton", option_b: "Pascal", option_c: "Joule", option_d: "Watt", correct_option: "B" },
  { question_text: "Which instrument is used to measure atmospheric pressure?", option_a: "Thermometer", option_b: "Hydrometer", option_c: "Barometer", option_d: "Manometer", correct_option: "C" },
  { question_text: "A force of 20 N acts on a body of mass 5 kg. The acceleration produced is:", option_a: "2 m/s²", option_b: "4 m/s²", option_c: "5 m/s²", option_d: "10 m/s²", correct_option: "B" },
  { question_text: "Work is done when:", option_a: "A force acts without movement", option_b: "A force causes displacement", option_c: "An object is stationary", option_d: "An object has mass", correct_option: "B" },
  { question_text: "The SI unit of power is:", option_a: "Joule", option_b: "Pascal", option_c: "Watt", option_d: "Newton", correct_option: "C" },
  { question_text: "A machine with efficiency of 80% converts:", option_a: "80% of input work into useful output work", option_b: "20% of input work into useful output work", option_c: "100% of input work into heat", option_d: "No input work into output work", correct_option: "A" },
  { question_text: "The momentum of a body is the product of:", option_a: "Mass and force", option_b: "Mass and velocity", option_c: "Force and acceleration", option_d: "Weight and velocity", correct_option: "B" },

  { question_text: "Which of the following is a vector quantity?", option_a: "Speed", option_b: "Distance", option_c: "Velocity", option_d: "Time", correct_option: "C" },
  { question_text: "The turning effect of a force is called:", option_a: "Pressure", option_b: "Torque", option_c: "Power", option_d: "Momentum", correct_option: "B" },
  { question_text: "The principle of flotation states that:", option_a: "A floating body displaces its own weight of fluid", option_b: "Heavy objects always sink", option_c: "Objects float only in water", option_d: "Pressure decreases with depth", correct_option: "A" },
  { question_text: "Heat is transferred from one part of a metal rod to another mainly by:", option_a: "Radiation", option_b: "Conduction", option_c: "Convection", option_d: "Reflection", correct_option: "B" },
  { question_text: "The boiling point of pure water at standard atmospheric pressure is:", option_a: "0°C", option_b: "50°C", option_c: "100°C", option_d: "212°C", correct_option: "C" },
  { question_text: "Which of the following is the best conductor of electricity?", option_a: "Rubber", option_b: "Plastic", option_c: "Copper", option_d: "Wood", correct_option: "C" },
  { question_text: "The resistance of a conductor depends on its:", option_a: "Length only", option_b: "Material only", option_c: "Length, area and material", option_d: "Colour only", correct_option: "C" },
  { question_text: "The unit of electrical resistance is:", option_a: "Volt", option_b: "Ampere", option_c: "Ohm", option_d: "Coulomb", correct_option: "C" },
  { question_text: "An electric current of 2 A flows for 5 seconds. The quantity of charge transferred is:", option_a: "2 C", option_b: "5 C", option_c: "7 C", option_d: "10 C", correct_option: "D" },
  { question_text: "The relationship between voltage (V), current (I), and resistance (R) is given by:", option_a: "V = IR", option_b: "V = I/R", option_c: "R = VI", option_d: "I = VR", correct_option: "A" },

  { question_text: "The image formed by a plane mirror is:", option_a: "Real and inverted", option_b: "Virtual and upright", option_c: "Real and upright", option_d: "Virtual and inverted", correct_option: "B" },
  { question_text: "The angle of incidence is always:", option_a: "Greater than the angle of reflection", option_b: "Equal to the angle of reflection", option_c: "Less than the angle of reflection", option_d: "Twice the angle of reflection", correct_option: "B" },
  { question_text: "The splitting of white light into its component colours is called:", option_a: "Reflection", option_b: "Refraction", option_c: "Dispersion", option_d: "Diffraction", correct_option: "C" },
  { question_text: "Which electromagnetic wave has the highest frequency?", option_a: "Radio waves", option_b: "Microwaves", option_c: "X-rays", option_d: "Gamma rays", correct_option: "D" },
  { question_text: "The frequency of a wave is measured in:", option_a: "Metres", option_b: "Seconds", option_c: "Hertz", option_d: "Newtons", correct_option: "C" },
  { question_text: "The time taken for one complete oscillation is called:", option_a: "Amplitude", option_b: "Period", option_c: "Frequency", option_d: "Wavelength", correct_option: "B" },
  { question_text: "A body of mass 10 kg is lifted through a height of 5 m. Taking g = 10 m/s², the gain in potential energy is:", option_a: "50 J", option_b: "100 J", option_c: "500 J", option_d: "1000 J", correct_option: "C" },
  { question_text: "A car travels at 20 m/s for 15 seconds. The distance covered is:", option_a: "150 m", option_b: "300 m", option_c: "350 m", option_d: "400 m", correct_option: "B" },
  { question_text: "The efficiency of a machine is calculated as:", option_a: "Output work ÷ Input work × 100%", option_b: "Input work ÷ Output work × 100%", option_c: "Output force ÷ Input force × 100%", option_d: "Input energy × Output energy", correct_option: "A" },
  { question_text: "If a force of 50 N moves an object through 4 m in the direction of the force, the work done is:", option_a: "46 J", option_b: "54 J", option_c: "200 J", option_d: "400 J", correct_option: "C" }
],
    math: [
  { question_text: "Solve: 5x - 7 = 18", option_a: "3", option_b: "4", option_c: "5", option_d: "6", correct_option: "C" },
  { question_text: "Factorize: x² + 7x + 12", option_a: "(x + 2)(x + 5)", option_b: "(x + 3)(x + 4)", option_c: "(x + 6)(x + 2)", option_d: "(x + 1)(x + 12)", correct_option: "B" },
  { question_text: "Evaluate: (3² × 2³)", option_a: "36", option_b: "54", option_c: "72", option_d: "108", correct_option: "C" },
  { question_text: "The value of √625 is:", option_a: "15", option_b: "20", option_c: "25", option_d: "30", correct_option: "C" },
  { question_text: "If y = 3x + 5, find y when x = 4.", option_a: "12", option_b: "15", option_c: "17", option_d: "20", correct_option: "C" },

  { question_text: "Simplify: 2/3 + 5/6", option_a: "7/9", option_b: "3/2", option_c: "4/3", option_d: "5/6", correct_option: "B" },
  { question_text: "Express 0.375 as a fraction in its simplest form.", option_a: "3/8", option_b: "5/8", option_c: "7/16", option_d: "1/4", correct_option: "A" },
  { question_text: "A shirt costs ₦8,000. A discount of 15% is given. Find the discount.", option_a: "₦1,000", option_b: "₦1,200", option_c: "₦1,500", option_d: "₦800", correct_option: "B" },
  { question_text: "Find the simple interest on ₦10,000 at 8% per annum for 3 years.", option_a: "₦2,000", option_b: "₦2,200", option_c: "₦2,400", option_d: "₦2,800", correct_option: "C" },
  { question_text: "If the ratio of boys to girls is 3:5 and there are 40 students, how many are boys?", option_a: "12", option_b: "15", option_c: "18", option_d: "20", correct_option: "B" },

  { question_text: "The sum of the interior angles of a pentagon is:", option_a: "360°", option_b: "540°", option_c: "720°", option_d: "900°", correct_option: "B" },
  { question_text: "Find the area of a triangle with base 12 cm and height 9 cm.", option_a: "54 cm²", option_b: "96 cm²", option_c: "108 cm²", option_d: "42 cm²", correct_option: "A" },
  { question_text: "The circumference of a circle with radius 7 cm is (Take π = 22/7):", option_a: "22 cm", option_b: "44 cm", option_c: "49 cm", option_d: "154 cm", correct_option: "B" },
  { question_text: "Find the volume of a cube with side length 5 cm.", option_a: "25 cm³", option_b: "75 cm³", option_c: "100 cm³", option_d: "125 cm³", correct_option: "D" },
  { question_text: "The Pythagorean theorem applies to:", option_a: "Equilateral triangles", option_b: "Right-angled triangles", option_c: "Isosceles triangles", option_d: "Scalene triangles", correct_option: "B" },

  { question_text: "Find the value of x if 2x² = 50.", option_a: "±3", option_b: "±4", option_c: "±5", option_d: "±6", correct_option: "C" },
  { question_text: "Simplify: (3x²)(2x³)", option_a: "5x⁵", option_b: "6x⁵", option_c: "6x⁶", option_d: "5x⁶", correct_option: "B" },
  { question_text: "If log₁₀(1000) = ?", option_a: "2", option_b: "3", option_c: "4", option_d: "10", correct_option: "B" },
  { question_text: "The gradient of the line joining (2,3) and (6,11) is:", option_a: "1", option_b: "2", option_c: "3", option_d: "4", correct_option: "B" },
  { question_text: "Solve: 4x + 9 = 29", option_a: "3", option_b: "4", option_c: "5", option_d: "6", correct_option: "C" },

  { question_text: "The mean of 8, 12, 10, 15 and 5 is:", option_a: "9", option_b: "10", option_c: "11", option_d: "12", correct_option: "B" },
  { question_text: "The median of 3, 8, 9, 11, 15 is:", option_a: "8", option_b: "9", option_c: "10", option_d: "11", correct_option: "B" },
  { question_text: "The probability of getting a head when a fair coin is tossed is:", option_a: "0", option_b: "1/4", option_c: "1/2", option_d: "1", correct_option: "C" },
  { question_text: "A die is rolled once. What is the probability of getting an even number?", option_a: "1/6", option_b: "1/3", option_c: "1/2", option_d: "2/3", correct_option: "C" },
  { question_text: "If 3 : x = 9 : 15, find x.", option_a: "4", option_b: "5", option_c: "6", option_d: "7", correct_option: "B" },

  { question_text: "Expand: (x + 4)(x + 2)", option_a: "x² + 6x + 8", option_b: "x² + 8x + 6", option_c: "x² + 4x + 2", option_d: "x² + 2x + 8", correct_option: "A" },
  { question_text: "Factorize: x² - 16", option_a: "(x - 8)(x + 2)", option_b: "(x - 4)(x + 4)", option_c: "(x - 2)(x + 8)", option_d: "(x - 16)(x + 1)", correct_option: "B" },
  { question_text: "Solve: x² = 81", option_a: "±7", option_b: "±8", option_c: "±9", option_d: "9 only", correct_option: "C" },
  { question_text: "Find the HCF of 24 and 36.", option_a: "6", option_b: "8", option_c: "10", option_d: "12", correct_option: "D" },
  { question_text: "Find the LCM of 12 and 18.", option_a: "24", option_b: "36", option_c: "48", option_d: "72", correct_option: "B" }
],
    chemistry: [
  { question_text: "Which of the following is a physical change?", option_a: "Burning paper", option_b: "Rusting iron", option_c: "Melting ice", option_d: "Digesting food", correct_option: "C" },
  { question_text: "The smallest particle of an element that retains its chemical properties is called:", option_a: "Molecule", option_b: "Atom", option_c: "Ion", option_d: "Electron", correct_option: "B" },
  { question_text: "Which subatomic particle has no electrical charge?", option_a: "Electron", option_b: "Proton", option_c: "Neutron", option_d: "Positron", correct_option: "C" },
  { question_text: "The mass number of an atom is equal to the:", option_a: "Number of electrons only", option_b: "Number of protons only", option_c: "Sum of protons and neutrons", option_d: "Sum of electrons and protons", correct_option: "C" },
  { question_text: "Which of the following is an alkali metal?", option_a: "Calcium", option_b: "Magnesium", option_c: "Sodium", option_d: "Aluminium", correct_option: "C" },

  { question_text: "The valency of oxygen is:", option_a: "1", option_b: "2", option_c: "3", option_d: "4", correct_option: "B" },
  { question_text: "Which of the following is a compound?", option_a: "Iron", option_b: "Air", option_c: "Water", option_d: "Sulphur", correct_option: "C" },
  { question_text: "The chemical formula for calcium carbonate is:", option_a: "CaCO₃", option_b: "CaO", option_c: "Ca(OH)₂", option_d: "CaSO₄", correct_option: "A" },
  { question_text: "The relative atomic mass of carbon is:", option_a: "6", option_b: "8", option_c: "12", option_d: "14", correct_option: "C" },
  { question_text: "Avogadro's constant is approximately:", option_a: "6.02 × 10²³", option_b: "3.00 × 10⁸", option_c: "9.81", option_d: "1.60 × 10⁻¹⁹", correct_option: "A" },

  { question_text: "How many moles are present in 36 g of water (H₂O = 18)?", option_a: "1 mole", option_b: "2 moles", option_c: "3 moles", option_d: "4 moles", correct_option: "B" },
  { question_text: "What is the molar mass of carbon dioxide (CO₂)?", option_a: "28 g/mol", option_b: "32 g/mol", option_c: "40 g/mol", option_d: "44 g/mol", correct_option: "D" },
  { question_text: "Which gas turns limewater milky?", option_a: "Oxygen", option_b: "Nitrogen", option_c: "Carbon dioxide", option_d: "Hydrogen", correct_option: "C" },
  { question_text: "Which indicator turns red in acidic solutions?", option_a: "Blue litmus paper", option_b: "Red litmus paper", option_c: "Phenolphthalein", option_d: "Methyl orange in alkali", correct_option: "A" },
  { question_text: "A solution with pH 3 is:", option_a: "Neutral", option_b: "Acidic", option_c: "Alkaline", option_d: "Amphoteric", correct_option: "B" },

  { question_text: "The process of losing electrons is known as:", option_a: "Reduction", option_b: "Oxidation", option_c: "Neutralization", option_d: "Hydrolysis", correct_option: "B" },
  { question_text: "Which of the following is an example of an oxidation reaction?", option_a: "Rusting of iron", option_b: "Freezing water", option_c: "Melting wax", option_d: "Boiling ethanol", correct_option: "A" },
  { question_text: "The gas produced when zinc reacts with dilute hydrochloric acid is:", option_a: "Oxygen", option_b: "Carbon dioxide", option_c: "Hydrogen", option_d: "Chlorine", correct_option: "C" },
  { question_text: "The empirical formula of glucose (C₆H₁₂O₆) is:", option_a: "CH₂O", option_b: "C₂H₄O₂", option_c: "CHO", option_d: "C₃H₆O₃", correct_option: "A" },
  { question_text: "Which type of bond is formed by the transfer of electrons?", option_a: "Covalent bond", option_b: "Metallic bond", option_c: "Ionic bond", option_d: "Coordinate bond", correct_option: "C" },

  { question_text: "The oxidation number of oxygen in most compounds is:", option_a: "-2", option_b: "+2", option_c: "-1", option_d: "+1", correct_option: "A" },
  { question_text: "Which of the following is a strong acid?", option_a: "Ethanoic acid", option_b: "Carbonic acid", option_c: "Hydrochloric acid", option_d: "Citric acid", correct_option: "C" },
  { question_text: "The process by which a solid changes directly into a gas is called:", option_a: "Condensation", option_b: "Evaporation", option_c: "Sublimation", option_d: "Fusion", correct_option: "C" },
  { question_text: "Which of the following methods can be used to separate crude oil into fractions?", option_a: "Filtration", option_b: "Fractional distillation", option_c: "Chromatography", option_d: "Evaporation", correct_option: "B" },
  { question_text: "The main constituent of natural gas is:", option_a: "Ethane", option_b: "Methane", option_c: "Propane", option_d: "Butane", correct_option: "B" },

  { question_text: "The functional group present in alcohols is:", option_a: "-COOH", option_b: "-OH", option_c: "-CHO", option_d: "-NH₂", correct_option: "B" },
  { question_text: "Which hydrocarbon is an alkene?", option_a: "Methane", option_b: "Ethane", option_c: "Ethene", option_d: "Propane", correct_option: "C" },
  { question_text: "What is the IUPAC name of CH₄?", option_a: "Ethane", option_b: "Methane", option_c: "Propane", option_d: "Butane", correct_option: "B" },
  { question_text: "The catalyst commonly used in the Haber process is:", option_a: "Copper", option_b: "Iron", option_c: "Nickel", option_d: "Platinum", correct_option: "B" },
  { question_text: "Which of the following gases is responsible for acid rain?", option_a: "Hydrogen", option_b: "Nitrogen", option_c: "Sulphur dioxide", option_d: "Helium", correct_option: "C" }
],
    biology: [
  { question_text: "Which of the following is found in plant cells but absent in animal cells?", option_a: "Cell membrane", option_b: "Nucleus", option_c: "Cell wall", option_d: "Mitochondrion", correct_option: "C" },
  { question_text: "The movement of water molecules from a region of high concentration to low concentration through a selectively permeable membrane is called:", option_a: "Diffusion", option_b: "Osmosis", option_c: "Transpiration", option_d: "Active transport", correct_option: "B" },
  { question_text: "Which part of the plant absorbs water and mineral salts from the soil?", option_a: "Stem", option_b: "Leaves", option_c: "Root hairs", option_d: "Flowers", correct_option: "C" },
  { question_text: "The green pigment responsible for photosynthesis is called:", option_a: "Carotene", option_b: "Chlorophyll", option_c: "Melanin", option_d: "Xanthophyll", correct_option: "B" },
  { question_text: "Which process releases energy from food in living cells?", option_a: "Photosynthesis", option_b: "Respiration", option_c: "Digestion", option_d: "Excretion", correct_option: "B" },

  { question_text: "The functional unit of the kidney is the:", option_a: "Neuron", option_b: "Nephron", option_c: "Alveolus", option_d: "Glomerulus", correct_option: "B" },
  { question_text: "Which blood vessel carries oxygenated blood from the lungs to the heart?", option_a: "Pulmonary artery", option_b: "Aorta", option_c: "Pulmonary vein", option_d: "Vena cava", correct_option: "C" },
  { question_text: "The largest organ in the human body is the:", option_a: "Liver", option_b: "Brain", option_c: "Skin", option_d: "Heart", correct_option: "C" },
  { question_text: "Which chamber of the heart pumps oxygenated blood to the body?", option_a: "Right atrium", option_b: "Right ventricle", option_c: "Left atrium", option_d: "Left ventricle", correct_option: "D" },
  { question_text: "Which blood cells help to fight infections?", option_a: "Red blood cells", option_b: "Platelets", option_c: "White blood cells", option_d: "Plasma", correct_option: "C" },

  { question_text: "The exchange of gases in the lungs takes place in the:", option_a: "Bronchi", option_b: "Trachea", option_c: "Alveoli", option_d: "Larynx", correct_option: "C" },
  { question_text: "Which process removes metabolic waste from the body?", option_a: "Digestion", option_b: "Excretion", option_c: "Respiration", option_d: "Nutrition", correct_option: "B" },
  { question_text: "The loss of water vapour from plant leaves is known as:", option_a: "Respiration", option_b: "Germination", option_c: "Transpiration", option_d: "Photosynthesis", correct_option: "C" },
  { question_text: "Which tissue transports water from the roots to the leaves?", option_a: "Phloem", option_b: "Cambium", option_c: "Xylem", option_d: "Epidermis", correct_option: "C" },
  { question_text: "Food manufactured in leaves is transported through the:", option_a: "Xylem", option_b: "Phloem", option_c: "Cortex", option_d: "Root hairs", correct_option: "B" },

  { question_text: "Which of the following is NOT a characteristic of living things?", option_a: "Respiration", option_b: "Growth", option_c: "Photosynthesis", option_d: "Movement", correct_option: "C" },
  { question_text: "The scientific study of heredity is called:", option_a: "Ecology", option_b: "Physiology", option_c: "Genetics", option_d: "Taxonomy", correct_option: "C" },
  { question_text: "A dominant gene is represented by:", option_a: "A capital letter", option_b: "A small letter", option_c: "A number", option_d: "A symbol", correct_option: "A" },
  { question_text: "The sex chromosomes in a human female are:", option_a: "XY", option_b: "XX", option_c: "YY", option_d: "XO", correct_option: "B" },
  { question_text: "Variation among organisms is mainly caused by:", option_a: "Respiration", option_b: "Reproduction", option_c: "Genetic inheritance and environment", option_d: "Excretion", correct_option: "C" },

  { question_text: "Which kingdom does Amoeba belong to?", option_a: "Animalia", option_b: "Plantae", option_c: "Protista", option_d: "Fungi", correct_option: "C" },
  { question_text: "The scientific name of humans is:", option_a: "Homo erectus", option_b: "Homo sapiens", option_c: "Pan troglodytes", option_d: "Australopithecus", correct_option: "B" },
  { question_text: "Which level of classification comes immediately after kingdom?", option_a: "Family", option_b: "Order", option_c: "Phylum", option_d: "Class", correct_option: "C" },
  { question_text: "The relationship in which both organisms benefit is called:", option_a: "Parasitism", option_b: "Commensalism", option_c: "Mutualism", option_d: "Predation", correct_option: "C" },
  { question_text: "Green plants are referred to as:", option_a: "Consumers", option_b: "Decomposers", option_c: "Producers", option_d: "Scavengers", correct_option: "C" },

  { question_text: "Which of the following diseases is caused by a virus?", option_a: "Tuberculosis", option_b: "Malaria", option_c: "Measles", option_d: "Typhoid", correct_option: "C" },
  { question_text: "The vector that transmits malaria is the:", option_a: "Housefly", option_b: "Tsetse fly", option_c: "Female Anopheles mosquito", option_d: "Cockroach", correct_option: "C" },
  { question_text: "Which vitamin is produced in the skin in the presence of sunlight?", option_a: "Vitamin A", option_b: "Vitamin B", option_c: "Vitamin C", option_d: "Vitamin D", correct_option: "D" },
  { question_text: "The deficiency disease caused by lack of vitamin C is:", option_a: "Rickets", option_b: "Scurvy", option_c: "Beriberi", option_d: "Night blindness", correct_option: "B" },
  { question_text: "Which nutrient is mainly responsible for body building and tissue repair?", option_a: "Carbohydrates", option_b: "Fats", option_c: "Proteins", option_d: "Vitamins", correct_option: "C" }
]
  };

  for (const [subject, rows] of Object.entries(seedBank)) {
    const existing = await dbGet("SELECT COUNT(*) as c FROM questions WHERE subject = ?", [subject]);
    if (Number(existing.c) === 0) {
      for (const row of rows) {
        await dbRun(
          `INSERT INTO questions (subject, question_text, option_a, option_b, option_c, option_d, correct_option)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [subject, row.question_text, row.option_a, row.option_b, row.option_c, row.option_d, row.correct_option]
        );
      }
      console.log(`Seeded questions for subject: ${subject}`);
    }
  }
}

module.exports = { dbRun, dbGet, dbAll, computeSubjectHash, initDb };