/* Layouts, frames and the strip renderer. */
window.KB = window.KB || {};

(function (KB) {
  const TAU = Math.PI * 2;
  const { pearl, drawSticker, heartPath } = KB;

  const LAYOUTS = {
    strip4: { name: 'Classic Strip', jp: '定番', count: 4, desc: 'four poses, one tall strip' },
    strip3: { name: 'Trio', jp: '三枚', count: 3, desc: 'three poses, a little shorter' },
    duo: { name: 'Duo', jp: '二人', count: 2, desc: 'two big frames for besties' },
    grid4: { name: 'Postcard', jp: '絵葉書', count: 4, desc: 'a 2×2 grid, like an old album page' },
  };

  // Slots are 4:3. All units are canvas pixels at scale 1.
  function stack(W, n, pw, top, gap, k) {
    const ph = Math.round(pw * 3 / 4);
    const x = (W - pw) / 2;
    const slots = [];
    for (let i = 0; i < n; i++) slots.push({ x, y: top + i * (ph + gap), w: pw, h: ph });
    const footerY = top + n * ph + (n - 1) * gap;
    const footer = Math.round(250 * k);
    return { w: W, h: footerY + footer, k, top, slots, footerY };
  }

  function grid(W, pw, colGap, rowGap, top, k) {
    const ph = Math.round(pw * 3 / 4);
    const x0 = (W - 2 * pw - colGap) / 2;
    const slots = [];
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++)
        slots.push({ x: x0 + c * (pw + colGap), y: top + r * (ph + rowGap), w: pw, h: ph });
    const footerY = top + 2 * ph + rowGap;
    return { w: W, h: footerY + Math.round(230 * k), k, top, slots, footerY };
  }

  const GEOMETRY = {
    strip4: () => stack(640, 4, 528, 92, 30, 1),
    strip3: () => stack(640, 3, 528, 92, 30, 1),
    duo: () => stack(760, 2, 640, 100, 34, 1.12),
    grid4: () => grid(1240, 528, 40, 40, 100, 1.3),
  };
  const geometry = (id) => (GEOMETRY[id] || GEOMETRY.strip4)();

  const FRAMES = {
    kuro: {
      name: 'Kuro', jp: '黒ロリ',
      bg: '#0b0a0c', pattern: 'damask', pc: 'rgba(240,236,240,.06)',
      lace: '#f4f0ee', text: '#f4f0ee', sub: '#b9b0bd', line: '#f4f0ee',
      bow: '#0b0a0c', bowEdge: '#f4f0ee', photoFiligree: '#f4f0ee',
      garland: true, pearlFrame: false,
      slotA: '#2a2830', slotB: '#121115',
    },
    shiro: {
      name: 'Shiro', jp: '白ロリ',
      bg: '#f7f4f1', pattern: 'dots', pc: 'rgba(20,16,20,.07)',
      lace: '#141014', text: '#141014', sub: '#6f6670', line: '#141014',
      bow: '#141014', bowEdge: '#f7f4f1', cornerFiligree: '#141014',
      garland: true, pearlFrame: true,
      slotA: '#e6e1e4', slotB: '#cfc8cd',
    },
    lilac: {
      name: 'Lilac Rose', jp: '薄紫の薔薇',
      bg: '#c9b8d6', pattern: 'stripes', pc: 'rgba(255,255,255,.2)',
      lace: '#1a1420', text: '#1a1420', sub: '#4e3d5e', line: '#1a1420',
      bow: '#1a1420', bowEdge: '#e9e1f0', cornerFiligree: '#ffffff',
      garland: false, pearlFrame: true,
      slotA: '#e2d8ea', slotB: '#a996ba',
    },
    requiem: {
      name: 'Requiem', jp: '鎮魂歌',
      bg: '#09080a', pattern: 'crosses', pc: 'rgba(220,215,225,.07)',
      lace: '#e9e6ec', text: '#ece8ef', sub: '#a39fab', line: '#c9c4cf',
      bow: '#09080a', bowEdge: '#e9e6ec', topper: 'cross', crossEdge: '#c9c4cf',
      arch: true, garland: true, pearlFrame: false,
      slotA: '#24222a', slotB: '#0e0d11',
    },
    shortcake: {
      name: 'Strawberry Shortcake', jp: 'ショートケーキ',
      bg: '#f4cdd5', pattern: 'gingham', pc: 'rgba(255,255,255,.45)',
      lace: '#ffffff', text: '#7a1f3a', sub: '#a8566e', line: '#ffffff',
      bow: '#ffffff', bowEdge: '#7a1f3a', photoFiligree: '#ffffff',
      garland: false, pearlFrame: false,
      slotA: '#fbe3e8', slotB: '#eeb4c1',
    },
    library: {
      name: 'Old Library', jp: '図書館',
      bg: '#1b130f', pattern: 'stripes', pc: 'rgba(0,0,0,.28)',
      lace: '#e8dcc4', text: '#e8dcc4', sub: '#c2a368', line: '#c2a368',
      bow: '#1b130f', bowEdge: '#c2a368', cornerFiligree: '#c2a368',
      garland: true, pearlFrame: false,
      slotA: '#3a2a20', slotB: '#160f0b',
    },
    vampire: {
      name: 'Vampire Tea Party', jp: '吸血鬼のお茶会',
      bg: '#12030a', pattern: 'damask', pc: 'rgba(181,29,54,.16)',
      lace: '#8e1428', text: '#f3dfe2', sub: '#e09aa6', line: '#b51d36',
      bow: '#8e1428', bowEdge: '#f3dfe2', topper: 'bat',
      arch: true, garland: true, pearlFrame: false,
      slotA: '#3a0a16', slotB: '#12030a',
    },
  };


  /* ───────── backgrounds ───────── */
  function drawPattern(c, f, W, H) {
    c.fillStyle = f.bg;
    c.fillRect(0, 0, W, H);
    c.fillStyle = f.pc;
    switch (f.pattern) {
      case 'dots':
        for (let y = 14, row = 0; y < H; y += 28, row++)
          for (let x = row % 2 ? 28 : 14; x < W; x += 28) {
            c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
          }
        break;
      case 'gingham':
        for (let x = 0; x < W; x += 32) c.fillRect(x, 0, 16, H);
        for (let y = 0; y < H; y += 32) c.fillRect(0, y, W, 16);
        break;
      case 'checker':
        for (let y = 0, j = 0; y < H; y += 26, j++)
          for (let x = 0, i = 0; x < W; x += 26, i++)
            if ((i + j) % 2) c.fillRect(x, y, 26, 26);
        break;
      case 'stripes':
        for (let x = 0; x < W; x += 26) c.fillRect(x, 0, 11, H);
        break;
      case 'crosses':
        for (let y = 30, row = 0; y < H; y += 52, row++)
          for (let x = row % 2 ? 52 : 26; x < W + 26; x += 52) {
            c.fillRect(x - 1.5, y - 10, 3, 20);
            c.fillRect(x - 7, y - 4.5, 14, 3);
          }
        break;
      case 'damask':
        for (let y = 30, row = 0; y < H; y += 60, row++)
          for (let x = row % 2 ? 60 : 30; x < W + 30; x += 60) {
            c.beginPath();
            c.moveTo(x, y - 13); c.lineTo(x + 8, y); c.lineTo(x, y + 13); c.lineTo(x - 8, y);
            c.closePath(); c.fill();
            for (const [dx, dy] of [[0, -20], [0, 20], [-15, 0], [15, 0]]) {
              c.beginPath(); c.arc(x + dx, y + dy, 2.2, 0, TAU); c.fill();
            }
          }
        break;
    }
  }

  /* ───────── lace edge ───────── */
  function laceEdge(c, f, L) {
    const band = 14;
    const target = 22;
    const n = Math.max(1, Math.round(L / target));
    const step = L / n;
    const r = step / 2;
    c.fillStyle = f.lace;
    c.fillRect(0, -band, L, band);
    for (let i = 0; i < n; i++) {
      const cx = step * (i + 0.5);
      c.beginPath(); c.arc(cx, 0, r, 0, Math.PI); c.fill();
    }
    c.fillStyle = f.bg;
    for (let i = 0; i < n; i++) {
      const cx = step * (i + 0.5);
      c.beginPath(); c.arc(cx, r * 0.42, r * 0.26, 0, TAU); c.fill();
      c.beginPath(); c.arc(cx + r, -band * 0.45, 2.2, 0, TAU); c.fill();
      c.beginPath(); c.arc(cx, -band * 0.45, 1.4, 0, TAU); c.fill();
    }
  }

  function drawLace(c, f, W, H) {
    const b = 14;
    const edges = [
      [0, b, 0, W],
      [W, H - b, Math.PI, W],
      [b, H, -Math.PI / 2, H],
      [W - b, 0, Math.PI / 2, H],
    ];
    for (const [x, y, rot, len] of edges) {
      c.save(); c.translate(x, y); c.rotate(rot);
      laceEdge(c, f, len);
      c.restore();
    }
    // little rosettes over the corners
    for (const [x, y] of [[b, b], [W - b, b], [b, H - b], [W - b, H - b]]) {
      c.fillStyle = f.lace;
      c.beginPath(); c.arc(x, y, 15, 0, TAU); c.fill();
      c.fillStyle = f.bg;
      c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill();
      pearl(c, x, y, 6.5);
    }
  }

  /* ───────── pearls ───────── */
  function pearlLine(c, x1, y1, x2, y2, r) {
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(d / (r * 2.15)));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pearl(c, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r);
    }
  }

  function pearlRect(c, x, y, w, h, r) {
    pearlLine(c, x, y, x + w, y, r);
    pearlLine(c, x + w, y, x + w, y + h, r);
    pearlLine(c, x, y + h, x + w, y + h, r);
    pearlLine(c, x, y, x, y + h, r);
    for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) pearl(c, px, py, r * 1.5);
  }

  // Pearls spaced evenly along a quadratic swag.
  function pearlSwag(c, x1, x2, y, depth, r) {
    const cx = (x1 + x2) / 2, cy = y + depth * 2;
    const pt = (t) => {
      const u = 1 - t;
      return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y + 2 * u * t * cy + t * t * y];
    };
    const spacing = r * 2.2;
    let [px, py] = pt(0);
    let acc = spacing;
    for (let i = 0; i <= 200; i++) {
      const [x, yy] = pt(i / 200);
      acc += Math.hypot(x - px, yy - py);
      px = x; py = yy;
      if (acc >= spacing) { pearl(c, x, yy, r); acc = 0; }
    }
  }

  function drawGarland(c, W, G, inset) {
    const y = 36, x0 = inset || 34, x1 = W - (inset || 34);
    const n = W > 900 ? 5 : 3;
    const seg = (x1 - x0) / n;
    const depth = Math.min(11, (G.top - 20 - y) / 2);
    for (let i = 0; i < n; i++) pearlSwag(c, x0 + seg * i, x0 + seg * (i + 1), y, depth, 3.4);
    for (let i = 0; i <= n; i++) {
      const x = x0 + seg * i;
      pearl(c, x, y, 5.5);
      // little teardrop pearl hanging under each join
      pearl(c, x, y + 11, 3.6);
    }
  }

  /* ───────── photo slots ───────── */
  function drawPlaceholder(c, sl, f, i) {
    const g = c.createLinearGradient(sl.x, sl.y, sl.x + sl.w, sl.y + sl.h);
    g.addColorStop(0, f.slotA);
    g.addColorStop(1, f.slotB);
    c.fillStyle = g;
    c.fillRect(sl.x, sl.y, sl.w, sl.h);
    c.save();
    c.translate(sl.x + sl.w / 2, sl.y + sl.h / 2);
    c.globalAlpha = 0.35;
    const s = sl.h / 180;
    c.scale(s, s);
    heartPath(c);
    c.fillStyle = f.lace;
    c.fill();
    c.restore();
    c.save();
    c.globalAlpha = 0.55;
    c.fillStyle = f.lace;
    c.font = `600 ${Math.round(sl.h * 0.085)}px "Grenze Gotisch", serif`;
    c.textAlign = 'left';
    c.fillText(`No.${i + 1}`, sl.x + sl.h * 0.05, sl.y + sl.h * 0.94);
    c.restore();
  }

  function diamond(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y - s); c.lineTo(x + s, y); c.lineTo(x, y + s); c.lineTo(x - s, y);
    c.closePath(); c.fill();
  }

  // Pointed chapel-window arch over a slot.
  function archPath(c, x, y, w, h) {
    const a = h * 0.42;
    c.beginPath();
    c.moveTo(x, y + h);
    c.lineTo(x, y + a);
    c.bezierCurveTo(x, y + a * 0.35, x + w * 0.28, y + a * 0.06, x + w / 2, y);
    c.bezierCurveTo(x + w * 0.72, y + a * 0.06, x + w, y + a * 0.35, x + w, y + a);
    c.lineTo(x + w, y + h);
    c.closePath();
  }

  function drawPhotoFrame(c, sl, f) {
    if (f.arch) {
      c.save();
      c.strokeStyle = f.line;
      c.lineWidth = 2;
      archPath(c, sl.x - 6, sl.y - 6, sl.w + 12, sl.h + 12); c.stroke();
      c.lineWidth = 1;
      archPath(c, sl.x - 11, sl.y - 11, sl.w + 22, sl.h + 22); c.stroke();
      c.fillStyle = f.line;
      diamond(c, sl.x - 11, sl.y + sl.h + 11, 6);
      diamond(c, sl.x + sl.w + 11, sl.y + sl.h + 11, 6);
      c.restore();
      return;
    }
    if (f.pearlFrame) {
      pearlRect(c, sl.x - 8, sl.y - 8, sl.w + 16, sl.h + 16, 3.6);
      return;
    }
    c.save();
    c.strokeStyle = f.line;
    c.lineWidth = 2;
    c.strokeRect(sl.x - 6, sl.y - 6, sl.w + 12, sl.h + 12);
    c.lineWidth = 1;
    c.strokeRect(sl.x - 11, sl.y - 11, sl.w + 22, sl.h + 22);
    c.fillStyle = f.line;
    for (const [x, y] of [[sl.x - 11, sl.y - 11], [sl.x + sl.w + 11, sl.y - 11], [sl.x - 11, sl.y + sl.h + 11], [sl.x + sl.w + 11, sl.y + sl.h + 11]])
      diamond(c, x, y, 6);
    c.restore();
  }

  /* ───────── footer text ───────── */
  function fitFont(c, text, family, size, maxW, style) {
    let s = size;
    do {
      c.font = `${style || ''} ${s}px ${family}`;
      s -= 2;
    } while (c.measureText(text).width > maxW && s > 12);
  }

  function formatDate(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  }

  function drawFooter(c, f, G, o) {
    const k = G.k, cx = G.w / 2, y0 = G.footerY;
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';

    // pearl divider with a tiny diamond in the middle
    const half = 70 * k;
    pearlLine(c, cx - half, y0 + 42 * k, cx - 14 * k, y0 + 42 * k, 3);
    pearlLine(c, cx + 14 * k, y0 + 42 * k, cx + half, y0 + 42 * k, 3);
    c.fillStyle = f.sub;
    diamond(c, cx, y0 + 42 * k, 6 * k);

    const caption = (o.caption || '').trim() || 'Dolly Noir';
    c.fillStyle = f.text;
    fitFont(c, caption, '"Grenze Gotisch", Georgia, serif', Math.round(68 * k), G.w - 120, '600');
    c.fillText(caption, cx, y0 + 114 * k);

    c.fillStyle = f.sub;
    c.font = `${Math.round(17 * k)}px "Zen Antique", serif`;
    const sub = '黒と白の人形写真館';
    c.fillText(sub, cx, y0 + 152 * k);
    const sw = c.measureText(sub).width / 2 + 18 * k;
    diamond(c, cx - sw, y0 + 146 * k, 4 * k);
    diamond(c, cx + sw, y0 + 146 * k, 4 * k);

    if (o.showDate) {
      c.font = `italic ${Math.round(20 * k)}px "IM Fell English", Georgia, serif`;
      c.fillText(`— ${formatDate(o.date || new Date())} —`, cx, y0 + 184 * k);
    }
    c.restore();
  }

  /* ───────── main renderer ───────── */
  /* ───────── filigree scrollwork (drawn for a top-left corner) ───────── */
  const FILIGREE = [
    'M6 6C30 4 52 8 64 18C72 25 70 36 61 36C54 36 52 28 58 26',
    'M6 6C4 30 8 52 18 64C25 72 36 70 36 61C36 54 28 52 26 58',
    'M10 10C22 26 30 32 40 30C46 29 46 22 41 22',
    'M64 18C76 10 88 10 94 14',
    'M18 64C10 76 10 88 14 94',
    'M30 8C34 14 40 15 44 12',
    'M8 30C14 34 15 40 12 44',
  ];
  let filigreePaths = null;

  function drawFiligree(c, x, y, size, color, sx, sy) {
    if (!filigreePaths) filigreePaths = FILIGREE.map((d) => new Path2D(d));
    const k = size / 100;
    c.save();
    c.translate(x, y);
    c.scale(sx * k, sy * k);
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 2.6 / k;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.shadowColor = 'rgba(0,0,0,.25)';
    c.shadowBlur = 3;
    for (const p of filigreePaths) c.stroke(p);
    for (const [px, py, r] of [[6, 6, 4], [94, 14, 2.4], [14, 94, 2.4], [58, 26, 2], [26, 58, 2], [41, 22, 1.8]]) {
      c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
    }
    c.restore();
  }

  // Orange LED date, like an old point-and-shoot.
  function drawStamp(c, sl, date) {
    const p = (n) => String(n).padStart(2, '0');
    const text = `'${p(date.getFullYear() % 100)} ${p(date.getMonth() + 1)} ${p(date.getDate())}`;
    c.save();
    c.font = `${Math.round(sl.h * 0.085)}px "VT323", "Courier New", monospace`;
    c.textAlign = 'right';
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#ff9a3c';
    c.shadowColor = 'rgba(255,120,30,.8)';
    c.shadowBlur = 6;
    c.fillText(text, sl.x + sl.w - sl.w * 0.045, sl.y + sl.h - sl.h * 0.05);
    c.restore();
  }

  function renderStrip(canvas, o) {
    const G = geometry(o.layout);
    const f = FRAMES[o.frame] || FRAMES.kuro;
    const s = o.scale || 1;
    canvas.width = Math.round(G.w * s);
    canvas.height = Math.round(G.h * s);
    const c = canvas.getContext('2d');
    c.setTransform(s, 0, 0, s, 0, 0);
    c.imageSmoothingQuality = 'high';

    drawPattern(c, f, G.w, G.h);

    G.slots.forEach((sl, i) => {
      const img = o.shots && o.shots[i];
      c.save();
      if (f.arch) { archPath(c, sl.x, sl.y, sl.w, sl.h); c.clip(); }
      if (img) c.drawImage(img, sl.x, sl.y, sl.w, sl.h);
      else drawPlaceholder(c, sl, f, i);
      if (img && o.stamp) drawStamp(c, sl, o.date || new Date());
      c.restore();
      drawPhotoFrame(c, sl, f);
      if (f.photoFiligree) {
        const fs = sl.w * 0.2;
        drawFiligree(c, sl.x - 3, sl.y - 3, fs, f.photoFiligree, 1, 1);
        drawFiligree(c, sl.x + sl.w + 3, sl.y + sl.h + 3, fs, f.photoFiligree, -1, -1);
      }
    });

    drawLace(c, f, G.w, G.h);
    if (f.cornerFiligree) {
      const fs = 92 * G.k, m = 20;
      drawFiligree(c, m, m, fs, f.cornerFiligree, 1, 1);
      drawFiligree(c, G.w - m, m, fs, f.cornerFiligree, -1, 1);
      drawFiligree(c, m, G.h - m, fs, f.cornerFiligree, 1, -1);
      drawFiligree(c, G.w - m, G.h - m, fs, f.cornerFiligree, -1, -1);
    }
    if (f.garland) drawGarland(c, G.w, G, f.cornerFiligree ? 104 * G.k : 0);

    c.save();
    const top = G.slots[0].y;
    if (f.topper === 'cross') {
      c.translate(G.w / 2, top - 16);
      drawSticker(c, 'cross', 66 * G.k, { edge: f.crossEdge });
    } else if (f.topper === 'bat') {
      c.translate(G.w / 2, top - 8);
      drawSticker(c, 'bat', 96 * G.k);
    } else {
      c.translate(G.w / 2, top - 2);
      drawSticker(c, 'bow', 86 * G.k, { fill: f.bow, edge: f.bowEdge || f.lace });
    }
    c.restore();

    drawFooter(c, f, G, o);

    (o.stickers || []).forEach((st, i) => {
      c.save();
      c.translate(st.x, st.y);
      c.rotate((st.rot || 0) * Math.PI / 180);
      drawSticker(c, st.type, st.size);
      if (i === o.selected) {
        const h = st.size * 0.58;
        c.lineWidth = 2;
        c.setLineDash([7, 5]);
        c.strokeStyle = '#ffffff';
        c.strokeRect(-h, -h, h * 2, h * 2);
        c.lineDashOffset = 6;
        c.strokeStyle = '#8e1428';
        c.strokeRect(-h, -h, h * 2, h * 2);
      }
      c.restore();
    });

    return G;
  }

  KB.LAYOUTS = LAYOUTS;
  KB.FRAMES = FRAMES;
  KB.geometry = geometry;
  KB.renderStrip = renderStrip;
})(window.KB);
