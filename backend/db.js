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
  source       TEXT,
  sent_at      TEXT,
  updated_at   TEXT DEFAULT (datetime('now')),
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

CREATE TABLE IF NOT EXISTS meal_photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  path       TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_photos_user_date ON meal_photos(user_id, date);

CREATE TABLE IF NOT EXISTS favorite_foods (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  barcode    TEXT,
  amount_g   REAL DEFAULT 100,
  kcal       REAL DEFAULT 0,
  protein_g  REAL DEFAULT 0,
  carbs_g    REAL DEFAULT 0,
  fat_g      REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_favorite_foods_user ON favorite_foods(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_foods_user_name ON favorite_foods(user_id, name COLLATE NOCASE);

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

CREATE TABLE IF NOT EXISTS habit_logs (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date      TEXT NOT NULL,
  habit_id  TEXT NOT NULL,
  completed INTEGER DEFAULT 1,
  PRIMARY KEY (user_id, date, habit_id)
);
CREATE INDEX IF NOT EXISTS idx_habit_user_date ON habit_logs(user_id, date);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint  TEXT NOT NULL UNIQUE,
  p256dh    TEXT NOT NULL,
  auth      TEXT NOT NULL,
  ua        TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  quote_enabled   INTEGER DEFAULT 1,
  workout_enabled INTEGER DEFAULT 1,
  meal_enabled    INTEGER DEFAULT 1,
  supp_enabled    INTEGER DEFAULT 1,
  cardio_enabled  INTEGER DEFAULT 1,
  routine_enabled INTEGER DEFAULT 0,
  family_enabled  INTEGER DEFAULT 0,
  sleep_enabled   INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS push_reminder_deliveries (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date      TEXT NOT NULL,
  item_id   TEXT NOT NULL,
  sent_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, date, item_id)
);
`);

// ─── ALTER weekly_checkins to v2 schema (idempotent) ───
const checkinCols = db.prepare("PRAGMA table_info(weekly_checkins)").all().map((c) => c.name);
const addCol = (col, def) => {
  if (!checkinCols.includes(col)) {
    try { db.exec(`ALTER TABLE weekly_checkins ADD COLUMN ${col} ${def};`); } catch {}
  }
};
addCol("waist_cm", "REAL");
addCol("chest_cm", "REAL");
addCol("arm_cm", "REAL");
addCol("energy", "INTEGER");
addCol("sleep_quality", "INTEGER");
addCol("back_pain", "INTEGER");
addCol("motivation", "INTEGER");
addCol("adherence_pct", "INTEGER");
addCol("notes", "TEXT");
addCol("photo_front", "TEXT");
addCol("photo_side", "TEXT");
addCol("photo_back", "TEXT");
addCol("photo_legs", "TEXT");

// daily_logs sync metadata for iOS Shortcut / automation debugging.
const dailyLogCols = db.prepare("PRAGMA table_info(daily_logs)").all().map((c) => c.name);
const addDailyLogCol = (col, def) => {
  if (!dailyLogCols.includes(col)) {
    try { db.exec(`ALTER TABLE daily_logs ADD COLUMN ${col} ${def};`); } catch {}
  }
};
addDailyLogCol("source", "TEXT");
addDailyLogCol("sent_at", "TEXT");
addDailyLogCol("updated_at", "TEXT");
addDailyLogCol("energy", "INTEGER");
addDailyLogCol("hunger", "INTEGER");
addDailyLogCol("headache", "INTEGER");
addDailyLogCol("coffee_ml", "INTEGER DEFAULT 0");

const mealItemCols = db.prepare("PRAGMA table_info(meal_items)").all().map((c) => c.name);
const addMealItemCol = (col, def) => {
  if (!mealItemCols.includes(col)) {
    try { db.exec(`ALTER TABLE meal_items ADD COLUMN ${col} ${def};`); } catch {}
  }
};
addMealItemCol("eaten_pct", "REAL DEFAULT 100");
addMealItemCol("photo_path", "TEXT");

const prefCols = db.prepare("PRAGMA table_info(notification_prefs)").all().map((c) => c.name);
const addPrefCol = (col, def = 1) => {
  if (!prefCols.includes(col)) {
    try { db.exec(`ALTER TABLE notification_prefs ADD COLUMN ${col} INTEGER DEFAULT ${def};`); } catch {}
  }
};
addPrefCol("cardio_enabled", 1);
addPrefCol("routine_enabled", 0);
addPrefCol("family_enabled", 0);
addPrefCol("sleep_enabled", 1);

export default db;
