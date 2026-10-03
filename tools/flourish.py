"""Engraved vine flourishes (the "Death of a Unicorn" kind of scrollwork).

Every stroke is a clothoid-like curve: it starts nearly straight and curls
tighter and tighter into a spiral. Branches sprout from the stems and curl the
other way, leaves and buds dot the vines, and each stroke tapers like an
engraved line. Output is SVG markup for styles.css (see lace_svgs.tokens).
"""
import math
import random


def curl(x, y, heading, length, turn, steps=34, sweep=None):
    """Points along a curve that sweeps in a gentle S, then winds into a spiral."""
    pts = [(x, y, heading)]
    ds = length / steps
    if sweep is None:
        sweep = -0.45 if turn > 0 else 0.45
    for i in range(1, steps + 1):
        s = i / steps
        heading_i = heading + turn * s ** 5 + sweep * math.sin(math.pi * s * 0.9)
        x += math.cos(heading_i) * ds
        y += math.sin(heading_i) * ds
        pts.append((x, y, heading_i))
    return pts


def ribbon(pts, w0, w1=0.25):
    """A filled, tapering outline around a centre line."""
    left, right = [], []
    n = len(pts) - 1
    for i, (x, y, h) in enumerate(pts):
        w = w0 + (w1 - w0) * (i / n)
        nx, ny = -math.sin(h), math.cos(h)
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    ring = left + right[::-1]
    return 'M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in ring) + 'Z'


def leaf(x, y, h, size):
    """A small pointed leaf (or bud) pointing along heading h."""
    tip = (x + math.cos(h) * size, y + math.sin(h) * size)
    nx, ny = -math.sin(h) * size * 0.35, math.cos(h) * size * 0.35
    mx, my = x + math.cos(h) * size * 0.45, y + math.sin(h) * size * 0.45
    return (f'M{x:.1f} {y:.1f} Q{mx + nx:.1f} {my + ny:.1f} {tip[0]:.1f} {tip[1]:.1f} '
            f'Q{mx - nx:.1f} {my - ny:.1f} {x:.1f} {y:.1f}Z')


def vine(rng, x, y, heading, length, turn, width, depth, out, sweep=None):
    pts = curl(x, y, heading, length, turn, sweep=sweep)
    out.append(ribbon(pts, width))
    ex, ey, _ = pts[-1]
    if depth <= 0:
        # a seed or little berry at the very end of the curl
        out.append(f'M{ex + 1.3:.1f} {ey:.1f}a1.3 1.3 0 1 0 -2.6 0a1.3 1.3 0 1 0 2.6 0Z')
        return
    n = len(pts)
    curl_dir = 1 if turn > 0 else -1
    for k, frac in enumerate((0.24, 0.46, 0.66)):
        i = int(n * (frac + rng.uniform(-0.04, 0.04)))
        bx, by, bh = pts[i]
        side = -curl_dir if k % 2 == 0 else curl_dir
        # branches peel away from the stem and curl the opposite way
        vine(rng, bx, by, bh + side * rng.uniform(0.6, 1.0), length * rng.uniform(0.28, 0.4),
             -side * abs(turn) * rng.uniform(0.85, 1.1), width * 0.62, depth - 1, out)
        li = min(int(n * (frac + 0.1)), n - 1)
        lx, ly, lh = pts[li]
        out.append(leaf(lx, ly, lh - side * 0.85, width * 4.4))


def svg(paths, w, h, color, extra=''):
    body = ''.join(f"<path d='{d}'/>" for d in paths)
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}'>"
            f"<g fill='{color}'>{body}{extra}</g></svg>")


def divider(color='#8d8a93', seed=7):
    """A symmetric horizontal flourish with a little blossom in the middle."""
    rng = random.Random(seed)
    half = []
    vine(rng, 192, 40, math.pi * 1.02, 160, -2.6 * math.pi, 1.6, 2, half)
    vine(rng, 192, 42, math.pi * 0.86, 70, 2.3 * math.pi, 1.1, 1, half)
    g = ''.join(f"<path d='{d}'/>" for d in half)
    blossom = ''.join(
        f"<ellipse cx='{200 + math.cos(a) * 5:.1f}' cy='{40 + math.sin(a) * 5:.1f}' rx='4.4' ry='2.5' "
        f"transform='rotate({math.degrees(a):.0f} {200 + math.cos(a) * 5:.1f} {40 + math.sin(a) * 5:.1f})'/>"
        for a in [k * math.pi * 2 / 5 - math.pi / 2 for k in range(5)])
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -15 400 110'><g fill='{color}'>"
            f"<g>{g}</g><g transform='translate(400 0) scale(-1 1)'>{g}</g>{blossom}"
            f"<circle cx='200' cy='40' r='2' fill='#f6f5f4'/></g></svg>")


def corner(color='#8d8a93', seed=3):
    """Vines growing along the top and left edges from the top-left corner."""
    rng = random.Random(seed)
    out = []
    vine(rng, 9, 12, 0.06, 175, 2.3 * math.pi, 1.7, 2, out, sweep=0.1)
    vine(rng, 12, 9, math.pi / 2 - 0.06, 175, -2.3 * math.pi, 1.7, 2, out, sweep=-0.1)
    vine(rng, 14, 14, math.pi / 4, 55, 2.2 * math.pi, 1.2, 1, out, sweep=0)
    return svg(out, 200, 200, color, "<circle cx='9' cy='9' r='4'/>")


def crest(color='#9a97a0', seed=11):
    """A wide, airy symmetric flourish that sits behind the logo."""
    rng = random.Random(seed)
    half = []
    vine(rng, 300, 96, math.pi + 0.18, 270, -2.7 * math.pi, 2.1, 2, half)
    vine(rng, 296, 104, math.pi - 0.4, 200, 2.5 * math.pi, 1.6, 2, half)
    vine(rng, 300, 92, -math.pi / 2 - 0.5, 70, -2.3 * math.pi, 1.2, 1, half)
    g = ''.join(f"<path d='{d}'/>" for d in half)
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 200'><g fill='{color}'>"
            f"<g>{g}</g><g transform='translate(600 0) scale(-1 1)'>{g}</g></g></svg>")


# ───────── calligraphy: strokes that swell and thin like a pen nib ─────────
NIB = math.radians(-35)


def bez(p0, p1, p2, p3, steps=70):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0]
        y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]
        pts.append((x, y))
    return pts


def pen(points, wmin, wmax, taper=0.12):
    """Outline a pen stroke through points: wide across the nib, hairline along it."""
    pts = []
    for i, (x, y) in enumerate(points):
        a = points[max(i - 1, 0)]
        b = points[min(i + 1, len(points) - 1)]
        h = math.atan2(b[1] - a[1], b[0] - a[0])
        pts.append((x, y, h))
    n = len(pts) - 1
    left, right = [], []
    for i, (x, y, h) in enumerate(pts):
        s = i / n
        ends = min(1, s / taper, (1 - s) / taper) if taper else 1
        w = (wmin + (wmax - wmin) * abs(math.sin(h - NIB))) * max(ends, 0.15)
        nx, ny = -math.sin(h), math.cos(h)
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    ring = left + right[::-1]
    return 'M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in ring) + 'Z'


def chain(*segs, steps=70):
    out = []
    for s in segs:
        out += bez(*s, steps=steps)
    return out


def spiral_pts(cx, cy, r0, a0, turns, direction=1, steps=120):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        r = r0 * (1 - 0.82 * t)
        a = a0 + direction * turns * 2 * math.pi * t
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


WORN = ("<filter id='worn' x='-5%' y='-5%' width='110%' height='110%'>"
        "<feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='4'/>"
        "<feDisplacementMap in='SourceGraphic' scale='2.2'/></filter>")


def swashes(color='#2a292d'):
    """Long hairline swashes that sweep across the title screen (the Keys poster)."""
    strokes = [
        chain(((-40, 520), (220, 360), (520, 300), (760, 380)),
              ((760, 380), (980, 450), (1120, 330), (1030, 250)),
              ((1030, 250), (950, 180), (820, 270), (900, 330)),
              ((900, 330), (1000, 400), (1250, 300), (1480, 190))),
        chain(((-30, 120), (180, 60), (330, 180), (230, 230)),
              ((230, 230), (130, 280), (90, 150), (260, 110)),
              ((260, 110), (520, 50), (760, 140), (960, 90))),
        chain(((520, 660), (760, 560), (1000, 620), (1180, 700)),
              ((1180, 700), (1330, 770), (1300, 640), (1480, 600))),
    ]
    paths = ''.join(f"<path d='{pen(s, .5, 4.2, .06)}'/>" for s in strokes)
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 760' preserveAspectRatio='xMidYMid slice'>"
            f"<g fill='{color}'>{paths}</g></svg>")


def bracket(color='#2a292d', flip=False):
    """A symmetric scroll bracket (the April Mae title ornament), in worn ink."""
    half = [
        chain(((300, 60), (250, 60), (130, 40), (60, 52)), steps=60) + spiral_pts(40, 66, 22, -1.2, 1.2, -1)[1:],
        chain(((300, 70), (270, 88), (200, 92), (160, 80)), steps=50) + spiral_pts(150, 64, 15, 1.0, 1.15, -1)[1:],
        chain(((300, 36), (294, 20), (304, 6), (312, 14)), steps=30),
    ]
    g = ''.join(f"<path d='{pen(s, .8, 4.6, .1)}'/>" for s in half)
    tf = " transform='translate(0 120) scale(1 -1)'" if flip else ''
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 120'><defs>{WORN}</defs>"
            f"<g fill='{color}' filter='url(#worn)'{tf}><g>{g}</g><g transform='translate(600 0) scale(-1 1)'>{g}</g>"
            f"<ellipse cx='300' cy='60' rx='9' ry='24' fill='none' stroke='{color}' stroke-width='3.2'/></g></svg>")


def key(color='#262529'):
    """An ornate skeleton key with a filigree bow, pointing down."""
    bow = (
        "<path fill-rule='evenodd' d='M60 6c16 0 24 12 20 22 12-4 26 4 26 18s-12 22-24 18c4 10-4 22-22 22S34 74 38 64c-12 4-24-4-24-18S28 24 40 28c-4-10 4-22 20-22z"
        "M60 20c-8 0-11 7-8 13l8 9 8-9c3-6 0-13-8-13zM28 46c0 7 6 9 12 7l8-7-8-7c-6-2-12 0-12 7zM92 46c0-7-6-9-12-7l-8 7 8 7c6 2 12 0 12-7zM60 72c8 0 11-7 8-13l-8-9-8 9c-3 6 0 13 8 13z'/>"
        "<circle cx='60' cy='46' r='5'/>"
    )
    shaft = ("<rect x='54' y='90' width='12' height='150' rx='3'/>"
             "<rect x='49' y='92' width='22' height='9' rx='3'/><rect x='50' y='118' width='20' height='6' rx='2'/>"
             "<rect x='50' y='214' width='20' height='6' rx='2'/>"
             "<path d='M58 128h4v80h-4z' fill='#fff' fill-opacity='.18'/>")
    bit = "<path fill-rule='evenodd' d='M66 236h34v40H66zM74 244h8v8h-8zM88 256h6v12h-6zM74 262h8v6h-8z'/>"
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 284'><g fill='{color}'>{bow}{shaft}{bit}</g></svg>")


def escutcheon(color='#262529'):
    """A baroque keyhole plate."""
    half = ("M100 4C112 4 117 16 111 25C127 20 145 33 141 51C139 61 129 66 122 64C139 66 151 81 147 99"
            "C143 113 129 117 121 112C132 122 134 139 123 149C115 156 106 156 103 151C110 165 108 183 100 198"
            "C106 206 107 220 100 232Z")
    keyhole = "M100 70a14 14 0 0 0-8 25l-5 36h26l-5-36a14 14 0 0 0-8-25z"
    swirls = (f"<g fill='none' stroke='#fff' stroke-opacity='.28' stroke-width='2.2' stroke-linecap='round'>"
              "<path d='M70 60c-14 4-16 20-4 24M130 60c14 4 16 20 4 24M74 140c-12 6-10 20 4 22M126 140c12 6 10 20-4 22M90 24c-6 6-4 14 4 16M110 24c6 6 4 14-4 16'/></g>")
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 236'><g fill='{color}'>"
            f"<path d='{half}'/><path d='{half}' transform='translate(200 0) scale(-1 1)'/></g>"
            f"<path d='{keyhole}' fill='#efeeec'/>{swirls}</svg>")


def rabbit(color='#a9a7ad'):
    """A small rabbit mid-hop, drawn as one smooth silhouette (the April Mae shadow)."""
    body = ("M14 52C10 44 16 34 28 30C40 26 56 28 66 32C70 26 76 22 82 22"
            "C80 14 82 4 87 2C91 1 92 8 90 16C92 10 96 4 100 5C104 6 102 14 96 22"
            "C104 24 110 30 110 37C110 42 106 45 100 45C96 45 92 46 90 50"
            "C88 56 84 60 80 62C86 64 92 66 94 69C95 71 92 72 88 71C80 70 72 68 64 66"
            "C56 66 48 66 40 64C34 68 26 72 20 72C16 72 15 69 18 67C22 64 26 62 28 60"
            "C22 60 16 58 14 52Z")
    return ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 80'>"
            f"<path d='{body}' fill='{color}'/>"
            "<circle cx='9' cy='46' r='6.5' fill='" + color + "'/>"
            "<circle cx='97' cy='34' r='1.8' fill='#e4e4e3' fill-opacity='.7'/></svg>")


def petal(color='#f7f6f4'):
    """A pale petal for the floating debris."""
    return ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>"
            f"<path d='M20 3C30 10 34 24 20 37 6 24 10 10 20 3z' fill='{color}' stroke='#b9b6bd' stroke-width='.9'/>"
            "<path d='M20 8v25' stroke='#cfccd2' stroke-width='.7'/></svg>")
