/* Photo filters, each with an intensity from 0 (off) to 1 (full).
 * `css(a)` drives the live camera preview; the pixel pipeline bakes the
 * same look into the print so it works in every browser, including ones
 * without canvas `ctx.filter`. The Pixel filter has no CSS equivalent, so
 * the booth draws its preview with `pixelate()` instead. */
window.KB = window.KB || {};

(function (KB) {
  const mix = (a, b, t) => a + (b - a) * t;
  const lum = (v) => 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];

  const op = {
    sepia: (a) => (v) => {
      const [r, g, b] = v;
      v[0] = mix(r, 0.393 * r + 0.769 * g + 0.189 * b, a);
      v[1] = mix(g, 0.349 * r + 0.686 * g + 0.168 * b, a);
      v[2] = mix(b, 0.272 * r + 0.534 * g + 0.131 * b, a);
    },
    gray: () => (v) => { v[0] = v[1] = v[2] = lum(v); },
    contrast: (k) => (v) => { for (let i = 0; i < 3; i++) v[i] = (v[i] - 128) * k + 128; },
    bright: (k) => (v) => { for (let i = 0; i < 3; i++) v[i] *= k; },
    sat: (k) => (v) => { const l = lum(v); for (let i = 0; i < 3; i++) v[i] = l + (v[i] - l) * k; },
    tint: (r, g, b) => (v) => { v[0] += r; v[1] += g; v[2] += b; },
    fade: (amt) => (v) => { for (let i = 0; i < 3; i++) v[i] = v[i] * (1 - amt / 255) + amt; },
  };

  const FILTERS = {
    natural: {
      name: 'Natural', jp: '素顔',
      css: () => 'none',
      ops: [],
    },
    digicam: {
      name: 'Digicam', jp: 'デジカメ',
      css: (a) => `brightness(${1 + 0.12 * a}) contrast(${1 + 0.12 * a}) saturate(${1 - 0.15 * a})`,
      ops: [op.bright(1.1), op.contrast(1.14), op.sat(0.85), op.tint(-4, 0, 8)],
      vignette: 0.3, grain: 5,
    },
    faded: {
      name: 'Faded', jp: '色褪せ',
      css: (a) => `contrast(${1 - 0.2 * a}) saturate(${1 - 0.45 * a}) sepia(${0.2 * a}) brightness(${1 + 0.08 * a})`,
      ops: [op.fade(40), op.sat(0.55), op.tint(10, 6, 0), op.contrast(0.85)],
      vignette: 0.2, grain: 10,
    },
    mono: {
      name: 'Monochrome', jp: '白黒',
      css: (a) => `grayscale(${a}) contrast(${1 + 0.3 * a}) brightness(${1 + 0.02 * a})`,
      ops: [op.gray(), op.contrast(1.3), op.bright(1.02)],
      vignette: 0.45, grain: 14,
    },
    pixel: {
      name: 'Pixel', jp: 'ドット',
      css: () => 'none',
      ops: [],
      pixel: true,
    },
  };

  /* ───────── pixel art ───────── */
  // Block size grows with intensity: 1px (off) up to ~2.4% of the width.
  const pixelBlock = (w, a) => Math.max(1, Math.round(1 + a * w * 0.024));

  // Fewer colour levels (and a little extra saturation) for a retro palette.
  function posterize(ctx, w, h, a) {
    if (a <= 0) return;
    const levels = Math.round(mix(48, 14, a));
    const step = 255 / (levels - 1);
    const img = ctx.getImageData(0, 0, w, h);
    const p = img.data;
    const v = [0, 0, 0];
    const boost = op.sat(1 + 0.12 * a);
    for (let i = 0; i < p.length; i += 4) {
      v[0] = p[i]; v[1] = p[i + 1]; v[2] = p[i + 2];
      boost(v);
      for (let k = 0; k < 3; k++) p[i + k] = Math.round(Math.min(255, Math.max(0, v[k])) / step) * step;
    }
    ctx.putImageData(img, 0, 0);
  }

  const small = document.createElement('canvas');

  // Draw `crop` of `source` into `out` as chunky pixels. Used for both the
  // live preview (every frame) and the final photos.
  function pixelate(source, crop, out, a, mirror) {
    const w = out.width, h = out.height;
    const block = pixelBlock(w, a);
    small.width = Math.max(1, Math.ceil(w / block));
    small.height = Math.max(1, Math.ceil(h / block));
    const s = small.getContext('2d', { willReadFrequently: true });
    s.save();
    if (mirror) { s.translate(small.width, 0); s.scale(-1, 1); }
    s.imageSmoothingEnabled = true;
    s.imageSmoothingQuality = 'high';
    s.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, small.width, small.height);
    s.restore();
    posterize(s, small.width, small.height, a);
    const o = out.getContext('2d');
    o.imageSmoothingEnabled = false;
    o.drawImage(small, 0, 0, w, h);
  }

  // Halve repeatedly so each pixel block averages the photo instead of
  // sampling a single point (which would shimmer and look noisy).
  function softShrink(src, targetW) {
    let cur = src;
    while (cur.width / 2 > targetW * 1.5) {
      const next = document.createElement('canvas');
      next.width = Math.round(cur.width / 2);
      next.height = Math.round(cur.height / 2);
      const c = next.getContext('2d');
      c.imageSmoothingQuality = 'high';
      c.drawImage(cur, 0, 0, next.width, next.height);
      cur = next;
    }
    return cur;
  }

  /* ───────── apply to a captured photo ───────── */
  function applyFilter(src, id, amount) {
    const f = FILTERS[id] || FILTERS.natural;
    const a = amount === undefined ? 1 : Math.max(0, Math.min(1, amount));
    const w = src.width, h = src.height;
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const ctx = out.getContext('2d');

    if (f.pixel) {
      const block = pixelBlock(w, a);
      const pre = softShrink(src, w / block);
      pixelate(pre, { x: 0, y: 0, w: pre.width, h: pre.height }, out, a, false);
      return out;
    }

    ctx.drawImage(src, 0, 0);
    if (a === 0) return out;

    const grain = (f.grain || 0) * a;
    if (f.ops.length || grain) {
      const img = ctx.getImageData(0, 0, w, h);
      const p = img.data;
      const v = [0, 0, 0];
      for (let i = 0; i < p.length; i += 4) {
        const r = p[i], g = p[i + 1], b = p[i + 2];
        v[0] = r; v[1] = g; v[2] = b;
        for (let k = 0; k < f.ops.length; k++) f.ops[k](v);
        let n = 0;
        if (grain) n = (Math.random() - 0.5) * 2 * grain;
        p[i] = r + (v[0] - r) * a + n;
        p[i + 1] = g + (v[1] - g) * a + n;
        p[i + 2] = b + (v[2] - b) * a + n;
      }
      ctx.putImageData(img, 0, 0);
    }

    if (f.vignette) {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) / 2);
      g.addColorStop(0, 'rgba(20,6,10,0)');
      g.addColorStop(1, `rgba(20,6,10,${f.vignette * a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    return out;
  }

  KB.FILTERS = FILTERS;
  KB.applyFilter = applyFilter;
  KB.pixelate = pixelate;
})(window.KB);
