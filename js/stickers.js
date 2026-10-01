/* Vector stickers, drawn straight onto canvas so prints stay crisp.
 * Every sticker draws inside a -50..50 box centred on the origin. */
window.KB = window.KB || {};

(function (KB) {
  const TAU = Math.PI * 2;

  function pearl(c, x, y, r, tint) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,.22)';
    c.beginPath(); c.arc(x + r * .15, y + r * .25, r, 0, TAU); c.fill();
    const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .08, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(.35, tint || '#f3ebe1');
    g.addColorStop(1, '#a89888');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.restore();
  }

  function roundRectPath(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function heartPath(c) {
    c.beginPath();
    c.moveTo(0, 38);
    c.bezierCurveTo(-56, 4, -40, -46, 0, -18);
    c.bezierCurveTo(40, -46, 56, 4, 0, 38);
    c.closePath();
  }

  function shine(c, x, y, rx, ry, rot) {
    c.fillStyle = 'rgba(255,255,255,.7)';
    c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill();
  }

  const STICKERS = {
    bow: {
      name: 'Ribbon',
      draw(c, o) {
        const fill = o.fill || '#1b0a10';
        const edge = o.edge || '#fffaf2';
        c.lineWidth = 3; c.strokeStyle = edge; c.fillStyle = fill;
        for (const m of [-1, 1]) {
          c.save(); c.scale(m, 1);
          c.beginPath();
          c.moveTo(2, 4); c.lineTo(24, 46); c.lineTo(14, 40); c.lineTo(7, 48); c.lineTo(-4, 8);
          c.closePath(); c.fill(); c.stroke();
          c.restore();
        }
        for (const m of [-1, 1]) {
          c.save(); c.scale(m, 1);
          c.beginPath();
          c.moveTo(0, 0);
          c.bezierCurveTo(16, -36, 54, -32, 49, -2);
          c.bezierCurveTo(46, 24, 16, 26, 0, 0);
          c.closePath(); c.fill(); c.stroke();
          c.lineWidth = 2;
          c.beginPath(); c.moveTo(8, -3); c.quadraticCurveTo(26, -14, 38, -6); c.stroke();
          c.beginPath(); c.moveTo(8, 3); c.quadraticCurveTo(24, 10, 34, 8); c.stroke();
          c.restore();
        }
        c.lineWidth = 3;
        roundRectPath(c, -10, -11, 20, 22, 7); c.fill(); c.stroke();
        pearl(c, 0, 0, 5.5);
      },
    },

    heart: {
      name: 'Heart',
      draw(c) {
        heartPath(c);
        c.fillStyle = '#b5172f'; c.fill();
        c.lineWidth = 3.5; c.strokeStyle = '#3b0611'; c.stroke();
        shine(c, -20, -16, 8, 5, -.6);
      },
    },

    cross: {
      name: 'Cross',
      draw(c, o) {
        const pts = [[-8, -46], [8, -46], [8, -24], [30, -24], [30, -8], [8, -8], [8, 46], [-8, 46], [-8, -8], [-30, -8], [-30, -24], [-8, -24]];
        c.beginPath();
        pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.closePath();
        c.fillStyle = '#1b0a10'; c.fill();
        c.lineWidth = 3; c.strokeStyle = (o && o.edge) || '#c9a76a'; c.stroke();
        for (const [x, y] of [[0, -46], [30, -16], [-30, -16], [0, 46]]) pearl(c, x, y, 6);
        c.beginPath(); c.arc(0, -16, 7, 0, TAU);
        c.fillStyle = '#8e1428'; c.fill(); c.lineWidth = 2.5; c.stroke();
        shine(c, -2.5, -18.5, 2.4, 1.6, -.6);
      },
    },

    sparkle: {
      name: 'Sparkle',
      draw(c) {
        const star = (s) => {
          c.beginPath();
          c.moveTo(0, -46 * s);
          c.quadraticCurveTo(6 * s, -6 * s, 46 * s, 0);
          c.quadraticCurveTo(6 * s, 6 * s, 0, 46 * s);
          c.quadraticCurveTo(-6 * s, 6 * s, -46 * s, 0);
          c.quadraticCurveTo(-6 * s, -6 * s, 0, -46 * s);
          c.closePath();
          c.fill(); c.stroke();
        };
        c.fillStyle = '#fff7e6'; c.strokeStyle = '#c9a76a'; c.lineWidth = 3;
        star(1);
        c.save(); c.translate(30, -30); star(.32); c.restore();
        c.save(); c.translate(-32, 30); star(.22); c.restore();
      },
    },

    cherry: {
      name: 'Cherries',
      draw(c) {
        c.strokeStyle = '#3d2a1a'; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(2, -42); c.quadraticCurveTo(-6, -14, -18, 12);
        c.moveTo(2, -42); c.quadraticCurveTo(12, -12, 20, 16);
        c.stroke();
        c.fillStyle = '#5b7a4c';
        c.beginPath(); c.ellipse(16, -38, 14, 6, -.4, 0, TAU); c.fill();
        for (const [x, y] of [[-18, 24], [20, 28]]) {
          c.beginPath(); c.arc(x, y, 17, 0, TAU);
          c.fillStyle = '#b0142e'; c.fill();
          c.lineWidth = 3; c.strokeStyle = '#3b0611'; c.stroke();
          shine(c, x - 6, y - 7, 5, 3, -.6);
        }
      },
    },

    cup: {
      name: 'Teacup',
      draw(c) {
        c.lineCap = 'round';
        c.strokeStyle = '#a68a80'; c.lineWidth = 3;
        for (const x of [-10, 8]) {
          c.beginPath(); c.moveTo(x, -24);
          c.bezierCurveTo(x - 9, -32, x + 7, -38, x - 2, -48);
          c.stroke();
        }
        c.fillStyle = '#fbf3e6'; c.strokeStyle = '#4a1220'; c.lineWidth = 3;
        c.beginPath(); c.ellipse(0, 32, 46, 10, 0, 0, TAU); c.fill(); c.stroke();
        c.lineWidth = 5;
        c.beginPath(); c.arc(32, 2, 11, -Math.PI / 2, Math.PI / 2); c.stroke();
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-32, -14); c.lineTo(32, -14);
        c.bezierCurveTo(32, 14, 20, 28, 0, 28);
        c.bezierCurveTo(-20, 28, -32, 14, -32, -14);
        c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(0, -14, 32, 7, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#a5582a';
        c.beginPath(); c.ellipse(0, -13.5, 27, 4.6, 0, 0, TAU); c.fill();
        c.save(); c.translate(0, 7); c.scale(.24, .24); heartPath(c);
        c.fillStyle = '#b5172f'; c.fill(); c.restore();
        c.strokeStyle = '#c9a76a'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(-30, -5); c.quadraticCurveTo(0, 0, 30, -5); c.stroke();
      },
    },

    bat: {
      name: 'Bat',
      draw(c) {
        c.fillStyle = '#1b0a10'; c.strokeStyle = '#f3d6dc'; c.lineWidth = 3; c.lineJoin = 'round';
        for (const m of [-1, 1]) {
          c.save(); c.scale(m, 1);
          c.beginPath();
          c.moveTo(10, -6);
          c.quadraticCurveTo(30, -32, 50, -14);
          c.quadraticCurveTo(45, -2, 48, 10);
          c.quadraticCurveTo(40, 2, 34, 13);
          c.quadraticCurveTo(28, 4, 20, 15);
          c.quadraticCurveTo(16, 6, 10, 9);
          c.closePath(); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(6, -14); c.lineTo(17, -33); c.lineTo(17, -10); c.closePath(); c.fill(); c.stroke();
          c.restore();
        }
        c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#fff';
        for (const x of [-7, 7]) { c.beginPath(); c.arc(x, -2, 4, 0, TAU); c.fill(); }
        c.fillStyle = '#1b0a10';
        for (const x of [-6, 8]) { c.beginPath(); c.arc(x, -1.5, 2, 0, TAU); c.fill(); }
        c.fillStyle = '#f08aa0';
        for (const x of [-12, 12]) { c.beginPath(); c.ellipse(x, 6, 4, 2.5, 0, 0, TAU); c.fill(); }
        c.fillStyle = '#fff';
        c.beginPath(); c.moveTo(1, 7); c.lineTo(5, 7); c.lineTo(3, 12); c.closePath(); c.fill();
      },
    },

    rose: {
      name: 'Rose',
      draw(c, o) {
        const petal = (o && o.petal) || '#8e1428';
        const dark = (o && o.dark) || '#4d0915';
        const edge = (o && o.edge) || '#3b0611';
        c.fillStyle = '#3f5a3a'; c.strokeStyle = '#1f2e1c'; c.lineWidth = 2.5;
        for (const [x, r] of [[-28, -.6], [28, .6]]) {
          c.beginPath(); c.ellipse(x, 28, 20, 8, r, 0, TAU); c.fill(); c.stroke();
        }
        c.beginPath(); c.arc(0, 0, 34, 0, TAU);
        c.fillStyle = petal; c.fill();
        c.lineWidth = 3; c.strokeStyle = edge; c.stroke();
        c.strokeStyle = dark; c.lineWidth = 4; c.lineCap = 'round';
        const arcs = [[0, 0, 26, .2, 1.45], [2, -2, 19, 1.1, 2.35], [-2, 1, 12, 0, 1.5], [1, 0, 5, .8, 2.4], [-1, 3, 26, 1.6, 2.1]];
        for (const [x, y, r, a, b] of arcs) {
          c.beginPath(); c.arc(x, y, r, a * Math.PI, b * Math.PI); c.stroke();
        }
        shine(c, -14, -18, 7, 3.5, -.7);
      },
    },

    crown: {
      name: 'Crown',
      draw(c) {
        c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(-40, 20); c.lineTo(-44, -18); c.lineTo(-22, 2); c.lineTo(0, -30);
        c.lineTo(22, 2); c.lineTo(44, -18); c.lineTo(40, 20);
        c.closePath();
        c.fillStyle = '#d4b36a'; c.fill();
        c.lineWidth = 3; c.strokeStyle = '#6b4f1d'; c.stroke();
        c.fillStyle = '#c19a4c';
        c.beginPath(); c.rect(-40, 14, 80, 13); c.fill(); c.stroke();
        for (const [x, y] of [[-44, -18], [0, -30], [44, -18]]) pearl(c, x, y, 6.5);
        for (const [x, col] of [[-22, '#1b0a10'], [0, '#8e1428'], [22, '#1b0a10']]) {
          c.beginPath(); c.arc(x, 20.5, 4.5, 0, TAU);
          c.fillStyle = col; c.fill();
        }
      },
    },

    lilacRose: {
      name: 'Lilac rose',
      draw(c) {
        STICKERS.rose.draw(c, { petal: '#9a7bb5', dark: '#4a3560', edge: '#2c1f3a' });
      },
    },

    cake: {
      name: 'Shortcake',
      draw(c) {
        c.lineJoin = 'round';
        c.strokeStyle = '#4a3a3a'; c.lineWidth = 2.5;
        // sponge
        c.fillStyle = '#f3d9a4';
        c.beginPath(); c.rect(-38, -6, 76, 40); c.fill(); c.stroke();
        // cream layers with strawberry halves
        c.fillStyle = '#fffaf2';
        c.fillRect(-37, 5, 74, 7);
        c.fillStyle = '#d8283f';
        for (const x of [-26, -6, 14, 32]) { c.beginPath(); c.arc(x, 9, 5, Math.PI, 0); c.fill(); }
        c.fillStyle = '#fffaf2';
        c.fillRect(-37, 20, 74, 4);
        // frosting top
        c.fillStyle = '#fffaf2';
        c.beginPath();
        c.moveTo(-40, -4);
        c.quadraticCurveTo(-40, -16, -28, -16);
        c.lineTo(28, -16);
        c.quadraticCurveTo(40, -16, 40, -4);
        c.closePath(); c.fill(); c.stroke();
        // whipped cream dollop
        c.beginPath(); c.arc(4, -22, 11, 0, TAU); c.fill(); c.stroke();
        // strawberry
        c.fillStyle = '#d8283f';
        c.beginPath();
        c.moveTo(4, -50);
        c.bezierCurveTo(18, -50, 16, -34, 4, -26);
        c.bezierCurveTo(-8, -34, -10, -50, 4, -50);
        c.fill(); c.stroke();
        c.fillStyle = '#fff3c4';
        for (const [x, y] of [[0, -44], [8, -42], [4, -36]]) { c.beginPath(); c.arc(x, y, 1.2, 0, TAU); c.fill(); }
        c.fillStyle = '#5b7a4c';
        c.beginPath(); c.ellipse(-2, -51, 6, 2.5, -.4, 0, TAU); c.ellipse(10, -51, 6, 2.5, .4, 0, TAU); c.fill();
      },
    },

    candle: {
      name: 'Candle',
      draw(c) {
        const glow = c.createRadialGradient(0, -32, 2, 0, -32, 24);
        glow.addColorStop(0, 'rgba(255,200,110,.55)');
        glow.addColorStop(1, 'rgba(255,200,110,0)');
        c.fillStyle = glow;
        c.beginPath(); c.arc(0, -32, 24, 0, TAU); c.fill();
        c.fillStyle = '#bdb6be'; c.strokeStyle = '#3a3540'; c.lineWidth = 3;
        c.beginPath(); c.ellipse(0, 40, 26, 7, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#f1e9dc';
        roundRectPath(c, -11, -12, 22, 52, 3); c.fill(); c.stroke();
        c.fillStyle = '#8e1428';
        c.beginPath();
        c.moveTo(-11, -9); c.lineTo(11, -9); c.lineTo(11, 2);
        c.quadraticCurveTo(8, 6, 6, 1); c.lineTo(5, 14);
        c.quadraticCurveTo(2, 18, -1, 14); c.lineTo(-2, 0);
        c.quadraticCurveTo(-6, 8, -11, 3);
        c.closePath(); c.fill();
        c.strokeStyle = '#1b0a10'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(0, -12); c.lineTo(0, -20); c.stroke();
        const fl = c.createLinearGradient(0, -46, 0, -20);
        fl.addColorStop(0, '#ffb347'); fl.addColorStop(1, '#fff7d6');
        c.fillStyle = fl;
        c.beginPath();
        c.moveTo(0, -48);
        c.bezierCurveTo(12, -34, 10, -20, 0, -20);
        c.bezierCurveTo(-10, -20, -12, -34, 0, -48);
        c.fill();
      },
    },

    coffin: {
      name: 'Coffin',
      draw(c) {
        c.beginPath();
        [[-16, -46], [16, -46], [28, -20], [18, 46], [-18, 46], [-28, -20]].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.closePath();
        c.fillStyle = '#1b0a10'; c.fill();
        c.lineWidth = 3; c.strokeStyle = '#e9e6ec'; c.stroke();
        c.lineWidth = 4.5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, -32); c.lineTo(0, 8); c.moveTo(-11, -20); c.lineTo(11, -20); c.stroke();
        c.save(); c.translate(0, 26); c.scale(.2, .2); heartPath(c);
        c.fillStyle = '#e09aa6'; c.fill(); c.restore();
      },
    },

    moon: {
      name: 'Moon',
      draw(c) {
        c.save();
        c.beginPath();
        c.rect(-60, -60, 120, 120);
        c.arc(20, -12, 34, 0, TAU, true);
        c.clip();
        c.beginPath(); c.arc(0, 0, 40, 0, TAU);
        c.fillStyle = '#f3ead2'; c.fill();
        c.lineWidth = 3; c.strokeStyle = '#6b5a3a'; c.stroke();
        c.restore();
        c.strokeStyle = '#6b5a3a'; c.lineWidth = 2.5; c.lineCap = 'round';
        c.beginPath(); c.arc(-24, 2, 5, .15 * Math.PI, .85 * Math.PI); c.stroke();
        c.fillStyle = '#f0a0b0';
        c.beginPath(); c.ellipse(-27, 13, 4.5, 2.6, 0, 0, TAU); c.fill();
        c.fillStyle = '#f3ead2'; c.strokeStyle = '#c9a76a'; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(30, 18); c.quadraticCurveTo(32, 26, 40, 28); c.quadraticCurveTo(32, 30, 30, 38);
        c.quadraticCurveTo(28, 30, 20, 28); c.quadraticCurveTo(28, 26, 30, 18);
        c.fill(); c.stroke();
      },
    },
  };

  function drawSticker(c, type, size, opts) {
    const s = STICKERS[type];
    if (!s) return;
    c.save();
    c.scale(size / 100, size / 100);
    c.lineJoin = 'round';
    s.draw(c, opts || {});
    c.restore();
  }

  KB.STICKERS = STICKERS;
  KB.drawSticker = drawSticker;
  KB.pearl = pearl;
  KB.heartPath = heartPath;
})(window.KB);
