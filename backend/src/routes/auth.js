import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'verifab-dev-secret-change-in-production';

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }
    const db = await getDb();
    const existing = db.get('SELECT id FROM users WHERE username = ? OR email = ?', username, email);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)', id, username, email, password_hash);
    const token = generateToken({ id, username });
    res.status(201).json({ token, user: { id, username, email, reputation: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const db = await getDb();
    const user = db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, reputation: user.reputation } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const db = await getDb();
    const user = db.get('SELECT id, username, email, reputation, created_at FROM users WHERE id = ?', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
