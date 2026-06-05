import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error.js';
import personasRouter from './routes/personas.js';
import rulesRouter from './routes/rules.js';
import skillsRouter from './routes/skills.js';
import { syncFramework } from '../sync/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/personas', personasRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/skills', skillsRouter);

// Sync endpoint
app.post('/api/sync', async (req, res) => {
  try {
    const stats = await syncFramework();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Auto-sync on startup if enabled
  if (process.env.AUTO_SYNC_ON_STARTUP === 'true') {
    console.log('Auto-syncing framework...');
    syncFramework()
      .then(() => console.log('Framework synced successfully'))
      .catch((error) => console.error('Sync failed:', error));
  }
});

export default app;
