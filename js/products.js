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
                   NOTE: the .webp pictures shipping with the demo are STAND-IN RENDERS
                   (studio-style 3D shots), not the owner's photos. Swap them out when the
                   real photos arrive.
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
      { name: "Black / Gold", swatch: "#111111", image: "images/products/signature-black.webp", paymentLink: "", soldOut: false },
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
      { name: "Pink", swatch: "#e94f8a", image: "images/products/trucker-pink.webp", paymentLink: "", soldOut: false },
      { name: "Blue", swatch: "#2f6fd6", image: "images/products/trucker-blue.webp", paymentLink: "", soldOut: false },
      { name: "Black", swatch: "#151515", image: "images/products/trucker-black.webp", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "ladies-denim",
    name: "Ladies Denim Hat",
    tag: "Denim",
    description: "A softer dad-cap shape in washed denim, sized for a ladies fit. Add your own design in-house.",
    price: 32, // EXAMPLE PRICE
    size: "One size · adjustable snap",
    colors: [
      { name: "Medium wash", swatch: "#3e5f8f", image: "images/products/denim-medium.webp", paymentLink: "", soldOut: false },
      { name: "Light wash", swatch: "#a9c2d8", image: "images/products/denim-light.webp", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "design-your-own",
    name: "Design Your Own Cap",
    tag: "Custom pattern",
    description: "Tell us your idea and we design a one-of-one logo pattern for you, then press it in under 10 minutes.",
    price: 40, // EXAMPLE PRICE
    size: "One size · adjustable snap",
    note: "After checkout we'll reach out to finalize your design.",
    colors: [
      { name: "Black", swatch: "#151515", image: "images/products/custom-black.webp", paymentLink: "", soldOut: false },
      { name: "Pink", swatch: "#e94f8a", image: "images/products/custom-pink.webp", paymentLink: "", soldOut: false },
      { name: "Blue", swatch: "#2f6fd6", image: "images/products/custom-blue.webp", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "design-your-own-beanie",
    name: "Design Your Own Beanie",
    tag: "Beanie",
    description: "A custom knit beanie with your own design embroidered or patched on. Warm, one-of-one, made with you.",
    price: 30, // EXAMPLE PRICE
    size: "One size · stretch fit",
    note: "After checkout we'll reach out to finalize your design.",
    colors: [
      { name: "Black", swatch: "#151515", image: "images/products/beanie-black.webp", paymentLink: "", soldOut: false },
      { name: "Pink", swatch: "#e94f8a", image: "images/products/beanie-pink.webp", paymentLink: "", soldOut: false },
      { name: "Blue", swatch: "#2f6fd6", image: "images/products/beanie-blue.webp", paymentLink: "", soldOut: false },
    ],
  },
];
