import { json, enabled, now, sleep, verifySeat, seatSeen, sweep } from "../../../_lib/assistant.js";
// Signed long-poll used ONLY by the Cap Bar assistant seat. Claims the oldest pending job.
export async function onRequestPost({ request, env }) {
  if (!enabled(env)) return json({ error: "off" }, 503);
  const body = await request.text();
  if (body.length > 2048 || !(await verifySeat(request, env, body))) return json({ error: "unauthorized" }, 401);
  await seatSeen(env);
  await sweep(env);
  const until = Date.now() + 20000;
  while (true) {
    const j = await env.DB.prepare(
      "UPDATE assistant_jobs SET status = 'claimed', claimed_at = ?1 WHERE id = (SELECT id FROM assistant_jobs WHERE status = 'pending' ORDER BY created_at LIMIT 1) AND status = 'pending' RETURNING id, question"
    ).bind(now()).first();
    if (j) return json({ job: { id: j.id, question: j.question } });
    if (Date.now() > until) { await seatSeen(env); return json({ job: null }); }
    await sleep(1000);
  }
}
