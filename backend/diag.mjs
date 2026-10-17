import "dotenv/config";
import { anthropic, MODEL } from "./src/lib/anthropicClient.js";
import { CONVERT_SCHEMA } from "./src/lib/schemas.js";
import { CONVERT_SYSTEM_PROMPT, buildConvertUserPrompt } from "./src/lib/prompts.js";

const code = `function reviewInvoices(invoiceIds) {
    let notifiedCount = 0;
    for (const id of invoiceIds) {
        const invoice = getInvoice(id);
        if (invoice.status === 'overdue') {
            sendNotification(invoice.customerId, 'Your invoice is overdue');
            notifiedCount++;
        } else if (invoice.balance === 0) {
            closeInvoice(id);
        }
    }
    return notifiedCount;
}`;

const response = await anthropic.messages.create({
  model: MODEL,
  max_tokens: 16000,
  output_config: { effort: "high", format: { type: "json_schema", schema: CONVERT_SCHEMA } },
  system: CONVERT_SYSTEM_PROMPT,
  messages: [{ role: "user", content: buildConvertUserPrompt({ code, db: "Oracle" }) }],
});

console.log("stop_reason:", response.stop_reason);
console.log("usage:", JSON.stringify(response.usage));
