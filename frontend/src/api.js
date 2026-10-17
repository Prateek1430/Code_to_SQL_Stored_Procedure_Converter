const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

export async function detectDb(code) {
  const res = await fetch(`${API_BASE_URL}/api/detect-db`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "DB detection failed.");
  return data;
}

// Streams newline-delimited JSON from /api/convert. Calls onDelta(text) for
// each incremental text chunk, then resolves with the final structured result.
export async function convertCode(code, db, onDelta) {
  const res = await fetch(`${API_BASE_URL}/api/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, db }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Conversion request failed (${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;

      const event = JSON.parse(line);
      if (event.type === "delta") {
        onDelta?.(event.text);
      } else if (event.type === "result") {
        return event.data;
      } else if (event.type === "error") {
        throw new Error(event.message || "Conversion failed.");
      }
    }
  }

  throw new Error("Stream ended without a result.");
}
