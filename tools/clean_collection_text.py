# One-off (Oct 8, 2026): removes the baked-in collection names from the collection flyers in images/collections/
# and blurs the unreadable-now patch on the Boss Lady flyer. Already applied; the inputs were the crops in git e4de8e9.
import cv2, numpy as np
spec = {
 'boss-lady': ((490, 25, 800, 160), (230, 40, 220)),
 'good-vibes': ((490, 25, 800, 160), (120, 200, 235)),
 'love-peace': ((460, 20, 800, 150), (255, 255, 255)),
 'pretty-spoiled': ((370, 35, 805, 170), (220, 120, 220)),
 'queen-bling': ((450, 35, 790, 130), (240, 50, 150)),
}
rng = np.random.default_rng(3)
def vfill(im, m):
    out = im.astype(np.float32).copy()
    H, W = m.shape
    for x in range(W):
        col = m[:, x] > 0
        y = 0
        while y < H:
            if col[y]:
                y0 = y
                while y < H and col[y]: y += 1
                a, b = max(y0 - 3, 0), min(y + 2, H - 1)
                top = im[max(a - 2, 0):a + 1, x].astype(np.float32).mean(0)
                bot = im[b:min(b + 3, H), x].astype(np.float32).mean(0)
                if np.abs(top - bot).sum() > 90: bot = top  # run ends on a hat: continue the wall from above
                for yy in range(y0, y):
                    t = (yy - a) / max(b - a, 1)
                    out[yy, x] = top * (1 - t) + bot * t
            else:
                y += 1
    # soften horizontally inside the fill only, and add a touch of grain so it doesn't look painted
    blur = cv2.GaussianBlur(out, (3, 1), 0)
    mm = (m > 0)[..., None]
    out = np.where(mm, blur + rng.normal(0, 2.2, out.shape), out)
    return np.clip(out, 0, 255).astype(np.uint8)
for n, (box, rgb) in spec.items():
    im = cv2.imread(n + '.jpg')
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
    t = cv2.cvtColor(np.uint8([[rgb[::-1]]]), cv2.COLOR_BGR2LAB).astype(np.float32)[0, 0]
    d = np.linalg.norm(lab - t, axis=2)
    m = np.zeros(d.shape, np.uint8)
    x0, y0, x1, y1 = box
    m[y0:y1, x0:x1] = (d[y0:y1, x0:x1] < 45).astype(np.uint8) * 255
    m = cv2.dilate(m, np.ones((5, 5), np.uint8), iterations=2)
    out = vfill(im, m)
    if n == 'boss-lady':  # "Black Queen Nutrition Facts" patch on the blue cap: blur so no words are readable
        pm = np.zeros(m.shape, np.float32); cv2.rectangle(pm, (652, 168), (778, 308), 1, -1)
        pm = cv2.GaussianBlur(pm, (15, 15), 0)[..., None]
        bl = cv2.GaussianBlur(out, (0, 0), 3.2)
        out = (out * (1 - pm) + bl * pm).astype(np.uint8)
    cv2.imwrite(f'/tmp/coll/{n}.png', out)
# Queen Bling: clean the pink fringe left between the removed text and the pink cap's crown
im = cv2.imread('/tmp/coll/queen-bling.png')
lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB)
for x in range(470, 690):
    a = lab[:, x, 1].astype(int)
    hat = next((y for y in range(118, 200) if (a[y:y + 5] > 165).all()), 200)
    for y in range(110, hat):
        if a[y] > 140:
            im[y, x] = im[108, x]
cv2.imwrite('/tmp/coll/queen-bling.png', im)
