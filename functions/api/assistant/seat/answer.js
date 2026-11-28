import { json, enabled, now, verifySeat, seatSeen, stat, LIMITS } from "../../../_lib/assistant.js";
const KINDS = { answered: "answered", no_answer: "no_answer", refused: "refused", error: "failed" };
const URLRX = /^[a-z0-9\-\/\.]+(#[a-z0-9\-]+)?$/;
export async function onRequestPost({ request, env }) {
  if (!enabled(env)) return json({ error: "off" }, 503);
  const body = await request.text();
  if (body.length > 16384 || !(await verifySeat(request, env, body))) return json({ error: "unauthorized" }, 401);
  await seatSeen(env);
  let b;
  try { b = JSON.parse(body); } catch (e) { return json({ error: "bad json" }, 400); }
  if (!/^[a-f0-9]{32}$/.test(String(b.id || ""))) return json({ error: "bad id" }, 400);
  const kind = KINDS[b.status] ? b.status : "error";
  const answer = String(b.answer || "").slice(0, LIMITS.answerMax);
  const cites = (Array.isArray(b.citations) ? b.citations : []).slice(0, LIMITS.citesMax)
    .filter((c) => c && URLRX.test(String(c.url || "")))
    .map((c) => ({ url: String(c.url), title: String(c.title || "").slice(0, 120), section: String(c.section || "").slice(0, 120) }));
  const status = kind === "error" ? "failed" : "done";
  const r = await env.DB.prepare("UPDATE assistant_jobs SET status = ?1, answer = ?2, citations = ?3, kind = ?4, answered_at = ?5 WHERE id = ?6 AND status = 'claimed'")
    .bind(status, answer, JSON.stringify(cites), kind, now(), b.id).run();
  await stat(env, KINDS[kind]);
  return json({ ok: true, updated: r.meta ? r.meta.changes : null });
}
