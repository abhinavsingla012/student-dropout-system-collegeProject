import { Server } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socketAuthMiddleware.js';
import { logInfo, logWarn } from './utils/logger.js';
import { appConfig } from './config/appConfig.js';

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: appConfig.frontendOrigin || '*'
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
