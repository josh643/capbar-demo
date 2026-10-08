# The Cap Bar: website (stage 1 demo)

Static, mobile-first site: hero, shop, "The Cap Bar experience", "Location coming soon" + notify form,
footer. No server, no database, no monthly platform fee. Payments are handled entirely by
**The Cap Bar's own Stripe account** through Stripe Payment Links.

```
index.html          the page
thanks.html         "Thank you for your order" page (Stripe redirects here after payment)
css/styles.css      all styling (black / gold / white)
js/products.js      <- EDIT THIS: settings, products, prices, photos, Stripe links
js/app.js           shop + checkout behaviour (no need to touch)
images/logo.svg     temporary vector re-draw of the round badge logo (swap for the original file)
images/products/    product images (currently placeholder illustrations)
images/og.png       link-preview image for Facebook / texts
fonts/              self-hosted Google Fonts (Anton, Inter, Great Vibes, Yellowtail; SIL OFL)
tools/make_art.py   regenerates the placeholder logo + cap illustrations
```

Preview locally: `cd site && python3 -m http.server 8000`, then open http://localhost:8000
(opening index.html straight from disk works too, but fonts load best over http).

## What is placeholder in this demo

| Item | Status |
|---|---|
| Prices ($30–$40) | **Example prices only**. Replace in `js/products.js`. |
| Product photos | **Placeholder illustrations**. Put real photos in `images/products/` and update the `image:` paths. |
| Product names / descriptions | Drafts based on the Facebook page (truckers + snapbacks, pink / blue / black, custom logo patterns). |
| Logo | Vector re-draw of the Facebook badge. Replace `images/logo.svg` with the original artwork when available. |
| Checkout | Demo pop-up (`demoMode: true`). Goes live once Payment Links are pasted in. |
| "Notify me" form | Opens the visitor's email app addressed to thomasmarlonr@gmail.com (no server in stage 1). |
| Email + Facebook links | Real (from the Facebook page). |

## Editing products

Everything lives in `js/products.js`. Each product has a name, description, `price`, and a list of
`colors`. Each color has its own `image`, `paymentLink` and `soldOut` flag. Add a product by copying
one `{ ... }` block. Keep the commas between blocks.

## Going live with Stripe (client's own account)

The Cap Bar's own Stripe account receives the money and handles receipts, refunds, disputes
(chargebacks) and payouts. The website never touches card numbers.

1. **Create the Stripe account**: the owner signs up at https://dashboard.stripe.com/register with
   the business details and the bank account for payouts. (Do this in the owner's name; not the developer's.)
2. **Add products**: Dashboard → *Product catalog* → *Add product*. Name, price, photo.
   Simplest setup: one Stripe product per color (e.g. "Custom Trucker – Pink").
   (Alternative: one product per style and a *custom field* dropdown "Color" on its Payment Link.)
3. **Create a Payment Link for each one**: Dashboard → *Payment Links* → *New*, pick the product, then:
   - *Let customers adjust quantity*: on, if you want people to buy several.
   - *Collect customers' addresses*: on, if shipping. Add a shipping rate (or say "Local pickup" in the description).
   - *Add custom fields*: for "Design Your Own" add a text field like "Describe your design idea".
   - *Limit the number of payments*: optional; a simple way to cap stock for limited drops.
   - *After payment* → *Don't show confirmation page* → redirect to `https://YOUR-DOMAIN/thanks.html`.
4. **Test first**: switch the dashboard to *Test mode*, create test links, and pay with card
   `4242 4242 4242 4242` (any future date, any CVC). Then repeat in live mode.
5. **Paste the links** into `js/products.js`, e.g.
   `{ name: "Pink", ..., paymentLink: "https://buy.stripe.com/abc123" }`
6. **Turn off demo mode**: set `demoMode: false` at the top of `js/products.js` and redeploy.
   Buy now then opens Stripe's secure checkout (cards, Apple Pay, Google Pay, Link).
   Any color without a link shows an "Email to order" button instead.
7. **Sold out**: set `soldOut: true` on that color (and/or deactivate its Payment Link in Stripe).

Stripe Payment Links and Checkout don't need any code on the website, a server, or a monthly fee.
Note: Stripe doesn't track stock counts the way a full store does. Use "Limit the number of payments" or
`soldOut` for that. A real inventory count is a stage 2 item.

### Stripe fees (US standard pricing, from https://stripe.com/pricing, checked Oct 8, 2026)

- **2.9% + 30¢ per successful domestic card transaction**. Example: a $30 cap costs $1.17 in fees, so the shop keeps $28.83.
- **No setup fees, no monthly fees**, no closure fees.
- Payment Links and Checkout: included at no additional charge on standard pricing.
- Refunds: no extra fee for card refunds, but the original processing fee isn't returned.
- Disputes / chargebacks: $15.00 per dispute received. Another $15.00 if you counter it, returned if you win.
- Payouts to the bank on the standard schedule are free. Instant Payouts are optional at 1.5%.
- Sales tax: Stripe Tax is optional and costs extra. Many small shops start by setting tax manually.

## Hosting and domain

Any static host works and is free for a site this size: Cloudflare Pages, Netlify, or GitHub Pages.
A domain costs about $10–20 per year (e.g. `thecapbarshop.com` looked unregistered on Oct 8, 2026;
`thecapbar.com` and `capbar.com` are taken).

Cloudflare Pages deploy (once logged in with `npx wrangler login`; wrangler 4 needs Node 22+):

```
npx wrangler pages deploy site --project-name capbar-demo
```

Then add the custom domain in the Cloudflare dashboard → Pages → capbar-demo → Custom domains,
and update the Stripe "after payment" redirect to the real domain.
