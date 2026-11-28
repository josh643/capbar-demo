import { json, enabled, seatOnline } from "../../_lib/assistant.js";
export async function onRequestGet({ env }) {
  if (!enabled(env)) return json({ enabled: false });
  let online = false;
  try { online = await seatOnline(env); } catch (e) {}
  return json({ enabled: true, online, turnstile: env.TURNSTILE_SITEKEY || null, max: 300 });
}
