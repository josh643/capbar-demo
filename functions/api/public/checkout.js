// Shop-ready checkout: Stripe PaymentIntent for The Cap Bar cart.
// Prices come from functions/_catalog.js, never from the browser.
// Safety: refuses to charge unless SHOP_CHECKOUT_ENABLED=true AND a Stripe
// key is present. Live keys are refused unless SHOP_STRIPE_LIVE=true.
import CATALOG from "../../_catalog.js";

const MAX_QTY = 10;
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// EWS fee: 50c + 1% per card sale, capped at $5. Only applied when a connected account is set.
export function ewsFee(cents) { return Math.min(500, 50 + Math.round(cents * 0.01)); }

export function priceCart(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) return { error: "Your cart is empty." };
  const lines = []; const bad = [];
  let total = 0;
  items.forEach((it, index) => {
    const v = CATALOG[it && it.color];
    const qty = Math.floor(Number(it && it.qty));
    if (!v || v.productId !== it.productId) return bad.push({ index, color: it && it.color, error: "This item is no longer available." });
    if (v.soldOut) return bad.push({ index, color: it.color, error: "Sold out." });
    if (!(qty >= 1 && qty <= MAX_QTY)) return bad.push({ index, color: it.color, error: "Choose 1 to " + MAX_QTY + "." });
    total += v.cents * qty;
    lines.push({ variantId: it.color, name: v.name, qty, unitPrice: v.cents / 100 });
  });
  if (bad.length) return { error: "Please check your cart.", lines: bad };
  return { lines, total };
}

export async function onRequestPost({ request, env }) {
  if (String(env.SHOP_CHECKOUT_ENABLED || "") !== "true") {
    return json({ error: "Online ordering is coming soon." }, 503);
  }
  const key = env.STRIPE_SECRET_KEY || "";
  const liveOk = String(env.SHOP_STRIPE_LIVE || "") === "true";
  const testKey = key.startsWith("sk_test_") || key.startsWith("rk_test_");
  const liveKey = key.startsWith("sk_live_") || key.startsWith("rk_live_");
  if (!testKey && !(liveOk && liveKey)) {
    return json({ error: "Checkout is not set up on this site." }, 503);
  }
  let body; try { body = await request.json(); } catch { return json({ error: "Bad request." }, 400); }
  const priced = priceCart(body && body.items);
  if (priced.error) return json(priced, 400);
  const form = new URLSearchParams({
    amount: String(priced.total), currency: "usd",
    "automatic_payment_methods[enabled]": "true",
    description: liveOk ? "The Cap Bar web order" : "The Cap Bar web order (test)",
    "metadata[site]": "capbar-shop-ready",
    "metadata[items]": priced.lines.map((l) => l.qty + "x " + l.variantId).join(", ").slice(0, 490),
  });
  const acct = env.STRIPE_CONNECTED_ACCOUNT || "";
  if (acct) { form.set("transfer_data[destination]", acct); form.set("application_fee_amount", String(ewsFee(priced.total))); }
  const r = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST", body: form,
    headers: { authorization: "Bearer " + key, "content-type": "application/x-www-form-urlencoded" },
  });
  const pi = await r.json();
  if (!r.ok) return json({ error: "Checkout could not be started. Please try again." }, 502);
  return json({
    clientSecret: pi.client_secret,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    subtotal: priced.total / 100,
    lines: priced.lines,
    testMode: !liveOk,
  });
}
