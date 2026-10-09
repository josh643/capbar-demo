"""Per-color product images from one 3D mockup (Oct 8).

The Blender mockups (tools/render_hats.py) are rendered twice with the same lights and camera:
  W = fabric albedo #a0a0a0, K = fabric albedo black (patch, seams and backdrop identical).
Rendered light is close to linear in the fabric albedo, so a hat in color C is
  out = K + (C / a_W) * (W - K)        (in linear RGB)
which leaves the backdrop, patch and stitching untouched. Each color is then calibrated: the lit
fabric's measured color is compared with the swatch and C is corrected until they match (Delta E).

  python3 tools/tint_colors.py RENDER_DIR OUT_DIR   ->  OUT_DIR/tint-<mockup>-<color>.webp + report
"""
import json, math, re, subprocess, sys
import numpy as np
from PIL import Image

RD, OUT = sys.argv[1], sys.argv[2]
A_W = 0.3515  # linear value of #a0a0a0

def slug(s): return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", s.lower()))[:60]
def to_lin(x): return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)
def to_srgb(x):
    x = np.clip(x, 0, 1); return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)
def hex_lin(h): return to_lin(np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]))
def lab(lin):
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = M @ lin / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])
def de(a, b): return float(np.linalg.norm(lab(a) - lab(b)))  # CIE76

def load(name): return to_lin(np.asarray(Image.open(f"{RD}/{name}.png").convert("RGB"), dtype=np.float64) / 255)

def body_color(img, mask, lit):
    px = img[mask & lit]
    return px.mean(axis=0)

products = json.loads(subprocess.run(["node", "-e",
    'const window={};eval(require("fs").readFileSync("js/products.js","utf8"));console.log(JSON.stringify(window.CAPBAR_PRODUCTS))'],
    capture_output=True, text=True, check=True).stdout)
JOBS = {"ladies-denim": "denim", "design-your-own-beanie": "beanie"}
report = []
for p in products:
    mock = JOBS.get(p["id"])
    if not mock: continue
    W, K = load(mock + "-W"), load(mock + "-K")
    diff = (W - K).mean(axis=2)
    mask = diff > 0.02                      # fabric pixels (respond to albedo)
    wl = W.mean(axis=2)
    lo, hi = np.percentile(wl[mask], [55, 92])
    lit = (wl >= lo) & (wl <= hi)           # well-lit fabric, no deep shadow or specular
    ref = body_color(W, mask, lit) / A_W     # how bright lit fabric renders per unit albedo
    for c in p["colors"]:
        if c.get("image") and "-photo" in c["image"]: continue   # real photo of this color
        target = hex_lin(c["swatch"])
        # Fabric sheen and denim wash add a little light that does not depend on the albedo (it is in K).
        # Dark or very saturated colors need less of it, so K is scaled down on the fabric only (kf).
        m = np.clip((diff - 0.01) / 0.06, 0, 1)[:, :, None]
        kf = 1.0
        C = target / ref
        for _ in range(12):
            Kf = K * (1 - m * (1 - kf))
            out = Kf + (C / A_W)[None, None, :] * (W - K)
            got = body_color(out, mask, lit)
            floor = body_color(Kf, mask, lit)
            C = np.clip(C * np.where(got > 1e-5, target / np.maximum(got, 1e-5), 1.0), 0, 3)
            need = np.min(target / np.maximum(floor, 1e-5))
            if need < 1.25: kf = float(np.clip(kf * max(need / 1.25, 0.5), 0.05, 1.0))
        Kf = K * (1 - m * (1 - kf))
        out = Kf + (C / A_W)[None, None, :] * (W - K)
        got = body_color(np.clip(out, 0, 1), mask, lit)
        name = f"tint-{mock}-{slug(c['name'])}.webp"
        Image.fromarray((to_srgb(out) * 255 + 0.5).astype(np.uint8)).save(f"{OUT}/{name}", quality=84, method=6)
        report.append(dict(product=p["id"], color=c["name"], swatch=c["swatch"], image="images/products/" + name, deltaE=round(de(got, target), 2), sheen=round(kf, 2)))
json.dump(report, open(f"{OUT}/../../tools/tint_report.json" if False else "/tmp/tint_report.json", "w"), indent=1)
for r in report: print(f'{r["product"]:24} {r["color"]:16} {r["swatch"]}  dE={r["deltaE"]:5.2f} k={r["sheen"]:.2f}  {r["image"]}')
