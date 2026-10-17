import { Router } from "express";
import { anthropic, MODEL } from "../lib/anthropicClient.js";
import { CONVERT_SCHEMA } from "../lib/schemas.js";
import { CONVERT_SYSTEM_PROMPT, buildConvertUserPrompt } from "../lib/prompts.js";

const router = Router();
const VALID_DBS = ["MySQL", "PostgreSQL", "SQL Server", "Oracle"];

function writeLine(res, obj) {
  res.write(JSON.stringify(obj) + "\n");
}

router.post("/", async (req, res) => {
  const { code, db } = req.body ?? {};

  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "Request body must include a non-empty 'code' string." });
  }
  if (!db || !VALID_DBS.includes(db)) {
    return res.status(400).json({ error: `Request body must include a 'db' field, one of: ${VALID_DBS.join(", ")}.` });
  }

  // Streamed as newline-delimited JSON so the frontend can render progress
  // (raw text deltas) before the final structured result arrives.
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: CONVERT_SCHEMA },
      },
      system: CONVERT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildConvertUserPrompt({ code, db }) }],
    });

    stream.on("text", (delta) => {
      writeLine(res, { type: "delta", text: delta });
    });

    const finalMessage = await stream.finalMessage();

    if (finalMessage.stop_reason === "refusal") {
      writeLine(res, { type: "error", message: "The model declined to generate this conversion." });
      return res.end();
    }

    const textBlock = finalMessage.content.find((block) => block.type === "text");
    if (!textBlock) {
      writeLine(res, { type: "error", message: "Model returned no text content." });
      return res.end();
    }

    const result = JSON.parse(textBlock.text);
    writeLine(res, { type: "result", data: result });
    res.end();
  } catch (err) {
    console.error("Conversion failed:", err);
    writeLine(res, { type: "error", message: err.message || "Conversion failed." });
    res.end();
  }
});

export default router;
