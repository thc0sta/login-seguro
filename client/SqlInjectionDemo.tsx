import { useState } from "react";

type Result = {
  ok: boolean;
  sql: string;
  row?: { id: number; username: string } | null;
  error?: string;
};

async function run(url: string, username: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  return response.json() as Promise<Result>;
}

export default function SqlInjectionDemo() {
  const [username, setUsername] = useState("demo'");
  const [vulnerable, setVulnerable] = useState<Result | null>(null);
  const [fixed, setFixed] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function testVulnerable() {
    setError("");
    try {
      setVulnerable(await run("/api/sql-demo/vulnerable", username));
    } catch {
      setError("Não foi possível executar a demonstração.");
    }
  }

  async function testFixed() {
    setError("");
    try {
      setFixed(await run("/api/sql-demo/fixed", username));
    } catch {
      setError("Não foi possível executar a demonstração.");
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <div className="badge">LOGIN</div>
        <h1>SQL Injection</h1>

        <label>
          Usuário para teste
          <input value={username} onChange={event => setUsername(event.target.value)} />
        </label>

        <div className="actions">
          <button onClick={testVulnerable}>Testar versão vulnerável</button>
          <button className="secondary" onClick={testFixed}>Testar versão corrigida</button>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        {vulnerable && (
          <div className="evidence">
            <h2>1. Versão vulnerável</h2>
            <p className="muted">Entrada diretamente na consulta.</p>
            <code>{vulnerable.sql}</code>
            {vulnerable.error ? (
              <p className="error">Erro SQL: {vulnerable.error}</p>
            ) : (
              <p>Nenhum erro de sintaxe foi gerado com esta entrada.</p>
            )}
          </div>
        )}

        {fixed && (
          <div className="evidence">
            <h2>2. Versão corrigida</h2>
            <p className="muted">Entrada tratada como parâmetro.</p>
            <code>{fixed.sql}</code>
            <p>
              {fixed.row
                ? `Usuário encontrado: ${fixed.row.username}`
                : "Nenhum usuário encontrado; a entrada não quebrou a consulta."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
