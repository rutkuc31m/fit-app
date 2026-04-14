// Uses Node 22.5+ built-in node:sqlite (no native build required)
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.FIT_DB || "./data/fit.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

const raw = new DatabaseSync(DB_PATH);
raw.exec("PRAGMA journal_mode = WAL;");
raw.exec("PRAGMA foreign_keys = ON;");

// better-sqlite3-compatible adapter so route code stays the same
export const db = {
  exec: (sql) => raw.exec(sql),
  prepare(sql) {
    const stmt = raw.prepare(sql);
    return {
      get: (...args) => stmt.get(...flatten(args)) ?? undefined,
      all: (...args) => stmt.all(...flatten(args)),
      run: (...args) => {
        const r = stmt.run(...flatten(args));
        return { lastInsertRowid: r.lastInsertRowid, changes: r.changes };
      }
    };
  }
};

// named params (@key) need an object; positional params stay as array
function flatten(args) {
  if (args.length === 1 && args[0] && typeof args[0] === "object" && !Array.isArray(args[0])) {
    return [args[0]];
  }
  return args.map((v) => v === undefined ? null : v);
}

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  lang          TEXT DEFAULT 'en',
  start_date    TEXT DEFAULT '2026-04-20',
  start_weight  REAL,
  target_weight REAL,
  height_cm     REAL,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,
  weight_kg    REAL,
  fasting_type TEXT,
  steps        INTEGER DEFAULT 0,
  water_ml     INTEGER DEFAULT 0,
  sleep_hours  REAL,
  mood         INTEGER,
  notes        TEXT,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_logs_user_date ON daily_logs(user_id, date);

CREATE TABLE IF NOT EXISTS meals (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date     TEXT NOT NULL,
  time     TEXT,
  name     TEXT
);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);

CREATE TABLE IF NOT EXISTS meal_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_id     INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  barcode     TEXT,
  name        TEXT NOT NULL,
  amount_g    REAL NOT NULL,
  kcal        REAL DEFAULT 0,
  protein_g   REAL DEFAULT 0,
  carbs_g     REAL DEFAULT 0,
  fat_g       REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS foods_cache (
  barcode      TEXT PRIMARY KEY,
  name         TEXT,
  brand        TEXT,
  kcal_100g    REAL,
  protein_100g REAL,
  carbs_100g   REAL,
  fat_100g     REAL,
  raw_json     TEXT,
  fetched_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  day_type   TEXT,
  completed  INTEGER DEFAULT 0,
  cardio_min INTEGER DEFAULT 0,
  notes      TEXT
);
CREATE INDEX IF NOT EXISTS idx_sess_user_date ON training_sessions(user_id, date);

CREATE TABLE IF NOT EXISTS training_sets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id   TEXT,
  exercise_name TEXT,
  set_number    INTEGER,
  weight_kg     REAL,
  reps          INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sets_session ON training_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON training_sets(exercise_id);

CREATE TABLE IF NOT EXISTS measurements (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date     TEXT NOT NULL,
  waist_cm REAL,
  chest_cm REAL,
  arm_cm   REAL,
  hip_cm   REAL,
  thigh_cm REAL
);

CREATE TABLE IF NOT EXISTS weekly_checkins (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number    INTEGER NOT NULL,
  date           TEXT NOT NULL,
  avg_weight     REAL,
  weight_change  REAL,
  training_done  INTEGER,
  avg_steps      INTEGER,
  avg_kcal       INTEGER,
  avg_protein_g  INTEGER,
  challenges     TEXT,
  adjustments    TEXT,
  UNIQUE(user_id, week_number)
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date     TEXT NOT NULL,
  path     TEXT NOT NULL,
  angle    TEXT
);
`);

export default db;
