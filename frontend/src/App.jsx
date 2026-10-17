import { useState } from "react";
import { detectDb, convertCode } from "./api";
import ResultView from "./components/ResultView";
import "./App.css";

const DB_OPTIONS = ["Auto-detect", "MySQL", "PostgreSQL", "SQL Server", "Oracle"];

const SAMPLE_CODE = `def transfer_money(from_account, to_account, amount):
    if amount <= 0:
        raise ValueError("Amount must be positive")

    balance = get_balance(from_account)
    if balance < amount:
        raise Exception("Insufficient funds")

    deduct(from_account, amount)
    credit(to_account, amount)
    log_transaction(from_account, to_account, amount)
    return True`;

export default function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [db, setDb] = useState("Auto-detect");
  const [phase, setPhase] = useState("idle"); // idle | detecting | confirm-db | converting | done | error
  const [detection, setDetection] = useState(null);
  const [confirmedDb, setConfirmedDb] = useState(null);
  const [streamText, setStreamText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function resetOutputs() {
    setDetection(null);
    setConfirmedDb(null);
    setStreamText("");
    setResult(null);
    setError(null);
  }

  async function handleConvertClick() {
    if (!code.trim()) {
      setError("Paste some code first.");
      setPhase("error");
      return;
    }
    resetOutputs();

    if (db === "Auto-detect") {
      setPhase("detecting");
      try {
        const detected = await detectDb(code);
        setDetection(detected);
        setPhase("confirm-db");
      } catch (err) {
        setError(err.message);
        setPhase("error");
      }
      return;
    }

    runConversion(db);
  }

  async function runConversion(targetDb) {
    setConfirmedDb(targetDb);
    setPhase("converting");
    setStreamText("");
    try {
      const data = await convertCode(code, targetDb, (delta) => {
        setStreamText((prev) => prev + delta);
      });
      setResult(data);
      setPhase("done");
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }

  const isBusy = phase === "detecting" || phase === "converting";

  return (
    <div className="page">
      <header className="page-header">
        <h1>Code &rarr; SQL Stored Procedure</h1>
        <p>
          Paste logic from any language. Get back a production-ready stored
          procedure, parameter mapping, and a usage guide for MySQL,
          PostgreSQL, SQL Server, or Oracle.
        </p>
      </header>

      <section className="panel">
        <label className="field-label" htmlFor="code-input">
          Source code
        </label>
        <textarea
          id="code-input"
          className="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          rows={16}
        />

        <div className="controls-row">
          <div className="db-select-group">
            <label className="field-label" htmlFor="db-select">
              Target database
            </label>
            <select
              id="db-select"
              value={db}
              onChange={(e) => setDb(e.target.value)}
              disabled={isBusy}
            >
              {DB_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <button className="primary-button" onClick={handleConvertClick} disabled={isBusy}>
            {isBusy ? "Working…" : "Convert"}
          </button>
        </div>
      </section>

      {phase === "detecting" && <p className="status-line">Detecting target database…</p>}

      {phase === "confirm-db" && detection && (
        <section className="panel confirm-panel">
          <p>
            Best guess: <strong>{detection.detected_db}</strong>{" "}
            <span className={`confidence confidence-${detection.confidence}`}>
              {detection.confidence} confidence
            </span>
          </p>
          <p className="reasoning">{detection.reasoning}</p>
          <div className="controls-row">
            <button className="primary-button" onClick={() => runConversion(detection.detected_db)}>
              Use {detection.detected_db}
            </button>
            {DB_OPTIONS.filter((d) => d !== "Auto-detect" && d !== detection.detected_db).map((d) => (
              <button key={d} className="secondary-button" onClick={() => runConversion(d)}>
                Use {d} instead
              </button>
            ))}
          </div>
        </section>
      )}

      {phase === "converting" && (
        <section className="panel">
          <p className="status-line">Generating stored procedure for {confirmedDb}…</p>
          <pre className="stream-output">{streamText || "Thinking…"}</pre>
        </section>
      )}

      {phase === "error" && error && (
        <section className="panel error-panel">
          <strong>Error:</strong> {error}
        </section>
      )}

      {phase === "done" && result && <ResultView result={result} />}
    </div>
  );
}
