#!/usr/bin/env python3
"""Build images/logo.svg: round black/gold badge + the client's cap (images/cap-mark.png,
cut out of their new logo art by tools/cut_cap.py) + 'The' script + CAP BAR + tagline.
Text is converted to outlines so the SVG looks identical everywhere.
Needs: pip install fonttools pillow
"""
import base64, io, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_art import text_path, GOLD, GOLD_DARK  # font helpers

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def cap_data_uri(width=480):
    im = Image.open(os.path.join(ROOT, "images", "cap-mark.png")).convert("RGBA")
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "WEBP", quality=90, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode(), width, h

def make_logo(cap_x=170, cap_w=200, cap_y=44, the_x=50, the_y=190, the_size=84):
    uri, w, h = cap_data_uri()
    cap_h = cap_w * h / w
    c = 200
    the = text_path("script", "The", the_size, the_x, the_y)
    capbar = text_path("block", "CAP BAR", 104, c, 278, "middle", tracking=2)
    t1 = text_path("script", "It's not just a custom hat shop –", 27, c, 314, "middle")
    t2 = text_path("script", "it's an experience!", 30, c, 343, "middle")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400" role="img" aria-label="The Cap Bar logo">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f3d98b"/><stop offset=".45" stop-color="{GOLD}"/><stop offset="1" stop-color="{GOLD_DARK}"/>
    </linearGradient>
    <radialGradient id="bg" cx=".5" cy=".38" r=".7">
      <stop offset="0" stop-color="#1c1a17"/><stop offset="1" stop-color="#050505"/>
    </radialGradient>
  </defs>
  <circle cx="200" cy="200" r="198" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="187" fill="none" stroke="url(#gold)" stroke-width="3"/>
  <image x="{cap_x}" y="{cap_y}" width="{cap_w}" height="{cap_h:.1f}" href="{uri}" xlink:href="{uri}"/>
  <path d="{the}" fill="url(#gold)" stroke="#050505" stroke-width="3" paint-order="stroke"/>
  <path d="{capbar}" fill="#ffffff"/>
  <path d="{t1}" fill="url(#gold)"/>
  <path d="{t2}" fill="url(#gold)"/>
</svg>
'''
    open(os.path.join(ROOT, "images", "logo.svg"), "w").write(svg)
    print("logo.svg", len(svg) // 1024, "KB; cap box", cap_x, cap_y, cap_w, round(cap_h))

if __name__ == "__main__":
    make_logo(cap_x=152, cap_w=215, cap_y=34, the_x=34, the_y=189, the_size=78)
