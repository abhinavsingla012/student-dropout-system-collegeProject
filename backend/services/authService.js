import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { logAuditEvent } from './auditLogService.js';

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).lean();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    await logAuditEvent({
      actor: null,
      action: 'AUTH_LOGIN_FAILED',
      entityType: 'auth',
      entityId: email,
      status: 'failure',
      metadata: { email },
    });
    throw new AppError('Incorrect email or password', 401);
  }

  await logAuditEvent({
    actor: user,
    action: 'AUTH_LOGIN_SUCCEEDED',
    entityType: 'user',
    entityId: user.id,
    metadata: { email: user.email },
  });

  return {
    token: generateToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  };
}
