import './config/env.js';
import http from 'http';
import { createApp } from './app.js';
import { createSocketServer } from './socket.js';
import { logInfo } from './utils/logger.js';
import { connectDB } from './utils/db.js';
import { appConfig } from './config/appConfig.js';

const app = createApp();
const server = http.createServer(app);
const io = createSocketServer(server);
app.set('io', io);

async function startServer() {
  await connectDB();
  server.listen(appConfig.port, () => {
    logInfo('SDAS API running', { url: `http://localhost:${appConfig.port}` });
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
