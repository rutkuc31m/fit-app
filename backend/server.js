import express from "express";
import cors from "cors";
import "./db.js";
import authRoutes from "./routes/auth.js";
import logsRoutes from "./routes/logs.js";
import mealsRoutes from "./routes/meals.js";
import foodsRoutes from "./routes/foods.js";
import trainingRoutes from "./routes/training.js";
import checkinsRoutes from "./routes/checkins.js";
import habitsRoutes from "./routes/habits.js";
import statsRoutes from "./routes/stats.js";
import pushRoutes from "./routes/push.js";
import { startPushScheduler } from "./push_worker.js";
import { startDailyQuoteCron } from "./jobs/dailyQuotePush.js";
import { startReminderCrons } from "./jobs/reminderPush.js";

const app = express();
const PORT = process.env.PORT || 8001;
const ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173,https://fit.rutkuc.com,https://dev-fit.rutkuc.com").split(",");

app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json({ limit: "8mb" }));
app.use("/photos", express.static(process.env.FIT_PHOTO_DIR || "./data/photos"));

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use("/api/auth", authRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/foods", foodsRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/checkins", checkinsRoutes);
app.use("/api/habits", habitsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/push", pushRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "server_error" });
});

app.listen(PORT, () => {
  console.log(`fit-api :${PORT}`);
  try { startPushScheduler(); } catch (e) { console.error("push scheduler failed:", e); }
  try { startDailyQuoteCron(); } catch (e) { console.error("daily quote cron failed:", e); }
  try { startReminderCrons(); } catch (e) { console.error("reminder crons failed:", e); }
});
