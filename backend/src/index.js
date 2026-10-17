import "dotenv/config";
import express from "express";
import cors from "cors";
import convertRouter from "./routes/convert.js";
import detectRouter from "./routes/detect.js";

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/detect-db", detectRouter);
app.use("/api/convert", convertRouter);

app.listen(PORT, () => {
  console.log(`code-to-sp backend listening on http://localhost:${PORT}`);
});
