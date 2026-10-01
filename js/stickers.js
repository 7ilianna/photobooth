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
      draw(c) {
        const pts = [[-8, -46], [8, -46], [8, -24], [30, -24], [30, -8], [8, -8], [8, 46], [-8, 46], [-8, -8], [-30, -8], [-30, -24], [-8, -24]];
        c.beginPath();
        pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.closePath();
        c.fillStyle = '#1b0a10'; c.fill();
        c.lineWidth = 3; c.strokeStyle = '#c9a76a'; c.stroke();
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
      name: 'Coffee',
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
        c.fillStyle = '#4a2a1d';
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
      draw(c) {
        c.fillStyle = '#3f5a3a'; c.strokeStyle = '#1f2e1c'; c.lineWidth = 2.5;
        for (const [x, r] of [[-28, -.6], [28, .6]]) {
          c.beginPath(); c.ellipse(x, 28, 20, 8, r, 0, TAU); c.fill(); c.stroke();
        }
        c.beginPath(); c.arc(0, 0, 34, 0, TAU);
        c.fillStyle = '#8e1428'; c.fill();
        c.lineWidth = 3; c.strokeStyle = '#3b0611'; c.stroke();
        c.strokeStyle = '#4d0915'; c.lineWidth = 4; c.lineCap = 'round';
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
