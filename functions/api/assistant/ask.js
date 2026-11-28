import { json, enabled, LIMITS, now, checkRate, claimGlobal, stat, sweep, cleanQuestion, seatOnline, originOk } from "../../_lib/assistant.js";

async function turnstileOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true; // Turnstile optional; rate limits still apply
  if (!token || token.length > 2048) return false;
  const fd = new FormData();
  fd.append("secret", env.TURNSTILE_SECRET); fd.append("response", token); if (ip) fd.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: fd });
  const j = await r.json().catch(() => ({}));
  return j.success === true;
}

export async function onRequestPost({ request, env }) {
  if (!enabled(env)) return json({ ok: false, error: "The assistant isn't switched on yet." }, 503);
  if (!originOk(request)) return json({ ok: false, error: "Not allowed." }, 403);
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return json({ ok: false, error: "Send JSON." }, 415);
  const len = parseInt(request.headers.get("content-length") || "0", 10);
  if (len > 2048) return json({ ok: false, error: "That request is too large." }, 413);
  let body;
  try { body = JSON.parse((await request.text()).slice(0, 2048)); } catch (e) { return json({ ok: false, error: "Invalid request." }, 400); }
  const q = cleanQuestion(body.q);
  if (q.length < 2) return json({ ok: false, error: "Please type a question." }, 400);
  if (q.length > LIMITS.qMax) return json({ ok: false, error: `Please keep questions under ${LIMITS.qMax} characters.` }, 400);

  await sweep(env);
  const t = now();
  const rate = await checkRate(request, env, t);
  if (!rate.ok) {
    await stat(env, "rate_limited");
    if (rate.scope === "global")
      return json({ ok: false, error: "The assistant has answered as many questions as it can today. Please try again tomorrow, or message the shop." }, 429);
    return json({ ok: false, error: "That's a lot of questions in a short time. Please try again in a few minutes." }, 429, { "retry-after": "600" });
  }
  if (!(await turnstileOk(env, String(body.turnstile || ""), request.headers.get("cf-connecting-ip")))) {
    await stat(env, "blocked");
    return json({ ok: false, error: "We couldn't confirm you're a person. Please reload the page and try again." }, 403);
  }
  if (!(await claimGlobal(env, t)).ok) {
    await stat(env, "rate_limited");
    return json({ ok: false, error: "The assistant has answered as many questions as it can today. Please try again tomorrow, or message the shop." }, 429);
  }
  const id = crypto.randomUUID().replace(/-/g, "");
  await env.DB.prepare("INSERT INTO assistant_jobs (id, created_at, question, status) VALUES (?1, ?2, ?3, 'pending')").bind(id, t, q).run();
  await stat(env, "asked");
  return json({ ok: true, id, online: await seatOnline(env) }, 202);
}
export const onRequestGet = () => json({ ok: false, error: "Use POST." }, 405);
