// ─────────────────────────────────────────────
// Seed script — generates students.json & interventions.json
// Run once: node server/seed.js
// ─────────────────────────────────────────────
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const FIRST_NAMES = [
  "Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Krishna",
  "Ishaan","Shaurya","Atharv","Dhruv","Kabir","Rohan","Aryan",
  "Ananya","Diya","Saanvi","Aadhya","Ira","Myra","Anika","Riya",
  "Priya","Sneha","Pooja","Meera","Kavya","Ishita","Tanya"
];

const LAST_NAMES = [
  "Sharma","Verma","Gupta","Patel","Reddy","Nair","Iyer",
  "Mehta","Singh","Kumar","Joshi","Malhotra","Kapoor",
  "Chopra","Das","Bose","Mishra","Yadav","Pandey"
];

const AREAS       = ["rural", "semi-urban", "urban"];
const ECONOMIC    = ["low", "mid", "high"];
const PARENT_EDU  = ["none", "primary", "secondary", "graduate"];
const GENDERS     = ["male", "female"];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function generateStudent(id) {
  const area = pick(AREAS);

  let distance;
  if      (area === "urban")      distance = rand(1, 8);
  else if (area === "semi-urban") distance = rand(5, 15);
  else                            distance = rand(10, 30);

  let economicStatus;
  if      (area === "rural") economicStatus = Math.random() < 0.6 ? "low" : pick(["mid","low"]);
  else if (area === "urban") economicStatus = pick(ECONOMIC);
  else                       economicStatus = pick(["low","mid"]);

  let attendance = rand(50, 100);
  const previousFailures = rand(0, 3);
  if (economicStatus === "low") attendance -= rand(0, 10);
  if (previousFailures >= 2)    attendance -= rand(5, 15);
  attendance = Math.max(40, Math.min(100, attendance));

  let gpa = (attendance / 10) - rand(0, 2);
  gpa = Math.max(3.5, Math.min(9.8, parseFloat(gpa.toFixed(1))));

  return {
    id,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    grade: rand(8, 12),
    attendance,
    gpa,
    area,
    gender: pick(GENDERS),
    economicStatus,
    parentEducation: pick(PARENT_EDU),
    distanceFromSchool: distance,
    previousFailures,
    hasScholarship: Math.random() < 0.35,
    interventions: []
  };
}

const students = Array.from({ length: 180 }, (_, i) => generateStudent(i + 1));

// Sample interventions
const TYPES = ["counselling","parent_meeting","academic_support","financial_aid","mentorship"];
const NOTES = [
  "Student showed improvement after session. Will follow up next week.",
  "Parent was cooperative and agreed to monitor homework. Next meeting in 2 weeks.",
  "Provided extra tutoring materials for maths and science.",
  "Financial aid application submitted. Awaiting approval.",
  "Assigned senior student mentor. First session completed.",
  "Discussed attendance issues. Student committed to attending regularly.",
  "Provided scholarship information and helped with application.",
  "Counselled on study habits and time management techniques.",
];

const interventions = [];
// Create ~25 sample interventions for high-risk students
const highRiskStudents = students.filter(s => {
  let score = 0;
  if (s.attendance < 60) score += 35;
  else if (s.attendance < 75) score += 20;
  if (s.gpa < 5.0) score += 25;
  else if (s.gpa < 6.5) score += 15;
  if (s.economicStatus === 'low') score += 15;
  if (s.distanceFromSchool > 20) score += 10;
  score += Math.min(s.previousFailures * 4, 10);
  return score >= 50;
});

const sampleStudents = highRiskStudents.slice(0, 25);
sampleStudents.forEach((s, i) => {
  interventions.push({
    id: Date.now() + i,
    studentId: s.id,
    studentName: s.name,
    type: pick(TYPES),
    note: pick(NOTES),
    date: new Date(2025, rand(0, 11), rand(1, 28)).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }),
  });
});

const dataDir = join(__dirname, 'data');
writeFileSync(join(dataDir, 'students.json'),      JSON.stringify(students, null, 2));
writeFileSync(join(dataDir, 'interventions.json'),  JSON.stringify(interventions, null, 2));

console.log(`✅ Seeded ${students.length} students and ${interventions.length} interventions.`);
