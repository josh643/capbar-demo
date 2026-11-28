/* The Cap Bar online-shop launch switch.
   Leave checkoutEnabled false until Marlon is ready to sell caps online.
   Turning this on does NOT take payments by itself — see SHOP-LAUNCH.md. */
window.CAPBAR_SHOP = window.CAPBAR_SHOP || {
  checkoutEnabled: false
};
(function () {
  var on = !!(window.CAPBAR_SHOP && window.CAPBAR_SHOP.checkoutEnabled);
  document.documentElement.classList.toggle("checkout-on", on);
  document.documentElement.classList.toggle("checkout-off", !on);
})();
