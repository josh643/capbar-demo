#!/usr/bin/env python3
"""Patch / label / pattern textures used by tools/render_hats.py (Blender)."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "textures")
GF = "/usr/share/fonts/truetype/sand-box/google"
ANTON = f"{GF}/Anton/Anton-Regular.ttf"
VIBES = f"{GF}/Great Vibes/GreatVibes-Regular.ttf"
GOLD = (214, 172, 78, 255)
GOLD_HI = (240, 206, 120, 255)

def crown(draw, cx, cy, w, color, band=True):
    s = w / 820.0
    pts = [(-410, 190), (-350, -170), (-170, 40), (0, -260), (170, 40), (350, -170), (410, 190)]
    draw.polygon([(cx + x * s, cy + y * s) for x, y in pts], fill=color)
    for x, y in [(-350, -170), (0, -260), (350, -170)]:
        r = 42 * s
        draw.ellipse([cx + x * s - r, cy + y * s - r * 1.6, cx + x * s + r, cy + y * s + r * 0.4], fill=color)
    if band:
        draw.rounded_rectangle([cx - 400 * s, cy + 240 * s, cx + 400 * s, cy + 330 * s], radius=20 * s, fill=color)

def save(im, name):
    im.save(os.path.join(OUT, name)); print("wrote", name, im.size)

def main():
    os.makedirs(OUT, exist_ok=True)
    # 1. gold crown embroidery (transparent bg)
    im = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    crown(d, 512, 540, 820, GOLD); save(im, "crown.png")
    # 2. round badge patch: black, gold rings, crown, white CAP BAR
    S = 1024
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([8, 8, S - 8, S - 8], fill=(14, 14, 14, 255))
    d.ellipse([40, 40, S - 40, S - 40], outline=GOLD, width=26)
    d.ellipse([92, 92, S - 92, S - 92], outline=GOLD, width=8)
    crown(d, S / 2, 460, 380, GOLD)
    f2 = ImageFont.truetype(VIBES, 210)
    d.text((S / 2, 220), "The", font=f2, fill=GOLD, anchor="mm")
    f = ImageFont.truetype(ANTON, 168)
    d.text((S / 2, 735), "CAP BAR", font=f, fill=(248, 246, 240, 255), anchor="mm")
    save(im, "badge.png")
    # 3. monogram "logo pattern" tile (repeats): crowns + CB script + small stars
    T = 512
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fcb = ImageFont.truetype(VIBES, 150)
    for (x, y) in [(128, 128), (384, 384)]:
        crown(d, x, y, 150, GOLD)
    for (x, y) in [(384, 128), (128, 384)]:
        d.text((x, y + 10), "CB", font=fcb, fill=(244, 232, 206, 255), anchor="mm")
    for (x, y) in [(256, 0), (0, 256), (256, 256), (0, 0), (512, 256), (256, 512), (512, 0), (0, 512), (512, 512)]:
        r = 16
        d.polygon([(x, y - r), (x + 5, y - 5), (x + r, y), (x + 5, y + 5), (x, y + r), (x - 5, y + 5), (x - r, y), (x - 5, y - 5)], fill=GOLD_HI)
    save(im, "monogram.png")
    # 4. woven beanie label: black rectangle, gold border, crown + THE CAP BAR
    W, H = 1024, 560
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([6, 6, W - 6, H - 6], radius=30, fill=(16, 16, 16, 255))
    d.rounded_rectangle([30, 30, W - 30, H - 30], radius=22, outline=GOLD, width=10)
    crown(d, W / 2, 190, 260, GOLD)
    f = ImageFont.truetype(ANTON, 150)
    d.text((W / 2, 390), "THE CAP BAR", font=f, fill=(246, 242, 232, 255), anchor="mm")
    save(im, "label.png")

if __name__ == "__main__":
    main()
