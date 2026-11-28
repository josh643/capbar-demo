import { json, enabled, now, sleep, seatOnline } from "../../_lib/assistant.js";
// Long-poll (up to ~20 s) for one answer. Job ids are 128-bit random values known only to the asker.
export async function onRequestGet({ request, env }) {
  if (!enabled(env)) return json({ status: "off" }, 503);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[a-f0-9]{32}$/.test(id)) return json({ status: "error", error: "Invalid id." }, 400);
  const until = Date.now() + 20000;
  while (true) {
    const j = await env.DB.prepare("SELECT status, answer, citations, kind, created_at FROM assistant_jobs WHERE id = ?1").bind(id).first();
    if (!j) return json({ status: "gone" }, 404);
    if (j.status === "done") return json({ status: "done", kind: j.kind, answer: j.answer, citations: JSON.parse(j.citations || "[]") });
    if (j.status === "failed") return json({ status: "failed", answer: j.answer || "Sorry, something went wrong. Please try again." });
    if (j.status === "pending" && now() - j.created_at > 45 && !(await seatOnline(env)))
      return json({ status: "offline", answer: "The assistant is offline right now. Please try again later, or message the shop." });
    if (Date.now() > until) return json({ status: j.status });
    await sleep(900);
  }
}
