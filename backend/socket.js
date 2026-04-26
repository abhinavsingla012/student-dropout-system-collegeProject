import { Server } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socketAuthMiddleware.js';
import { logInfo, logWarn } from './utils/logger.js';
import { appConfig } from './config/appConfig.js';

function buildSocketCorsOrigin() {
  if (!appConfig.frontendOrigin || appConfig.frontendOrigin === '*') {
    return '*';
  }

  const allowedOrigins = new Set(
    appConfig.frontendOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  for (const origin of Array.from(allowedOrigins)) {
    try {
      const parsed = new URL(origin);
      if (parsed.hostname === 'localhost') {
        allowedOrigins.add(`${parsed.protocol}//127.0.0.1${parsed.port ? `:${parsed.port}` : ''}`);
      }
      if (parsed.hostname === '127.0.0.1') {
        allowedOrigins.add(`${parsed.protocol}//localhost${parsed.port ? `:${parsed.port}` : ''}`);
      }
    } catch {
      // Keep the configured origin only if it cannot be parsed.
    }
  }

  return Array.from(allowedOrigins);
}

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: buildSocketCorsOrigin()
    }
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const user = socket.user;
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);

    if (user.role === 'counselor') {
      socket.join(`counselor:${user.id}`);
    }

    logInfo('Socket connected', {
      socketId: socket.id,
      userId: user.id,
      role: user.role
    });

    socket.on('disconnect', (reason) => {
      logWarn('Socket disconnected', {
        socketId: socket.id,
        userId: user.id,
        reason
      });
    });
  });

  return io;
};
