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
   - price:        EXAMPLE PRICES ONLY (placeholders for the demo). Replace with
                   The Cap Bar's real prices.
   - image:        the product's main picture (square, hat on a mannequin when we have one).
                   A color can have its own image; colors WITHOUT one show the main picture
                   with a small "Pictured: ..." note (pictureName says which color that is).
                   Files ending in "-photo.webp" are The Cap Bar's REAL mannequin photos (Oct 8, 2026).
                   signature-black, denim-*, beanie-* are still STAND-IN 3D RENDERS
                   (no mannequin photo of those blanks yet).
   - colors:       beanie / denim / distressed color names were read off the supplier
                   screenshots the owner sent (Oct 8) as a color reference. Supplier
                   images are NOT used on the site. Confirm names/stock with the owner.
   - paymentLink:  paste the Stripe Payment Link for that exact product + color
                   (looks like https://buy.stripe.com/xxxxxxxx). Leave "" until
                   the client's Stripe account is set up. See README.md.
                   (Many colors? One Payment Link per product with a "Color"
                   dropdown custom field is simpler; paste the same link on each color.)
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
    image: "images/products/signature-black.webp", // render
    colors: [
      { name: "Black / Gold", swatch: "#111111", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "custom-trucker",
    name: "Custom Trucker",
    tag: "Trucker",
    description: "Foam front, breathable mesh back. Pick your color and your patches, pressed in-house.",
    price: 30, // EXAMPLE PRICE
    size: "One size · adjustable snap",
    image: "images/products/trucker-pink-photo.webp",
    pictureName: "Pink",
    colors: [
      { name: "Pink", swatch: "#f2b8cc", image: "images/products/trucker-pink-photo.webp", paymentLink: "", soldOut: false },
      { name: "Royal blue", swatch: "#1f5fd0", image: "images/products/trucker-royal-blue-photo.webp", paymentLink: "", soldOut: false },
      { name: "Light blue", swatch: "#7fb0e6", image: "images/products/trucker-light-blue-photo.webp", paymentLink: "", soldOut: false },
      { name: "Black", swatch: "#151515", image: "images/products/trucker-black-photo.webp", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "ladies-denim",
    name: "Ladies Denim Hat",
    tag: "Denim",
    description: "A soft washed-denim dad cap, sized for a ladies fit, in a big range of colors. Add your own design in-house.",
    price: 32, // EXAMPLE PRICE
    size: "One size · adjustable strap",
    image: "images/products/denim-medium.webp", // render
    pictureName: "Denim blue",
    colors: [
      { name: "Denim blue", swatch: "#5087b6", image: "images/products/denim-medium.webp", paymentLink: "", soldOut: false },
      { name: "Sky blue", swatch: "#7cb0e0", image: "images/products/denim-light.webp", paymentLink: "", soldOut: false },
      { name: "Light gray", swatch: "#cfccd6", paymentLink: "", soldOut: false },
      { name: "Gray", swatch: "#81848f", paymentLink: "", soldOut: false },
      { name: "Slate", swatch: "#716f7a", paymentLink: "", soldOut: false },
      { name: "Black", swatch: "#333333", paymentLink: "", soldOut: false },
      { name: "Navy", swatch: "#515669", paymentLink: "", soldOut: false },
      { name: "Steel blue", swatch: "#5c6e90", paymentLink: "", soldOut: false },
      { name: "Medium blue", swatch: "#566c9b", paymentLink: "", soldOut: false },
      { name: "Royal blue", swatch: "#1b6195", paymentLink: "", soldOut: false },
      { name: "Turquoise", swatch: "#06a9d7", paymentLink: "", soldOut: false },
      { name: "Light pink", swatch: "#e2a2bd", paymentLink: "", soldOut: false },
      { name: "Bubblegum pink", swatch: "#dd6898", paymentLink: "", soldOut: false },
      { name: "Hot pink", swatch: "#d04083", paymentLink: "", soldOut: false },
      { name: "Magenta", swatch: "#ce3b80", paymentLink: "", soldOut: false },
      { name: "Coral", swatch: "#d54059", paymentLink: "", soldOut: false },
      { name: "Red", swatch: "#9e1d23", paymentLink: "", soldOut: false },
      { name: "Wine", swatch: "#853c47", paymentLink: "", soldOut: false },
      { name: "Rust", swatch: "#b96056", paymentLink: "", soldOut: false },
      { name: "Brick", swatch: "#bc6359", paymentLink: "", soldOut: false },
      { name: "Mustard", swatch: "#b78246", paymentLink: "", soldOut: false },
      { name: "Khaki", swatch: "#937f67", paymentLink: "", soldOut: false },
      { name: "Olive khaki", swatch: "#9c9770", paymentLink: "", soldOut: false },
      { name: "Sage", swatch: "#bbd2af", paymentLink: "", soldOut: false },
      { name: "Dark green", swatch: "#3e433d", paymentLink: "", soldOut: false },
      { name: "Coffee", swatch: "#645540", paymentLink: "", soldOut: false },
      { name: "Chocolate", swatch: "#584444", paymentLink: "", soldOut: false },
      { name: "Purple", swatch: "#604b79", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "vintage-distressed-denim",
    name: "Vintage Distressed Denim",
    tag: "Distressed",
    description: "Frayed, washed vintage dad cap with a broken-in look. Finish it with your patches.",
    price: 32, // EXAMPLE PRICE
    size: "One size · adjustable strap",
    colors: [
      { name: "Blue", swatch: "#5e6b90", image: "images/products/distressed-blue-photo.webp", paymentLink: "", soldOut: false },
      { name: "Khaki", swatch: "#b49a7e", image: "images/products/distressed-khaki-photo.webp", paymentLink: "", soldOut: false },
      { name: "Green", swatch: "#1f7a62", image: "images/products/distressed-green-photo.webp", paymentLink: "", soldOut: false },
      { name: "Black / gray", swatch: "#474749", image: "images/products/distressed-black-photo.webp", paymentLink: "", soldOut: false },
      { name: "Navy", swatch: "#1d2235", image: "images/products/distressed-navy-photo.webp", paymentLink: "", soldOut: false },
      { name: "Hot pink", swatch: "#d0306f", image: "images/products/distressed-hot-pink-photo.webp", paymentLink: "", soldOut: false },
    ],
    image: "images/products/distressed-blue-photo.webp",
    pictureName: "Blue",
  },
  {
    id: "design-your-own",
    name: "Design Your Own Cap",
    tag: "Custom pattern",
    description: "Tell us your idea and we design a one-of-one look for you, from scripture patches to full patch stacks, pressed in under 10 minutes.",
    price: 40, // EXAMPLE PRICE
    size: "One size · adjustable snap",
    note: "After checkout we'll reach out to finalize your design.",
    image: "images/products/custom-black-snapback-photo.webp",
    pictureName: "Black snapback",
    colors: [
      { name: "Black snapback", swatch: "#1b1c20", image: "images/products/custom-black-snapback-photo.webp", paymentLink: "", soldOut: false },
      { name: "Olive snapback", swatch: "#4f5a2a", image: "images/products/custom-olive-snapback-photo.webp", paymentLink: "", soldOut: false },
      { name: "Camo", swatch: "linear-gradient(135deg, #e8e8e8 0 30%, #5b5b5b 30% 55%, #1c1c1c 55% 75%, #9a9a9a 75%)", image: "images/products/custom-camo-photo.webp", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "design-your-own-beanie",
    name: "Design Your Own Beanie",
    tag: "Beanie",
    description: "A cuffed knit beanie with your own design embroidered or patched on. Warm, one-of-one, made with you.",
    price: 30, // EXAMPLE PRICE
    size: "One size · stretch fit",
    note: "After checkout we'll reach out to finalize your design.",
    image: "images/products/beanie-black.webp", // render
    pictureName: "Black",
    colors: [
      { name: "Red", swatch: "#8a1020", paymentLink: "", soldOut: false },
      { name: "Burgundy", swatch: "#5b0a0a", paymentLink: "", soldOut: false },
      { name: "Light pink", swatch: "#edd1d0", paymentLink: "", soldOut: false },
      { name: "Dusty pink", swatch: "#cd94ab", paymentLink: "", soldOut: false },
      { name: "Orange", swatch: "#f99136", paymentLink: "", soldOut: false },
      { name: "Mustard", swatch: "#c79b49", paymentLink: "", soldOut: false },
      { name: "Yellow", swatch: "#fdc50e", paymentLink: "", soldOut: false },
      { name: "Fuchsia", swatch: "#ba2f7c", image: "images/products/beanie-pink.webp", paymentLink: "", soldOut: false },
      { name: "Ice blue", swatch: "#bccdd5", paymentLink: "", soldOut: false },
      { name: "Sky blue", swatch: "#6bb5d2", paymentLink: "", soldOut: false },
      { name: "Lavender", swatch: "#a799d1", paymentLink: "", soldOut: false },
      { name: "Mint green", swatch: "#38e490", paymentLink: "", soldOut: false },
      { name: "Taupe", swatch: "#7a6d5e", paymentLink: "", soldOut: false },
      { name: "Light gray", swatch: "#babbb3", paymentLink: "", soldOut: false },
      { name: "Blue gray", swatch: "#8d99a9", paymentLink: "", soldOut: false },
      { name: "Cornflower blue", swatch: "#5377d1", paymentLink: "", soldOut: false },
      { name: "Black", swatch: "#151515", image: "images/products/beanie-black.webp", paymentLink: "", soldOut: false },
      { name: "Navy", swatch: "#131627", paymentLink: "", soldOut: false },
      { name: "Indigo", swatch: "#282665", paymentLink: "", soldOut: false },
      { name: "Royal blue", swatch: "#0911ae", image: "images/products/beanie-blue.webp", paymentLink: "", soldOut: false },
      { name: "Forest green", swatch: "#144734", paymentLink: "", soldOut: false },
      { name: "Olive", swatch: "#374135", paymentLink: "", soldOut: false },
      { name: "Chocolate", swatch: "#3a2f33", paymentLink: "", soldOut: false },
      { name: "Charcoal", swatch: "#4a4d56", paymentLink: "", soldOut: false },
    ],
  },
];
