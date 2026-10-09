#!/usr/bin/env python3
"""Build the showcase photos (Oct 8, 2026 rebuild) from the owner's originals.

  python3 tools/build_showcase_images.py   (run from the site folder)

Every photo is rotated by its EXIF orientation, cropped, resized and saved WITHOUT
camera/location metadata as:
  images/showcase/<slug>.jpg / .webp       (max 1600 px, full-screen viewer)
  images/showcase/<slug>-sm.jpg / .webp    (720 px wide, natural shape, collage grid)
Sources: ../client-photos/originals/IMG_xxxx.jpeg (not in this repo) or an older,
already-cleaned web photo in images/gallery/.
"""
import os, sys
import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(ROOT, "..", "client-photos", "originals")
OUT = os.path.join(ROOT, "images", "showcase")

def label_top(im):
    """Owner's flyers have the collection name written under the mannequin. Return the y
    where that text starts (we crop above it: he asked for collection names off the pictures)."""
    a = np.asarray(im).astype(int); h, w, _ = a.shape
    mx = a.max(2); sat = mx - a.min(2)
    white_bg = np.median(a[:20, :20].reshape(-1, 3), 0).mean() > 200
    txt = ((sat > 50) | (mx < 90)) if white_bg else ((sat > 60) & (mx > 90))
    rows = txt[:, int(w * .03):int(w * .97)].mean(1)
    for y in range(int(h * .7), h):
        if rows[y] > .05:
            return y
    return h

# slug: (source, crop) ; crop = "label" | (x0, y0, x1, y1) fractions | None
PHOTOS = {
    # email 1 (Oct 8, 9:03 PM): collection photos, his collection labels cropped off
    "queen-aint-easy-cap":      ("IMG_7089.jpeg", "label"),
    "queen-trucker":            ("IMG_7088.jpeg", "label"),
    "love-bus-trucker":         ("IMG_6797.jpeg", "label"),
    "peace-trucker":            ("IMG_6799.jpeg", "label"),
    "sun-moon-peace-trucker":   ("IMG_6800.jpeg", "label"),
    "love-flowers-trucker":     ("IMG_6798.jpeg", "label"),
    "husbands-tab-trucker":     ("IMG_6765.jpeg", "label"),
    "main-character-trucker":   ("IMG_6731.jpeg", "label"),
    "very-demure-trucker":      ("IMG_6733.jpeg", "label"),
    "certified-good-girl-beanie": ("IMG_7111.jpeg", (0, 0.03, 1, 0.97)),
    # email 2 (9:08 PM)
    "faith-camo-caps":          ("IMG_6906.jpeg", (0, 0.12, 1, 0.92)),
    "stay-positive-camo-caps":  ("IMG_6908.jpeg", (0, 0.2, 1, 0.8)),
    "chosen-camo-caps":         ("IMG_6905.jpeg", (0, 0.18, 1, 0.85)),
    "loved-camo-caps":          ("IMG_6909.jpeg", (0, 0.22, 1, 0.85)),
    "positive-vibes-snapbacks": ("IMG_6902.jpeg", (0, 0.2, 1, 0.75)),
    # email 3 (9:11 PM, "Pics for the gallery page")
    "expensive-and-difficult-caps": ("IMG_6924.jpeg", (0, 0.18, 1, 0.54)),  # bottom row (profanity patch) cropped off
    "booked-busy-blessed-cap":  ("IMG_6951.jpeg", (0, 0.08, 1, 0.75)),
    "certified-hustlher-cap":   ("IMG_6950.jpeg", (0, 0.2, 1, 0.82)),
    "hustler-side-cap":         ("IMG_6952.jpeg", (0, 0.18, 1, 0.8)),
    "just-the-tip-trucker":     ("IMG_6980.jpeg", (0, 0.05, 1, 0.85)),
    # earlier photos (already cleaned web copies)
    "peace-love-truckers":      ("gallery/peace-love-truckers.jpg", None),
    "beach-patch-truckers":     ("gallery/beach-patch-truckers.jpg", None),
    "no-bad-vibes-truckers":    ("gallery/no-bad-vibes-truckers.jpg", None),
    "excuse-me-trucker":        ("gallery/excuse-me-pink-trucker.jpg", None),
    "blue-collar-spoiled-trucker": ("gallery/blue-collar-spoiled-trucker.jpg", None),
    "boss-lady-omg-cap":        ("gallery/green-boss-lady.jpg", None),
    "husbands-tab-front":       ("gallery/husbands-tab-front.jpg", None),
    "i-will-trust-camo":        ("gallery/i-will-trust-camo.jpg", None),
    "faith-over-fear-camo":     ("gallery/trinity-camo-caps.jpg", None),
    "grizz-901-blue-trucker":   ("collections/the-901.jpg", (0.012, 0.07, 0.488, 0.93)),   # owner's 901 Grizz picture, two hats side by side
    "grizz-901-dark-trucker":   ("collections/the-901.jpg", (0.515, 0.075, 0.99, 0.93)),
    # Oct 9 (owner): "You can add those 7 pics" + new Black Girls Magic Collection
    "black-girl-magic-cap":     ("IMG_6965.jpeg", (0, 0.18, 1, 0.8)),
    "black-girl-magic-side":    ("IMG_6966.jpeg", (0, 0.1, 1, 0.75)),
    "black-girl-magic-camo":    ("IMG_7109.jpeg", (0, 0.08, 1, 0.8)),
    "unapologetically-pink-cap": ("IMG_6954.jpeg", (0, 0.1, 1, 0.8)),
    "black-queen-cap":          ("IMG_6937.jpeg", (0, 0.1, 1, 0.8)),
    "black-queen-side":         ("IMG_6939.jpeg", (0, 0.1, 1, 0.8)),
    "black-beautiful-blessed-trucker": ("IMG_7092.jpeg", (0.1, 0.25, 0.9, 0.82)),
    "black-beautiful-blessed-cap": ("IMG_7106.jpeg", None),
    "black-and-dope-caps":      ("IMG_6895.jpeg", (0, 0.18, 1, 0.78)),
    "black-everyday-caps":      ("IMG_6896.jpeg", (0, 0.3, 1, 0.82)),
}

def load(src):
    p = os.path.join(ORIG, src) if src.startswith("IMG_") else os.path.join(ROOT, "images", src)
    return ImageOps.exif_transpose(Image.open(p)).convert("RGB")

def save(im, base, q):
    im.save(base + ".jpg", "JPEG", quality=q, optimize=True, progressive=True)
    im.save(base + ".webp", "WEBP", quality=q - 4, method=6)

def main():
    only = set(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    for slug, (src, crop) in PHOTOS.items():
        if only and slug not in only:
            continue
        im = load(src); w, h = im.size
        if crop == "label":
            im = im.crop((0, 0, w, max(int(h * .5), label_top(im) - int(h * .015))))
        elif crop:
            im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
        big = im.copy(); big.thumbnail((1600, 1600), Image.LANCZOS)
        save(big, os.path.join(OUT, slug), 82)
        sm = im.copy(); sm.thumbnail((720, 2000), Image.LANCZOS)
        save(sm, os.path.join(OUT, slug + "-sm"), 78)
        print(f"{slug:30s} {big.size[0]}x{big.size[1]}  sm {sm.size[0]}x{sm.size[1]}")

if __name__ == "__main__":
    main()
