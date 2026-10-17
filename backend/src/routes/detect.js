import { Router } from "express";
import { anthropic, MODEL } from "../lib/anthropicClient.js";
import { DETECT_DB_SCHEMA } from "../lib/schemas.js";
import { DETECT_SYSTEM_PROMPT, buildDetectUserPrompt } from "../lib/prompts.js";

const router = Router();

router.post("/", async (req, res) => {
  const { code } = req.body ?? {};

  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "Request body must include a non-empty 'code' string." });
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: DETECT_SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: DETECT_DB_SCHEMA },
      },
      messages: [{ role: "user", content: buildDetectUserPrompt({ code }) }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock) {
      return res.status(502).json({ error: "Model returned no text content." });
    }

    const result = JSON.parse(textBlock.text);
    return res.json(result);
  } catch (err) {
    console.error("DB detection failed:", err);
    return res.status(502).json({ error: "DB detection failed.", detail: err.message });
  }
});

export default router;
