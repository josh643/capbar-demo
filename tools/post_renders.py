"""Post-process Blender renders -> web .webp product pictures.
Darkens the backdrop with a soft vignette + gentle levels so the shots sit on a dark studio
background like the site, then saves webp (target < 200 KB).
Usage: python3 tools/post_renders.py <render_dir> <out_dir>"""
import sys, os, glob
import numpy as np
from PIL import Image

def process(src, dst, q=88):
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
    h, w, _ = im.shape
    y, x = np.mgrid[0:h, 0:w]
    # vignette centred a little left/below centre (where the hat sits)
    cx, cy = w * 0.47, h * 0.55
    r = np.sqrt(((x - cx) / (w * 0.62)) ** 2 + ((y - cy) / (h * 0.70)) ** 2)
    vig = np.clip(1.0 - 0.55 * np.clip(r - 0.35, 0, None) ** 1.4, 0.35, 1)[..., None]
    out = im * vig
    out = np.clip((out - 0.015) / 0.985, 0, 1) ** 1.12      # gentle levels: deeper blacks
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(dst, "WEBP", quality=q, method=6)
    return os.path.getsize(dst)

if __name__ == "__main__":
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src_dir, "*.png"))):
        name = os.path.splitext(os.path.basename(f))[0]
        n = process(f, os.path.join(out_dir, name + ".webp"))
        print(f"{name}.webp {n // 1024} KB")
