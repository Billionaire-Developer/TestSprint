export const FACTS = {
  physics: [
    "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
    "A day on Venus is longer than a year on Venus — it rotates that slowly.",
    "Sound travels about 4 times faster in water than in air.",
    "If you could fold a piece of paper 42 times, it would reach the Moon.",
    "Astronauts are slightly taller in space because there's no gravity compressing their spine."
  ],
  math: [
    "Zero is the only number that can't be represented in Roman numerals.",
    "A 'googol' is the number 1 followed by 100 zeros — and it's smaller than infinity.",
    "The symbol for pi (π) has been used for over 250 years, since the 1700s.",
    "There are more possible chess games than atoms in the observable universe.",
    "Every whole number can be written as the sum of at most 4 square numbers."
  ],
  chemistry: [
    "Diamonds and pencil graphite are both made purely of carbon atoms.",
    "Honey never spoils — archaeologists have found edible honey in ancient tombs.",
    "Water is one of the few substances that expands when it freezes.",
    "Helium is the only element discovered in space (on the Sun) before being found on Earth.",
    "Bananas are slightly radioactive due to their potassium content."
  ],
  biology: [
    "Octopuses have three hearts and blue blood.",
    "Your body replaces most of its cells within about 7-10 years.",
    "A group of flamingos is called a 'flamboyance.'",
    "Sharks existed before trees appeared on Earth.",
    "The human brain uses about 20% of the body's total energy."
  ]
};

export function getRandomFact(subject) {
  const pool = FACTS[subject] || Object.values(FACTS).flat();
  return pool[Math.floor(Math.random() * pool.length)];
}