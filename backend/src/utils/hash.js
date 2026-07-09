import crypto from 'crypto';

export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function hashProofBundle(files) {
  const sorted = Object.keys(files).sort().map(k => `${k}:${files[k]}`).join('||');
  return sha256(sorted);
}

export function generateChallengeToken(challengeId, userId, skillId) {
  return sha256(`${challengeId}:${userId}:${skillId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`);
}
