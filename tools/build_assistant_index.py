#!/usr/bin/env python3
"""Build assistant-index.json: the ONLY knowledge the Cap Bar assistant has.

Everything comes from the site's own pages and js/showcase-data.js. Nothing is added by hand here except
the contact fallback and the clearly marked ASSISTANT NOTES below, which restate what the site already says.
Re-run after the site content changes:  python3 tools/build_assistant_index.py
"""
import json, re, sys, html, pathlib, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
def read(p): return (ROOT / p).read_text(encoding="utf-8")
def text(s):
    s = re.sub(r"<(script|style|svg|head).*?</\1>", " ", s, flags=re.S)
    s = re.sub(r"<br\s*/?>", ", ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()
def between(s, start, end):
    i = s.index(start); j = s.index(end, i)
    return s[i:j]

index_html, contact_html, story_html = read("index.html"), read("contact.html"), read("story.html")
settings = read("js/settings.js")
email = re.search(r'email:\s*"([^"]+)"', settings).group(1)
facebook = re.search(r'facebook:\s*"([^"]+)"', settings).group(1)
d = read("js/showcase-data.js")
show = json.loads(d[d.index("{"): d.rindex("}") + 1])

chunks = []
def add(id_, url, title, section, body):
    chunks.append({"id": id_, "url": url, "title": title, "section": section, "text": re.sub(r"\s+", " ", body).strip()})

# --- Visit / location ---
loc = between(index_html, 'id="location"', "PREMIUM QUALITY")
add("visit", "/#location", "The Cap Bar", "Location and status",
    "The Cap Bar is now open at 348 South Main Street, Memphis, Tennessee 38103. " +
    "It's not just a hat shop, it's an experience! " + re.search(r'<p class="loc-lead">(.*?)</p>', loc, re.S).group(1) +
    " Directions are available through Google Maps from the Get directions button on the home page.")
hours = re.findall(r"<li><span>([^<]+)</span><span>([^<]+)</span></li>", between(index_html, 'id="hours"', "</section>"))
add("hours", "/#hours", "Store hours", "Store hours",
    "Store hours: " + "; ".join(f"{a} {b}" for a, b in hours) + ". The store is at 348 South Main Street, Memphis. "
    "These are the regular store hours listed on the website.")
add("premium", "/", "The Cap Bar", "Quality",
    text(between(index_html, '<p class="premium-kicker"', "</section>")))
add("follow", "/#follow", "Follow us", "Follow us",
    "Follow The Cap Bar on Instagram at @Capbarexperience (instagram.com/Capbarexperience) and on Facebook as The Cap Bar (" + facebook + ").")
add("contact", "/contact", "Contact", "Contact",
    f"Contact The Cap Bar by email at {email}, through The Cap Bar on Facebook, or visit the store at 348 South Main Street, Memphis, Tennessee 38103. "
    "The contact page has a message form for questions, custom designs, group or event orders, and when you open. "
    "Sending the form opens your email app with your message ready to go. No phone number is listed on the website.")
add("contact-topics", "/contact", "Contact", "Questions, custom designs, group or event orders",
    "Questions, custom designs, group or event orders: send a message and we'll get back to you. "
    "For custom hat or design ideas, group orders and event orders, use the contact page or email " + email + ".")
# --- How it works / custom caps ---
steps = re.findall(r"<h3>([^<]+)</h3><p>([^<]+)</p>", between(index_html, 'id="experience"', "GALLERY TEASER"))
lead = re.search(r'<p class="lead">(.*?)</p>', between(index_html, 'id="experience"', "<ol"), re.S).group(1)
add("custom-how", "/#experience", "The Cap Bar experience", "How custom caps work",
    "How it works at The Cap Bar. " + lead + " " + " ".join(f"Step {i+1}: {a}. {html.unescape(b)}" for i, (a, b) in enumerate(steps)))
add("custom-patches", "/#experience", "The Cap Bar experience", "Custom patch caps",
    "Custom patch caps: choose from hundreds of patches and signature designs, or bring your own idea and the team will design it with you. "
    "Cap styles to start from are trucker, snapback, distressed cap or beanie. Every logo pattern is designed by hand ahead of time, so your hat is pressed in about 10 minutes at the customization station while you wait, and you walk out wearing it. "
    "The Cap Bar designs custom hats for adults and children.")
mission = [text(p) for p in re.findall(r"<p>(.*?)</p>", between(story_html, 'class="story-body"', "story-callout"), re.S)]
add("story", "/story", "Our story", "Our mission", " ".join(mission))
add("family", "/story", "Our story", "Families and celebrations",
    "The Cap Bar welcomes everyone like family: shopping for yourself, creating matching family hats, celebrating a special occasion, or just a fun creative experience. Custom hats are for both adults and children.")
add("merch-901", "/collections#the-901", "901 Collection", "Merch coming mid-December",
    "The 901 Collection merch is coming mid-December: a varsity jacket with a wool body, leather sleeves, chenille and regular embroidery, gold snap buttons, gold and black rib, leather trim on pockets and embroidered patches. "
    "The home page features the new 901 Collection, Memphis pride.")
# --- Collections ---
names = [re.sub(r"\s*[^\w\s&.'-]+\s*$", "", c["name"]).strip() for c in show["collections"]]
add("collections-all", "/collections", "Collections", "All collections",
    "Collections at The Cap Bar: " + "; ".join(names) + ". These are a few favorites from the hundreds of patches in the store. The collections page shows photos of each; tap any photo to see it up close.")
for c, nm in zip(show["collections"], names):
    caps = "; ".join(p["caption"] for p in c["photos"])
    soon = " This collection is marked coming soon on the website." if c.get("comingSoon") else ""
    add("coll-" + c["id"], "/collections#" + c["id"], nm, nm,
        f"{nm}: {c['blurb']}{soon} Pieces shown on the website: {caps}.")
cap_alts = {}
add("gallery", "/gallery", "Gallery", "Our work",
    "The gallery shows real hats designed and pressed at The Cap Bar. Tap any photo to see it up close.")
# --- Testimonials (published on the contact page) ---
tj = read("js/testimonials.js")
quotes = re.findall(r'quote:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"', tj)
if quotes:
    add("reviews", "/contact", "What customers say", "Customer reviews",
        "What customers say (reviews published on the contact page): " + " ".join(f"\u201c{html.unescape(q).strip()}\u201d, {n}." for q, n in quotes))

out = {"built": datetime.date.today().isoformat(), "contact_email": email, "chunks": chunks}
(ROOT / "assistant-index.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"{len(chunks)} chunks, {sum(len(c['text']) for c in chunks)} chars", file=sys.stderr)
