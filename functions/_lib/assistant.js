// Shared helpers for the Cap Bar assistant relay. The assistant itself is an isolated agent seat that never
// accepts inbound connections: it polls /api/assistant/seat/next over HTTPS with signed requests, answers, and
// posts back to /api/assistant/seat/answer. This site only queues questions and hands back answers.
export const LIMITS = { qMax: 300, globalDay: 300, jobTtl: 3600, answerMax: 1200, citesMax: 4 };
// Per-visitor buckets, checked together. A visitor is throttled when ANY bucket is over its limit, so rotating
// addresses inside one IPv6 /64 or /48, one IPv4 /24, or one network (ASN) does not reset the count.
// Limits are a little looser than a research site because customers share the shop Wi-Fi.
export const BUCKETS = [
  { scope: "addr", per10: 6, perDay: 30 },
  { scope: "net", per10: 20, perDay: 80 },
  { scope: "asn", per10: 60, perDay: 300 },
];
const ALLOWED_HOSTS = /^(capbarexperience\.com|www\.capbarexperience\.com|capbar\.pages\.dev|[a-z0-9-]+\.capbar\.pages\.dev)$/;

export function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", ...extra },
  });
}
export const now = () => Math.floor(Date.now() / 1000);
export const day = (t = now()) => new Date(t * 1000).toISOString().slice(0, 10);
export function enabled(env) {
  return env.ASSISTANT_ENABLED === "1" && !!env.ASSISTANT_SEAT_SECRET && !!env.DB;
}
// Browsers always send Origin on a cross-site POST. Reject other sites; non-browser callers still hit the rate limits.
export function originOk(request) {
  const o = request.headers.get("origin");
  if (!o) return true;
  try { return ALLOWED_HOSTS.test(new URL(o).hostname); } catch (e) { return false; }
}
const enc = new TextEncoder();
export async function sha256hex(s) {
  const b = await crypto.subtle.digest("SHA-256", typeof s === "string" ? enc.encode(s) : s);
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
export async function hmacHex(secret, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return [...new Uint8Array(s)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function safeEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function expand6(ip) {
  let s = String(ip || "").toLowerCase().split("%")[0];
  if (!/^[0-9a-f:.]+$/.test(s) || s.indexOf(":") < 0) return null;
  const m = s.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (m) {
    const v4 = parse4(m[2]);
    if (!v4) return null;
    s = m[1] + ((v4[0] << 8) | v4[1]).toString(16) + ":" + ((v4[2] << 8) | v4[3]).toString(16);
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const a = halves[0] ? halves[0].split(":") : [];
  const b = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - a.length - b.length : 0;
  if (fill < 0 || (halves.length === 1 && a.length !== 8)) return null;
  const all = [...a, ...Array(fill).fill("0"), ...b];
  if (all.length !== 8 || all.some((h) => !/^[0-9a-f]{1,4}$/.test(h))) return null;
  return all.map((h) => parseInt(h, 16));
}
function parse4(ip) {
  const p = String(ip || "").split(".");
  if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || +x > 255)) return null;
  return p.map(Number);
}
const hex = (h) => h.map((x) => x.toString(16)).join(":");
// Network buckets for one client address. IPv4-mapped IPv6 is treated as IPv4.
export function ipBuckets(ip) {
  const v4 = parse4(ip);
  if (v4) return { family: 4, addr: v4.join("."), net: v4.slice(0, 3).join(".") + ".0/24" };
  const h = expand6(ip);
  if (!h) return { family: 0, addr: "unknown", net: "unknown" };
  if (h.slice(0, 5).every((x) => x === 0) && h[5] === 0xffff) {
    const m = [h[6] >> 8, h[6] & 255, h[7] >> 8, h[7] & 255];
    return { family: 4, addr: m.join("."), net: m.slice(0, 3).join(".") + ".0/24" };
  }
  return { family: 6, addr: hex(h.slice(0, 4)) + "::/64", net: hex(h.slice(0, 3)) + "::/48" };
}
// Salted, daily-rotating hashes: we rate-limit without storing IP addresses or network identifiers.
async function bucketId(env, label) {
  return (await hmacHex(env.ASSISTANT_SEAT_SECRET, "rl|" + day() + "|" + label)).slice(0, 24);
}
export async function visitorBuckets(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const b = ipBuckets(ip);
  const asn = request.cf && request.cf.asn ? String(request.cf.asn) : "unknown";
  return {
    addr: await bucketId(env, "addr|" + b.addr),
    net: await bucketId(env, "net|" + b.net),
    asn: await bucketId(env, "asn|" + asn),
  };
}
// Counts this ATTEMPT in every per-visitor bucket and reports the first one over its limit. The site-wide daily
// cap is READ here and claimed with claimGlobal() once the question is accepted.
export async function checkRate(request, env, t = now()) {
  const ids = await visitorBuckets(request, env);
  const win = Math.floor(t / 600), d = day(t);
  let over = null;
  for (const B of BUCKETS) {
    const n10 = await bump(env, `${B.scope}10:${ids[B.scope]}:${win}`, 660);
    const nd = await bump(env, `${B.scope}day:${ids[B.scope]}:${d}`, 90000);
    if (!over && (n10 > B.per10 || nd > B.perDay)) over = B.scope;
  }
  if (over) return { ok: false, scope: over };
  if ((await peekGlobal(env, t)) >= LIMITS.globalDay) return { ok: false, scope: "global" };
  return { ok: true };
}
export const globalKey = (t = now()) => `global:${day(t)}`;
export async function peekGlobal(env, t = now()) {
  const r = await env.DB.prepare("SELECT n FROM assistant_rate WHERE k = ?1").bind(globalKey(t)).first();
  return r ? r.n : 0;
}
export async function claimGlobal(env, t = now()) {
  const n = await bump(env, globalKey(t), 90000);
  return { ok: n <= LIMITS.globalDay, n };
}
export async function bump(env, key, ttl) {
  const exp = now() + ttl;
  const row = await env.DB.prepare(
    "INSERT INTO assistant_rate (k, n, expires) VALUES (?1, 1, ?2) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n"
  ).bind(key, exp).first();
  return row ? row.n : 1;
}
export async function stat(env, col) {
  const ok = ["asked", "answered", "no_answer", "refused", "failed", "rate_limited", "blocked"];
  if (!ok.includes(col)) return;
  await env.DB.prepare(`INSERT INTO assistant_daily (day, ${col}) VALUES (?1, 1) ON CONFLICT(day) DO UPDATE SET ${col} = ${col} + 1`).bind(day()).run();
}
export async function sweep(env) {
  const t = now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM assistant_jobs WHERE created_at < ?1").bind(t - LIMITS.jobTtl),
    env.DB.prepare("DELETE FROM assistant_rate WHERE expires < ?1").bind(t),
    env.DB.prepare("DELETE FROM assistant_nonce WHERE expires < ?1").bind(t),
    env.DB.prepare("UPDATE assistant_jobs SET status = 'pending', claimed_at = NULL WHERE status = 'claimed' AND claimed_at < ?1").bind(t - 120),
  ]);
}
// Signed seat request: X-Seat-Ts, X-Seat-Nonce, X-Seat-Sig = HMAC(secret, ts\nnonce\nMETHOD\npath\nsha256(body)).
export async function verifySeat(request, env, body) {
  const ts = parseInt(request.headers.get("x-seat-ts") || "0", 10);
  const nonce = request.headers.get("x-seat-nonce") || "";
  const sig = request.headers.get("x-seat-sig") || "";
  if (!ts || Math.abs(now() - ts) > 60 || !/^[a-f0-9]{32,64}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(sig)) return false;
  const path = new URL(request.url).pathname;
  const msg = `${ts}\n${nonce}\n${request.method}\n${path}\n${await sha256hex(body)}`;
  if (!safeEq(await hmacHex(env.ASSISTANT_SEAT_SECRET, msg), sig)) return false;
  try {
    await env.DB.prepare("INSERT INTO assistant_nonce (nonce, expires) VALUES (?1, ?2)").bind(nonce, now() + 300).run();
  } catch (e) {
    return false; // replayed nonce
  }
  return true;
}
export async function seatSeen(env) {
  await env.DB.prepare("INSERT INTO assistant_seat (id, last_seen) VALUES (1, ?1) ON CONFLICT(id) DO UPDATE SET last_seen = ?1").bind(now()).run();
}
export async function seatOnline(env) {
  const r = await env.DB.prepare("SELECT last_seen FROM assistant_seat WHERE id = 1").first();
  return !!r && now() - r.last_seen < 75;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function cleanQuestion(q) {
  return String(q || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
