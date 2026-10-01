/* Sounds, all synthesised with Web Audio so there are no files to load:
 *  - a music-box chime for button presses, and single notes for page turns
 *  - an old camera: shutter click and film-winding ratchet
 *  - an ambient bed: soft wind and a slow music-box lullaby
 * Chimes and the lullaby each have their own on/off switch, remembered per
 * browser. Browsers only allow sound after the first tap or click. */
window.KB = window.KB || {};

(function (KB) {
  let ctx = null;
  const read = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const write = (key, v) => { try { localStorage.setItem(key, v); } catch (_) { /* storage blocked */ } };
  let on = read('bisque-sound') !== 'off';
  let ambOn = read('bisque-ambience') !== 'off';

  function audio() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

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
  function bell(freq, t, out, length) {
    const k = length || 1;
    for (const [mult, amp, decay] of [[1, 1, 0.9 * k], [2.01, 0.35, 0.5 * k], [3.98, 0.12, 0.25 * k]]) {
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

  function bus(level) {
    const g = ctx.createGain();
    g.gain.value = level;
    g.connect(ctx.destination);
    return g;
  }

  function chime() {
    if (!on || !audio()) return;
    const tune = TUNES[Math.floor(Math.random() * TUNES.length)];
    const t0 = ctx.currentTime + 0.01;
    const out = bus(0.09);
    tune.forEach((f, i) => bell(f, t0 + i * 0.075, out));
  }

  // A single plucked note (page turns, cards, little moments)
  function note(freq, delay) {
    if (!on || !audio()) return;
    bell(freq, ctx.currentTime + 0.01 + (delay || 0), bus(0.08));
  }

  // A short burst of filtered noise: the building block of mechanical sounds
  let noiseBuf = null;
  function noise(t, dur, freq, q, level, out) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  // An old camera: two clicks of the shutter, then the film winding on
  function shutter() {
    if (!on || !audio()) return;
    const t = ctx.currentTime + 0.01;
    const out = bus(0.5);
    noise(t, 0.05, 3200, 0.8, 0.9, out);
    noise(t + 0.075, 0.07, 1800, 1.2, 0.7, out);
    for (let i = 0; i < 9; i++) noise(t + 0.32 + i * 0.045, 0.025, 2400 + i * 120, 4, 0.35, out);
  }

  /* ───────── the ambient bed: wind and a slow lullaby ───────── */
  // A slow, slightly sad music-box melody (Hz; 0 is a rest)
  const LULLABY = [
    1318.5, 0, 1174.7, 1046.5, 0, 987.8, 880.0, 0,
    1046.5, 0, 987.8, 880.0, 0, 830.6, 880.0, 0, 0,
    1318.5, 0, 1568.0, 1318.5, 0, 1174.7, 1046.5, 0,
    987.8, 0, 1046.5, 880.0, 0, 0, 0,
  ];
  let amb = null;

  function startAmbience() {
    if (!ambOn || amb || !audio()) return;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 3);
    master.connect(ctx.destination);

    // wind: looping noise through a slowly wandering band-pass filter
    noise(ctx.currentTime, 0.001, 1000, 1, 0.0001, master); // makes sure the noise buffer exists
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuf;
    wind.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.frequency.value = 420;
    wf.Q.value = 0.7;
    const wg = ctx.createGain();
    wg.gain.value = 0.022;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 220;
    lfo.connect(lfoAmt); lfoAmt.connect(wf.frequency);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.045;
    const lfo2Amt = ctx.createGain();
    lfo2Amt.gain.value = 0.012;
    lfo2.connect(lfo2Amt); lfo2Amt.connect(wg.gain);
    wind.connect(wf); wf.connect(wg); wg.connect(master);
    wind.start(); lfo.start(); lfo2.start();

    // lullaby: a soft, low-passed music box a long way off
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    const lg = ctx.createGain();
    lg.gain.value = 0.035;
    lp.connect(lg); lg.connect(master);
    let i = 0;
    const timer = setInterval(() => {
      const f = LULLABY[i++ % LULLABY.length];
      if (f) bell(f, ctx.currentTime + 0.02, lp, 2.2);
    }, 640);

    amb = { master, nodes: [wind, lfo, lfo2], timer };
  }

  function stopAmbience() {
    if (!amb) return;
    const a = amb;
    amb = null;
    clearInterval(a.timer);
    a.master.gain.cancelScheduledValues(ctx.currentTime);
    a.master.gain.setValueAtTime(a.master.gain.value, ctx.currentTime);
    a.master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    setTimeout(() => a.nodes.forEach((n) => { try { n.stop(); } catch (_) { /* already stopped */ } }), 1400);
  }

  // Quiet while the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAmbience(); else if (ambOn && ctx) startAmbience();
  });

  KB.sound = {
    chime,
    note,
    shutter,
    startAmbience,
    get on() { return on; },
    set(value) { on = value; write('bisque-sound', value ? 'on' : 'off'); },
    get ambience() { return ambOn; },
    setAmbience(value) {
      ambOn = value;
      write('bisque-ambience', value ? 'on' : 'off');
      if (value) startAmbience(); else stopAmbience();
    },
  };
})(window.KB);
