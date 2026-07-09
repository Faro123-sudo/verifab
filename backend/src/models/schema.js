export async function initializeDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      reputation INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS skill_claims (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      skill_id TEXT NOT NULL REFERENCES skills(id),
      status TEXT DEFAULT 'pending',
      challenge TEXT NOT NULL,
      proof_hash TEXT,
      proof_metadata TEXT,
      submitted_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL REFERENCES skill_claims(id),
      reviewer_id TEXT NOT NULL REFERENCES users(id),
      decision TEXT NOT NULL CHECK(decision IN ('approve','reject')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL REFERENCES skill_claims(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      skill_id TEXT NOT NULL REFERENCES skills(id),
      credential_hash TEXT NOT NULL,
      issuer_signature TEXT NOT NULL,
      issued_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS timestamps (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL REFERENCES skill_claims(id),
      sha256_hash TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT('local'),
      tx_reference TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}
