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
   - price:        what the customer pays (the sale price when a hat is on sale).
   - compareAt:    optional regular price. When it is higher than price, the shop
                   shows it crossed out next to the sale price. Leave it off when
                   the hat is not on sale.
   - image:        the product's main picture (square, hat on a mannequin when we have one).
                   Every color should have its OWN image of that exact color. The site never
                   shows a picture of a different color: a color without an image shows a
                   grayed-out product picture with that color's swatch chip on top.
                   Files ending in "-photo.webp" are The Cap Bar's REAL mannequin photos (Oct 8, 2026).
                   "tint-denim-*" / "tint-beanie-*" are the 3D mockup tinted to each swatch
                   (tools/tint_colors.py), STAND-INS until real photos of those blanks exist.
                   signature-black is a stand-in 3D render.
   - pictureName:  which color the main picture shows (for your reference).
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
    price: 30,
    compareAt: 35,
    size: "One size · adjustable snap",
    image: "images/products/signature-black.webp", // render
    colors: [
      { name: "Black / Gold", swatch: "#111111", image: "images/products/signature-black.webp", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "custom-trucker",
    name: "Custom Trucker",
    tag: "Trucker",
    description: "Foam front, breathable mesh back. Pick your color and your patches, pressed in-house.",
    price: 25,
    compareAt: 30,
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
    price: 25,
    compareAt: 30,
    size: "One size · adjustable strap",
    image: "images/products/tint-denim-denim-blue.webp", // 3D mockup tinted per color
    pictureName: "Denim blue",
    colors: [
      { name: "Denim blue", swatch: "#5087b6", image: "images/products/tint-denim-denim-blue.webp", paymentLink: "", soldOut: false },
      { name: "Sky blue", swatch: "#7cb0e0", image: "images/products/tint-denim-sky-blue.webp", paymentLink: "", soldOut: false },
      { name: "Light gray", swatch: "#cfccd6", image: "images/products/tint-denim-light-gray.webp", paymentLink: "", soldOut: false },
      { name: "Gray", swatch: "#81848f", image: "images/products/tint-denim-gray.webp", paymentLink: "", soldOut: false },
      { name: "Slate", swatch: "#716f7a", image: "images/products/tint-denim-slate.webp", paymentLink: "", soldOut: false },
      { name: "Black", swatch: "#333333", image: "images/products/tint-denim-black.webp", paymentLink: "", soldOut: false },
      { name: "Navy", swatch: "#515669", image: "images/products/tint-denim-navy.webp", paymentLink: "", soldOut: false },
      { name: "Steel blue", swatch: "#5c6e90", image: "images/products/tint-denim-steel-blue.webp", paymentLink: "", soldOut: false },
      { name: "Medium blue", swatch: "#566c9b", image: "images/products/tint-denim-medium-blue.webp", paymentLink: "", soldOut: false },
      { name: "Royal blue", swatch: "#1b6195", image: "images/products/tint-denim-royal-blue.webp", paymentLink: "", soldOut: false },
      { name: "Turquoise", swatch: "#06a9d7", image: "images/products/tint-denim-turquoise.webp", paymentLink: "", soldOut: false },
      { name: "Light pink", swatch: "#e2a2bd", image: "images/products/tint-denim-light-pink.webp", paymentLink: "", soldOut: false },
      { name: "Bubblegum pink", swatch: "#dd6898", image: "images/products/tint-denim-bubblegum-pink.webp", paymentLink: "", soldOut: false },
      { name: "Hot pink", swatch: "#d04083", image: "images/products/tint-denim-hot-pink.webp", paymentLink: "", soldOut: false },
      { name: "Magenta", swatch: "#ce3b80", image: "images/products/tint-denim-magenta.webp", paymentLink: "", soldOut: false },
      { name: "Coral", swatch: "#d54059", image: "images/products/tint-denim-coral.webp", paymentLink: "", soldOut: false },
      { name: "Red", swatch: "#9e1d23", image: "images/products/tint-denim-red.webp", paymentLink: "", soldOut: false },
      { name: "Wine", swatch: "#853c47", image: "images/products/tint-denim-wine.webp", paymentLink: "", soldOut: false },
      { name: "Rust", swatch: "#b96056", image: "images/products/tint-denim-rust.webp", paymentLink: "", soldOut: false },
      { name: "Brick", swatch: "#bc6359", image: "images/products/tint-denim-brick.webp", paymentLink: "", soldOut: false },
      { name: "Mustard", swatch: "#b78246", image: "images/products/tint-denim-mustard.webp", paymentLink: "", soldOut: false },
      { name: "Khaki", swatch: "#937f67", image: "images/products/tint-denim-khaki.webp", paymentLink: "", soldOut: false },
      { name: "Olive khaki", swatch: "#9c9770", image: "images/products/tint-denim-olive-khaki.webp", paymentLink: "", soldOut: false },
      { name: "Sage", swatch: "#bbd2af", image: "images/products/tint-denim-sage.webp", paymentLink: "", soldOut: false },
      { name: "Dark green", swatch: "#3e433d", image: "images/products/tint-denim-dark-green.webp", paymentLink: "", soldOut: false },
      { name: "Coffee", swatch: "#645540", image: "images/products/tint-denim-coffee.webp", paymentLink: "", soldOut: false },
      { name: "Chocolate", swatch: "#584444", image: "images/products/tint-denim-chocolate.webp", paymentLink: "", soldOut: false },
      { name: "Purple", swatch: "#604b79", image: "images/products/tint-denim-purple.webp", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "vintage-distressed-denim",
    name: "Vintage Distressed Denim",
    tag: "Distressed",
    description: "Frayed, washed vintage dad cap with a broken-in look. Finish it with your patches.",
    price: 25,
    compareAt: 30,
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
    name: "Design Your Own Cap · Men's",
    tag: "Men's",
    description: "Men's snapbacks. Tell us your idea and we design a one-of-one look for you, pressed in under 10 minutes.",
    price: 30,
    compareAt: 35,
    size: "One size · adjustable snap",
    note: "After checkout we'll reach out to finalize your design.",
    image: "images/products/custom-black-snapback-photo.webp",
    pictureName: "Black snapback",
    colors: [
      { name: "Black snapback", swatch: "#1b1c20", image: "images/products/custom-black-snapback-photo.webp", paymentLink: "", soldOut: false },
      { name: "Olive snapback", swatch: "#4f5a2a", image: "images/products/custom-olive-snapback-photo.webp", paymentLink: "", soldOut: false },
      { name: "Woodland camo", swatch: "linear-gradient(135deg, #3d4a28 0 40%, #8a7a45 40% 70%, #1c2414 70%)", image: "images/products/camo-woodland-photo.webp", paymentLink: "", soldOut: false },
      { name: "Gray camo", swatch: "linear-gradient(135deg, #6e7270 0 35%, #d9d9d9 35% 60%, #2a2c2b 60%)", image: "images/products/camo-gray-photo.webp", paymentLink: "", soldOut: false },
    ],
  },
  {
    id: "design-your-own-beanie",
    name: "Design Your Own Beanie",
    tag: "Beanie",
    description: "A cuffed knit beanie with your own design embroidered or patched on. Warm, one-of-one, made with you.",
    price: 17,
    compareAt: 20,
    size: "One size · stretch fit",
    note: "After checkout we'll reach out to finalize your design.",
    image: "images/products/tint-beanie-black.webp", // 3D mockup tinted per color
    pictureName: "Black",
    colors: [
      { name: "Red", swatch: "#8a1020", image: "images/products/tint-beanie-red.webp", paymentLink: "", soldOut: false },
      { name: "Burgundy", swatch: "#5b0a0a", image: "images/products/tint-beanie-burgundy.webp", paymentLink: "", soldOut: false },
      { name: "Light pink", swatch: "#edd1d0", image: "images/products/tint-beanie-light-pink.webp", paymentLink: "", soldOut: false },
      { name: "Dusty pink", swatch: "#cd94ab", image: "images/products/beanie-dusty-pink-photo.webp", paymentLink: "", soldOut: false },
      { name: "Orange", swatch: "#f99136", image: "images/products/tint-beanie-orange.webp", paymentLink: "", soldOut: false },
      { name: "Mustard", swatch: "#c79b49", image: "images/products/tint-beanie-mustard.webp", paymentLink: "", soldOut: false },
      { name: "Yellow", swatch: "#fdc50e", image: "images/products/tint-beanie-yellow.webp", paymentLink: "", soldOut: false },
      { name: "Fuchsia", swatch: "#ba2f7c", image: "images/products/tint-beanie-fuchsia.webp", paymentLink: "", soldOut: false },
      { name: "Ice blue", swatch: "#bccdd5", image: "images/products/tint-beanie-ice-blue.webp", paymentLink: "", soldOut: false },
      { name: "Sky blue", swatch: "#6bb5d2", image: "images/products/tint-beanie-sky-blue.webp", paymentLink: "", soldOut: false },
      { name: "Lavender", swatch: "#a799d1", image: "images/products/tint-beanie-lavender.webp", paymentLink: "", soldOut: false },
      { name: "Mint green", swatch: "#38e490", image: "images/products/tint-beanie-mint-green.webp", paymentLink: "", soldOut: false },
      { name: "Taupe", swatch: "#7a6d5e", image: "images/products/tint-beanie-taupe.webp", paymentLink: "", soldOut: false },
      { name: "Light gray", swatch: "#babbb3", image: "images/products/tint-beanie-light-gray.webp", paymentLink: "", soldOut: false },
      { name: "Blue gray", swatch: "#8d99a9", image: "images/products/tint-beanie-blue-gray.webp", paymentLink: "", soldOut: false },
      { name: "Cornflower blue", swatch: "#5377d1", image: "images/products/tint-beanie-cornflower-blue.webp", paymentLink: "", soldOut: false },
      { name: "Black", swatch: "#151515", image: "images/products/tint-beanie-black.webp", paymentLink: "", soldOut: false },
      { name: "Navy", swatch: "#131627", image: "images/products/tint-beanie-navy.webp", paymentLink: "", soldOut: false },
      { name: "Indigo", swatch: "#282665", image: "images/products/tint-beanie-indigo.webp", paymentLink: "", soldOut: false },
      { name: "Royal blue", swatch: "#0911ae", image: "images/products/tint-beanie-royal-blue.webp", paymentLink: "", soldOut: false },
      { name: "Forest green", swatch: "#144734", image: "images/products/tint-beanie-forest-green.webp", paymentLink: "", soldOut: false },
      { name: "Olive", swatch: "#374135", image: "images/products/tint-beanie-olive.webp", paymentLink: "", soldOut: false },
      { name: "Chocolate", swatch: "#3a2f33", image: "images/products/tint-beanie-chocolate.webp", paymentLink: "", soldOut: false },
      { name: "Charcoal", swatch: "#4a4d56", image: "images/products/tint-beanie-charcoal.webp", paymentLink: "", soldOut: false },
    ],
  },
];
