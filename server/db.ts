import Database from "better-sqlite3";
import { hashPassword } from "./security";

export const db = new Database(process.env.DB_FILE || "login-seguro.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attempts (
    origin TEXT PRIMARY KEY,
    failures INTEGER NOT NULL DEFAULT 0,
    blocked_until INTEGER NOT NULL DEFAULT 0
  );
`);

const existing = db.prepare("SELECT id FROM users WHERE username = ?").get("demo");
if (!existing) {
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run("demo", hashPassword("Demo@12345"));
}

export function findUser(username: string) {
  return db.prepare(
    "SELECT id, username, password_hash FROM users WHERE username = ?"
  ).get(username) as { id: number; username: string; password_hash: string } | undefined;
}

export function getAttempt(origin: string) {
  return db.prepare(
    "SELECT failures, blocked_until FROM attempts WHERE origin = ?"
  ).get(origin) as { failures: number; blocked_until: number } | undefined;
}

export function recordFailure(origin: string) {
  const current = getAttempt(origin);
  const failures = (current?.failures ?? 0) + 1;
  const blockedUntil = failures >= 5 ? Date.now() + 10 * 60 * 1000 : 0;

  db.prepare(`
    INSERT INTO attempts (origin, failures, blocked_until)
    VALUES (?, ?, ?)
    ON CONFLICT(origin) DO UPDATE SET
      failures = excluded.failures,
      blocked_until = excluded.blocked_until
  `).run(origin, failures, blockedUntil);

  return { failures, blockedUntil };
}

export function clearFailures(origin: string) {
  db.prepare("DELETE FROM attempts WHERE origin = ?").run(origin);
}
