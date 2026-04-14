import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "fit-dev-secret-change-me";
const EXP = "30d";

export const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: EXP });

export const requireAuth = (req, res, next) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "no_token" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
};
