import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'verifab.db');

fs.mkdirSync(dbDir, { recursive: true });

let _db = null;

function makePrep(conn) {
  return {
    run(sql, ...params) {
      conn.run(sql, params);
      saveDb();
    },
    get(sql, ...params) {
      const stmt = conn.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(sql, ...params) {
      const stmt = conn.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
    exec(sql) {
      conn.exec(sql);
      saveDb();
    }
  };
}

function saveDb() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }
  _db.run('PRAGMA foreign_keys = ON');
  return makePrep(_db);
}

let dbPromise = null;
export default function getDb() {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}
