(function () {
  "use strict";
  var S = window.CAPBAR_SETTINGS || {};
  var P = window.CAPBAR_PRODUCTS || [];
  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: S.currency || "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 });

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  // ---- shop
  var grid = document.getElementById("shop-grid");
  function imgOf(p, c) { return c.image || p.image || p.colors[0].image; }
  P.forEach(function (p) {
    var state = { color: 0 };
    var many = p.colors.length > 5;
    var img = el("img", { src: imgOf(p, p.colors[0]), alt: p.name, loading: "lazy", width: "520", height: "370" });
    var colorLabel = el("span", { class: "color-name", text: p.colors[0].name });
    var pictured = el("span", { class: "card-pictured" });
    var buy = el("button", { class: "btn btn-gold btn-block", type: "button" });
    function refresh() {
      var c = p.colors[state.color];
      var src = imgOf(p, c), own = !!c.image;
      if (img.getAttribute("src") !== src) img.src = src;
      img.alt = own || !p.pictureName ? p.name + " in " + c.name : p.name + " (pictured in " + p.pictureName + ")";
      colorLabel.textContent = c.name;
      pictured.textContent = (!own && p.pictureName && c.name !== p.pictureName) ? "Pictured: " + p.pictureName : "";
      pictured.hidden = !pictured.textContent;
      buy.disabled = !!c.soldOut;
      buy.textContent = c.soldOut ? "Sold out" : "Buy now · " + money.format(p.price);
    }
    var swatches = el("div", { class: "swatches" + (many ? " swatches-many" : ""), role: "radiogroup", "aria-label": p.name + " color" });
    p.colors.forEach(function (c, i) {
      var b = el("button", {
        class: "swatch" + (i === 0 ? " is-on" : ""), type: "button", role: "radio",
        "aria-checked": i === 0 ? "true" : "false", "aria-label": c.name, title: c.name,
        style: "--sw:" + c.swatch,
        onclick: function () {
          state.color = i;
          swatches.querySelectorAll(".swatch").forEach(function (s, j) {
            s.classList.toggle("is-on", j === i); s.setAttribute("aria-checked", j === i ? "true" : "false");
          });
          refresh();
        },
      });
      swatches.appendChild(b);
    });
    buy.addEventListener("click", function () { checkout(p, p.colors[state.color]); });
    refresh();
    var optRow = many
      ? el("div", { class: "card-opts card-opts-many" }, [
          el("div", { class: "opt" }, [el("span", { class: "opt-label", text: "Color:" }), colorLabel, el("span", { class: "opt-count", text: " · " + p.colors.length + " colors" })]),
          swatches,
        ])
      : el("div", { class: "card-opts" }, [
          p.colors.length > 1 ? swatches : el("span", { class: "swatch swatch-static", style: "--sw:" + p.colors[0].swatch, "aria-hidden": "true" }),
          el("div", { class: "opt" }, [el("span", { class: "sr-only", text: "Color: " }), colorLabel]),
        ]);
    var card = el("article", { class: "card" }, [
      el("div", { class: "card-media" }, [img, p.tag ? el("span", { class: "card-tag", text: p.tag }) : null, pictured]),
      el("div", { class: "card-body" }, [
        el("div", { class: "card-head" }, [el("h3", { text: p.name }), el("p", { class: "price", text: money.format(p.price) })]),
        el("p", { class: "card-desc", text: p.description }),
        optRow,
        el("p", { class: "card-size", text: p.size || "" }),
        p.note ? el("p", { class: "card-note", text: p.note }) : null,
        buy,
      ]),
    ]);
    grid.appendChild(card);
  });

  // ---- gallery / our work (js/gallery.js)
  var G = (window.CAPBAR_GALLERY || []).filter(function (g) { return g && g.src; });
  var gGrid = document.getElementById("gallery-grid");
  var gEmpty = document.getElementById("gallery-empty");
  var lb = document.getElementById("lightbox");
  var canWebp = (function () { try { return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0; } catch (e) { return false; } })();
  function webpOf(src) { return src.replace(/\.(jpe?g|png)$/i, ".webp"); }
  if (gGrid) {
    if (!G.length) { gGrid.hidden = true; gEmpty.hidden = false; }
    G.forEach(function (g, i) {
      var tsrc = g.thumb || g.src;
      var img = el("img", { src: tsrc, alt: g.alt || "Custom hat by The Cap Bar", loading: i < 2 ? "eager" : "lazy", decoding: "async", width: "800", height: "800" });
      var pic = g.webp ? el("picture", null, [el("source", { type: "image/webp", srcset: webpOf(tsrc) }), img]) : img;
      var b = el("button", { class: "g-item" + (g.featured ? " g-featured" : ""), type: "button", "aria-label": "View photo: " + (g.alt || "Cap Bar hat") }, [
        pic,
        g.caption ? el("span", { class: "g-cap", text: g.caption }) : null,
      ]);
      b.addEventListener("click", function () { openLb(i); });
      gGrid.appendChild(b);
    });
  }
  var lbIndex = 0;
  function openLb(i) {
    lbIndex = (i + G.length) % G.length;
    var g = G[lbIndex];
    var im = document.getElementById("lb-img"); im.src = (g.webp && canWebp) ? webpOf(g.src) : g.src; im.alt = g.alt || "";
    document.getElementById("lb-cap").textContent = g.caption || "";
    if (!lb.open) { if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); }
  }
  if (lb) {
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.closest("[data-close]")) lb.close();
      else if (e.target.closest("[data-prev]")) openLb(lbIndex - 1);
      else if (e.target.closest("[data-next]")) openLb(lbIndex + 1);
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") openLb(lbIndex - 1);
      if (e.key === "ArrowRight") openLb(lbIndex + 1);
    });
  }

  // ---- checkout
  var dlg = document.getElementById("checkout");
  function checkout(p, c) {
    if (!S.demoMode && c.paymentLink) { window.location.href = c.paymentLink; return; }
    // demo mode -> demo checkout notice; live mode without a link -> "email to order"
    var live = !S.demoMode;
    dlg.querySelectorAll(".co-demo").forEach(function (n) { n.hidden = live; });
    dlg.querySelectorAll(".co-live").forEach(function (n) { n.hidden = !live; });
    document.getElementById("co-eyebrow").textContent = live ? "Order" : "Demo checkout";
    document.getElementById("co-mail").href = "mailto:" + S.email + "?subject=" + encodeURIComponent("Order: " + p.name + " (" + c.name + ")");
    document.getElementById("co-img").src = imgOf(p, c);
    document.getElementById("co-img").alt = p.name + " in " + c.name;
    document.getElementById("co-name").textContent = p.name;
    document.getElementById("co-variant").textContent = c.name + " · One size";
    document.getElementById("co-price").textContent = money.format(p.price);
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }
  dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });

  // ---- "notify me" form -> opens an email to the shop (stage 1 has no server)
  var form = document.getElementById("notify");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var who = form.querySelector("input[type=email]").value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(who)) { form.querySelector(".form-msg").textContent = "Please enter a valid email."; return; }
    var subject = encodeURIComponent("Let me know when The Cap Bar opens");
    var body = encodeURIComponent("Hi! Please let me know when your location opens.\n\nMy email: " + who);
    window.location.href = "mailto:" + S.email + "?subject=" + subject + "&body=" + body;
    form.querySelector(".form-msg").textContent = "Thanks! Your email app should open to send it.";
  });
})();
