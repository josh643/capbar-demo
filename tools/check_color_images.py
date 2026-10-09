#!/usr/bin/env python3
"""Check every product x color picks a picture OF THAT COLOR (shop card + cart thumbnail).

Usage: python3 tools/check_color_images.py [--api https://admin.capbarexperience.com]

For each color it resolves the picture the way js/app.js and js/cart.js do:
  own picture = color.image, or the product image when the product has only one color;
  no own picture -> neutral gray product picture + swatch chip (reported as CHIP, allowed).
Then it checks:
  * the file exists (and, with --api, the API serves the same file),
  * no picture is shared by two different colors of a product,
  * the picture's dominant colors contain the swatch color (CIE76 dE <= 15 for tinted
    mockups, <= 30 for real photos), and no other swatch of that product matches 10+ dE better among that product's swatches.
Exit code 1 on any FAIL.
"""
import json, os, re, subprocess, sys, urllib.request
import numpy as np
from PIL import Image

UA = {"User-Agent": "Mozilla/5.0 (capbar color check)"}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_products():
    js = "global.window={};require(%r);console.log(JSON.stringify(window.CAPBAR_PRODUCTS))" % os.path.join(ROOT, "js/products.js")
    return json.loads(subprocess.check_output(["node", "-e", js]))

def hexes(sw):
    return re.findall(r"#[0-9a-fA-F]{6}", sw or "")

def srgb_to_lab(rgb):  # rgb 0..1, (..., 3)
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def hex_lab(h):
    return srgb_to_lab(np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]))

_cache = {}
def clusters(path, k=10):
    if path in _cache: return _cache[path]
    im = Image.open(path).convert("RGB"); im.thumbnail((160, 160))
    a = np.asarray(im, dtype=np.float64) / 255
    h, w, _ = a.shape
    a = a.reshape(-1, 3)
    lab = srgb_to_lab(a)
    rng = np.random.default_rng(1)
    cen = lab[rng.choice(len(lab), k, replace=False)]
    for _ in range(25):
        lbl = np.argmin(((lab[:, None] - cen[None]) ** 2).sum(-1), 1)
        cen = np.array([lab[lbl == i].mean(0) if (lbl == i).any() else cen[i] for i in range(k)])
    share = np.bincount(lbl, minlength=k) / len(lbl)
    _cache[path] = [(cen[i], share[i]) for i in range(k) if share[i] >= 0.05]
    return _cache[path]

def is_backdrop(lab):  # white/gray mannequin heads and walls: light and almost no color
    return lab[0] > 62 and np.hypot(lab[1], lab[2]) < 10

_px = {}
def pixels(path):
    if path not in _px:
        im = Image.open(path).convert("RGB"); im.thumbnail((200, 200))
        arr = np.asarray(im, dtype=np.float64)
        rgb = arr.reshape(-1, 3)
        # cut-out photos sit on pure black: that backdrop (and its soft edge) is not a black hat
        bg = arr.max(2) <= 12
        if bg.mean() > 0.08:
            from PIL import ImageFilter
            halo = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
            rgb = rgb[~halo.reshape(-1)]
        _px[path] = srgb_to_lab(rgb / 255)
    return _px[path]

def score(path, sw):
    """dE that the closest 4% of the picture reaches: small = a real patch of this color is in it.
    Real photos weight lightness at half (textile CMC 2:1 style) since shop lighting darkens or
    brightens a cap; tinted mockups are held to plain dE."""
    lab = pixels(path)
    if "/tint-" not in path:
        lab = lab * np.array([0.5, 1, 1])
    per = []  # a multi-color swatch (camo) must find each of its colors
    for h in hexes(sw):
        t = hex_lab(h) * (np.array([0.5, 1, 1]) if "/tint-" not in path else 1)
        d = np.linalg.norm(lab - t, axis=1)
        per.append(float(np.percentile(d, 4)))
    return float(np.mean(per)) if per else 1e9

# Two-tone hats: (product, color) -> other color names that are ALSO really on that hat, so they don't
# count as "looks more like". The own color must still be found (dE limit).
TWO_TONE = {
    # Peace trucker (owner photo IMG_6799): white front panel, royal blue bill + mesh. The white panel (and the
    # mannequin head) reads white / warm cream / shaded gray in the shop light, so the light-neutral trucker colors
    # added Oct 8 (White, Khaki, Gray) all find a patch in it. Royal blue must still be found (dE limit).
    ("custom-trucker", "Royal blue"): {"White", "Khaki", "Gray"},
}

def main():
    api = sys.argv[sys.argv.index("--api") + 1] if "--api" in sys.argv else None
    products = load_products()
    api_map = {}
    if api:
        data = json.load(urllib.request.urlopen(urllib.request.Request(api + "/api/public/products", headers=UA)))
        for p in data["products"]:
            for c in p["colors"]:
                own = c.get("image") or (len(p["colors"]) == 1 and p.get("image")) or ""
                api_map[(p["id"], c["name"])] = own
    fails = chips = ok = 0
    rows = []
    for p in products:
        used = {}
        for c in p["colors"]:
            own = c.get("image") or (p["image"] if len(p["colors"]) == 1 else "")
            status, note = "OK", ""
            if not own:
                status, note = "CHIP", "no own picture: neutral picture + swatch chip"
            else:
                f = os.path.join(ROOT, own)
                if not os.path.exists(f):
                    status, note = "FAIL", "missing file " + own
                else:
                    if own in used and used[own] != c["name"]:
                        status, note = "FAIL", "same picture as " + used[own]
                    used.setdefault(own, c["name"])
                    s_own = score(f, c["swatch"])
                    others = sorted((score(f, o["swatch"]), o["name"]) for o in p["colors"] if o["name"] != c["name"] and hexes(o["swatch"])
                                    and o["name"] not in TWO_TONE.get((p["id"], c["name"]), ()))
                    note = note or "dE %.1f" % s_own
                    limit = 15 if "/tint-" in own else 30  # tints are calibrated to the swatch; real photos vary with light
                    if s_own > limit:
                        status, note = "FAIL", "picture does not show %s (dE %.1f)" % (c["swatch"], s_own)
                    elif others and others[0][0] + 10 < s_own:
                        status, note = "FAIL", "picture looks more like %s (dE %.1f vs %.1f)" % (others[0][1], others[0][0], s_own)
                    if status == "FAIL" and "-v" in sys.argv:
                        note += "  clusters: " + ", ".join("L%.0f a%.0f b%.0f %.0f%%" % (c[0], c[1], c[2], 100 * w) for c, w in clusters(f))
            if api:
                a = api_map.get((p["id"], c["name"]))
                if a is None:
                    status, note = "FAIL", note + "; not in API"
                elif os.path.basename(a) != os.path.basename(own or ""):
                    status, note = "FAIL", note + "; API picture %s != site %s" % (os.path.basename(a) or "(none)", os.path.basename(own or "") or "(none)")
                elif a:
                    try:
                        r = urllib.request.urlopen(urllib.request.Request(a, method="HEAD", headers=UA))
                        if r.status != 200: raise Exception(r.status)
                    except Exception as e:
                        status, note = "FAIL", note + "; API media %s" % e
            rows.append((status, p["id"], c["name"], os.path.basename(own) if own else "-", note))
            fails += status == "FAIL"; chips += status == "CHIP"; ok += status == "OK"
    for r in rows:
        print("%-4s  %-26s %-16s %-36s %s" % r)
    print("\n%d combinations: %d OK (own color picture), %d CHIP (swatch chip), %d FAIL" % (len(rows), ok, chips, fails))
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
