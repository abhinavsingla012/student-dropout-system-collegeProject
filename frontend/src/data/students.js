

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

const AREAS = ["rural", "semi-urban", "urban"];
const ECONOMIC = ["low", "mid", "high"];
const PARENT_EDU = ["none", "primary", "secondary", "graduate"];
const GENDERS = ["male", "female"];

// Utility helpers
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

// More realistic distribution logic
function generateStudent(id) {
  const area = pick(AREAS);

  // Area influences distance
  let distance;
  if (area === "urban") distance = rand(1, 8);
  else if (area === "semi-urban") distance = rand(5, 15);
  else distance = rand(10, 30);

  // Economic bias by area
  let economicStatus;
  if (area === "rural") {
    economicStatus = Math.random() < 0.6 ? "low" : pick(["mid","low"]);
  } else if (area === "urban") {
    economicStatus = pick(ECONOMIC);
  } else {
    economicStatus = pick(["low","mid"]);
  }

  // Attendance influenced by economic & failures
  let attendance = rand(50, 100);

  const previousFailures = rand(0, 3);

  if (economicStatus === "low") attendance -= rand(0, 10);
  if (previousFailures >= 2) attendance -= rand(5, 15);

  attendance = Math.max(40, Math.min(100, attendance));

  // GPA loosely correlated with attendance
  let gpa = (attendance / 10) - rand(0, 2);
  gpa = Math.max(3.5, Math.min(9.8, parseFloat(gpa.toFixed(1))));

  return {
    id,
    name: randomName(),
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

// Generate 180 students
export const students = Array.from({ length: 180 }, (_, i) =>
  generateStudent(i + 1)
);