import { Router } from 'express';
import getDb from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/my', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const credentials = db.all(`
      SELECT c.*, s.name as skill_name, s.category as skill_category
      FROM credentials c JOIN skills s ON c.skill_id = s.id
      WHERE c.user_id = ? ORDER BY c.issued_at DESC`, req.user.id);
    res.json(credentials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify/:hash', async (req, res) => {
  try {
    const db = await getDb();
    const credential = db.get(`
      SELECT c.*, s.name as skill_name, s.category as skill_category, u.username as user_name
      FROM credentials c
      JOIN skills s ON c.skill_id = s.id
      JOIN users u ON c.user_id = u.id
      WHERE c.credential_hash = ?`, req.params.hash);
    if (!credential) return res.status(404).json({ error: 'Credential not found', valid: false });
    res.json({ valid: true, credential });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const credential = db.get(`
      SELECT c.*, s.name as skill_name, s.category as skill_category
      FROM credentials c JOIN skills s ON c.skill_id = s.id
      WHERE c.id = ? AND c.user_id = ?`, req.params.id, req.user.id);
    if (!credential) return res.status(404).json({ error: 'Credential not found' });
    res.json(credential);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
