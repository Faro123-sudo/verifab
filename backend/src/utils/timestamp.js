import { v4 as uuidv4 } from 'uuid';
import getDb from '../db.js';

export async function anchorHash(hash, claimId) {
  const db = await getDb();
  const id = uuidv4();
  const txRef = `VERIFAB-LOCAL-${Date.now()}-${hash.slice(0, 8)}`;
  db.run('INSERT INTO timestamps (id, claim_id, sha256_hash, source, tx_reference) VALUES (?, ?, ?, ?, ?)',
    id, claimId, hash, 'local', txRef);
  return { id, txRef, hash };
}

export async function verifyTimestamp(claimId) {
  const db = await getDb();
  return db.get('SELECT * FROM timestamps WHERE claim_id = ? ORDER BY created_at DESC LIMIT 1', claimId);
}
