import express from 'express';
import cors    from 'cors';

// Import our new routers (Unit II & III)
import studentRoutes      from './routes/studentRoutes.js';
import interventionRoutes from './routes/interventionRoutes.js';
import authRoutes         from './routes/authRoutes.js';
import { protect }        from './middleware/authMiddleware.js';

const app  = express();
const PORT = 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Use Routers ──
app.use('/api/auth', authRoutes);

// Protect these routes (Unit III: Authentication and Security)
app.use('/api/students', protect, studentRoutes);
app.use('/api/interventions', protect, interventionRoutes);

// ── Centralized Error Handler (Unit II: Error Handling) ──
import { errorHandler } from './middleware/errorMiddleware.js';
app.use(errorHandler);

// ── Start server ──
app.listen(PORT, () => {
  console.log(`🚀 SDAS API running at http://localhost:${PORT}`);
});
