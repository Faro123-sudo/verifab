import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { sha256 } from '../utils/hash.js';

const router = Router();

async function updateUserReputation(db, userId) {
  const result = db.get('SELECT COUNT(*) as count FROM reviews WHERE reviewer_id = ? AND decision = ?', userId, 'approve');
  db.run('UPDATE users SET reputation = ? WHERE id = ?', result.count * 10, userId);
}

async function checkAndIssueCredential(db, claimId) {
  const reviews = db.all('SELECT * FROM reviews WHERE claim_id = ?', claimId);
  const approvals = reviews.filter(r => r.decision === 'approve');
  const rejections = reviews.filter(r => r.decision === 'reject');

  if (approvals.length >= 3) {
    const claim = db.get('SELECT * FROM skill_claims WHERE id = ?', claimId);
    if (!claim) return;
    const existingCred = db.get('SELECT id FROM credentials WHERE claim_id = ?', claimId);
    if (existingCred) return;

    const credentialId = uuidv4();
    const reviewHashes = reviews.map(r => r.id).sort().join(':');
    const credentialHash = sha256(`${claim.user_id}:${claim.skill_id}:${claim.proof_hash}:${reviewHashes}:${Date.now()}`);
    const issuerSignature = sha256(`VERIFAB:${credentialHash}:${claim.user_id}:${process.env.JWT_SECRET || 'verifab-dev-secret'}`);

    db.run('INSERT INTO credentials (id, claim_id, user_id, skill_id, credential_hash, issuer_signature) VALUES (?, ?, ?, ?, ?, ?)',
      credentialId, claimId, claim.user_id, claim.skill_id, credentialHash, issuerSignature);
    db.run("UPDATE skill_claims SET status = ? WHERE id = ?", 'verified', claimId);
  } else if (rejections.length >= 3) {
    db.run("UPDATE skill_claims SET status = ? WHERE id = ?", 'rejected', claimId);
  }
}

router.get('/pending', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const claims = db.all(`
      SELECT sc.id, sc.user_id, sc.skill_id, sc.challenge, sc.proof_hash, sc.proof_metadata, sc.submitted_at,
             s.name as skill_name, s.category as skill_category, u.username as claimant_name
      FROM skill_claims sc
      JOIN skills s ON sc.skill_id = s.id
      JOIN users u ON sc.user_id = u.id
      WHERE sc.status = 'submitted'
        AND sc.id NOT IN (SELECT claim_id FROM reviews WHERE reviewer_id = ?)
      ORDER BY sc.submitted_at ASC`, req.user.id);
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submit', authenticate, async (req, res) => {
  try {
    const { claimId, decision, notes } = req.body;
    if (!claimId || !decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'claimId and decision (approve|reject) required' });
    }
    const db = await getDb();
    const claim = db.get('SELECT * FROM skill_claims WHERE id = ?', claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot review your own claim' });
    }
    const existing = db.get('SELECT id FROM reviews WHERE claim_id = ? AND reviewer_id = ?', claimId, req.user.id);
    if (existing) return res.status(400).json({ error: 'Already reviewed this claim' });

    const reviewId = uuidv4();
    db.run('INSERT INTO reviews (id, claim_id, reviewer_id, decision, notes) VALUES (?, ?, ?, ?, ?)',
      reviewId, claimId, req.user.id, decision, notes || null);

    await updateUserReputation(db, req.user.id);
    await checkAndIssueCredential(db, claimId);

    res.status(201).json({ reviewId, decision, status: 'submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my-reviews', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const reviews = db.all(`
      SELECT r.*, s.name as skill_name, u.username as claimant_name
      FROM reviews r
      JOIN skill_claims sc ON r.claim_id = sc.id
      JOIN skills s ON sc.skill_id = s.id
      JOIN users u ON sc.user_id = u.id
      WHERE r.reviewer_id = ?
      ORDER BY r.created_at DESC`, req.user.id);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
