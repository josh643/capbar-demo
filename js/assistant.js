/* Cap Bar assistant: a floating chat bubble (no assistant page). It only appears when the backend reports it
   is switched on and its answering seat is online; otherwise nothing is added to the page. */
(function () {
  "use strict";
  if (window.__capbarAssistant) return; window.__capbarAssistant = true;
  var KEY = "cba_chat_v1", MAX_Q = 300, MAX_KEEP = 24;
  var CHIPS = ["What are your hours?", "Tell me about the Queen Bling collection", "How do custom patch caps work?"];
  var HELLO = "Hi! I'm the Cap Bar assistant. Ask me about our hours, collections or custom patch caps. I only know what's on this website, so for prices or anything specific I'll point you to the shop.";
  var el = {}, msgs = [], busy = false, opened = false, lastFocus = null;

  fetch("/api/assistant/status", { headers: { accept: "application/json" }, cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (s) { if (s && s.enabled && s.online) init(); })
    .catch(function () {});

  function h(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  var ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.1 1 4 2.7 5.4L4 21l4.6-2.1c1.1.3 2.2.4 3.4.4 5.5 0 10-3.6 10-8s-4.5-8.3-10-8.3Zm-4 9.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.6 2-12.6 2z"/></svg>';

  function init() {
    var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/css/assistant.css"; document.head.appendChild(css);
    var b = h("button", "cba-btn"); b.type = "button"; b.id = "cba-btn"; b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-controls", "cba-panel"); b.setAttribute("aria-expanded", "false");
    b.innerHTML = ICON_CHAT + "<span>Ask Cap Bar</span>"; b.setAttribute("aria-label", "Open the Cap Bar assistant chat");
    b.addEventListener("click", function () { open(); });
    document.body.appendChild(b); el.btn = b;
    try { var s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (s && Array.isArray(s.m)) { msgs = s.m.slice(-MAX_KEEP); if (s.o) open(true); } } catch (e) {}
  }

  function build() {
    var p = h("section", "cba-panel"); p.id = "cba-panel"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Cap Bar assistant"); p.hidden = true;
    var head = h("div", "cba-head"), t = h("div", "cba-title");
    t.appendChild(h("b", null, "Cap Bar Assistant")); t.appendChild(h("span", null, "AI helper · answers come from this website"));
    var x = h("button", "cba-x", "\u00d7"); x.type = "button"; x.setAttribute("aria-label", "Close chat"); x.addEventListener("click", close);
    head.appendChild(t); head.appendChild(x);
    var log = h("div", "cba-log"); log.setAttribute("role", "log"); log.setAttribute("aria-live", "polite"); log.setAttribute("aria-label", "Conversation");
    var chips = h("div", "cba-chips");
    CHIPS.forEach(function (c) { var k = h("button", "cba-chip", c); k.type = "button"; k.addEventListener("click", function () { ask(c); }); chips.appendChild(k); });
    var form = h("form", "cba-form"); form.noValidate = true;
    var inp = h("textarea", "cba-in"); inp.rows = 1; inp.maxLength = MAX_Q; inp.placeholder = "Ask about hours, collections, custom caps\u2026"; inp.setAttribute("aria-label", "Your question");
    inp.setAttribute("enterkeyhint", "send"); inp.setAttribute("autocomplete", "off");
    var send = h("button", "cba-send"); send.type = "submit"; send.setAttribute("aria-label", "Send"); send.innerHTML = ICON_SEND;
    form.appendChild(inp); form.appendChild(send);
    var note = h("p", "cba-note", "AI assistant. It can be wrong, so check with the shop for prices and orders. Please don\u2019t share personal details. Chats are kept for up to an hour so we can answer.");
    p.appendChild(head); p.appendChild(log); p.appendChild(chips); p.appendChild(form); p.appendChild(note);
    document.body.appendChild(p);
    el.panel = p; el.log = log; el.chips = chips; el.inp = inp; el.send = send;
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = inp.value.trim(); if (v) ask(v); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : send.click(); } });
    inp.addEventListener("input", function () { inp.style.height = "auto"; inp.style.height = Math.min(inp.scrollHeight, 110) + "px"; });
    p.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); close(); } });
    if (window.visualViewport) {
      var fit = function () { if (window.innerWidth <= 600 && !p.hidden) { p.style.height = window.visualViewport.height + "px"; p.style.top = window.visualViewport.offsetTop + "px"; p.style.bottom = "auto"; } else { p.style.height = p.style.top = p.style.bottom = ""; } };
      window.visualViewport.addEventListener("resize", fit); window.visualViewport.addEventListener("scroll", fit); el.fit = fit;
    }
    if (!msgs.length) msgs = [{ r: "bot", t: HELLO }];
    msgs.forEach(render);
    scroll();
  }

  function open(quiet) {
    if (!el.panel) build();
    lastFocus = document.activeElement;
    el.panel.hidden = false; el.btn.hidden = true; el.btn.setAttribute("aria-expanded", "true"); opened = true;
    if (el.fit) el.fit();
    el.chips.hidden = msgs.some(function (m) { return m.r === "me"; });
    save(); scroll();
    if (!quiet) setTimeout(function () { el.inp.focus(); }, 30);
  }
  function close() {
    el.panel.hidden = true; el.btn.hidden = false; el.btn.setAttribute("aria-expanded", "false"); opened = false; save();
    if (el.fit) el.fit();
    try { el.btn.focus(); } catch (e) {}
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ o: opened, m: msgs.slice(-MAX_KEEP) })); } catch (e) {} }
  function scroll() { el.log.scrollTop = el.log.scrollHeight; }

  var URL_OK = /^\/[a-z0-9\-\/\.]*(#[a-z0-9\-]+)?$/;
  function render(m) {
    if (m.r === "me") { el.log.appendChild(h("div", "cba-msg cba-me", m.t)); return; }
    el.log.appendChild(h("div", "cba-msg cba-bot" + (m.e ? " cba-err" : ""), m.t));
    if (m.c && m.c.length) {
      var s = h("div", "cba-src"); s.appendChild(h("span", null, "From the site:"));
      m.c.slice(0, 3).forEach(function (c) {
        if (!URL_OK.test(c.url || "")) return;
        var a = h("a", null, c.section || c.title || "Page"); a.href = c.url; s.appendChild(a);
      });
      if (s.childNodes.length > 1) el.log.appendChild(s);
    }
  }
  function push(m) { msgs.push(m); render(m); save(); scroll(); }
  function typing() { var d = h("div", "cba-msg cba-bot cba-typing"); d.setAttribute("aria-label", "Typing"); d.innerHTML = "<i></i><i></i><i></i>"; el.log.appendChild(d); scroll(); return d; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function ask(q) {
    if (busy) return;
    q = q.slice(0, MAX_Q); busy = true; el.send.disabled = true; el.chips.hidden = true;
    el.inp.value = ""; el.inp.style.height = "";
    push({ r: "me", t: q });
    var dots = typing();
    run(q).then(function (res) { dots.remove(); push(res); }).catch(function () { dots.remove(); push({ r: "bot", e: 1, t: "Sorry, something went wrong. Please try again, or contact the shop from the Contact page." }); })
      .then(function () { busy = false; el.send.disabled = false; if (!el.panel.hidden) el.inp.focus(); });
  }
  async function run(q) {
    var r = await fetch("/api/assistant/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: q }) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok || !j.ok) return { r: "bot", e: 1, t: j.error || "Sorry, I can't answer right now. Please try again in a bit, or use the Contact page." };
    var until = Date.now() + 150000;
    while (Date.now() < until) {
      var a = await fetch("/api/assistant/answer?id=" + encodeURIComponent(j.id), { cache: "no-store" });
      var d = await a.json().catch(function () { return {}; });
      if (d.status === "done") return { r: "bot", t: d.answer, c: d.citations || [] };
      if (d.status === "failed" || d.status === "offline") return { r: "bot", e: 1, t: d.answer || "Sorry, I can't answer right now. Please try again later." };
      if (d.status === "gone" || a.status >= 400) break;
      await sleep(300);
    }
    return { r: "bot", e: 1, t: "That took too long. Please try again, or contact the shop from the Contact page." };
  }
})();
