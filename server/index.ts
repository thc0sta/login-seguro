import express from "express";
import { db, findUser, getAttempt, recordFailure, clearFailures } from "./db";
import { token, verifyPassword } from "./security";

const app = express();
app.use(express.json({ limit: "10kb" }));

const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const BLOCK_MS = 10 * 60 * 1000;
const SESSION_MS = 30 * 60 * 1000;
const MAX_FAILURES = 5;

type Challenge = { answer: number; expires: number };
const challenges = new Map<string, Challenge>();
const csrfTokens = new Map<string, number>();
const sessions = new Map<string, { user: string; expires: number }>();

function getOrigin(req: express.Request) {
  return String(req.ip || req.socket.remoteAddress || "unknown");
}

function issueChallenge() {
  const id = token(12);
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  challenges.set(id, { answer: a + b, expires: Date.now() + LOGIN_WINDOW_MS });
  return { id, question: `Quanto é ${a} + ${b}?` };
}

function setCookie(name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict${secure}`;
}

function jsonError(res: express.Response, status: number, error: string) {
  return res.status(status).json({ error });
}

app.get("/api/login", (req, res) => {
  const csrf = token();
  csrfTokens.set(csrf, Date.now() + LOGIN_WINDOW_MS);

  const current = getAttempt(getOrigin(req));
  const remaining = Math.max(0, MAX_FAILURES - (current?.failures ?? 0));

  return res.json({
    csrf,
    challenge: issueChallenge(),
    remaining
  });
});

app.get("/api/session", (req, res) => {
  const sid = req.headers.cookie?.match(/(?:^|;\s*)sid=([^;]+)/)?.[1];
  const session = sid ? sessions.get(sid) : undefined;

  if (!session || session.expires <= Date.now()) {
    if (sid) sessions.delete(sid);
    return res.json({ authenticated: false });
  }

  return res.json({ authenticated: true, user: session.user });
});

app.post("/api/login", (req, res) => {
  const { user, password, answer, csrf, challengeId } = req.body ?? {};

  if ([user, password, answer, csrf, challengeId].some(value => typeof value !== "string")) {
    return jsonError(res, 400, "Dados inválidos.");
  }

  const csrfExpires = csrfTokens.get(csrf);
  if (!csrfExpires || csrfExpires <= Date.now()) {
    return jsonError(res, 403, "Token CSRF inválido ou expirado.");
  }
  csrfTokens.delete(csrf);

  const origin = getOrigin(req);
  const attempt = getAttempt(origin);
  if (attempt?.blocked_until && attempt.blocked_until > Date.now()) {
    return jsonError(res, 429, "Origem temporariamente bloqueada. Aguarde 10 minutos.");
  }

  const challenge = challenges.get(challengeId);
  challenges.delete(challengeId);
  if (!challenge || challenge.expires <= Date.now() || challenge.answer !== Number(answer)) {
    const result = recordFailure(origin);
    return jsonError(
      res,
      401,
      result.failures >= MAX_FAILURES
        ? "Muitas falhas. Bloqueio temporário ativado."
        : "Desafio anti-robô incorreto."
    );
  }

  const found = findUser(user);
  const valid = Boolean(found && verifyPassword(password, found.password_hash));
  if (!valid) {
    const result = recordFailure(origin);
    return jsonError(
      res,
      401,
      result.failures >= MAX_FAILURES
        ? "Muitas falhas. Bloqueio temporário ativado."
        : "Usuário ou senha inválidos."
    );
  }

  clearFailures(origin);

  const sid = token(32);
  sessions.set(sid, { user: found!.username, expires: Date.now() + SESSION_MS });
  res.setHeader("Set-Cookie", setCookie("sid", sid, 1800));
  return res.json({ user: found!.username, remaining: MAX_FAILURES });
});

app.post("/api/logout", (req, res) => {
  const sid = req.headers.cookie?.match(/(?:^|;\s*)sid=([^;]+)/)?.[1];
  if (sid) sessions.delete(sid);
  res.setHeader("Set-Cookie", setCookie("sid", "", 0));
  return res.json({ ok: true });
});

// -----------------------------------------------------------------------------
// SQL Injection — DEMONSTRAÇÃO ACADÊMICA LOCAL
// A rota vulnerável existe exclusivamente para a apresentação do trabalho.
// Nunca expor /api/sql-demo/vulnerable em produção.
// -----------------------------------------------------------------------------
app.post("/api/sql-demo/vulnerable", (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username : "";
  const unsafeSql = `SELECT id, username FROM users WHERE username = '${username}'`;

  try {
    const row = db.prepare(unsafeSql).get() as { id: number; username: string } | undefined;
    return res.json({ ok: true, sql: unsafeSql, row: row ?? null });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Erro SQL desconhecido.";
    return res.status(400).json({ ok: false, sql: unsafeSql, error: detail });
  }
});

app.post("/api/sql-demo/fixed", (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username : "";
  const safeSql = "SELECT id, username FROM users WHERE username = ?";

  try {
    const row = db.prepare(safeSql).get(username) as { id: number; username: string } | undefined;
    return res.json({ ok: true, sql: safeSql, row: row ?? null });
  } catch {
    return jsonError(res, 500, "Não foi possível executar a consulta segura.");
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API em http://localhost:${port}`));
