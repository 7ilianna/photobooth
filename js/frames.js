/* Layouts ("sets") and frames ("tablecloths"), plus the strip renderer. */
window.KB = window.KB || {};

(function (KB) {
  const TAU = Math.PI * 2;
  const { pearl, drawSticker, heartPath } = KB;

  const LAYOUTS = {
    strip4: { name: 'Classic Strip', jp: '定番', count: 4, desc: 'four poses, one tall strip', price: '¥480' },
    strip3: { name: 'Trio', jp: '三枚', count: 3, desc: 'three poses, a little shorter', price: '¥380' },
    duo: { name: 'Duo', jp: '二人', count: 2, desc: 'two big frames for besties', price: '¥280' },
    grid4: { name: 'Postcard', jp: '絵葉書', count: 4, desc: 'a 2×2 grid, like a café postcard', price: '¥520' },
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
    noir: {
      name: 'Black Lace', jp: '黒レース',
      bg: '#150a0e', pattern: 'damask', pc: 'rgba(244,236,226,.07)',
      lace: '#f1e6da', text: '#f1e6da', sub: '#c9a7ae', line: '#f1e6da',
      bow: '#8e1428', garland: true, pearlFrame: false,
      slotA: '#3a1a22', slotB: '#1f0d12',
    },
    pearl: {
      name: 'Pearl Cream', jp: '真珠',
      bg: '#f8f0e3', pattern: 'dots', pc: 'rgba(90,20,38,.09)',
      lace: '#1b0a10', text: '#3b0f1b', sub: '#7d5a60', line: '#3b0f1b',
      bow: '#1b0a10', bowEdge: '#f8f0e3', garland: true, pearlFrame: true,
      slotA: '#ead9cf', slotB: '#d9bfb7',
    },
    ichigo: {
      name: 'Strawberry Parfait', jp: '苺パフェ',
      bg: '#f4c9d3', pattern: 'gingham', pc: 'rgba(255,255,255,.42)',
      lace: '#ffffff', text: '#8a1c3c', sub: '#a8566e', line: '#ffffff',
      bow: '#b5172f', garland: false, pearlFrame: true,
      slotA: '#fbe3e8', slotB: '#eeb4c1',
    },
    coffee: {
      name: 'Coffee Jelly', jp: 'コーヒーゼリー',
      bg: '#3b251d', pattern: 'checker', pc: 'rgba(240,226,200,.07)',
      lace: '#efe0c6', text: '#efe0c6', sub: '#c2a368', line: '#c2a368',
      bow: '#1b0a10', garland: true, pearlFrame: false,
      slotA: '#5a3d31', slotB: '#2a1912',
    },
    bordeaux: {
      name: 'Bordeaux Rose', jp: '薔薇',
      bg: '#5c1426', pattern: 'stripes', pc: 'rgba(0,0,0,.16)',
      lace: '#1b0a10', text: '#f6e3da', sub: '#e9c7a0', line: '#e9c7a0',
      bow: '#1b0a10', bowEdge: '#e9c7a0', garland: true, pearlFrame: false,
      slotA: '#7a2236', slotB: '#3f0c19',
    },
    melon: {
      name: 'Melon Soda Velvet', jp: 'メロンソーダ',
      bg: '#24392d', pattern: 'dots', pc: 'rgba(240,226,200,.08)',
      lace: '#f4ead8', text: '#f4ead8', sub: '#b8d4a8', line: '#f4ead8',
      bow: '#b5172f', garland: true, pearlFrame: true,
      slotA: '#3b5a47', slotB: '#1a2a20',
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

  function drawGarland(c, W, G) {
    const y = 36, x0 = 34, x1 = W - 34;
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
    c.font = `${Math.round(sl.h * 0.08)}px "UnifrakturMaguntia", serif`;
    c.textAlign = 'left';
    c.fillText(`No.${i + 1}`, sl.x + sl.h * 0.05, sl.y + sl.h * 0.94);
    c.restore();
  }

  function diamond(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y - s); c.lineTo(x + s, y); c.lineTo(x, y + s); c.lineTo(x - s, y);
    c.closePath(); c.fill();
  }

  function drawPhotoFrame(c, sl, f) {
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

    const caption = (o.caption || '').trim() || 'Kurobara';
    c.fillStyle = f.text;
    fitFont(c, caption, '"Pinyon Script", cursive', Math.round(64 * k), G.w - 120);
    c.fillText(caption, cx, y0 + 114 * k);

    c.fillStyle = f.sub;
    c.font = `${Math.round(17 * k)}px "Kaisei Decol", serif`;
    const sub = '喫茶 黒薔薇 ・ 写真館';
    c.fillText(sub, cx, y0 + 152 * k);
    const sw = c.measureText(sub).width / 2 + 18 * k;
    diamond(c, cx - sw, y0 + 146 * k, 4 * k);
    diamond(c, cx + sw, y0 + 146 * k, 4 * k);

    if (o.showDate) {
      c.font = `italic ${Math.round(20 * k)}px "Cormorant Garamond", serif`;
      c.fillText(`— ${formatDate(o.date || new Date())} —`, cx, y0 + 184 * k);
    }
    c.restore();
  }

  /* ───────── main renderer ───────── */
  function renderStrip(canvas, o) {
    const G = geometry(o.layout);
    const f = FRAMES[o.frame] || FRAMES.noir;
    const s = o.scale || 1;
    canvas.width = Math.round(G.w * s);
    canvas.height = Math.round(G.h * s);
    const c = canvas.getContext('2d');
    c.setTransform(s, 0, 0, s, 0, 0);
    c.imageSmoothingQuality = 'high';

    drawPattern(c, f, G.w, G.h);

    G.slots.forEach((sl, i) => {
      const img = o.shots && o.shots[i];
      if (img) c.drawImage(img, sl.x, sl.y, sl.w, sl.h);
      else drawPlaceholder(c, sl, f, i);
      drawPhotoFrame(c, sl, f);
    });

    drawLace(c, f, G.w, G.h);
    if (f.garland) drawGarland(c, G.w, G);

    c.save();
    c.translate(G.w / 2, G.slots[0].y - 2);
    drawSticker(c, 'bow', 86 * G.k, { fill: f.bow, edge: f.bowEdge || f.lace });
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
