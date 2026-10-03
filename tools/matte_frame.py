"""Rebuild transparency for a frame exported on a flat purple background.

Pixels inside the photo windows that fade smoothly out of the purple are
treated as a glow of *any* colour: each one becomes its brightest possible
foreground colour at the lowest possible opacity (so blue sky haze, white
glows and pink halos all fade over the photos). Textured things (fur, lace,
ruffles) and anything not connected to the purple by a smooth fade stay solid.
usage: python3 tools/matte_frame.py SRC.webp frames/theme-N.png [check.png]
"""
import sys
import numpy as np
from PIL import Image

P = np.array([167, 165, 195.])
SLOTS = [(90, 64), (550, 64), (90, 634), (550, 634)]
src, out = sys.argv[1], sys.argv[2]
CAP = 0.8
C = np.asarray(Image.open(src).convert('RGB')).astype(float)
H, W, _ = C.shape
inside = np.zeros((H, W), bool)
for x, y in SLOTS:
    inside[y:y + 550, x:x + 440] = True

# minimum-alpha matte against purple: push C away from P until it hits the RGB cube
d = C - P
with np.errstate(divide='ignore', invalid='ignore'):
    tmax = np.where(d > 0, (255 - P) / d, np.where(d < 0, (0 - P) / d, np.inf))
t = np.min(tmax, axis=2)
t = np.clip(np.where(np.isfinite(t), t, 1), 1, None)
alpha = np.clip(1 / t, 0, 1)
alpha[np.linalg.norm(d, axis=2) < 4] = 0
F = np.clip(P + d * t[..., None], 0, 255)


def box(v, r=2):
    pad = np.pad(v, r, mode='edge')
    cs = np.pad(pad.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    n = 2 * r + 1
    return (cs[n:, n:] - cs[:-n, n:] - cs[n:, :-n] + cs[:-n, :-n]) / (n * n)


std = np.sqrt(np.maximum(box(alpha * alpha) - box(alpha) ** 2, 0))
smooth = inside & (std < 0.06) & (alpha < CAP)


def shift(m, dy, dx, fill=False):
    o = np.full_like(m, fill)
    ys = slice(max(dy, 0), H + min(dy, 0)); yd = slice(max(-dy, 0), H + min(-dy, 0))
    xs = slice(max(dx, 0), W + min(dx, 0)); xd = slice(max(-dx, 0), W + min(-dx, 0))
    o[ys, xs] = m[yd, xd]
    return o


# grow the glow outward from pure purple through smooth, continuous fades
glow = inside & (alpha == 0)
for _ in range(500):
    grown = glow.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        grown |= smooth & shift(glow, dy, dx) & (np.abs(alpha - shift(alpha, dy, dx, 0.0)) < 0.08)
    if (grown == glow).all():
        break
    glow = grown
# a 1px soft edge where solid objects meet the purple
near = np.zeros_like(glow)
for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
    near |= shift(glow, dy, dx)
edge = near & inside & ~glow & (alpha < 0.97)

A = np.ones((H, W))
OUT = C.copy()
sel = glow | edge
A[sel] = alpha[sel]
OUT[sel] = F[sel]
A[A < 0.03] = 0
Image.fromarray(np.dstack([OUT, A * 255]).round().clip(0, 255).astype(np.uint8), 'RGBA').save(out, optimize=True)

if len(sys.argv) > 3:
    bg = np.zeros((H, W, 3), np.uint8); bg[:] = [230, 40, 120]; bg[:, ::40] = [40, 200, 80]
    im = Image.fromarray(bg).convert('RGBA'); im.alpha_composite(Image.open(out))
    im.convert('RGB').resize((432, 540)).save(sys.argv[3])
