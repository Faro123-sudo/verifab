import express from 'express';
import cors from 'cors';
import getDb from './db.js';
import { initializeDatabase } from './models/schema.js';
import authRoutes from './routes/auth.js';
import skillRoutes from './routes/skills.js';
import reviewRoutes from './routes/reviews.js';
import credentialRoutes from './routes/credentials.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/credentials', credentialRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0', name: 'verifab' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  const db = await getDb();
  initializeDatabase(db);
  app.listen(PORT, () => {
    console.log(`Verifab backend running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
