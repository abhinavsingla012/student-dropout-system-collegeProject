import './config/env.js';
import { connectDB, disconnectDB } from './utils/db.js';
import { User } from './models/User.js';
import { Student } from './models/Student.js';
import { Intervention } from './models/Intervention.js';
import { Counter } from './models/Counter.js';
import { AuditLog } from './models/AuditLog.js';

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Shaurya', 'Atharv', 'Dhruv', 'Kabir', 'Rohan', 'Aryan',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Ira', 'Myra', 'Anika', 'Riya',
  'Priya', 'Sneha', 'Pooja', 'Meera', 'Kavya', 'Ishita', 'Tanya',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Nair', 'Iyer',
  'Mehta', 'Singh', 'Kumar', 'Joshi', 'Malhotra', 'Kapoor',
  'Chopra', 'Das', 'Bose', 'Mishra', 'Yadav', 'Pandey',
];

const AREAS = ['rural', 'semi-urban', 'urban'];
const ECONOMIC = ['low', 'mid', 'high'];
const PARENT_EDU = ['none', 'primary', 'secondary', 'graduate'];
const GENDERS = ['male', 'female'];
const TYPES = ['counselling', 'parent_meeting', 'academic_support', 'financial_aid', 'mentorship'];
const NOTES = [
  'Student showed improvement after session. Will follow up next week.',
  'Parent was cooperative and agreed to monitor homework. Next meeting in 2 weeks.',
  'Provided extra tutoring materials for maths and science.',
  'Financial aid application submitted. Awaiting approval.',
  'Assigned senior student mentor. First session completed.',
  'Discussed attendance issues. Student committed to attending regularly.',
  'Provided scholarship information and helped with application.',
  'Counselled on study habits and time management techniques.',
];

const users = [
  {
    id: 1,
    name: 'Admin Counselor',
    email: 'admin@sdas.com',
    password: '$2b$10$zHAvqu3yeQlHq9wHvJ1EiuRDQHAbaY8u8VCnDVgyiW//m2BBO3oC2',
    role: 'admin',
  },
  {
    id: 2,
    name: 'Rahul Sharma',
    email: 'rahul@sdas.com',
    password: '$2b$10$5.04ef0Bb2sTSvjNHDKTQeSyENP9D.CC8aj67YX8iBLeDIoSf9Z7G',
    role: 'counselor',
  },
  {
    id: 3,
    name: 'Priya Singh',
    email: 'priya@sdas.com',
    password: '$2b$10$5.04ef0Bb2sTSvjNHDKTQeSyENP9D.CC8aj67YX8iBLeDIoSf9Z7G',
    role: 'counselor',
  },
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(values) {
  return values[rand(0, values.length - 1)];
}

function generateStudent(id) {
  const area = pick(AREAS);

  let distance;
  if (area === 'urban') distance = rand(1, 8);
  else if (area === 'semi-urban') distance = rand(5, 15);
  else distance = rand(10, 30);

  let economicStatus;
  if (area === 'rural') economicStatus = Math.random() < 0.6 ? 'low' : pick(['mid', 'low']);
  else if (area === 'urban') economicStatus = pick(ECONOMIC);
  else economicStatus = pick(['low', 'mid']);

  let attendance = rand(50, 100);
  const previousFailures = rand(0, 3);
  if (economicStatus === 'low') attendance -= rand(0, 10);
  if (previousFailures >= 2) attendance -= rand(5, 15);
  attendance = Math.max(40, Math.min(100, attendance));

  let gpa = (attendance / 10) - rand(0, 2);
  gpa = Math.max(3.5, Math.min(9.8, Number(gpa.toFixed(1))));

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
    interventions: [],
    assignedCounselorId: null,
    assignedCounselor: null,
  };
}

function assignCounselors(students) {
  return students.map((student, index) => {
    if (index < 5) {
      return { ...student, assignedCounselorId: 2 };
    }
    if (index < 10) {
      return { ...student, assignedCounselorId: 3 };
    }
    return student;
  });
}

function buildInterventions(students) {
  const highRiskStudents = students.filter((student) => {
    let score = 0;
    if (student.attendance < 60) score += 35;
    else if (student.attendance < 75) score += 20;
    if (student.gpa < 5.0) score += 25;
    else if (student.gpa < 6.5) score += 15;
    if (student.economicStatus === 'low') score += 15;
    if (student.distanceFromSchool > 20) score += 10;
    score += Math.min(student.previousFailures * 4, 10);
    return score >= 50;
  });

  return highRiskStudents.slice(0, 25).map((student, index) => ({
    id: index + 1,
    studentId: student.id,
    studentName: student.name,
    createdById: student.assignedCounselorId || 1,
    type: pick(TYPES),
    note: pick(NOTES),
    date: new Date(2025, rand(0, 11), rand(1, 28)).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }));
}

async function seedDatabase() {
  const generatedStudents = assignCounselors(
    Array.from({ length: 180 }, (_, index) => generateStudent(index + 1))
  );

  await connectDB();

  await Promise.all([
    Counter.deleteMany({}),
    User.deleteMany({}),
    Student.deleteMany({}),
    Intervention.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const createdUsers = await User.insertMany(users);
  const counselorByNumericId = new Map(createdUsers.map((user) => [user.id, user]));

  const studentDocs = generatedStudents.map((student) => ({
    ...student,
    assignedCounselor: student.assignedCounselorId
      ? counselorByNumericId.get(student.assignedCounselorId)?._id || null
      : null,
  }));
  const createdStudents = await Student.insertMany(studentDocs);
  const studentByNumericId = new Map(createdStudents.map((student) => [student.id, student]));
  const userByNumericId = new Map(createdUsers.map((user) => [user.id, user]));

  const interventionDocs = buildInterventions(generatedStudents).map((intervention) => ({
    ...intervention,
    student: studentByNumericId.get(intervention.studentId)._id,
    createdBy: userByNumericId.get(intervention.createdById)?._id || null,
    createdByName: userByNumericId.get(intervention.createdById)?.name || null,
  }));
  const createdInterventions = await Intervention.insertMany(interventionDocs);

  await Counter.create({ key: 'interventionId', value: createdInterventions.length });

  const interventionsByStudentId = new Map();
  for (const intervention of createdInterventions) {
    const bucket = interventionsByStudentId.get(intervention.studentId) || [];
    bucket.push(intervention._id);
    interventionsByStudentId.set(intervention.studentId, bucket);
  }

  const studentUpdates = createdStudents
    .filter((student) => interventionsByStudentId.has(student.id))
    .map((student) => ({
      updateOne: {
        filter: { _id: student._id },
        update: {
          $set: { interventions: interventionsByStudentId.get(student.id) },
        },
      },
    }));

  if (studentUpdates.length) {
    await Student.bulkWrite(studentUpdates);
  }

  console.log(
    `Seeded ${createdUsers.length} users, ${createdStudents.length} students, and ${createdInterventions.length} interventions.`
  );
}

seedDatabase()
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
