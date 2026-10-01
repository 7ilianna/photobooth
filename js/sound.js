/* A tiny music-box chime for button presses, synthesised with Web Audio
 * so there is no sound file to load. Each press plays one of a few short
 * three-note tunes. The on/off choice is remembered per browser. */
window.KB = window.KB || {};

(function (KB) {
  let ctx = null;
  let on = true;
  try { on = localStorage.getItem('bisque-sound') !== 'off'; } catch (_) { /* storage blocked */ }

  // Three-note music-box phrases (Hz), high and sparkly
  const TUNES = [
    [1318.5, 1661.2, 1975.5],
    [1568.0, 1975.5, 2349.3],
    [1760.0, 2093.0, 2637.0],
    [1318.5, 1975.5, 2637.0],
    [2093.0, 1661.2, 1318.5],
    [1975.5, 2349.3, 1975.5],
  ];

  // One plucked note: a sine fundamental plus two fading bell partials
  function bell(freq, t, out) {
    for (const [mult, amp, decay] of [[1, 1, 0.9], [2.01, 0.35, 0.5], [3.98, 0.12, 0.25]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + decay + 0.05);
    }
  }

  function chime() {
    if (!on) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
      return;
    }
    if (ctx.state === 'suspended') ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0.09;
    master.connect(ctx.destination);
    const tune = TUNES[Math.floor(Math.random() * TUNES.length)];
    const t0 = ctx.currentTime + 0.01;
    tune.forEach((f, i) => bell(f, t0 + i * 0.075, master));
  }

  KB.sound = {
    chime,
    get on() { return on; },
    set(value) {
      on = value;
      try { localStorage.setItem('bisque-sound', value ? 'on' : 'off'); } catch (_) { /* storage blocked */ }
    },
  };
})(window.KB);
