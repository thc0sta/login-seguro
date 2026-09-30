import { useEffect, useState } from "react";
import SqlInjectionDemo from "./SqlInjectionDemo";

type Challenge = { id: string; question: string };
type Session = { user: string };

type ApiError = { error?: string };

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...options });
  const raw = await response.text();

  let data: T | ApiError = {};
  if (raw) {
    try {
      data = JSON.parse(raw) as T;
    } catch {
      throw new Error("Resposta inválida do servidor.");
    }
  }

  if (!response.ok) {
    throw new Error((data as ApiError).error || `Erro HTTP ${response.status}.`);
  }

  return data as T;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [csrf, setCsrf] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [remaining, setRemaining] = useState(5);
  const [message, setMessage] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const [showSqlDemo, setShowSqlDemo] = useState(false);

  async function loadLogin() {
    const data = await api<{ csrf: string; challenge: Challenge; remaining: number }>("/api/login");
    setCsrf(data.csrf);
    setChallenge(data.challenge);
    setRemaining(data.remaining);

    const marker = document.getElementById("csrf_source_marker") as HTMLInputElement | null;
    if (marker) marker.value = data.csrf;
  }

  useEffect(() => {
    api<{ authenticated: boolean; user?: string }>("/api/session")
      .then(data => {
        if (data.authenticated && data.user) setSession({ user: data.user });
      })
      .catch(() => undefined);

    loadLogin().catch(error => setMessage(error instanceof Error ? error.message : "Erro ao carregar login."));
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const result = await api<{ user: string; remaining: number }>("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          password,
          answer,
          csrf,
          challengeId: challenge?.id
        })
      });

      setSession({ user: result.user });
      setRemaining(result.remaining);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar.");
      setPassword("");
      setAnswer("");
      try {
        await loadLogin();
      } catch {
        // Mantém a mensagem original do login.
      }
    }
  }

  async function logout() {
    await api("/api/logout", { method: "POST" });
    setSession(null);
    setShowEvidence(false);
    setShowSqlDemo(false);
    setUser("");
    setPassword("");
    await loadLogin();
  }

  if (showSqlDemo) {
    return (
      <>
        <SqlInjectionDemo />
        <div className="shell">
          <div className="card">
            <button className="secondary" onClick={() => setShowSqlDemo(false)}>
              Voltar ao painel
            </button>
          </div>
        </div>
      </>
    );
  }

  if (session) {
    return (
      <main className="shell">
        <section className="card">
          <div className="badge">AUTENTICADO</div>
          <h1>Olá, {session.user}.</h1>
          <p className="muted">Sua sessão foi validada pelo servidor.</p>

          <div className="actions">
            <button onClick={() => setShowEvidence(value => !value)}>
              {showEvidence ? "Ocultar evidências" : "Ver evidências"}
            </button>
            <button className="secondary" onClick={() => setShowSqlDemo(true)}>
              Demonstração SQL Injection
            </button>
            <button className="secondary" onClick={logout}>Sair</button>
          </div>

          {showEvidence && (
            <div className="evidence">
              <h2>Proteções ativas</h2>
              <ul>
                <li>Senha protegida com scrypt + salt.</li>
                <li>Consulta de credenciais com parâmetro.</li>
                <li>CSRF de uso único, validado no servidor.</li>
                <li>Desafio anti-robô validado no servidor.</li>
                <li>Bloqueio temporário após cinco falhas consecutivas.</li>
                <li>Cookie de sessão HttpOnly + SameSite=Strict.</li>
              </ul>
              <p className="muted">Token CSRF atual: {csrf.slice(0, 12)}…</p>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="card">
        <div className="badge">LOGIN</div>
        <h1>Entrar</h1>

        <form onSubmit={login}>
          <input type="hidden" name="csrf_token" value={csrf} />

          <label>
            Usuário
            <input
              value={user}
              onChange={event => setUser(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <label>
            {challenge?.question ?? "Carregando desafio…"}
            <input
              inputMode="numeric"
              value={answer}
              onChange={event => setAnswer(event.target.value)}
              required
            />
          </label>

          <button type="submit">Entrar</button>
        </form>

        <p className="attempts">Tentativas restantes: {remaining}</p>
        {message && <p className="error" role="alert">{message}</p>}
      </section>
    </main>
  );
}
