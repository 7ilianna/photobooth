/* Photo filters. `css` is used for the live camera preview; the pixel
 * pipeline (`ops` + extras) bakes the same look into the print so it works
 * in every browser, including ones without canvas `ctx.filter`. */
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
      css: 'none',
      ops: [],
    },
    kissaten: {
      name: 'Kissaten', jp: '喫茶',
      css: 'sepia(.45) saturate(1.1) contrast(1.05) brightness(1.04)',
      ops: [op.sepia(0.45), op.sat(1.1), op.contrast(1.05), op.bright(1.04), op.tint(8, 2, -6)],
      vignette: 0.35, grain: 6,
    },
    noir: {
      name: 'Noir', jp: '黒',
      css: 'grayscale(1) contrast(1.3) brightness(1.02)',
      ops: [op.gray(), op.contrast(1.3), op.bright(1.02)],
      vignette: 0.45, grain: 14,
    },
    rose: {
      name: 'Rosé', jp: '薔薇色',
      css: 'sepia(.2) saturate(1.15) hue-rotate(-15deg) brightness(1.06) contrast(.95)',
      ops: [op.sepia(0.15), op.tint(18, -4, 8), op.sat(1.1), op.bright(1.05), op.contrast(0.95)],
      vignette: 0.15,
    },
    showa: {
      name: 'Showa Film', jp: '昭和',
      css: 'contrast(.88) brightness(1.06) saturate(.8) sepia(.15)',
      ops: [op.fade(28), op.sat(0.8), op.tint(6, 4, -10), op.contrast(0.92)],
      vignette: 0.25, grain: 12,
    },
    dreamy: {
      name: 'Dreamy', jp: '夢',
      css: 'brightness(1.1) contrast(.85) saturate(.9)',
      ops: [op.bright(1.08), op.contrast(0.88), op.sat(0.9), op.tint(8, 0, 10)],
      glow: 0.4,
    },
  };

  function applyFilter(src, id) {
    const f = FILTERS[id] || FILTERS.natural;
    const w = src.width, h = src.height;
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const ctx = out.getContext('2d');
    ctx.drawImage(src, 0, 0);

    if (f.ops.length || f.grain) {
      const img = ctx.getImageData(0, 0, w, h);
      const p = img.data;
      const v = [0, 0, 0];
      const grain = f.grain || 0;
      for (let i = 0; i < p.length; i += 4) {
        v[0] = p[i]; v[1] = p[i + 1]; v[2] = p[i + 2];
        for (let k = 0; k < f.ops.length; k++) f.ops[k](v);
        if (grain) {
          const n = (Math.random() - 0.5) * 2 * grain;
          v[0] += n; v[1] += n; v[2] += n;
        }
        p[i] = v[0]; p[i + 1] = v[1]; p[i + 2] = v[2];
      }
      ctx.putImageData(img, 0, 0);
    }

    if (f.glow) {
      // cheap cross-browser blur: shrink then scale back up
      const small = document.createElement('canvas');
      small.width = Math.max(1, Math.round(w / 12));
      small.height = Math.max(1, Math.round(h / 12));
      const sctx = small.getContext('2d');
      sctx.drawImage(out, 0, 0, small.width, small.height);
      ctx.save();
      ctx.globalAlpha = f.glow;
      ctx.globalCompositeOperation = 'screen';
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(small, 0, 0, w, h);
      ctx.restore();
    }

    if (f.vignette) {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) / 2);
      g.addColorStop(0, 'rgba(20,6,10,0)');
      g.addColorStop(1, `rgba(20,6,10,${f.vignette})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    return out;
  }

  KB.FILTERS = FILTERS;
  KB.applyFilter = applyFilter;
})(window.KB);
