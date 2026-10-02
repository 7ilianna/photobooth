"""Builds the lace, ribbon and ornament drawings used by styles.css as data URIs."""
import math
import urllib.parse

INK = '#cbc2b8'      # the grey that outlines white lace so it reads on bone
HOLE = '#e7e0d7'


def uri(svg):
    return 'url("data:image/svg+xml,' + urllib.parse.quote(svg, safe="/:=' ") + '")'


def hem():
    """A lace hem tile that hangs downward: eyelet band, scallop, fan and holes."""
    p = ["<svg xmlns='http://www.w3.org/2000/svg' width='48' height='46' viewBox='0 0 48 46'>"]
    p.append("<path d='M0 0H48V15H0Z' fill='#fff'/>")
    p.append(f"<path d='M0 1.5H48M0 13.5H48' stroke='{INK}' stroke-width='.8'/>")
    p.append(f"<path d='M1 15A23 23 0 0 0 47 15' fill='#fff' stroke='{INK}' stroke-width='1'/>")
    p.append(f"<path d='M7 15A17 17 0 0 0 41 15' fill='none' stroke='{HOLE}' stroke-width='.9'/>")
    for x in (6, 18, 30, 42):
        p.append(f"<circle cx='{x}' cy='7.5' r='2' fill='{HOLE}'/>")
    for x in (12, 24, 36):
        p.append(f"<path d='M{x} 4.5l2 3-2 3-2-3z' fill='{HOLE}'/>")
    for k in range(7):
        a = math.radians(25 + k * 21.7)
        x1, y1 = 24 + math.cos(a) * 5, 15 + math.sin(a) * 5
        x2, y2 = 24 + math.cos(a) * 15, 15 + math.sin(a) * 15
        p.append(f"<path d='M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}' stroke='{HOLE}' stroke-width='1.1'/>")
    for k in range(5):
        a = math.radians(30 + k * 30)
        p.append(f"<circle cx='{24 + math.cos(a) * 19.5:.1f}' cy='{15 + math.sin(a) * 19.5:.1f}' r='1.5' fill='{HOLE}'/>")
    p.append(f"<circle cx='24' cy='15' r='3' fill='#fff' stroke='{INK}' stroke-width='.8'/>")
    p.append('</svg>')
    return ''.join(p)


def net():
    """Curtain lace: a diamond net with a little flower in every cell."""
    lines = 'M0 9L9 0L18 9L27 0L36 9M0 27L9 36L18 27L27 36L36 27M0 9L9 18L0 27M18 9L9 18L18 27M18 9L27 18L18 27M36 9L27 18L36 27'
    p = ["<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>"]
    p.append(f"<path d='{lines}' fill='none' stroke='#b9afa5' stroke-opacity='.55' stroke-width='.9' transform='translate(.5 .6)'/>")
    p.append(f"<path d='{lines}' fill='none' stroke='#fff' stroke-width='.9'/>")
    for cx, cy in ((9, 18), (27, 18)):
        for k in range(5):
            a = math.radians(k * 72 - 90)
            p.append(f"<circle cx='{cx + math.cos(a) * 2.6:.1f}' cy='{cy + math.sin(a) * 2.6:.1f}' r='1.7' fill='#fff' stroke='#b9afa5' stroke-opacity='.5' stroke-width='.5'/>")
        p.append(f"<circle cx='{cx}' cy='{cy}' r='1' fill='#d8cfc5'/>")
    p.append('</svg>')
    return ''.join(p)


def frame():
    """A 72×72 lace frame for border-image (slice 24): scallops on every side, rosettes at the corners."""
    side = (f"<path d='M0 16H72V24H0Z' fill='#fff'/>"
            f"<path d='M0 16.6H72M0 23.4H72' stroke='{INK}' stroke-width='.7'/>"
            f"<path d='M24 16A12 12 0 0 1 48 16Z' fill='#fff' stroke='{INK}' stroke-width='.9'/>"
            f"<circle cx='36' cy='11.5' r='2' fill='{HOLE}'/>"
            f"<circle cx='29' cy='20' r='1.3' fill='{HOLE}'/><circle cx='43' cy='20' r='1.3' fill='{HOLE}'/>"
            f"<path d='M36 17.6l1.6 2.4-1.6 2.4-1.6-2.4z' fill='{HOLE}'/>")
    p = ["<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'>"]
    for rot in (0, 90, 180, 270):
        p.append(f"<g transform='rotate({rot} 36 36)'>{side}</g>")
    for cx, cy in ((13, 13), (59, 13), (13, 59), (59, 59)):
        for k in range(8):
            a = math.radians(k * 45)
            p.append(f"<circle cx='{cx + math.cos(a) * 7:.1f}' cy='{cy + math.sin(a) * 7:.1f}' r='4' fill='#fff' stroke='{INK}' stroke-width='.8'/>")
        p.append(f"<circle cx='{cx}' cy='{cy}' r='6.5' fill='#fff' stroke='{INK}' stroke-width='.8'/>")
        p.append(f"<circle cx='{cx}' cy='{cy}' r='2.4' fill='{HOLE}'/>")
    p.append('</svg>')
    return ''.join(p)


def bow(stroke=INK, fill='#fff'):
    return ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 44'>"
            f"<g fill='{fill}' stroke='{stroke}' stroke-width='1.3' stroke-linejoin='round'>"
            "<path d='M29 22L18 41l6-1 3 4 4-20z'/><path d='M31 22l11 19-6-1-3 4-4-20z'/>"
            "<path d='M30 20C22 6 6 4 5 14s16 14 25 6z'/><path d='M30 20C38 6 54 4 55 14s-16 14-25 6z'/>"
            "<path d='M12 13c5-2 11 1 15 6M48 13c-5-2-11 1-15 6' fill='none'/>"
            "<rect x='25.5' y='15.5' width='9' height='10' rx='3.5'/></g></svg>")


def curl():
    d = 'M4 34C12 6 24 4 28 20S44 40 56 8'
    return ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 42'>"
            f"<path d='{d}' fill='none' stroke='{INK}' stroke-width='7' stroke-linecap='round'/>"
            f"<path d='{d}' fill='none' stroke='#fff' stroke-width='5' stroke-linecap='round'/>"
            "<path d='M4 34C12 6 24 4 28 20' fill='none' stroke='#efe9e2' stroke-width='1.4' stroke-linecap='round'/></svg>")


def scrap():
    p = ["<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 26'>"]
    p.append(f"<path d='M2 2H62V12H2Z' fill='#fff' stroke='{INK}' stroke-width='.8'/>")
    for k in range(5):
        x = 2 + k * 12
        p.append(f"<path d='M{x} 12A6 6 0 0 0 {x + 12} 12' fill='#fff' stroke='{INK}' stroke-width='.8'/>")
        p.append(f"<circle cx='{x + 6}' cy='15' r='1.6' fill='{HOLE}'/>")
        p.append(f"<circle cx='{x + 6}' cy='7' r='1.8' fill='{HOLE}'/>")
    p.append('</svg>')
    return ''.join(p)


def rosette():
    p = ["<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'>"]
    for k in range(10):
        a = math.radians(k * 36)
        p.append(f"<circle cx='{22 + math.cos(a) * 14:.1f}' cy='{22 + math.sin(a) * 14:.1f}' r='6.5' fill='#fff' stroke='{INK}' stroke-width='.8'/>")
    p.append(f"<circle cx='22' cy='22' r='12' fill='#fff' stroke='{INK}' stroke-width='.8'/>")
    for k in range(6):
        a = math.radians(k * 60)
        p.append(f"<circle cx='{22 + math.cos(a) * 7:.1f}' cy='{22 + math.sin(a) * 7:.1f}' r='1.6' fill='{HOLE}'/>")
    p.append(f"<circle cx='22' cy='22' r='3' fill='#fff' stroke='{INK}' stroke-width='.8'/></svg>")
    return ''.join(p)


def damask():
    """A faint lace-paper pattern for the page background."""
    return ("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>"
            "<g fill='none' stroke='#8e8478' stroke-opacity='.09' stroke-width='1'>"
            "<path d='M60 22c-10 10-10 22 0 30 10-8 10-20 0-30zM60 52c-14-6-26 0-28 12 12 2 24-2 28-12zM60 52c14-6 26 0 28 12-12 2-24-2-28-12z'/>"
            "<circle cx='60' cy='60' r='26'/><circle cx='60' cy='60' r='30' stroke-dasharray='2 4'/>"
            "<path d='M0 0l8 8M120 0l-8 8M0 120l8-8M120 120l-8-8'/></g>"
            "<g fill='#8e8478' fill-opacity='.08'><circle cx='0' cy='60' r='3'/><circle cx='120' cy='60' r='3'/><circle cx='60' cy='0' r='3'/><circle cx='60' cy='120' r='3'/></g></svg>")


def quilt():
    return ("<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 34 34'>"
            "<path d='M0 0L34 34M34 0L0 34' stroke='#cfc6bb' stroke-width='.8'/>"
            "<circle cx='17' cy='17' r='1.8' fill='#fff' stroke='#c2b8ad' stroke-width='.6'/>"
            "<circle cx='0' cy='0' r='1.8' fill='#fff' stroke='#c2b8ad' stroke-width='.6'/><circle cx='34' cy='0' r='1.8' fill='#fff' stroke='#c2b8ad' stroke-width='.6'/>"
            "<circle cx='0' cy='34' r='1.8' fill='#fff' stroke='#c2b8ad' stroke-width='.6'/><circle cx='34' cy='34' r='1.8' fill='#fff' stroke='#c2b8ad' stroke-width='.6'/></svg>")


def lock():
    return ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 50'>"
            "<g fill='none' stroke='#9a9298' stroke-width='2.4'><path d='M11 22v-7a9 9 0 0 1 18 0v7'/></g>"
            "<path d='M20 48c-9-6-15-11-15-18 0-5 4-9 8-9 3 0 6 2 7 5 1-3 4-5 7-5 4 0 8 4 8 9 0 7-6 12-15 18z' fill='#e9e6e9' stroke='#9a9298' stroke-width='1.4'/>"
            "<circle cx='20' cy='31' r='2.6' fill='#9a9298'/><path d='M20 33v6' stroke='#9a9298' stroke-width='2'/></svg>")


FILIGREE = [
    'M6 6C30 4 52 8 64 18C72 25 70 36 61 36C54 36 52 28 58 26',
    'M6 6C4 30 8 52 18 64C25 72 36 70 36 61C36 54 28 52 26 58',
    'M10 10C22 26 30 32 40 30C46 29 46 22 41 22',
    'M64 18C76 10 88 10 94 14',
    'M18 64C10 76 10 88 14 94',
    'M30 8C34 14 40 15 44 12',
    'M8 30C14 34 15 40 12 44',
]


def filigree(tf, color='#a39ba1'):
    dots = [(6, 6, 4), (94, 14, 2.4), (14, 94, 2.4), (58, 26, 2), (26, 58, 2), (41, 22, 1.8)]
    g = ''.join(f"<path d='{d}'/>" for d in FILIGREE)
    c = ''.join(f"<circle cx='{x}' cy='{y}' r='{r}' stroke='none'/>" for x, y, r in dots)
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='{tf}' fill='none' stroke='{color}' "
            f"stroke-width='2.4' stroke-linecap='round'><g fill='{color}'>{c}</g>{g}</g></svg>")


def ornament_files():
    """Larger drawings, saved as their own SVG files under assets/ornaments/."""
    import flourish as fl
    corner = fl.corner('#8d8a93')
    inner = corner[corner.index('>') + 1:corner.rindex('</svg>')]

    def turned(tf):
        return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><g transform='{tf}'>{inner}</g></svg>"
    return {
        'FL_TL': ('corner-tl.svg', corner),
        'FL_TR': ('corner-tr.svg', turned('translate(200 0) scale(-1 1)')),
        'FL_BL': ('corner-bl.svg', turned('translate(0 200) scale(1 -1)')),
        'FL_BR': ('corner-br.svg', turned('translate(200 200) scale(-1 -1)')),
        'FL_DIVIDER': ('divider.svg', fl.divider('#8d8a93')),
        'SWASHES': ('swashes.svg', fl.swashes('#2a292d')),
        'BRACKET': ('bracket.svg', fl.bracket('#2a292d')),
        'BRACKET_UNDER': ('bracket-under.svg', fl.bracket('#2a292d', flip=True)),
        'BRACKET_SOFT': ('bracket-soft.svg', fl.bracket('#6d6a72')),
        'BRACKET_SOFT_UNDER': ('bracket-soft-under.svg', fl.bracket('#6d6a72', flip=True)),
        'KEY': ('key.svg', fl.key('#262529')),
        'PLATE': ('keyhole-plate.svg', fl.escutcheon('#262529')),
        'RABBIT': ('rabbit.svg', fl.rabbit('#141316')),
        'PETAL': ('petal.svg', fl.petal()),
    }


def tokens():
    return {
        'LACE_HEM': uri(hem()),
        'LACE_NET': uri(net()),
        'LACE_FRAME': uri(frame()),
        'BOW': uri(bow()),
        'BOW_DARK': uri(bow('#8f878d', '#fbf9f6')),
        'CURL': uri(curl()),
        'SCRAP': uri(scrap()),
        'ROSETTE': uri(rosette()),
        'DAMASK': uri(damask()),
        'QUILT': uri(quilt()),
        'LOCK': uri(lock()),
        'FIL_TL': uri(filigree('')),
        'FIL_TR': uri(filigree('translate(100 0) scale(-1 1)')),
        'FIL_BL': uri(filigree('translate(0 100) scale(1 -1)')),
        'FIL_BR': uri(filigree('translate(100 100) scale(-1 -1)')),
    }
