/* ==========================================================================
   THE CAP BAR — store settings + product list
   This is the ONLY file you need to edit to change products, prices, photos
   and Stripe checkout links. (Plain JavaScript; keep the commas and quotes.)
   ========================================================================== */

window.CAPBAR_SETTINGS = {
  businessName: "The Cap Bar",
  email: "thomasmarlonr@gmail.com",
  facebook: "https://www.facebook.com/people/The-Cap-Bar/61595176251150/",

  // true  = show the "demo preview" ribbon and the demo checkout pop-up.
  // false = go live: Buy buttons open each product's Stripe Payment Link.
  demoMode: true,

  currency: "USD",
};

/* --------------------------------------------------------------------------
   PRODUCTS
   - price:        EXAMPLE PRICES ONLY (placeholders for the demo, roughly what
                   custom caps sell for). Replace with The Cap Bar's real prices.
   - image:        put the real product photos in images/products/ and change
                   the file name here (jpg/png/webp all fine, square-ish works best).
   - paymentLink:  paste the Stripe Payment Link for that exact product + color
                   (looks like https://buy.stripe.com/xxxxxxxx). Leave "" until
                   the client's Stripe account is set up. See README.md.
   - soldOut:      true hides the Buy button for that color.
   -------------------------------------------------------------------------- */
window.CAPBAR_PRODUCTS = [
  {
    id: "signature-snapback",
    name: "Signature Snapback",
    tag: "House cap",
    description: "Black on black with our gold Cap Bar badge. The one we wear.",
    price: 35, // EXAMPLE PRICE
    size: "One size · adjustable snap",
    colors: [
      { name: "Black / Gold", swatch: "#111111", image: "images/products/signature-black.svg", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "custom-trucker",
    name: "Custom Trucker",
    tag: "Trucker",
    description: "Foam front, breathable mesh back. Pick your color and your design, pressed in-house.",
    price: 30, // EXAMPLE PRICE
    size: "One size · adjustable snap",
    colors: [
      { name: "Pink", swatch: "#e94f8a", image: "images/products/trucker-pink.svg", paymentLink: "", soldOut: false },
      { name: "Blue", swatch: "#2f6fd6", image: "images/products/trucker-blue.svg", paymentLink: "", soldOut: false },
      { name: "Black", swatch: "#151515", image: "images/products/trucker-black.svg", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "script-snapback",
    name: "Script Snapback",
    tag: "Snapback",
    description: "Structured six-panel snapback with gold script lettering.",
    price: 32, // EXAMPLE PRICE
    size: "One size · adjustable snap",
    colors: [
      { name: "Black", swatch: "#151515", image: "images/products/snapback-black.svg", paymentLink: "", soldOut: false },
      { name: "Pink", swatch: "#e94f8a", image: "images/products/snapback-pink.svg", paymentLink: "", soldOut: false },
      { name: "Blue", swatch: "#2f6fd6", image: "images/products/snapback-blue.svg", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "design-your-own",
    name: "Design Your Own",
    tag: "Custom pattern",
    description: "Tell us your idea and we design a one-of-one logo pattern for you, then press it in under 10 minutes.",
    price: 40, // EXAMPLE PRICE
    size: "One size · adjustable snap",
    note: "After checkout we'll reach out to finalize your design.",
    colors: [
      { name: "Black", swatch: "#151515", image: "images/products/custom-pattern-black.svg", paymentLink: "", soldOut: false },
      { name: "Pink", swatch: "#e94f8a", image: "images/products/custom-pattern-pink.svg", paymentLink: "", soldOut: false },
      { name: "Blue", swatch: "#2f6fd6", image: "images/products/custom-pattern-blue.svg", paymentLink: "", soldOut: false },
    ],
  },
];
