/* Shared bits for every page: demo ribbon, email/Facebook links, year, mobile menu. */
(function () {
  "use strict";
  var S = window.CAPBAR_SETTINGS || {};
  if (S.demoMode) document.documentElement.classList.add("is-demo");
  document.querySelectorAll("[data-email]").forEach(function (a) {
    a.href = "mailto:" + S.email; if (!a.textContent.trim()) a.textContent = S.email;
  });
  document.querySelectorAll("[data-facebook]").forEach(function (a) { a.href = S.facebook; });
  document.querySelectorAll("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  var btn = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    function set(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.classList.toggle("menu-open", open);
    }
    btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }
})();
