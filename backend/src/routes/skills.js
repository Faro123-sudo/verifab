import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { getRandomChallenge, getAllCategories } from '../utils/challenges.js';
import { hashProofBundle, generateChallengeToken } from '../utils/hash.js';
import { anchorHash } from '../utils/timestamp.js';

const router = Router();

router.get('/categories', (req, res) => {
  res.json(getAllCategories());
});

router.get('/challenges/:category', (req, res) => {
  const challenge = getRandomChallenge(req.params.category);
  if (!challenge) return res.status(404).json({ error: 'No challenges for this category' });
  res.json(challenge);
});

router.post('/claim', authenticate, async (req, res) => {
  try {
    const { skillName, category } = req.body;
    if (!skillName || !category) {
      return res.status(400).json({ error: 'skillName and category required' });
    }
    const db = await getDb();
    let skill = db.get('SELECT * FROM skills WHERE name = ?', skillName);
    if (!skill) {
      const skillId = uuidv4();
      db.run('INSERT INTO skills (id, name, category) VALUES (?, ?, ?)', skillId, skillName, category);
      skill = { id: skillId, name: skillName, category };
    }
    const challenge = getRandomChallenge(category);
    const claimId = uuidv4();
    const challengeToken = generateChallengeToken(challenge.id, req.user.id, skill.id);
    db.run('INSERT INTO skill_claims (id, user_id, skill_id, status, challenge) VALUES (?, ?, ?, ?, ?)',
      claimId, req.user.id, skill.id, 'pending', JSON.stringify({ ...challenge, token: challengeToken }));
    res.status(201).json({
      claimId,
      challenge: { ...challenge, token: challengeToken },
      skill: { id: skill.id, name: skill.name, category: skill.category }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submit-proof', authenticate, async (req, res) => {
  try {
    const { claimId, files } = req.body;
    if (!claimId || !files || typeof files !== 'object') {
      return res.status(400).json({ error: 'claimId and files object required' });
    }
    const db = await getDb();
    const claim = db.get('SELECT * FROM skill_claims WHERE id = ? AND user_id = ?', claimId, req.user.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'pending') return res.status(400).json({ error: 'Claim already submitted or closed' });
    const proofHash = hashProofBundle(files);
    const anchor = await anchorHash(proofHash, claimId);
    db.run('UPDATE skill_claims SET status = ?, proof_hash = ?, proof_metadata = ?, submitted_at = datetime(\'now\') WHERE id = ?',
      'submitted', proofHash, JSON.stringify(files), claimId);
    res.json({ claimId, proofHash, timestamp: anchor, status: 'submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my-claims', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const claims = db.all(`
      SELECT sc.*, s.name as skill_name, s.category as skill_category
      FROM skill_claims sc JOIN skills s ON sc.skill_id = s.id
      WHERE sc.user_id = ? ORDER BY sc.created_at DESC`, req.user.id);
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const claim = db.get(`
      SELECT sc.*, s.name as skill_name, s.category as skill_category
      FROM skill_claims sc JOIN skills s ON sc.skill_id = s.id
      WHERE sc.id = ?`, req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    const reviews = db.all(`
      SELECT r.*, u.username as reviewer_name FROM reviews r
      JOIN users u ON r.reviewer_id = u.id WHERE r.claim_id = ?`, claim.id);
    const timestamps = db.all('SELECT * FROM timestamps WHERE claim_id = ?', claim.id);
    res.json({ ...claim, reviews, timestamps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
