import express from "express";
import cors from "cors";
import "./db.js";
import authRoutes from "./routes/auth.js";
import logsRoutes from "./routes/logs.js";
import mealsRoutes from "./routes/meals.js";
import foodsRoutes from "./routes/foods.js";
import trainingRoutes from "./routes/training.js";
import measurementsRoutes from "./routes/measurements.js";
import checkinsRoutes from "./routes/checkins.js";
import habitsRoutes from "./routes/habits.js";

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
app.use("/api/measurements", measurementsRoutes);
app.use("/api/checkins", checkinsRoutes);
app.use("/api/habits", habitsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "server_error" });
});

app.listen(PORT, () => console.log(`fit-api :${PORT}`));
