import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/sdas_backend_test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.FRONTEND_ORIGIN = '*';

const { connectDB, disconnectDB } = await import('../utils/db.js');
const { createApp } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Student } = await import('../models/Student.js');
const { Intervention } = await import('../models/Intervention.js');
const { Counter } = await import('../models/Counter.js');
const { AuditLog } = await import('../models/AuditLog.js');
const { Notification } = await import('../models/Notification.js');

const app = createApp();
app.set('io', {
  to() {
    return {
      emit() {},
    };
  },
});

const TEST_ADMIN_PASSWORD = 'admin123';
const TEST_COUNSELOR_PASSWORD = 'password123';

async function seedFixtures() {
  await Promise.all([
    Counter.deleteMany({}),
    User.deleteMany({}),
    Student.deleteMany({}),
    Intervention.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  await Counter.create({ key: 'interventionId', value: 0 });
  const [adminPasswordHash, counselorPasswordHash] = await Promise.all([
    bcrypt.hash(TEST_ADMIN_PASSWORD, 10),
    bcrypt.hash(TEST_COUNSELOR_PASSWORD, 10),
  ]);

  const [admin, rahul, priya] = await User.insertMany([
    {
      id: 1,
      name: 'Admin Counselor',
      email: 'admin@sdas.com',
      password: adminPasswordHash,
      role: 'admin',
    },
    {
      id: 2,
      name: 'Rahul Sharma',
      email: 'rahul@sdas.com',
      password: counselorPasswordHash,
      role: 'counselor',
    },
    {
      id: 3,
      name: 'Priya Singh',
      email: 'priya@sdas.com',
      password: counselorPasswordHash,
      role: 'counselor',
    },
  ]);

  await Student.insertMany([
    {
      id: 1,
      name: 'Anika Mishra',
      grade: 11,
      attendance: 40,
      gpa: 3.5,
      area: 'urban',
      gender: 'female',
      economicStatus: 'low',
      parentEducation: 'primary',
      distanceFromSchool: 4,
      previousFailures: 2,
      hasScholarship: false,
      assignedCounselor: rahul._id,
      assignedCounselorId: rahul.id,
      interventions: [],
    },
    {
      id: 2,
      name: 'Pooja Nair',
      grade: 8,
      attendance: 68,
      gpa: 5.8,
      area: 'semi-urban',
      gender: 'female',
      economicStatus: 'mid',
      parentEducation: 'secondary',
      distanceFromSchool: 8,
      previousFailures: 1,
      hasScholarship: false,
      assignedCounselor: rahul._id,
      assignedCounselorId: rahul.id,
      interventions: [],
    },
    {
      id: 3,
      name: 'Diya Kapoor',
      grade: 10,
      attendance: 72,
      gpa: 6.2,
      area: 'rural',
      gender: 'female',
      economicStatus: 'low',
      parentEducation: 'none',
      distanceFromSchool: 18,
      previousFailures: 0,
      hasScholarship: true,
      assignedCounselor: priya._id,
      assignedCounselorId: priya.id,
      interventions: [],
    },
  ]);
}

async function login(email, password) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  assert.equal(response.status, 200);
  return response.body.data.token;
}

before(async () => {
  await connectDB();
});

beforeEach(async () => {
  await seedFixtures();
});

after(async () => {
  await Promise.all([
    Counter.deleteMany({}),
    User.deleteMany({}),
    Student.deleteMany({}),
    Intervention.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  await disconnectDB();
});

test('versioned login returns envelope and writes audit log', async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'rahul@sdas.com', password: TEST_COUNSELOR_PASSWORD });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'success');
  assert.equal(response.body.data.user.name, 'Rahul Sharma');
  assert.ok(response.body.data.token);

  const auditLog = await AuditLog.findOne({ action: 'AUTH_LOGIN_SUCCEEDED', actorId: 2 }).lean();
  assert.ok(auditLog);
});

test('legacy students route remains array-shaped for frontend compatibility', async () => {
  const token = await login('rahul@sdas.com', TEST_COUNSELOR_PASSWORD);

  const response = await request(app)
    .get('/api/students')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.equal(response.body.length, 2);
});

test('versioned students route supports pagination and metadata', async () => {
  const token = await login('admin@sdas.com', TEST_ADMIN_PASSWORD);

  const response = await request(app)
    .get('/api/v1/students?page=1&limit=2&sort=-attendance')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'success');
  assert.equal(response.body.data.length, 2);
  assert.equal(response.body.meta.page, 1);
  assert.equal(response.body.meta.limit, 2);
  assert.equal(response.body.meta.total, 3);
});

test('counselor cannot fetch another counselors student', async () => {
  const token = await login('rahul@sdas.com', TEST_COUNSELOR_PASSWORD);

  const response = await request(app)
    .get('/api/v1/students/3')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 403);
});

test('counselor can create intervention and audit log is written', async () => {
  const token = await login('rahul@sdas.com', TEST_COUNSELOR_PASSWORD);

  const response = await request(app)
    .post('/api/v1/interventions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      studentId: 1,
      studentName: 'Anika Mishra',
      type: 'parent_meeting',
      note: 'Parents were contacted and agreed to monitor attendance closely.',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.createdById, 2);
  assert.equal(response.body.data.createdByName, 'Rahul Sharma');

  const intervention = await Intervention.findOne({ studentId: 1 }).lean();
  assert.ok(intervention);

  const auditLog = await AuditLog.findOne({ action: 'INTERVENTION_CREATED', actorId: 2 }).lean();
  assert.ok(auditLog);

  const adminNotification = await Notification.findOne({ type: 'INTERVENTION', 'data.studentId': 1 }).lean();
  assert.ok(adminNotification);
  assert.equal(adminNotification.title, 'New Intervention Logged');
});

test('admin can assign student and audit logs can be listed via v1 API', async () => {
  const token = await login('admin@sdas.com', TEST_ADMIN_PASSWORD);

  const assignResponse = await request(app)
    .patch('/api/v1/users/assign')
    .set('Authorization', `Bearer ${token}`)
    .send({ studentId: 3, counselorId: 2 });

  assert.equal(assignResponse.status, 200);
  assert.equal(assignResponse.body.data.student.assignedCounselorId, 2);

  const logsResponse = await request(app)
    .get('/api/v1/audit-logs?page=1&limit=10&sort=-createdAt')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(logsResponse.status, 200);
  assert.ok(Array.isArray(logsResponse.body.data));
  assert.ok(logsResponse.body.data.some((log) => log.action === 'STUDENT_ASSIGNMENT_UPDATED'));

  const counselorToken = await login('rahul@sdas.com', TEST_COUNSELOR_PASSWORD);
  const notificationsResponse = await request(app)
    .get('/api/v1/notifications')
    .set('Authorization', `Bearer ${counselorToken}`);

  assert.equal(notificationsResponse.status, 200);
  assert.ok(notificationsResponse.body.data.some((note) => note.type === 'ASSIGNMENT' && note.data.studentId === 3));
  assert.ok(notificationsResponse.body.unreadCount >= 1);
});

test('admin metric update creates risk alert notification for assigned counselor', async () => {
  const adminToken = await login('admin@sdas.com', TEST_ADMIN_PASSWORD);

  const updateResponse = await request(app)
    .patch('/api/v1/students/2')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ attendance: 45, gpa: 4.8 });

  assert.equal(updateResponse.status, 200);

  const counselorToken = await login('rahul@sdas.com', TEST_COUNSELOR_PASSWORD);
  const notificationsResponse = await request(app)
    .get('/api/v1/notifications')
    .set('Authorization', `Bearer ${counselorToken}`);

  assert.equal(notificationsResponse.status, 200);
  assert.ok(notificationsResponse.body.data.some((note) => note.type === 'RISK_ALERT' && note.data.studentId === 2));
});
