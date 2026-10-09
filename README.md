# The Cap Bar: website (showcase for the store)

**Oct 8, 2026: showcase version.** At the owner's request the site is a showcase for the store, with no
online sales for now. "Location coming soon" (348 South Main Street, Memphis) is the theme of the home
page. The site has his five collections plus 901 Grizz, a collage gallery, Our Story and Contact.

- **Bring the online store back:** everything is saved in git tag `store-v1` (cart, prices, admin API,
  Stripe Payment Links). `js/products.js`, `js/cart.js`, `js/app.js` and the admin are still here, just not
  loaded by the public pages. `shop.html` / `thanks.html` now forward to the collections / home page
  (plus `_redirects`).
- **Photos:** `images/showcase/` is built from the owner's originals by `tools/build_showcase_images.py`
  (EXIF rotation, crops, collection labels cut off, no camera/location data, 1600px + 720px .jpg/.webp).
- **Which photo goes where:** `js/showcase-data.js` (collections in the owner's order, names exactly as he
  wrote them; gallery order). Pages render it with `js/showcase.js` (collage + photo viewer).
- Settings (email, Facebook): `js/settings.js`.

---

## Store version notes (store-v1, kept for the upgrade)


Static, mobile-first site: hero, shop, "The Cap Bar experience", "Location coming soon" card (348 South Main),
footer. No server, no database, no monthly platform fee. Payments are handled entirely by
**The Cap Bar's own Stripe account** through Stripe Payment Links.

```
index.html            home: hero, Our Story teaser, collections teaser, experience, gallery highlights, shop CTA, coming-soon
shop.html             the shop: product grid, colors, sale prices, demo checkout (loads from the admin API, falls back to js/products.js)
collections.html      all collections, Camo, The 901 (coming soon)
gallery.html          "Our work" gallery + lightbox (js/gallery.js)
story.html            Our Story: Marlon's mission statement
contact.html          contact page: short mission, testimonials, contact info + form
thanks.html           "Thank you for your order" page (Stripe redirects here after payment)
css/styles.css        all styling (black / gold / white)
js/products.js        <- EDIT: settings, products, prices, photos, Stripe links
js/gallery.js         <- EDIT: list of real photos for the "Our work" gallery
js/testimonials.js    <- EDIT: real customer reviews for the contact page
js/cart.js            cart (saved in the browser), header cart button, cart drawer, checkout
js/site.js, app.js, contact.js   page behaviour (no need to touch)
images/logo.svg       badge logo: round black/gold badge + the client's cap art + The / CAP BAR / tagline
images/cap-mark.png   the cap cut out of the client's new logo art (transparent PNG)
images/products/      product pictures, 1040x715 .webp (*-photo.webp = real photos; the rest are stand-in renders)
images/gallery/       real photos of the owner's designs (1600px .jpg/.webp + 800px square -thumb)
images/og.jpg         link-preview image for Facebook / texts; favicon.png + icon-180.png = icons
fonts/                self-hosted Google Fonts (Anton, Inter, Great Vibes, Yellowtail; SIL OFL)
tools/                cut_cap.py (cap cut-out), make_logo.py (logo), make_textures.py +
                      render_hats.py (Blender product renders), og.html (preview image)
```

Preview locally: `cd site && python3 -m http.server 8000`, then open http://localhost:8000
(opening index.html straight from disk works too, but fonts load best over http).

## What is placeholder in this demo

| Item | Status |
|---|---|
| Prices ($30–$40) | **Example prices only**. Replace in `js/products.js`. |
| Product pictures | **Real photos** from the owner where we have them: Custom Trucker Royal blue, Light blue, Black, Pink (main picture is the owner's Peace trucker, IMG_6799), Design Your Own Cap, Dusty pink beanie (main beanie picture). Ladies Denim and the other beanie colors use the 3D mockup tinted per color (`tools/tint_colors.py`); Signature Snapback is a render. **No picture yet** (grayed-out picture + swatch chip): all 5 Vintage Distressed Denim colors (old photos had "Black ..." patches or were colors he no longer carries; the green photo is only the grayed-out base) and the 8 new trucker colors (Cranberry, White, Orange, Olive green, Gray, Brown, Khaki, Blue Jean). Check with `python3 tools/check_color_images.py --api https://admin.capbarexperience.com`. |
| Product names / descriptions | Drafts based on the Facebook page and the client's feedback (signature snapback, truckers, ladies denim, vintage distressed denim, design-your-own cap and beanie). |
| Logo | Our round badge with the cap cut out of the client's new logo art. If the client has the original high-res/vector file of that cap, re-run `tools/cut_cap.py` + `tools/make_logo.py` or drop in a finished logo. |
| "Our work" gallery | **17 real photos** from the owner. Off the site: profanity patches (IMG_6924, 6802) and, at the owner's request (Oct 8), every photo whose patch says "Black" (Black Queen, Black Beautiful Blessed, Unapologetically Black, Black yesterday/today/everyday). Baked-in "... Collection" captions were cropped off; captions describe the hat. |
| Collections section | The owner's 6 collection images with the collection names removed from the pictures (owner's request, Oct 8; `tools/clean_collection_text.py`). The "Black Queen" patch on the Boss Lady image is blurred. |
| Location | 348 South Main Street, Memphis, TN 38103 (owner, Oct 8), coming soon: home "Coming soon / Our new location" card with the owner's photo at the door (IMG_6837), contact page, every footer, LocalBusiness JSON-LD on home + contact. Ships + local pickup (home, shop, contact). |
| Colors | Custom Trucker (12) and Vintage Distressed Denim (Black, Charcoal, Khaki, Blue, Cranberry) are the **owner's own lists** (Oct 8). Ladies denim + beanie colors were read off supplier screenshots (supplier images are NOT on the site); beanies: owner ordered more colors, "use pink for now" (dusty pink photo is the main picture). |
| Mission statement | **Owner's own words** (Oct 8): full text in the Our Story section of index.html; short version on the contact page. Mission picture: the Love bus trucker on a mannequin (IMG_6797), per owner. |
| Testimonials | **None yet**. Placeholder layout + "Share your experience" email button. Only add real reviews. |
| Contact form | Opens the visitor's email app (no server in stage 1). |
| Checkout | Demo pop-up (`demoMode: true`). Goes live once Payment Links are pasted in. |
| "Notify me" form | Opens the visitor's email app addressed to thomasmarlonr@gmail.com (no server in stage 1). |
| Email + Facebook links | Real (from the Facebook page). |

## Shop data and checkout

The shop loads products, photos, and stock from the admin at
`https://admin.capbarexperience.com/api/public/products`. If that API is down,
it falls back to `js/products.js`. Buy now asks the admin to start Stripe Checkout.
Until Marlon links his own Stripe key, that call stays in demo mode and the demo
ribbon and demo checkout stay up. Example prices in the admin are placeholders
(stock is seeded at 10 per color).

## Editing products

Everything lives in `js/products.js`. Each product has a name, description, `price`, and a list of
`colors`. Each color has its own `image`, `paymentLink` and `soldOut` flag. Add a product by copying
one `{ ... }` block. Keep the commas between blocks.

## Gallery ("Our work") and reviews

- Gallery: copy photos into `images/gallery/` and add a line per photo in `js/gallery.js`
  (`{ src: "images/gallery/name.jpg", thumb: "images/gallery/name-thumb.jpg", webp: true, alt: "what's in the photo", caption: "optional" }`).
  `webp: true` means a .webp copy with the same name exists (faster on phones). The web copies are made by
  `../tools_photos/process.py` on the build box (fixes rotation, strips GPS/camera data, resizes).
  Clicking a photo opens a full-screen viewer. With an empty list the section shows "Photos coming soon".
- Reviews: add real reviews (with the customer's OK) to `js/testimonials.js`
  (`{ quote: "...", name: "Jasmine R.", detail: "Custom trucker" }`). Empty list = placeholder + "Share your experience".

## Product renders

The product pictures are stand-in 3D renders made on the build box:
`python3 tools/make_textures.py && blender -b -P tools/render_hats.py -- --samples 64 --res 1040x715`
then converted to .webp (~40–120 KB each). Replace them with real product photos when available.

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

**Live:** https://capbarexperience.com/ (Cloudflare Pages project `capbar`, account 21779b…; www.capbarexperience.com too).
Redeploy: `cd ../cf && CLOUDFLARE_ACCOUNT_ID=21779b260eff4cd8fdd71c920eaec8ab npx wrangler@3 pages deploy ../site --project-name capbar --branch main`.
GitHub Pages copy: https://josh643.github.io/capbar-demo/ (push to main).


Any static host works and is free for a site this size: Cloudflare Pages, Netlify, or GitHub Pages.
A domain costs about $10–20 per year (e.g. `thecapbarshop.com` looked unregistered on Oct 8, 2026;
`thecapbar.com` and `capbar.com` are taken).

Cloudflare Pages deploy (once logged in with `npx wrangler login`; wrangler 4 needs Node 22+):

```
npx wrangler pages deploy site --project-name capbar-demo
```

Then add the custom domain in the Cloudflare dashboard → Pages → capbar-demo → Custom domains,
and update the Stripe "after payment" redirect to the real domain.

## Pages and old links

The site was split into pages on Oct 8. The header and footer are repeated in each .html file;
edit all six when a link changes. index.html forwards old one-page links (#shop, #collections, #camo,
#gallery, #story) to the new pages.

## Cart

Every page has a cart button with a count in the header. "Add to cart" on the shop (and on the
Camo section) adds a hat in the chosen color; the cart is saved in the shopper's browser
(localStorage key `capbar_cart_v1`) so it follows them across pages. The cart drawer changes
quantities (1 to 10 per color, limited by stock), removes lines, and shows the subtotal at sale
prices with the regular prices struck through.

Check out sends only product, color and quantity to `https://admin.capbarexperience.com/api/public/checkout`.
The admin prices every line from its own database and opens one Stripe Checkout for the whole cart.
Until Stripe is connected it answers in demo mode and the drawer shows the demo checkout note.
After a paid checkout, thanks.html empties the cart.
