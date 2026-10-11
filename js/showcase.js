/* Showcase pages: collection tiles (home), collection sections (collections.html),
   photo collage (gallery.html + home teaser) and a shared full-screen photo viewer. */
(function () {
  "use strict";
  var D = window.CAPBAR_SHOWCASE || { collections: [], gallery: [] };
  var BASE = "images/showcase/";
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] == null) return;
      if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function pic(p, eager) {
    return el("picture", null, [
      el("source", { type: "image/webp", srcset: BASE + p.id + "-sm.webp" }),
      el("img", { src: BASE + p.id + "-sm.jpg", alt: p.alt, width: p.w, height: p.h, loading: eager ? "eager" : "lazy", decoding: "async" }),
    ]);
  }

  // ---- viewer
  var lb = document.getElementById("lightbox"), group = [], at = 0;
  var canWebp = (function () { try { return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0; } catch (e) { return false; } })();
  function show(i) {
    at = (i + group.length) % group.length;
    var p = group[at], im = document.getElementById("lb-img");
    im.src = BASE + p.id + (canWebp ? ".webp" : ".jpg"); im.alt = p.alt;
    document.getElementById("lb-cap").textContent = p.caption + (group.length > 1 ? "  ·  " + (at + 1) + " / " + group.length : "");
    if (!lb.open) { if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); }
  }
  function open(list, i) { if (!lb) return; group = list; show(i); }
  if (lb) {
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.closest("[data-close]")) lb.close();
      else if (e.target.closest("[data-prev]")) show(at - 1);
      else if (e.target.closest("[data-next]")) show(at + 1);
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
    });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
    });
  }

  // ---- masonry collage of photo buttons
  function collage(node, list, eagerCount) {
    list.forEach(function (p, i) {
      var b = el("button", { class: "collage-item", type: "button", "aria-label": "View photo: " + p.caption }, [
        pic(p, i < (eagerCount || 0)), el("span", { class: "collage-cap", text: p.caption }),
      ]);
      b.addEventListener("click", function () { open(list, i); });
      node.appendChild(b);
    });
  }
  var g = document.getElementById("collage");
  if (g) {
    var lim = parseInt(g.getAttribute("data-limit"), 10);
    collage(g, lim > 0 ? D.gallery.slice(0, lim) : D.gallery, 4);
  }

  // ---- home: one tile per collection
  var tiles = document.getElementById("coll-tiles");
  if (tiles) D.collections.forEach(function (c) {
    var p = c.photos[0];
    tiles.appendChild(el("a", { class: "coll-tile", href: "collections.html#" + c.id }, [
      el("span", { class: "coll-tile-img" }, [pic(p)]),
      el("span", { class: "coll-tile-body" }, [
        el("strong", { text: c.name }),
        el("small", { text: c.comingSoon ? "Coming soon" : c.photos.length + (c.photos.length === 1 ? " photo" : " photos") }),
      ]),
    ]));
  });

  // ---- collections page: a section per collection
  var cl = document.getElementById("collections-list");
  if (cl) {
    var nav = document.getElementById("coll-jump");
    D.collections.forEach(function (c, ci) {
      if (nav) nav.appendChild(el("a", { href: "#" + c.id, text: c.name + (c.comingSoon ? " (Coming soon)" : "") }));
      var grid = el("div", { class: "collage collage-coll" + (c.photos.length < 3 ? " collage-few" : "") });
      collage(grid, c.photos, ci === 0 ? 2 : 0);
      cl.appendChild(el("section", { id: c.id, class: "coll-section", "aria-labelledby": c.id + "-t" }, [
        el("div", { class: "section-head" }, [
          el("p", { class: "eyebrow", text: "Collection" }),
          el("h2", { id: c.id + "-t", text: c.name }),
          c.comingSoon ? el("p", { class: "collection-status", text: "Coming soon" }) : null,
          el("p", { class: "lead", text: c.blurb }),
        ]),
        grid,
      ]));
    });
  }
})();
