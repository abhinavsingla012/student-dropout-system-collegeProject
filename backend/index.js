import express from 'express';
import cors    from 'cors';

// Import our new routers (Unit II: express.Router)
import studentRoutes      from './routes/studentRoutes.js';
import interventionRoutes from './routes/interventionRoutes.js';

const app  = express();
const PORT = 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Use Routers (Unit II: Implementing basic routing) ──
// We "prefix" our routes here
app.use('/api/students', studentRoutes);
app.use('/api/interventions', interventionRoutes);

// ── Centralized Error Handler (Unit II: Error Handling) ──
import { errorHandler } from './middleware/errorMiddleware.js';
app.use(errorHandler);

// ── Start server ──
app.listen(PORT, () => {
  console.log(`🚀 SDAS API running at http://localhost:${PORT}`);
});
