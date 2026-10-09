/* The Cap Bar cart: saved in this browser (localStorage), shared by every page.
   - Header cart button with a count on every page.
   - Cart drawer: change quantity, remove, subtotal (sale prices, regular prices struck through), check out.
   - Checkout sends only product + color + quantity. The admin server prices every line from its own
     database and creates one Stripe Checkout. In demo mode it answers with a demo confirmation. */
(function () {
  "use strict";
  var KEY = "capbar_cart_v1";
  var API = "https://admin.capbarexperience.com";
  var MAX_QTY = 10;
  var S = window.CAPBAR_SETTINGS || {};
  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 });

  function slug(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }
  // Same color id the admin uses (product id + "--" + color slug), for the js/products.js fallback.
  function colorId(p, c) { return c.id || (p.id + "--" + (slug(c.name) || "color")).slice(0, 70); }
  function imgOf(p, c) { return (c && c.image) || p.image || ""; }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  // ---------------------------------------------------------------- storage
  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (l) {
        return l && typeof l.productId === "string" && typeof l.variantId === "string" && Number.isInteger(l.qty) && l.qty > 0;
      }).map(function (l) { l.qty = Math.min(MAX_QTY, l.qty); return l; });
    } catch (e) { return []; }
  }
  var lines = read();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* private mode: cart lives for this page only */ }
    paint();
  }
  window.addEventListener("storage", function (e) { if (e.key === KEY) { lines = read(); paint(); } });

  function count() { return lines.reduce(function (n, l) { return n + l.qty; }, 0); }
  function find(variantId) { for (var i = 0; i < lines.length; i++) if (lines[i].variantId === variantId) return lines[i]; return null; }
  function maxFor(l) { return Math.max(1, Math.min(MAX_QTY, l.stock == null ? MAX_QTY : l.stock)); }

  // ---------------------------------------------------------------- catalog (for prices, photos, stock)
  var catalogPromise = null;
  function catalog() {
    if (catalogPromise) return catalogPromise;
    var fallback = function () { return window.CAPBAR_PRODUCTS || []; };
    catalogPromise = new Promise(function (resolve) {
      if (window.CAPBAR_CATALOG_LIVE) return resolve(window.CAPBAR_CATALOG_LIVE);
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; resolve(fallback()); } }, 4000);
      fetch(API + "/api/public/products").then(function (r) { if (!r.ok) throw new Error("api"); return r.json(); })
        .then(function (d) {
          if (done) return; done = true; clearTimeout(t);
          if (d && typeof d.demoMode === "boolean") {
            S.demoMode = d.demoMode;
            document.documentElement.classList.toggle("is-demo", !!d.demoMode);
          }
          resolve(d && d.products && d.products.length ? d.products : fallback());
        })
        .catch(function () { if (!done) { done = true; clearTimeout(t); resolve(fallback()); } });
    });
    return catalogPromise;
  }
  function locate(products, productId, variantId) {
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (p.id !== productId) continue;
      for (var j = 0; j < p.colors.length; j++) if (colorId(p, p.colors[j]) === variantId) return { p: p, c: p.colors[j] };
      return { p: p, c: null };
    }
    return null;
  }
  function snapshot(p, c) {
    return {
      productId: p.id, variantId: colorId(p, c), name: p.name, color: c.name,
      price: Number(p.price), compareAt: p.compareAt && p.compareAt > p.price ? Number(p.compareAt) : null,
      image: imgOf(p, c), swatch: c.swatch || "", stock: c.stock == null ? null : Number(c.stock),
    };
  }
  // Refresh saved lines from the current catalog (price changes, sold out, photo changes).
  function refresh() {
    return catalog().then(function (products) {
      lines.forEach(function (l) {
        var hit = locate(products, l.productId, l.variantId);
        if (!hit || !hit.c) { l.problem = "No longer available."; return; }
        var s = snapshot(hit.p, hit.c);
        l.name = s.name; l.color = s.color; l.price = s.price; l.compareAt = s.compareAt; l.image = s.image; l.swatch = s.swatch; l.stock = s.stock;
        if (hit.c.soldOut) l.problem = "Sold out.";
        else if (l.stock != null && l.qty > l.stock) l.problem = "Only " + l.stock + " left.";
        else delete l.problem;
      });
      save();
    });
  }

  // ---------------------------------------------------------------- public API
  function add(p, c, qty) {
    var s = snapshot(p, c);
    var l = find(s.variantId);
    if (l) {
      Object.keys(s).forEach(function (k) { l[k] = s[k]; });
      l.qty = Math.min(maxFor(l), l.qty + (qty || 1));
    } else {
      s.qty = Math.min(maxFor(s), qty || 1);
      lines.push(s);
      l = s;
    }
    delete l.problem;
    resetCheckout();
    save();
    announce("Added " + p.name + " (" + c.name + ") to your cart. " + count() + (count() === 1 ? " item" : " items") + " in cart.");
    open(l.variantId);
  }
  function setQty(variantId, qty) {
    var l = find(variantId); if (!l) return;
    l.qty = Math.max(1, Math.min(maxFor(l), qty));
    if (l.problem && /^Only/.test(l.problem) && l.qty <= (l.stock || 0)) delete l.problem;
    resetCheckout();
    save();
  }
  function remove(variantId) {
    var l = find(variantId);
    lines = lines.filter(function (x) { return x.variantId !== variantId; });
    resetCheckout();
    save();
    if (l) announce("Removed " + l.name + " (" + l.color + ").");
  }
  window.CapBarCart = { add: add, open: open, count: count, lines: function () { return lines.slice(); }, clear: function () { lines = []; save(); } };

  // ---------------------------------------------------------------- header buttons + live region
  var live = el("div", { class: "sr-only", role: "status", "aria-live": "polite" });
  document.body.appendChild(live);
  function announce(msg) { live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30); }

  function paintBadges() {
    var n = count();
    document.querySelectorAll("[data-cart-open]").forEach(function (b) {
      var c = b.querySelector(".cart-count");
      if (c) { c.textContent = n > 99 ? "99+" : String(n); c.hidden = n === 0; }
      b.setAttribute("aria-label", "Cart, " + n + (n === 1 ? " item" : " items"));
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cart-open]");
    if (!b) return;
    e.preventDefault();
    open();
  });

  // ---------------------------------------------------------------- drawer
  var dlg = el("dialog", { id: "cart", class: "cart-drawer", "aria-labelledby": "cart-title" });
  dlg.innerHTML =
    '<div class="cart-panel">' +
      '<div class="cart-head"><h2 id="cart-title">Your cart <span class="cart-head-count"></span></h2>' +
      '<button class="cart-x" type="button" data-close aria-label="Close cart">×</button></div>' +
      '<div class="cart-body">' +
        '<div class="cart-msg" role="alert" hidden></div>' +
        '<div class="cart-demo" hidden><p class="eyebrow">Demo checkout</p><div class="co-note">' +
          '<strong>Payments will go through your Stripe account once connected.</strong>' +
          "<p>When the store is live, this button opens Stripe's secure checkout (card, Apple Pay, Google Pay). The Cap Bar's own Stripe account receives the money and handles receipts, refunds and chargebacks.</p>" +
        '</div></div>' +
        '<ul class="cart-lines" aria-label="Items in your cart"></ul>' +
        '<div class="cart-empty" hidden><p>Your cart is empty.</p><a class="btn btn-gold" href="shop.html">Shop hats</a></div>' +
      '</div>' +
      '<div class="cart-foot">' +
        '<div class="cart-sub"><span>Subtotal</span><span class="cart-subtotal"></span></div>' +
        '<button class="btn btn-gold btn-block cart-checkout" type="button">Check out</button>' +
        '<p class="co-fine cart-fine">Secure checkout powered by Stripe · cards, Apple Pay &amp; Google Pay</p>' +
        '<button class="btn btn-ghost btn-block" type="button" data-close>Keep shopping</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(dlg);
  var listEl = dlg.querySelector(".cart-lines");
  var emptyEl = dlg.querySelector(".cart-empty");
  var footEl = dlg.querySelector(".cart-foot");
  var subEl = dlg.querySelector(".cart-subtotal");
  var headCount = dlg.querySelector(".cart-head-count");
  var msgEl = dlg.querySelector(".cart-msg");
  var demoEl = dlg.querySelector(".cart-demo");
  var coBtn = dlg.querySelector(".cart-checkout");

  function priceNode(l, unit) {
    var n = el("span", { class: "cl-money" });
    if (l.compareAt && l.compareAt > l.price) n.appendChild(el("s", { text: money.format(l.compareAt * unit) }));
    n.appendChild(el("span", { text: money.format(l.price * unit) }));
    return n;
  }

  function lineNode(l) {
    var label = l.name + ", " + l.color;
    var minus = el("button", { class: "qty-btn", type: "button", "aria-label": "Decrease quantity of " + label, text: "−" });
    var plus = el("button", { class: "qty-btn", type: "button", "aria-label": "Increase quantity of " + label, text: "+" });
    var val = el("span", { class: "qty-val", "aria-live": "polite", text: String(l.qty) });
    minus.disabled = l.qty <= 1;
    plus.disabled = l.qty >= maxFor(l);
    minus.addEventListener("click", function () { setQty(l.variantId, l.qty - 1); focusAfter(l.variantId, ".qty-btn:first-of-type"); });
    plus.addEventListener("click", function () { setQty(l.variantId, l.qty + 1); focusAfter(l.variantId, ".qty-btn:last-of-type"); });
    var rm = el("button", { class: "cl-remove", type: "button", "aria-label": "Remove " + label, text: "Remove" });
    rm.addEventListener("click", function () {
      var idx = lines.indexOf(l);
      remove(l.variantId);
      var rest = listEl.querySelectorAll(".cl-remove");
      if (rest.length) rest[Math.min(idx, rest.length - 1)].focus(); else dlg.querySelector(".cart-x").focus();
    });
    var img = el("img", { src: l.image || "images/cap-mark.png", alt: "", width: "84", height: "84", loading: "lazy" });
    var each = el("p", { class: "cl-each" }, [priceNode(l, 1), " each"]);
    var li = el("li", { class: "cart-line" + (l.problem ? " has-problem" : ""), "data-variant": l.variantId }, [
      el("div", { class: "cl-img" }, [img]),
      el("div", { class: "cl-info" }, [
        el("p", { class: "cl-name", text: l.name }),
        el("p", { class: "cl-color" }, [el("span", { class: "cl-sw", style: "--sw:" + (l.swatch || "#555"), "aria-hidden": "true" }), l.color]),
        each,
        l.problem ? el("p", { class: "cl-problem", text: l.problem }) : null,
        el("div", { class: "cl-row" }, [
          el("div", { class: "qty", role: "group", "aria-label": "Quantity of " + label }, [minus, val, plus]),
          rm,
        ]),
      ]),
      el("p", { class: "cl-total" }, [priceNode(l, l.qty)]),
    ]);
    return li;
  }
  function focusAfter(variantId, sel) {
    var li = listEl.querySelector('[data-variant="' + (window.CSS && CSS.escape ? CSS.escape(variantId) : variantId) + '"]');
    var b = li && li.querySelector(sel);
    if (b && !b.disabled) b.focus(); else if (li) { var o = li.querySelector(".qty-btn:not([disabled])"); if (o) o.focus(); }
  }

  function paint() {
    paintBadges();
    var n = count();
    headCount.textContent = n ? "(" + n + ")" : "";
    listEl.textContent = "";
    lines.forEach(function (l) { listEl.appendChild(lineNode(l)); });
    emptyEl.hidden = lines.length > 0;
    listEl.hidden = lines.length === 0;
    footEl.hidden = lines.length === 0;
    if (!lines.length) { demoEl.hidden = true; msgEl.hidden = true; }
    var sub = 0, reg = 0;
    lines.forEach(function (l) { sub += l.price * l.qty; reg += (l.compareAt && l.compareAt > l.price ? l.compareAt : l.price) * l.qty; });
    subEl.textContent = "";
    if (reg > sub + 0.001) subEl.appendChild(el("s", { text: money.format(reg) }));
    subEl.appendChild(el("strong", { text: money.format(sub) }));
    coBtn.disabled = lines.some(function (l) { return !!l.problem && !/^Only/.test(l.problem); }) || busy;
  }

  var busy = false;
  function resetCheckout() { demoEl.hidden = true; msgEl.hidden = true; coBtn.textContent = "Check out"; }

  function open(focusVariant) {
    paint();
    if (!dlg.open) {
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      document.documentElement.classList.add("cart-is-open");
    }
    if (focusVariant) {
      var li = listEl.querySelector('[data-variant="' + (window.CSS && CSS.escape ? CSS.escape(focusVariant) : focusVariant) + '"]');
      if (li) { li.scrollIntoView({ block: "nearest" }); }
    }
    refresh();
  }
  function close() { if (dlg.open) dlg.close(); }
  dlg.addEventListener("close", function () { document.documentElement.classList.remove("cart-is-open"); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-close]")) close(); });

  function showMsg(text, link) {
    msgEl.textContent = text;
    if (link) { msgEl.appendChild(document.createTextNode(" ")); msgEl.appendChild(link); }
    msgEl.hidden = false;
  }

  coBtn.addEventListener("click", function () {
    if (!lines.length || busy) return;
    busy = true; coBtn.disabled = true; coBtn.textContent = "Checking your cart…";
    msgEl.hidden = true; demoEl.hidden = true;
    var items = lines.map(function (l) { return { productId: l.productId, color: l.variantId, qty: l.qty }; });
    fetch(API + "/api/public/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, status: r.status, body: b }; }); })
      .then(function (res) {
        busy = false;
        var b = res.body || {};
        if (res.ok && b.url) { window.location.href = b.url; return; }
        if (res.ok && b.demo) {
          // Server-checked prices and quantities.
          (b.lines || []).forEach(function (sl) {
            var l = find(sl.variantId); if (!l) return;
            l.price = sl.unitPrice; l.compareAt = sl.compareAt || null; delete l.problem;
          });
          save();
          demoEl.hidden = false;
          coBtn.textContent = "Check out";
          coBtn.disabled = true;
          dlg.querySelector(".cart-body").scrollTop = 0;
          announce("Demo checkout. Your cart was checked: " + count() + " items, " + money.format(b.subtotal || 0) + ". Payments will go through your Stripe account once connected.");
          return;
        }
        (b.lines || []).forEach(function (bad) {
          (bad.indexes || [bad.index]).forEach(function (i) { if (lines[i]) lines[i].problem = bad.error; });
          var l = bad.color && find(bad.color);
          if (l) l.problem = bad.error;
        });
        save();
        coBtn.textContent = "Check out";
        showMsg(b.error || "Checkout could not be started. Please try again.");
      })
      .catch(function () {
        busy = false;
        coBtn.textContent = "Check out";
        paint();
        if (S.demoMode) { demoEl.hidden = false; coBtn.disabled = true; return; }
        var mail = el("a", { href: "mailto:" + (S.email || "") + "?subject=" + encodeURIComponent("Order from the website"), text: "Email us" });
        showMsg("Checkout could not be started. Please try again or", mail);
      });
  });

  // "Add to cart" buttons outside the shop grid (e.g. the Camo section): data-cart-add="productId" data-cart-color="Color name"
  document.querySelectorAll("[data-cart-add]").forEach(function (b) {
    catalog().then(function (products) {
      var p = products.filter(function (x) { return x.id === b.getAttribute("data-cart-add"); })[0];
      var want = (b.getAttribute("data-cart-color") || "").toLowerCase();
      var c = p && p.colors.filter(function (x) { return x.name.toLowerCase() === want || colorId(p, x) === want; })[0];
      if (!p || !c || c.soldOut) { b.hidden = true; return; }
      b.hidden = false;
      b.textContent = "Add to cart · " + money.format(p.price);
      b.setAttribute("aria-label", "Add " + p.name + ", " + c.name + " to cart, " + money.format(p.price));
      b.addEventListener("click", function () { add(p, c, 1); });
    });
  });

  paint();
  if (location.hash === "#cart") { open(); }
})();
