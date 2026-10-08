(function () {
  "use strict";
  var S = window.CAPBAR_SETTINGS || {};
  var T = (window.CAPBAR_TESTIMONIALS || []).filter(function (t) { return t && t.quote; });

  // ---- testimonials
  var grid = document.getElementById("reviews-grid");
  var empty = document.getElementById("reviews-empty");
  if (!T.length) { grid.hidden = true; empty.hidden = false; }
  T.forEach(function (t) {
    var fig = document.createElement("figure"); fig.className = "review";
    var q = document.createElement("blockquote"); q.textContent = t.quote;
    var c = document.createElement("figcaption");
    var n = document.createElement("strong"); n.textContent = t.name || "Cap Bar customer";
    c.appendChild(n);
    if (t.detail) { var d = document.createElement("span"); d.textContent = t.detail; c.appendChild(d); }
    fig.appendChild(q); fig.appendChild(c); grid.appendChild(fig);
  });
  var share = document.getElementById("share-exp");
  if (share) share.href = "mailto:" + S.email + "?subject=" + encodeURIComponent("My Cap Bar experience") +
    "&body=" + encodeURIComponent("Hi Cap Bar!\n\nHere's how my experience went:\n\n\nOK to share this on your website? (yes/no)\nName to show:\n");

  // ---- contact form -> email (no server in stage 1)
  var f = document.getElementById("contact-form");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = f.name.value.trim(), email = f.email.value.trim(), topic = f.topic.value, msg = f.message.value.trim();
    var out = f.querySelector(".form-msg");
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !msg) {
      out.textContent = "Please add your name, a valid email and a message."; return;
    }
    var subject = topic + " from " + name;
    var body = msg + "\n\n— " + name + "\n" + email;
    window.location.href = "mailto:" + S.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    out.textContent = "Thanks! Your email app should open with the message ready to send.";
  });
})();
