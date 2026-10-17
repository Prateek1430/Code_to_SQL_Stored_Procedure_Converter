# Code → SQL Stored Procedure Converter

Paste application logic from any programming language and get back a
production-ready SQL Stored Procedure (MySQL / PostgreSQL / SQL Server /
Oracle), with parameter mapping, a usage guide, and plain-language notes on
what changed and why.

The conversion itself is done by Claude (Opus 4.8) via the Anthropic API,
constrained to a strict JSON schema so the response is always structured
(language detected, target db, SP code, parameters, usage guide, dev notes,
assumptions) rather than free-form prose.

## Structure

- `backend/` — Node.js + Express API. Holds the Anthropic API key, builds the
  prompts, enforces the output schema, and streams progress to the frontend.
- `frontend/` — React (Vite) UI: paste code, pick a DB (or auto-detect),
  watch it generate, copy the result.

## Running it

**Backend**

```bash
cd backend
cp .env.example .env   # then put your real ANTHROPIC_API_KEY in .env
npm install
npm run dev
```

Runs on `http://localhost:8787`.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` (Vite default) and talks to the backend at
the URL in `frontend/.env.development` (`VITE_API_BASE_URL`).

## How DB detection works

If you leave the database selector on "Auto-detect", the backend makes a
quick, cheap call to Claude to guess the dialect from context clues in the
code (imports, connection strings, comments, etc.) and shows you its
confidence before generating anything. You confirm or override with one
click — only then does the full conversion run.

## API key handling

`ANTHROPIC_API_KEY` lives only in `backend/.env` and is read server-side via
`dotenv`. It is never sent to the frontend, never appears in any API
response, and the frontend only ever talks to this backend's own
`/api/detect-db` and `/api/convert` endpoints — never the Anthropic API
directly.

## Endpoints

- `POST /api/detect-db` — `{ code }` → `{ detected_db, confidence, reasoning }`
- `POST /api/convert` — `{ code, db }` → streamed newline-delimited JSON:
  `{type: "delta", text}` chunks while generating, then one
  `{type: "result", data}` with the full structured conversion.
