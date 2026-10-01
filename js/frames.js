/* Print layout, the four themes and the strip renderer.
 *
 * Every print is a 1080×1350 Instagram portrait post (4:5) with four 4:5
 * photos in a 2×2 grid. To use your own frame art, export a PNG at
 * exactly 1080×1350 with transparent holes over the slots (see
 * frames/template.png) and set `overlay` on the theme below. Until the
 * file exists, a drawn placeholder is used instead. */
window.KB = window.KB || {};

(function (KB) {
  const TAU = Math.PI * 2;
  const { pearl, drawSticker, heartPath } = KB;

  const PRINT = (() => {
    const w = 1080, h = 1350;
    const pw = 440, ph = 550, gap = 20, top = 64;
    const x0 = (w - pw * 2 - gap) / 2;
    const slots = [];
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++)
        slots.push({ x: x0 + c * (pw + gap), y: top + r * (ph + gap), w: pw, h: ph });
    return { w, h, slots, footerY: top + ph * 2 + gap };
  })();
  const PHOTO_ASPECT = 4 / 5; // width / height of each photo

  // Frames are designed as 1080×1350 PNGs (see frames/README.md). The colour
  // fields are only used for the drawn fallback if a PNG fails to load.
  // `footer: false` means the art fills the bottom strip, so the booth
  // doesn't write a caption or date there.
  const THEMES = {
    window: {
      name: 'Locked Lattice', tagline: 'latched from the inside', overlay: 'frames/theme-1.png', footer: false,
      fortune: 'A secret kept behind iron… and a key you were always meant to find.',
      bio: 'A wrought-iron window, latched from the inside. A polka-dot ribbon at the sill, a silver key on a length of lace, and two dolls keeping watch from a heart of black organza.',
      cv: 'you ♡',
      sweetness: 4, gloom: 4,
      mood: 'melancholy, a little sweet',
      motifs: 'key · lace · polka dots · wrought iron',
      look: { filter: 'mono', intensity: 0.7 },
      bg: '#0b0a0d', pattern: 'crosses', pc: 'rgba(239,233,242,.06)',
      lace: '#efe9f2', ink: '#efe9f2', sub: '#b7afc0', line: '#c9c3d3',
      slotA: '#26222c', slotB: '#100e13',
    },
    lullaby: {
      name: 'Angel Lullaby', tagline: 'hush now, little lamb', overlay: 'frames/theme-2.png', footer: false,
      fortune: 'Someone is watching over you tonight. Close your eyes, little lamb.',
      bio: 'White ruffled curtains tied back with silver ribbon. An angel has left a wing at the sill, a rocking horse waits by the window, and a sleepy lamb keeps watch over a cherub who cried herself to sleep.',
      cv: 'you ♡',
      sweetness: 5, gloom: 2,
      mood: 'soft, sleepy, a little sad',
      motifs: 'angel wings · pearls · ruffles · rocking horse',
      look: { filter: 'faded', intensity: 0.6 },
      bg: '#f4f2f2', pattern: 'dots', pc: 'rgba(27,20,32,.06)',
      lace: '#ffffff', ink: '#3a3a40', sub: '#8d8c91', line: '#c9c8cc',
      slotA: '#e6e4e6', slotB: '#cfcdd2',
    },
    biscuit: {
      name: 'Biscuit Waltz', tagline: 'tea at four, music at five', overlay: 'frames/theme-3.png', footer: false,
      fortune: 'Sweet things are coming, right on time. Save the last dance for me.',
      bio: 'Pastel plaid and pearl-strung windows. Butter biscuits and wafer rolls, whipped cream on a silver fork, and a little audience of woodland friends waiting for the music to start.',
      cv: 'you ♡',
      sweetness: 5, gloom: 1,
      mood: 'sweet, cozy, playful',
      motifs: 'biscuits · cream · music notes · pearls',
      look: { filter: 'digicam', intensity: 0.6 },
      bg: '#efe6e6', pattern: 'dots', pc: 'rgba(90,60,50,.07)',
      lace: '#ffffff', ink: '#5a3d31', sub: '#9c8378', line: '#d9c6c2',
      slotA: '#f2e8e6', slotB: '#dccbc6',
    },
    // A clean border with no art, in black or white (picked with `tone`)
    plain: {
      name: 'Plain', tagline: 'just you, in black or white', plain: true,
      fortune: 'Nothing hidden, nothing to fear. Just you, exactly as you are.',
      bio: 'No lace, no keys. A clean border in black or white, so the photos do all the talking.',
      sweetness: 2, gloom: 2, mood: 'quiet', motifs: 'none at all',
      look: { filter: 'natural', intensity: 1 },
      tones: {
        black: { bg: '#0a0a0b', ink: '#f1f0ee', sub: '#8d8c91', slotA: '#26252a', slotB: '#141416', lace: '#f1f0ee' },
        white: { bg: '#f7f6f3', ink: '#1b1a1d', sub: '#77767c', slotA: '#e3e1e3', slotB: '#cfcdd0', lace: '#1b1a1d' },
      },
    },
  };

  // Resolve a theme for drawing, folding in the chosen tone for Plain.
  function themeFor(id, tone) {
    const t = THEMES[id] || Object.values(THEMES)[0];
    return t.plain ? { ...t, ...t.tones[tone] || t.tones.black } : t;
  }


  // Load any overlay PNGs that exist; re-render when one arrives.
  function loadOverlays(onReady) {
    for (const t of Object.values(THEMES)) {
      if (!t.overlay) continue;
      const img = new Image();
      img.onload = () => { t.image = img; if (onReady) onReady(); };
      img.src = t.overlay;
    }
  }

  /* ───────── placeholder backgrounds ───────── */
  function drawPattern(c, t, W, H) {
    c.fillStyle = t.bg;
    c.fillRect(0, 0, W, H);
    c.fillStyle = t.pc;
    switch (t.pattern) {
      case 'dots':
        for (let y = 16, row = 0; y < H; y += 32, row++)
          for (let x = row % 2 ? 32 : 16; x < W; x += 32) {
            c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
          }
        break;
      case 'crosses':
        for (let y = 34, row = 0; y < H; y += 60, row++)
          for (let x = row % 2 ? 60 : 30; x < W + 30; x += 60) {
            c.fillRect(x - 1.5, y - 11, 3, 22);
            c.fillRect(x - 8, y - 5, 16, 3);
          }
        break;
      case 'stars':
        for (let y = 30, row = 0; y < H; y += 70, row++)
          for (let x = row % 2 ? 70 : 35; x < W + 35; x += 70) {
            c.beginPath();
            c.moveTo(x, y - 8); c.quadraticCurveTo(x, y, x + 8, y); c.quadraticCurveTo(x, y, x, y + 8);
            c.quadraticCurveTo(x, y, x - 8, y); c.quadraticCurveTo(x, y, x, y - 8);
            c.fill();
          }
        break;
      case 'damask':
        for (let y = 34, row = 0; y < H; y += 68, row++)
          for (let x = row % 2 ? 68 : 34; x < W + 34; x += 68) {
            c.beginPath();
            c.moveTo(x, y - 14); c.lineTo(x + 9, y); c.lineTo(x, y + 14); c.lineTo(x - 9, y);
            c.closePath(); c.fill();
            for (const [dx, dy] of [[0, -22], [0, 22], [-17, 0], [17, 0]]) {
              c.beginPath(); c.arc(x + dx, y + dy, 2.4, 0, TAU); c.fill();
            }
          }
        break;
    }
  }

  /* ───────── lace edge ───────── */
  function laceEdge(c, t, L) {
    const band = 16;
    const n = Math.max(1, Math.round(L / 26));
    const step = L / n;
    const r = step / 2;
    c.fillStyle = t.lace;
    c.fillRect(0, -band, L, band);
    for (let i = 0; i < n; i++) {
      c.beginPath(); c.arc(step * (i + 0.5), 0, r, 0, Math.PI); c.fill();
    }
    c.fillStyle = t.bg;
    for (let i = 0; i < n; i++) {
      const cx = step * (i + 0.5);
      c.beginPath(); c.arc(cx, r * 0.42, r * 0.26, 0, TAU); c.fill();
      c.beginPath(); c.arc(cx + r, -band * 0.45, 2.4, 0, TAU); c.fill();
    }
  }

  function drawLace(c, t, W, H) {
    const b = 16;
    for (const [x, y, rot, len] of [[0, b, 0, W], [W, H - b, Math.PI, W], [b, H, -Math.PI / 2, H], [W - b, 0, Math.PI / 2, H]]) {
      c.save(); c.translate(x, y); c.rotate(rot);
      laceEdge(c, t, len);
      c.restore();
    }
    for (const [x, y] of [[b, b], [W - b, b], [b, H - b], [W - b, H - b]]) {
      c.fillStyle = t.lace;
      c.beginPath(); c.arc(x, y, 18, 0, TAU); c.fill();
      c.fillStyle = t.bg;
      c.beginPath(); c.arc(x, y, 11, 0, TAU); c.fill();
      pearl(c, x, y, 8);
    }
  }

  /* ───────── pearls ───────── */
  function pearlSwag(c, x1, x2, y, depth, r) {
    const cx = (x1 + x2) / 2, cy = y + depth * 2;
    const pt = (k) => {
      const u = 1 - k;
      return [u * u * x1 + 2 * u * k * cx + k * k * x2, u * u * y + 2 * u * k * cy + k * k * y];
    };
    const spacing = r * 2.2;
    let [px, py] = pt(0);
    let acc = spacing;
    for (let i = 0; i <= 240; i++) {
      const [x, yy] = pt(i / 240);
      acc += Math.hypot(x - px, yy - py);
      px = x; py = yy;
      if (acc >= spacing) { pearl(c, x, yy, r); acc = 0; }
    }
  }

  function drawGarland(c, W) {
    const y = 32, x0 = 110, x1 = W - 110, n = 4;
    const seg = (x1 - x0) / n;
    for (let i = 0; i < n; i++) pearlSwag(c, x0 + seg * i, x0 + seg * (i + 1), y, 6, 3.4);
    for (let i = 0; i <= n; i++) pearl(c, x0 + seg * i, y, 5.5);
  }

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
    c.lineWidth = 2.8 / k;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const p of filigreePaths) c.stroke(p);
    for (const [px, py, r] of [[6, 6, 4], [94, 14, 2.4], [14, 94, 2.4], [58, 26, 2], [26, 58, 2], [41, 22, 1.8]]) {
      c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
    }
    c.restore();
  }

  /* ───────── photo slots ───────── */
  function drawPlaceholderPhoto(c, sl, t, i) {
    const g = c.createLinearGradient(sl.x, sl.y, sl.x + sl.w, sl.y + sl.h);
    g.addColorStop(0, t.slotA);
    g.addColorStop(1, t.slotB);
    c.fillStyle = g;
    c.fillRect(sl.x, sl.y, sl.w, sl.h);
    c.save();
    c.translate(sl.x + sl.w / 2, sl.y + sl.h / 2);
    c.globalAlpha = 0.3;
    const s = sl.w / 190;
    c.scale(s, s);
    heartPath(c);
    c.fillStyle = t.lace;
    c.fill();
    c.restore();
    c.save();
    c.globalAlpha = 0.6;
    c.fillStyle = t.lace;
    c.font = `500 ${Math.round(sl.w * 0.06)}px "Cormorant SC", Georgia, serif`;
    c.textAlign = 'left';
    c.fillText(['I', 'II', 'III', 'IV'][i], sl.x + 18, sl.y + sl.h - 20);
    c.restore();
  }

  function drawSlotFrame(c, sl, t) {
    c.save();
    c.strokeStyle = t.line;
    c.lineWidth = 2.5;
    c.strokeRect(sl.x - 8, sl.y - 8, sl.w + 16, sl.h + 16);
    c.lineWidth = 1.2;
    c.strokeRect(sl.x - 15, sl.y - 15, sl.w + 30, sl.h + 30);
    c.restore();
    // top-right and bottom-left, so the digicam date (bottom-right) stays clear
    drawFiligree(c, sl.x + sl.w + 4, sl.y - 4, sl.w * 0.2, t.line, -1, 1);
    drawFiligree(c, sl.x - 4, sl.y + sl.h + 4, sl.w * 0.2, t.line, 1, -1);
  }

  // Orange LED date, like an old point-and-shoot.
  function drawStamp(c, sl, date) {
    const p = (n) => String(n).padStart(2, '0');
    const text = `'${p(date.getFullYear() % 100)} ${p(date.getMonth() + 1)} ${p(date.getDate())}`;
    c.save();
    c.font = `${Math.round(sl.w * 0.085)}px "VT323", "Courier New", monospace`;
    c.textAlign = 'right';
    c.fillStyle = '#ff9a3c';
    c.shadowColor = 'rgba(255,120,30,.8)';
    c.shadowBlur = 6;
    c.fillText(text, sl.x + sl.w * 0.95, sl.y + sl.h * 0.96);
    c.restore();
  }

  /* ───────── footer text ───────── */
  function formatDate(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  }

  function drawFooter(c, t, o) {
    const cx = PRINT.w / 2, y0 = PRINT.footerY;
    c.save();
    c.textAlign = 'center';
    const caption = (o.caption || '').trim() || 'Bisque';
    c.fillStyle = t.ink;
    let size = 80;
    do {
      c.font = `italic 300 ${size}px "Cormorant Garamond", Georgia, serif`;
      size -= 4;
    } while (c.measureText(caption).width > PRINT.w - 240 && size > 30);
    c.fillText(caption, cx, y0 + 74);
    c.fillStyle = t.sub;
    c.font = 'italic 21px "Cormorant Garamond", serif';
    const parts = ['bisque photobooth'];
    if (o.showDate) parts.push(formatDate(o.date || new Date()));
    c.fillText(parts.join('  ·  '), cx, y0 + 132);
    c.restore();
  }

  /* ───────── main renderer ───────── */
  function renderStrip(canvas, o) {
    const t = themeFor(o.theme, o.tone);
    const s = o.scale || 1;
    const W = PRINT.w, H = PRINT.h;
    canvas.width = Math.round(W * s);
    canvas.height = Math.round(H * s);
    const c = canvas.getContext('2d');
    c.setTransform(s, 0, 0, s, 0, 0);
    c.imageSmoothingQuality = 'high';

    if (t.image || t.plain) { c.fillStyle = t.bg; c.fillRect(0, 0, W, H); }
    else drawPattern(c, t, W, H);

    PRINT.slots.forEach((sl, i) => {
      const img = o.shots && o.shots[i];
      if (img) c.drawImage(img, sl.x, sl.y, sl.w, sl.h);
      else drawPlaceholderPhoto(c, sl, t, i);
      if (img && o.stamp) drawStamp(c, sl, o.date || new Date());
    });

    if (t.image) {
      c.drawImage(t.image, 0, 0, W, H);
    } else if (!t.plain) {
      PRINT.slots.forEach((sl) => drawSlotFrame(c, sl, t));
      drawLace(c, t, W, H);
      drawGarland(c, W);
      c.save();
      c.translate(W / 2, 46);
      drawSticker(c, 'bow', 74, { fill: t.bg, edge: t.lace });
      c.restore();
      c.save();
      c.fillStyle = t.sub;
      c.globalAlpha = 0.7;
      c.textAlign = 'left';
      c.font = '500 14px "Cormorant SC", Georgia, serif';
      c.fillText(`${t.name.toUpperCase()} · PLACEHOLDER`, 44, H - 42);
      c.restore();
    }

    if (t.footer !== false) drawFooter(c, t, o);

    (o.stickers || []).forEach((st, i) => {
      c.save();
      c.translate(st.x, st.y);
      c.rotate((st.rot || 0) * Math.PI / 180);
      drawSticker(c, st.type, st.size);
      if (i === o.selected) {
        const h = st.size * 0.58;
        c.lineWidth = 3;
        c.setLineDash([9, 6]);
        c.strokeStyle = '#ffffff';
        c.strokeRect(-h, -h, h * 2, h * 2);
        c.lineDashOffset = 7;
        c.strokeStyle = '#4b3a5e';
        c.strokeRect(-h, -h, h * 2, h * 2);
      }
      c.restore();
    });
  }

  KB.PRINT = PRINT;
  KB.PHOTO_ASPECT = PHOTO_ASPECT;
  KB.THEMES = THEMES;
  KB.themeFor = themeFor;
  KB.loadOverlays = loadOverlays;
  KB.renderStrip = renderStrip;
})(window.KB);
