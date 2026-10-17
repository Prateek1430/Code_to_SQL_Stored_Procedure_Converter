import { useState } from "react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function ResultView({ result }) {
  const {
    source_language,
    database,
    stored_procedure_name,
    sp_code,
    parameters,
    usage_guide,
    dev_notes,
    assumptions,
  } = result;

  return (
    <div className="result">
      <section className="panel">
        <div className="result-meta">
          <span className="badge">{source_language}</span>
          <span className="badge badge-db">{database}</span>
          <span className="badge badge-name">{stored_procedure_name}</span>
        </div>

        <div className="code-block-header">
          <h2>Stored Procedure</h2>
          <CopyButton text={sp_code} />
        </div>
        <pre className="code-block">
          <code>{sp_code}</code>
        </pre>
      </section>

      <section className="panel">
        <h2>Parameters</h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Direction</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((p) => (
              <tr key={p.name}>
                <td><code>{p.name}</code></td>
                <td>{p.direction}</td>
                <td><code>{p.sql_type}</code></td>
                <td>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Usage Guide</h2>
        <h3>Call syntax</h3>
        <div className="code-block-header">
          <CopyButton text={usage_guide.call_syntax} />
        </div>
        <pre className="code-block">
          <code>{usage_guide.call_syntax}</code>
        </pre>

        <h3>Example with values</h3>
        <div className="code-block-header">
          <CopyButton text={usage_guide.example_with_values} />
        </div>
        <pre className="code-block">
          <code>{usage_guide.example_with_values}</code>
        </pre>

        <h3>Steps</h3>
        <ol className="step-list">
          {usage_guide.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h2>Developer Notes</h2>
        <ul className="note-list">
          {dev_notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </section>

      {assumptions?.length > 0 && (
        <section className="panel assumptions-panel">
          <h2>Assumptions</h2>
          <ul className="note-list">
            {assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
