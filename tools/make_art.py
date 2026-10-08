#!/usr/bin/env python3
"""Generate placeholder artwork for The Cap Bar demo site.

  - images/logo.svg            vector re-draw of the round Cap Bar badge (temporary until
                               the client sends the original logo file)
  - images/products/*.svg      placeholder cap illustrations (swap for real photos later)

Run:  python3 tools/make_art.py     (needs: pip install fonttools)
Fonts are read from the system Google Fonts folder (all SIL Open Font License).
"""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GF = "/usr/share/fonts/truetype/sand-box/google"
FONTS = {
    "script": f"{GF}/Great Vibes/GreatVibes-Regular.ttf",
    "block": f"{GF}/Anton/Anton-Regular.ttf",
}
_cache = {}

GOLD = "#d4af5a"
GOLD_DARK = "#a8832f"


def font(name):
    if name not in _cache:
        _cache[name] = TTFont(FONTS[name])
    return _cache[name]


def text_width(name, text, size, tracking=0):
    f = font(name)
    cmap, hmtx = f.getBestCmap(), f["hmtx"]
    upm = f["head"].unitsPerEm
    w = 0
    for ch in text:
        g = cmap.get(ord(ch))
        if g:
            w += hmtx[g][0] * size / upm + tracking
    return w - tracking


def text_path(name, text, size, x, y, anchor="start", tracking=0):
    """Return SVG path data for text (baseline at y)."""
    f = font(name)
    cmap, hmtx, gs = f.getBestCmap(), f["hmtx"], f.getGlyphSet()
    upm = f["head"].unitsPerEm
    s = size / upm
    w = text_width(name, text, size, tracking)
    if anchor == "middle":
        x -= w / 2
    elif anchor == "end":
        x -= w
    pen = SVGPathPen(gs)
    cx = x
    for ch in text:
        g = cmap.get(ord(ch))
        if not g:
            continue
        tp = TransformPen(pen, (s, 0, 0, -s, cx, y))
        gs[g].draw(tp)
        cx += hmtx[g][0] * s + tracking
    return pen.getCommands()


# ---------------------------------------------------------------- logo
def cap_outline(cx, cy, scale, stroke, color):
    """Gold line-art baseball cap (side view), centred near (cx, cy)."""
    t = lambda d: d  # paths are authored around (0,0) and placed with a transform
    return f'''<g transform="translate({cx} {cy}) scale({scale})" fill="none" stroke="{color}"
      stroke-width="{stroke / scale:.2f}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-72 26 C-74 -18 -40 -46 2 -46 C42 -46 66 -20 70 22"/>
    <path d="M-72 26 C-30 20 30 18 70 22"/>
    <path d="M58 22 C84 12 118 14 132 30 C104 38 76 36 56 32"/>
    <path d="M2 -46 C-8 -22 -10 0 -6 21"/>
    <path d="M2 -46 C26 -26 36 -4 38 19"/>
    <circle cx="2" cy="-49" r="4"/>
  </g>'''


def make_logo():
    W = 400
    c = W / 2
    the = text_path("script", "The", 92, 66, 172)
    capbar = text_path("block", "CAP BAR", 104, c, 268, "middle", tracking=2)
    t1 = text_path("script", "It's not just a custom hat shop –", 27, c, 308, "middle")
    t2 = text_path("script", "it's an experience!", 30, c, 338, "middle")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}" role="img" aria-label="The Cap Bar logo">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f3d98b"/><stop offset=".45" stop-color="{GOLD}"/><stop offset="1" stop-color="{GOLD_DARK}"/>
    </linearGradient>
    <radialGradient id="bg" cx=".5" cy=".38" r=".7">
      <stop offset="0" stop-color="#1c1a17"/><stop offset="1" stop-color="#050505"/>
    </radialGradient>
  </defs>
  <circle cx="{c}" cy="{c}" r="198" fill="url(#bg)"/>
  <circle cx="{c}" cy="{c}" r="187" fill="none" stroke="url(#gold)" stroke-width="3"/>
  {cap_outline(236, 116, 0.92, 5, "url(#gold)")}
  <path d="{the}" fill="url(#gold)"/>
  <path d="{capbar}" fill="#ffffff"/>
  <path d="{t1}" fill="url(#gold)"/>
  <path d="{t2}" fill="url(#gold)"/>
</svg>
'''
    open(os.path.join(ROOT, "images", "logo.svg"), "w").write(svg)


# ------------------------------------------------------------ products
def shade(hex_color, k):
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    if k < 0:
        r, g, b = (int(v * (1 + k)) for v in (r, g, b))
    else:
        r, g, b = (int(v + (255 - v) * k) for v in (r, g, b))
    return f"#{r:02x}{g:02x}{b:02x}"


CROWN = "M112 292 C100 158 190 78 300 78 C410 78 500 158 488 292 C420 304 180 304 112 292 Z"
BRIM = "M138 280 C210 302 390 302 462 280 C470 330 420 380 300 382 C180 380 130 330 138 280 Z"
BRIM_FLAT = "M130 284 C210 304 390 304 470 284 C474 324 430 358 300 360 C170 358 126 324 130 284 Z"


def make_cap(fname, style, front, back, brim, patch="badge", seam_color=None):
    """Front view cap. style: trucker | snapback ; colours are hex strings."""
    seam = seam_color or shade(front, -0.35)
    uid = fname.replace(".svg", "").replace("-", "")
    mesh = ""
    back_fill = back
    if style == "trucker":
        mesh = f'''<pattern id="m{uid}" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="{back}"/>
        <circle cx="5" cy="5" r="2.7" fill="{shade(back, -0.45)}"/></pattern>'''
        back_fill = f"url(#m{uid})"
    brim_d = BRIM if style == "trucker" else BRIM_FLAT
    front_clip = "M206 70 C164 130 150 220 160 310 L440 310 C450 220 436 130 394 70 Z"
    if patch == "badge":
        mini = text_path("block", "CAP BAR", 27, 0, 11, "middle", tracking=0.5)
        the = text_path("script", "The", 24, -26, -9)
        patch_svg = f'''<g transform="translate(300 196)">
        <circle r="58" fill="#0b0b0b" stroke="{GOLD}" stroke-width="3.5"/>
        <circle r="51" fill="none" stroke="{GOLD}" stroke-width="1.2"/>
        <path d="{the}" fill="{GOLD}"/><path d="{mini}" fill="#fff"/></g>'''
    elif patch == "script":
        s = text_path("script", "Cap Bar", 74, 0, 0, "middle")
        patch_svg = f'<g transform="translate(300 222) rotate(-6)"><path d="{s}" fill="{GOLD}" stroke="{shade(GOLD,-0.45)}" stroke-width=".8"/></g>'
    elif patch == "pattern":
        pts = [(232, 150), (300, 118), (368, 150), (262, 200), (338, 200), (226, 250), (300, 252), (374, 250), (300, 182)]
        star = lambda x, y, k: (f'<path transform="translate({x} {y}) scale({k})" d="M0 -14 L4 -4 15 -4 6 3 9 14 0 7 -9 14 -6 3 -15 -4 -4 -4Z" fill="{GOLD}"/>')
        patch_svg = f'<g clip-path="url(#f{uid})">' + "".join(star(x, y, 1.15 if i % 2 else .85) for i, (x, y) in enumerate(pts)) + "</g>"
    else:
        patch_svg = ""

    center_seam = "" if style == "trucker" else f'<path d="M300 80 L300 298" stroke="{seam}" stroke-width="2.5" opacity=".7"/>'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 50 520 370" role="img" aria-label="{style} cap illustration (placeholder)">
  <defs>
    {mesh}
    <clipPath id="c{uid}"><path d="{CROWN}"/></clipPath>
    <clipPath id="f{uid}"><path d="{front_clip}"/></clipPath>
    <radialGradient id="l{uid}" cx=".36" cy=".22" r=".85">
      <stop offset="0" stop-color="#fff" stop-opacity=".32"/>
      <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".45"/>
    </radialGradient>
    <linearGradient id="b{uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{shade(brim,0.10)}"/><stop offset="1" stop-color="{shade(brim,-0.32)}"/>
    </linearGradient>
    <radialGradient id="s{uid}"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="300" cy="392" rx="250" ry="22" fill="url(#s{uid})"/>
  <g clip-path="url(#c{uid})">
    <rect x="40" y="50" width="520" height="370" fill="{back_fill}"/>
    <g clip-path="url(#f{uid})"><rect x="40" y="50" width="520" height="370" fill="{front}"/></g>
    <path d="M206 70 C164 130 150 220 160 310" fill="none" stroke="{seam}" stroke-width="3"/>
    <path d="M394 70 C436 130 450 220 440 310" fill="none" stroke="{seam}" stroke-width="3"/>
    {center_seam}
    {patch_svg}
    <rect x="40" y="50" width="520" height="370" fill="url(#l{uid})"/>
  </g>
  <path d="{CROWN}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="2"/>
  <ellipse cx="300" cy="80" rx="15" ry="6" fill="{shade(front,-0.15)}" stroke="#000" stroke-opacity=".35"/>
  <path d="{brim_d}" fill="url(#b{uid})" stroke="#000" stroke-opacity=".45" stroke-width="2"/>
  <path d="{brim_d}" fill="none" stroke="{shade(brim,0.45)}" stroke-width="1.6" stroke-dasharray="7 6" opacity=".55" transform="translate(300 330) scale(.9 .8) translate(-300 -330)"/>
</svg>
'''
    open(os.path.join(ROOT, "images", "products", fname), "w").write(svg)


PINK, BLUE, BLACK, WHITE = "#e94f8a", "#2f6fd6", "#151515", "#f2f0ea"

if __name__ == "__main__":
    make_logo()
    # Custom Trucker (front colour, white mesh)
    make_cap("trucker-pink.svg", "trucker", PINK, WHITE, PINK)
    make_cap("trucker-blue.svg", "trucker", BLUE, WHITE, BLUE)
    make_cap("trucker-black.svg", "trucker", BLACK, "#2a2a2a", BLACK, seam_color="#444")
    # Snapback (solid)
    make_cap("snapback-black.svg", "snapback", BLACK, BLACK, BLACK, patch="script", seam_color="#3a3a3a")
    make_cap("snapback-pink.svg", "snapback", PINK, PINK, PINK, patch="script")
    make_cap("snapback-blue.svg", "snapback", BLUE, BLUE, BLUE, patch="script")
    # Signature (black + gold badge)
    make_cap("signature-black.svg", "snapback", BLACK, BLACK, "#0d0d0d", patch="badge", seam_color="#3a3a3a")
    # Custom design / logo pattern
    make_cap("custom-pattern-black.svg", "trucker", BLACK, "#2a2a2a", BLACK, patch="pattern", seam_color="#444")
    make_cap("custom-pattern-pink.svg", "trucker", PINK, WHITE, PINK, patch="pattern")
    make_cap("custom-pattern-blue.svg", "trucker", BLUE, WHITE, BLUE, patch="pattern")
    print("art written")
