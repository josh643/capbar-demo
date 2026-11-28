# Cap Bar shop-ready: how to turn online sales on

This branch is a **preview only**. It is not the live site.
Do not merge it to `staging` or `main` until Joshua and Marlon have approved a launch.

Preview URL (after this branch is pushed): https://shop-ready.capbar.pages.dev

The live showcase stays on https://capbarexperience.com (`main`) and
https://staging.capbar.pages.dev (`staging`).

## Where the shop version came from

- **Git tag `store-v1`** (`63439320ff0596d604a251fafbcc8a147775fa6e`, 8 Oct 2026):
  the full online store (cart, prices, Stripe Payment Link hooks, admin API)
  saved the evening Marlon pivoted the site to a showcase.
- **Branch `store-staging`** (`24906022741b1d4da952feefabbe66b81a178267`, 4 Nov 2026):
  that shop later updated onto the October showcase, with Stripe Elements
  (test mode), server-side prices, and `noindex`.
- **This branch `shop-ready`** starts from current `main` (`f233e03`, 27 Nov 2026)
  so the showcase content wins (901 Collection, varsity jacket details, photos,
  hours, logo, follow-us, footer), and the shop pages from `store-staging` are
  ported on top.

## The launch switch (off by default)

Two things must both be on before a card can be charged. Either one alone is not enough.

1. **Front-end flag** in `js/shop-config.js`:

   ```js
   window.CAPBAR_SHOP = { checkoutEnabled: false }
   ```

   Set `checkoutEnabled: true` to show Add to cart / Check out instead of
   “Online ordering coming soon”.

2. **Pages Function env var** on the Cloudflare Pages project `capbar`,
   for the `shop-ready` preview (and later, only after approval, for production):

   | Variable | What it does |
   | --- | --- |
   | `SHOP_CHECKOUT_ENABLED` | Must be the string `true` or the function answers “coming soon” and creates no PaymentIntent. |
   | `STRIPE_SECRET_KEY` | Stripe secret key. Test keys (`sk_test_` / `rk_test_`) are accepted. Live keys are **refused** unless `SHOP_STRIPE_LIVE=true`. |
   | `STRIPE_PUBLISHABLE_KEY` | Matching publishable key (`pk_test_…` or `pk_live_…`). |
   | `SHOP_STRIPE_LIVE` | Set to `true` only when going live with real charges. Leave unset for test mode. |
   | `STRIPE_CONNECTED_ACCOUNT` | Optional. If set, the function applies the EWS fee (50¢ + 1% per sale, capped at $5) and transfers the rest to that connected account. Leave unset if Marlon’s Stripe account is the platform account that receives the money directly. |

   Do not put keys in the repo or in chat.

The function prices every line from `functions/_catalog.js` (built from
`js/products.js`). The browser cannot set the price.

### After you change products or prices

```bash
node tools/build_catalog.mjs
```

Commit the updated `functions/_catalog.js` with the product change.

## Current catalog (from `js/products.js`)

These are the hats already in the saved shop catalog, used as-is:

| Product | Price | Colors |
| --- | --- | --- |
| Signature Snapback | $30 | Black / Gold |
| Custom Trucker | $25 | 12 colors |
| Ladies Denim Hat | $25 | 28 colors |
| Vintage Distressed Denim | $25 | Black, Charcoal, Khaki, Blue, Cranberry |
| Design Your Own Cap · Men’s | $30 | Black snapback, Olive snapback, Woodland camo, Gray camo |
| Design Your Own Beanie | $17 | 24 colors |

Shipping vs local pickup is mentioned on the shop page (348 South Main Street,
Memphis). Stripe Checkout is not yet configured with shipping rates or a
pickup option — that is a launch decision.

**Not in the shop catalog yet** (showcase only): the 901 Collection varsity
jacket (“merch coming mid-December”), The Official Cap Bar Cap, and the
collection designs themselves (Queen Bling, Love & Peace, and the rest).
Those need prices and a yes from Marlon before they can be sold online.

## Checklist before going live on capbarexperience.com

Nothing below should be done without Joshua’s approval, and a live merge still
goes staging-first, then main, with a separate yes for the merge.

- [ ] Marlon confirms which products are for sale, the prices, and shipping
      vs local pickup (and any tax).
- [ ] Catalog updated and `node tools/build_catalog.mjs` re-run.
- [ ] Marlon’s Stripe account is connected (his own account, or a Stripe
      Connect destination in `STRIPE_CONNECTED_ACCOUNT`).
- [ ] Test-mode end-to-end on this preview (flag on, test keys only, no live
      charges).
- [ ] Set `checkoutEnabled: true` in `js/shop-config.js`.
- [ ] Set `SHOP_CHECKOUT_ENABLED=true` on the Pages environment that will go
      live, with the right keys. Set `SHOP_STRIPE_LIVE=true` only for live keys.
- [ ] Restore `robots.txt` and remove the preview `X-Robots-Tag: noindex`
      from `_headers` so the public site can be indexed. Add `/shop` to the
      sitemap.
- [ ] Take `shop-ready` out of `.github/workflows/deploy.yml`’s production
      copy, or keep previews only, so a later push cannot surprise production.
  The live workflow on `main` / `staging` must stay `[staging, main]` until
      a launch merge is approved.
- [ ] Remove the red/brown “Preview · this is not the live site” ribbon
      (`js/site.js`).
- [ ] Deploy to **staging** first (https://staging.capbar.pages.dev), get
      Marlon’s approval (relayed through Joshua), then merge to `main` only
      with a fresh yes.

## What flipping the switch does *not* do by itself

- It does not create a Stripe account, products, or Payment Links.
- It does not charge anyone while `SHOP_CHECKOUT_ENABLED` is unset/false,
  or while only test keys are configured.
- It does not change capbarexperience.com. Only a merge to `main` would.
