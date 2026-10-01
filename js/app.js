(function () {
  const { THEMES, PRINT, PHOTO_ASPECT, FILTERS, STICKERS, renderStrip, applyFilter, pixelate, drawSticker, loadOverlays, sound } = window.KB;

  const $ = (s, r = document) => r.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const COUNT = PRINT.slots.length;
  const SHOT_H = 960, SHOT_W = Math.round(SHOT_H * PHOTO_ASPECT);
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  const state = {
    theme: Object.keys(THEMES)[0],
    tone: 'black',      // border colour for the Plain frame
    filter: 'digicam',
    intensity: 1,       // 0–1, shared by every filter
    timer: 3,
    shots: [],          // raw 3:4 canvases, mirrored like a mirror
    shotsVersion: 0,
    filtered: [],
    filteredKey: '',
    stickers: [],
    selected: -1,
    caption: 'Bisque',
    showDate: true,
    stamp: false,
  };

  const ready = () => {
    for (let i = 0; i < COUNT; i++) if (!state.shots[i]) return false;
    return true;
  };

  /* ───────── toast ───────── */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ───────── router (#/themes, #/booth, #/result) ───────── */
  const SCREENS = ['home', 'themes', 'booth', 'result'];
  let current = null;

  function route() {
    let name = location.hash.replace(/^#\/?/, '') || 'home';
    if (!SCREENS.includes(name)) name = 'home';
    if (name === 'result' && !ready()) {
      if (current !== 'booth') toast('take your photos first, darling ♡');
      location.replace('#/booth');
      return;
    }
    if (current === 'booth' && name !== 'booth') stopCamera();
    current = name;
    for (const s of SCREENS) $('#screen-' + s).hidden = s !== name;
    document.body.dataset.screen = name;
    document.querySelectorAll('.steps a').forEach((a) => a.classList.toggle('active', a.dataset.step === name));
    window.scrollTo(0, 0);
    if (name === 'home') showTitleMenu(false);
    if (name === 'themes') renderThemes();
    if (name === 'booth') enterBooth();
    if (name === 'result') enterResult();
  }

  function pressed(el, on) { el.setAttribute('aria-pressed', on ? 'true' : 'false'); }

  /* ───────── title screen: Press START opens the menu ───────── */
  function showTitleMenu(show) {
    $('#press-start').hidden = show;
    $('#title-menu').hidden = !show;
    if (show) $('#title-menu a').focus();
  }
  $('#press-start').addEventListener('click', (e) => { e.preventDefault(); showTitleMenu(true); });
  document.addEventListener('keydown', (e) => {
    if (current !== 'home' || !$('#dialog').hidden) return;
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a, button, input')) {
      e.preventDefault();
      showTitleMenu(true);
    }
  });

  /* ───────── How to Play / Credits dialogs ───────── */
  const DIALOGS = { howto: 'How to Play', credits: 'Credits' };
  let dialogReturn = null;
  function openDialog(name) {
    dialogReturn = document.activeElement;
    $('#dialog-title').textContent = DIALOGS[name];
    const body = $('#dialog-body');
    body.innerHTML = '';
    body.append($('#tpl-' + name).content.cloneNode(true));
    $('#dialog').hidden = false;
    $('#dialog-close').focus();
  }
  function closeDialog() {
    $('#dialog').hidden = true;
    if (dialogReturn) dialogReturn.focus();
  }
  document.querySelectorAll('[data-dialog]').forEach((b) => b.addEventListener('click', () => openDialog(b.dataset.dialog)));
  $('#dialog-close').addEventListener('click', closeDialog);
  $('#dialog').addEventListener('click', (e) => { if (e.target.id === 'dialog') closeDialog(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#dialog').hidden) closeDialog(); });


  /* ───────── frame select: a lace-covered diary ───────── */
  // The diary opens to one spread per frame: a dated entry on the left and the
  // frame's photograph on the right. Pages turn in 3D; Plain sits underneath.
  const deckIds = Object.keys(THEMES).filter((id) => !THEMES[id].plain);
  const plainId = Object.keys(THEMES).find((id) => THEMES[id].plain);
  const N = deckIds.length;
  const diary = $('#diary');
  const leaf = $('#leaf');
  const pageL = $('#page-left');
  const pageR = $('#page-right');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const single = () => window.matchMedia('(max-width: 720px)').matches;
  const isPlain = () => !!THEMES[state.theme].plain;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const TILTS = [-2.5, 1.8, -1.2, 2.2];

  let spread = 0;        // which frame's spread is open
  let opened = false;    // has the cover been opened?
  let picked = false;    // has anything been chosen yet?
  let turning = false;

  // One chime per action, however fast things happen
  let lastChime = 0;
  function chime() {
    const now = performance.now();
    if (now - lastChime < 140) return;
    lastChime = now;
    sound.chime();
  }

  function entryDate(i) {
    const d = new Date();
    d.setDate(d.getDate() - (N - i) * 9);
    return `the ${ordinal(d.getDate())} of ${MONTHS[d.getMonth()]}`;
  }

  function entryHTML(i) {
    const t = THEMES[deckIds[i]];
    return `<div class="entry">
        <p class="entry-date">${entryDate(i)}</p>
        <p class="entry-dear">Dear diary,</p>
        <p class="entry-text">${t.bio || ''}</p>
        <p class="entry-ps">P.S. ${t.fortune || ''}</p>
        <span class="entry-bow" aria-hidden="true"></span>
        <span class="page-num">${2 * i + 1}</span>
      </div>`;
  }

  function photoHTML(i) {
    const id = deckIds[i], t = THEMES[id];
    const chosen = picked && state.theme === id;
    return `<div class="photo-page${chosen ? ' is-chosen' : ''}">
        <p class="entry-date entry-mini">${entryDate(i)}</p>
        <figure class="photo" style="--tilt:${TILTS[i % TILTS.length]}deg">
          <span class="photo-tape" aria-hidden="true"></span>
          <canvas data-theme="${id}" aria-hidden="true"></canvas>
          <span class="pc pc-tl"></span><span class="pc pc-tr"></span><span class="pc pc-bl"></span><span class="pc pc-br"></span>
          <span class="photo-flash" aria-hidden="true"></span>
        </figure>
        <p class="photo-cap"><b>${t.name}</b><i>${t.tagline || ''}</i></p>
        <p class="entry-ps entry-mini">P.S. ${t.fortune || ''}</p>
        <button class="choose-btn" type="button" data-choose="${id}" aria-pressed="${chosen}">${chosen ? 'chosen ♡' : 'choose this photograph'}</button>
        <span class="bookmark" aria-hidden="true"></span>
        <span class="stamp" aria-hidden="true">chosen</span>
        <span class="page-num">${2 * i + 2}</span>
      </div>`;
  }

  function setPage(el, html) {
    el.innerHTML = html;
    el.querySelectorAll('canvas[data-theme]').forEach((cv) => {
      renderStrip(cv, { theme: cv.dataset.theme, scale: 0.24, caption: state.caption, showDate: false });
    });
    el.querySelectorAll('[data-choose]').forEach((b) => b.addEventListener('click', () => choosePhoto(b.dataset.choose)));
  }

  function showSpread(i) {
    setPage(pageL, entryHTML(i));
    setPage(pageR, photoHTML(i));
    $('#page-no').textContent = `photograph ${i + 1} of ${N}`;
    $('#page-prev').disabled = i === 0;
    $('#page-next').disabled = i === N - 1;
  }

  async function openDiary() {
    if (opened) return;
    opened = true;
    showSpread(spread);
    diary.dataset.state = 'opening';
    [1046.5, 1318.5, 1568.0].forEach((f, k) => sound.note(f, k * 0.16));
    await wait(1400);
    diary.dataset.state = 'open';
    speak(picked && !isPlain()
      ? `You chose ${THEMES[state.theme].name}. Turn the pages if your heart has changed…`
      : 'Turn the pages, darling. Choose the photograph you like best…');
  }
  $('#book-cover').addEventListener('click', openDiary);

  // Turn one page forwards (d = 1) or backwards (d = -1)
  async function turn(d) {
    const to = spread + d;
    if (turning || !opened || to < 0 || to >= N) return;
    turning = true;
    sound.note(d > 0 ? 1568.0 : 1318.5);
    const one = single();
    const front = leaf.querySelector('.leaf-front');
    const back = leaf.querySelector('.leaf-back');
    leaf.className = `leaf ${one ? 'one' : d > 0 ? 'fwd' : 'bwd'}`;
    let from = 'rotateY(0deg)', target;
    if (one) {
      if (d > 0) { setPage(front, photoHTML(spread)); back.innerHTML = ''; setPage(pageR, photoHTML(to)); target = 'rotateY(-180deg)'; }
      else { setPage(front, photoHTML(to)); back.innerHTML = ''; from = 'rotateY(-180deg)'; target = 'rotateY(0deg)'; }
    } else if (d > 0) {
      setPage(front, photoHTML(spread)); setPage(back, entryHTML(to)); setPage(pageR, photoHTML(to)); target = 'rotateY(-180deg)';
    } else {
      setPage(front, entryHTML(spread)); setPage(back, photoHTML(to)); setPage(pageL, entryHTML(to)); target = 'rotateY(180deg)';
    }
    leaf.style.transform = from;
    leaf.hidden = false;
    void leaf.offsetWidth;
    leaf.classList.add('is-turning');
    leaf.style.transform = target;
    await wait(1000);
    spread = to;
    showSpread(to);
    leaf.hidden = true;
    leaf.classList.remove('is-turning');
    turning = false;
    speak(THEMES[deckIds[to]].fortune);
  }
  $('#page-prev').addEventListener('click', () => turn(-1));
  $('#page-next').addEventListener('click', () => turn(1));
  diary.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
  });
  let swipeX = null;
  $('#book').addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
  $('#book').addEventListener('pointerup', (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1);
  });

  function choosePhoto(id) {
    picked = true;
    state.theme = id;
    syncPlainButtons();
    renderProfile();
    setPage(pageR, photoHTML(spread));
    const ph = pageR.querySelector('.photo');
    if (ph && !reduceMotion) ph.classList.add('is-flash');
    sound.shutter();
    speak(`${THEMES[id].name}… a lovely choice. The camera is ready whenever you are ♡`);
  }

  // The diary speaks, like a PS2 dialogue box
  let speakToken = 0;
  function speak(text) {
    const token = ++speakToken;
    const typed = $('#fortune-typed');
    const box = $('#fortune');
    $('#fortune-full').textContent = text;
    box.classList.remove('is-done');
    if (reduceMotion) { typed.textContent = text; box.classList.add('is-done'); return; }
    typed.textContent = '';
    let i = 0;
    (function step() {
      if (token !== speakToken) return;
      typed.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, text[i - 1] === '.' || text[i - 1] === '…' ? 140 : 26);
      else box.classList.add('is-done');
    })();
  }

  function renderThemes() {
    if (picked && !isPlain()) spread = deckIds.indexOf(state.theme);
    if (opened) showSpread(spread);
    diary.dataset.state = opened ? 'open' : 'closed';
    document.querySelectorAll('.plain-opt').forEach((b) => {
      renderStrip(b.querySelector('canvas'), { theme: plainId, tone: b.dataset.plain, scale: 0.1, caption: state.caption, showDate: false });
    });
    syncPlainButtons();
    renderProfile();
    if (!opened) speak('A diary, tied with a silver ribbon. Open it, if you like…');
    else if (picked) speak(isPlain() ? THEMES[plainId].fortune : `Welcome back. ${THEMES[state.theme].name} is still waiting for you ♡`);
  }

  function renderProfile() {
    const t = THEMES[state.theme];
    $('#profile').hidden = !picked;
    const toneName = state.tone === 'white' ? 'White' : 'Black';
    $('#profile-no').textContent = t.plain ? 'Plain photograph' : `Photograph ${deckIds.indexOf(state.theme) + 1} of ${N}`;
    $('#profile-name').textContent = t.plain ? `Plain ${toneName}` : t.name;
    $('#profile-tagline').textContent = t.tagline || '';
    $('#profile-bio').textContent = t.bio || '';
    $('#profile-cv').textContent = t.cv ? `CV: ${t.cv}` : '';

    const pips = (n, glyph) => `${glyph.repeat(n)}<i>${glyph.repeat(5 - n)}</i>`;
    $('#profile-meters').innerHTML =
      `<div class="meter"><span>Sweetness</span><b aria-label="${t.sweetness || 0} of 5">${pips(t.sweetness || 0, '♡')}</b></div>` +
      `<div class="meter"><span>Gloom</span><b aria-label="${t.gloom || 0} of 5">${pips(t.gloom || 0, '✝')}</b></div>`;

    const look = t.look && FILTERS[t.look.filter];
    const rows = [
      ['Poses', 'four · two by two'],
      ['Size', '1080 × 1350 · Instagram post'],
      t.mood && ['Mood', t.mood],
      t.motifs && ['Motifs', t.motifs],
      look && ['Pairs with', `${look.name}${t.look.filter === 'natural' ? '' : ` · ${Math.round(t.look.intensity * 100)}%`}`],
    ].filter(Boolean);
    $('#profile-stats').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('#profile-look').hidden = !look;
    $('#coming-soon').hidden = !Object.values(THEMES).some((x) => x.placeholder && !x.image);
  }

  // Plain Black / Plain White, under the diary
  function syncPlainButtons() {
    const plain = isPlain() && picked;
    document.querySelectorAll('.plain-opt').forEach((b) => pressed(b, plain && b.dataset.plain === state.tone));
  }
  document.querySelectorAll('.plain-opt').forEach((b) => b.addEventListener('click', () => {
    picked = true;
    state.theme = plainId;
    state.tone = b.dataset.plain;
    if (opened) setPage(pageR, photoHTML(spread));
    syncPlainButtons();
    renderProfile();
    speak(THEMES[plainId].fortune);
  }));

  // Plain border colour on the print screen
  function setTone(tone) {
    state.tone = tone;
    document.querySelectorAll('[data-tone]').forEach((b) => pressed(b, b.dataset.tone === tone));
    if (current === 'result') drawResult();
  }
  document.querySelectorAll('[data-tone]').forEach((b) => b.addEventListener('click', () => setTone(b.dataset.tone)));

  /* ───────── ribbons and lace scraps drifting through the fog ───────── */
  (function spawnFloaters() {
    if (reduceMotion) return;
    const host = $('#floaters');
    const kinds = ['bow', 'curl', 'lace', 'rosette', 'bow', 'lace', 'curl', 'rosette', 'bow'];
    const count = window.innerWidth < 600 ? 9 : 18;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = `floater f-${kinds[i % kinds.length]}`;
      const r = Math.random;
      s.style.cssText = [
        `--x:${(r() * 100).toFixed(1)}vw`,
        `--w:${(18 + r() * 34).toFixed(0)}px`,
        `--dur:${(24 + r() * 28).toFixed(1)}s`,
        `--delay:${(-r() * 50).toFixed(1)}s`,
        `--sway:${((r() * 2 - 1) * (40 + r() * 70)).toFixed(0)}px`,
        `--spin:${((r() < 0.5 ? -1 : 1) * (0.4 + r() * 1.1)).toFixed(2)}`,
        `--o:${(0.45 + r() * 0.45).toFixed(2)}`,
      ].join(';');
      host.append(s);
    }
  })();

  // The filament glows whenever the cursor is near something you can touch
  document.addEventListener('pointerover', (e) => {
    document.body.classList.toggle('is-sensing', !!e.target.closest('a, button, label, input, .photo, #result-canvas'));
  });

  $('#profile-look').addEventListener('click', () => {
    const look = THEMES[state.theme].look;
    if (!look) return;
    state.filter = look.filter;
    state.intensity = look.intensity;
    toast(`${FILTERS[look.filter].name} at ${Math.round(look.intensity * 100)}% ♡ ready in the booth`);
  });

  /* ───────── chips (filters / timers) ───────── */
  function renderChips(el, items, isOn, onPick) {
    el.innerHTML = '';
    for (const [value, label] of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.innerHTML = label;
      pressed(b, isOn(value));
      b.addEventListener('click', () => {
        onPick(value);
        el.querySelectorAll('.chip').forEach((x) => pressed(x, x === b));
      });
      el.append(b);
    }
  }
  const filterItems = () => Object.entries(FILTERS).map(([id, f]) => [id, f.name]);

  /* ───────── camera ───────── */
  const video = $('#video');
  let stream = null;

  async function startCamera() {
    const msg = $('#cam-msg');
    if (stream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msg.hidden = false;
      msg.innerHTML = '<p>This browser can’t open a camera here (it needs https). You can still <b>upload photos</b> below ♡</p>';
      return;
    }
    msg.hidden = false;
    msg.innerHTML = '<p class="loading">Now Loading<span>.</span><span>.</span><span>.</span><br><small>please allow camera access</small></p>';
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      if (current !== 'booth') { s.getTracks().forEach((t) => t.stop()); return; }
      stream = s;
      video.srcObject = s;
      await video.play().catch(() => {});
      msg.hidden = true;
    } catch (err) {
      msg.hidden = false;
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      msg.innerHTML = denied
        ? '<p>Camera access was refused. Allow it in your browser settings, or <b>upload photos</b> instead ♡</p>'
        : '<p>No camera found… but you can <b>upload photos</b> instead ♡</p>';
    }
    updateBoothButtons();
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
  }

  // Centre crop of a sw×sh source at the photo aspect.
  function centreCrop(sw, sh) {
    let w = sw, h = sh;
    if (sw / sh > PHOTO_ASPECT) w = sh * PHOTO_ASPECT; else h = sw / PHOTO_ASPECT;
    return { x: (sw - w) / 2, y: (sh - h) / 2, w, h };
  }

  // Crop to the photo aspect from the centre, mirrored to match the preview.
  function grab(source, sw, sh, mirror) {
    const cv = document.createElement('canvas');
    cv.width = SHOT_W; cv.height = SHOT_H;
    const c = cv.getContext('2d');
    const r = centreCrop(sw, sh);
    if (mirror) { c.translate(SHOT_W, 0); c.scale(-1, 1); }
    c.drawImage(source, r.x, r.y, r.w, r.h, 0, 0, SHOT_W, SHOT_H);
    return cv;
  }

  /* ───────── booth ───────── */
  let busy = false;

  function enterBooth() {
    renderChips($('#filter-chips'), filterItems(), (v) => v === state.filter, (v) => {
      state.filter = v;
      filterChanged();
    });
    syncIntensity();
    renderChips($('#timer-chips'), [[3, '3 sec'], [5, '5 sec'], [10, '10 sec']], (v) => v === state.timer, (v) => { state.timer = v; });
    applyPreviewFilter();
    renderTray();
    tickHud();
    updateBoothButtons();
    startCamera();
  }

  function applyPreviewFilter() {
    video.style.filter = FILTERS[state.filter].css(state.intensity);
    startPixelPreview();
  }

  // The Pixel filter can't be done in CSS, so draw the camera into a canvas.
  const pixelCanvas = $('#pixel-preview');
  pixelCanvas.width = SHOT_W; pixelCanvas.height = SHOT_H;
  let pixelRaf = 0;
  function startPixelPreview() {
    if (!pixelRaf) pixelRaf = requestAnimationFrame(pixelFrame);
  }
  function pixelFrame() {
    pixelRaf = 0;
    const on = current === 'booth' && stream && FILTERS[state.filter].pixel && video.videoWidth > 0;
    pixelCanvas.hidden = !on;
    if (!on) return;
    pixelate(video, centreCrop(video.videoWidth, video.videoHeight), pixelCanvas, state.intensity, true);
    pixelRaf = requestAnimationFrame(pixelFrame);
  }

  /* ───────── intensity slider (shared by booth and print screens) ───────── */
  const amountInputs = [$('#filter-amount'), $('#result-filter-amount')];
  function syncIntensity() {
    const f = FILTERS[state.filter];
    const off = !f.ops.length && !f.pixel; // Natural has nothing to adjust
    for (const input of amountInputs) {
      input.value = Math.round(state.intensity * 100);
      input.disabled = off;
      input.closest('.amount').classList.toggle('is-off', off);
      input.closest('.amount').querySelector('output').textContent = off ? '—' : `${input.value}%`;
    }
  }

  // Re-filtering four full-size photos is heavy, so coalesce slider drags.
  let refilterTimer = 0;
  function filterChanged() {
    syncIntensity();
    if (current === 'booth') {
      applyPreviewFilter();
      clearTimeout(refilterTimer);
      refilterTimer = setTimeout(renderTray, 60);
    } else if (current === 'result') {
      clearTimeout(refilterTimer);
      refilterTimer = setTimeout(() => { ensureFiltered(); drawResult(); }, 40);
    }
  }

  for (const input of amountInputs) {
    input.addEventListener('input', () => {
      state.intensity = input.value / 100;
      filterChanged();
    });
  }

  function renderTray() {
    const tray = $('#tray');
    tray.innerHTML = '';
    for (let i = 0; i < COUNT; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'thumb';
      const shot = state.shots[i];
      if (shot) {
        b.classList.add('has-shot');
        b.setAttribute('aria-label', `Retake photo ${i + 1}`);
        const small = document.createElement('canvas');
        small.width = 192; small.height = 240;
        small.getContext('2d').drawImage(shot, 0, 0, 192, 240);
        b.append(applyFilter(small, state.filter, state.intensity));
        b.addEventListener('click', () => {
          if (busy) return;
          if (!stream) { toast('no camera — upload a photo to replace it ♡'); return; }
          shoot([i]);
        });
      } else {
        b.setAttribute('aria-label', `Photo ${i + 1} (empty)`);
        b.tabIndex = -1;
      }
      const n = document.createElement('span');
      n.textContent = ROMAN[i];
      b.append(n);
      tray.append(b);
    }
    const done = state.shots.slice(0, COUNT).filter(Boolean).length;
    $('#hud-count').textContent = COUNT - done;
    $('#tray-hint').textContent = done === COUNT
      ? 'all done! tap a photo to retake it'
      : `${done} of ${COUNT} photos`;
  }

  // Live clock in the viewfinder, ticking only while the booth is open
  const pad = (n) => String(n).padStart(2, '0');
  function tickHud() {
    const d = new Date();
    $('#hud-date').textContent = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  setInterval(() => { if (current === 'booth') tickHud(); }, 1000);

  function updateBoothButtons() {
    const start = $('#btn-start');
    start.disabled = busy || !stream;
    start.textContent = ready() ? 'Retake all ↻' : 'Start ♡';
    $('#btn-next').setAttribute('aria-disabled', busy || !ready() ? 'true' : 'false');
  }

  const capCharge = $('#cap-charge');
  const CIRC = 2 * Math.PI * 38;
  capCharge.style.strokeDasharray = CIRC.toFixed(1);
  capCharge.style.strokeDashoffset = CIRC.toFixed(1);

  // Camera Obscura: the capture ring charges, then "Shutter Chance"
  async function countdown(n) {
    const el = $('#countdown');
    const vf = $('.viewfinder');
    vf.classList.add('is-charging');
    capCharge.style.transition = 'none';
    capCharge.style.strokeDashoffset = CIRC.toFixed(1);
    void capCharge.getBoundingClientRect();
    capCharge.style.transition = `stroke-dashoffset ${n}s linear`;
    capCharge.style.strokeDashoffset = '0';
    el.hidden = false;
    for (let k = n; k > 0; k--) {
      el.textContent = k;
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
      await sleep(1000);
      if (!stream) break;
    }
    el.hidden = true;
    if (stream) {
      const sc = $('#shutter-chance');
      sc.hidden = false;
      sc.classList.remove('go');
      void sc.offsetWidth;
      sc.classList.add('go');
      await sleep(450);
      sc.hidden = true;
    }
    vf.classList.remove('is-charging');
    capCharge.style.transition = 'stroke-dashoffset .5s ease';
    capCharge.style.strokeDashoffset = CIRC.toFixed(1);
  }

  function flash() {
    const f = $('#flash');
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }

  async function shoot(indices) {
    if (busy || !stream) return;
    busy = true;
    updateBoothButtons();
    const label = $('#shot-label');
    for (const i of indices) {
      label.hidden = false;
      label.textContent = `pose ${ROMAN[i]} of IV ♡`;
      await countdown(state.timer);
      if (!stream || !video.videoWidth) break;
      state.shots[i] = grab(video, video.videoWidth, video.videoHeight, true);
      state.shotsVersion++;
      flash();
      sound.shutter();
      renderTray();
      await sleep(800);
    }
    label.hidden = true;
    busy = false;
    updateBoothButtons();
    if (ready() && current === 'booth') toast('beautiful! ready to decorate ✦');
  }

  $('#btn-start').addEventListener('click', () => {
    shoot(Array.from({ length: COUNT }, (_, i) => i));
  });

  $('#btn-next').addEventListener('click', (e) => {
    if ($('#btn-next').getAttribute('aria-disabled') === 'true') e.preventDefault();
  });

  $('#upload').addEventListener('change', async (e) => {
    const files = [...e.target.files].filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (!files.length || busy) return;
    // fill empty slots first; if everything is full, replace from the start
    const empty = [];
    for (let i = 0; i < COUNT; i++) if (!state.shots[i]) empty.push(i);
    const targets = empty.length ? empty : Array.from({ length: COUNT }, (_, i) => i);
    let used = 0;
    for (const file of files.slice(0, targets.length)) {
      try {
        const img = await loadImage(file);
        state.shots[targets[used]] = grab(img, img.naturalWidth || img.width, img.naturalHeight || img.height, false);
        used++;
      } catch (_) {
        toast('couldn’t read one of those images');
      }
    }
    if (used) {
      state.shotsVersion++;
      renderTray();
      updateBoothButtons();
      toast(ready() ? 'all set! ready to decorate ✦' : `added ${used} photo${used > 1 ? 's' : ''} ♡`);
    }
  });

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
      img.src = url;
    });
  }

  /* ───────── result ───────── */
  const canvas = $('#result-canvas');

  function ensureFiltered() {
    const key = `${state.filter}|${state.intensity}|${state.shotsVersion}`;
    if (key === state.filteredKey) return;
    state.filtered = state.shots.slice(0, COUNT).map((s) => applyFilter(s, state.filter, state.intensity));
    state.filteredKey = key;
  }

  function printOptions(selected) {
    return {
      theme: state.theme,
      tone: state.tone,
      shots: state.filtered,
      stickers: state.stickers,
      selected,
      caption: state.caption,
      showDate: state.showDate,
      stamp: state.stamp,
    };
  }

  let rafPending = false;
  function drawResult() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      renderStrip(canvas, printOptions(state.selected));
    });
  }

  function enterResult() {
    ensureFiltered();
    renderThemeSwatches();
    $('#theme-control').hidden = Object.keys(THEMES).length < 2;
    syncCaptionControl();
    renderChips($('#result-filter-chips'), filterItems(), (v) => v === state.filter, (v) => {
      state.filter = v;
      filterChanged();
    });
    syncIntensity();
    $('#caption').value = state.caption;
    $('#show-date').checked = state.showDate;
    $('#show-stamp').checked = state.stamp;
    renderStickerPalette();
    syncStickerEdit();
    drawResult();
  }

  // Frames whose art fills the bottom strip have no caption or date
  function syncCaptionControl() {
    $('#caption-control').hidden = THEMES[state.theme].footer === false;
  }

  function renderThemeSwatches() {
    const el = $('#theme-swatches');
    el.innerHTML = '';
    Object.entries(THEMES).forEach(([id, t], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.title = t.name;
      b.setAttribute('aria-label', t.name);
      b.textContent = ROMAN[i];
      b.style.background = t.plain ? 'linear-gradient(135deg, #0a0a0b 50%, #f7f6f3 50%)' : t.bg;
      b.style.color = t.plain ? '#888' : t.ink;
      pressed(b, id === state.theme);
      b.addEventListener('click', () => {
        state.theme = id;
        el.querySelectorAll('.swatch').forEach((x) => pressed(x, x === b));
        syncCaptionControl();
        syncToneControl();
        drawResult();
      });
      el.append(b);
    });
    syncToneControl();
  }

  function syncToneControl() {
    $('#result-tone').hidden = !THEMES[state.theme].plain;
    document.querySelectorAll('#result-tone [data-tone]').forEach((b) => pressed(b, b.dataset.tone === state.tone));
  }

  let paletteBuilt = false;
  function renderStickerPalette() {
    if (paletteBuilt) return;
    paletteBuilt = true;
    const el = $('#sticker-palette');
    for (const [type, s] of Object.entries(STICKERS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sticker-btn';
      b.title = s.name;
      b.setAttribute('aria-label', `Add ${s.name} sticker`);
      const cv = document.createElement('canvas');
      cv.width = cv.height = 96;
      const c = cv.getContext('2d');
      c.translate(48, 48);
      drawSticker(c, type, 82);
      b.append(cv);
      b.addEventListener('click', () => addSticker(type));
      el.append(b);
    }
  }

  function addSticker(type) {
    state.stickers.push({
      type,
      x: PRINT.w / 2 + (Math.random() - 0.5) * PRINT.w * 0.4,
      y: PRINT.h * (0.15 + Math.random() * 0.6),
      size: Math.round(PRINT.w * 0.15),
      rot: Math.round((Math.random() - 0.5) * 30),
    });
    state.selected = state.stickers.length - 1;
    syncStickerEdit();
    drawResult();
  }

  function syncStickerEdit() {
    const st = state.stickers[state.selected];
    $('#sticker-edit').hidden = !st;
    $('#sticker-clear').hidden = !state.stickers.length;
    if (st) {
      $('#sticker-size').value = st.size;
      $('#sticker-rot').value = st.rot;
    }
  }

  $('#sticker-size').addEventListener('input', (e) => {
    const st = state.stickers[state.selected];
    if (st) { st.size = +e.target.value; drawResult(); }
  });
  $('#sticker-rot').addEventListener('input', (e) => {
    const st = state.stickers[state.selected];
    if (st) { st.rot = +e.target.value; drawResult(); }
  });
  $('#sticker-del').addEventListener('click', removeSelected);
  $('#sticker-front').addEventListener('click', () => {
    const st = state.stickers[state.selected];
    if (!st) return;
    state.stickers.splice(state.selected, 1);
    state.stickers.push(st);
    state.selected = state.stickers.length - 1;
    drawResult();
  });
  $('#sticker-clear').addEventListener('click', () => {
    state.stickers = [];
    state.selected = -1;
    syncStickerEdit();
    drawResult();
  });

  function removeSelected() {
    if (state.selected < 0) return;
    state.stickers.splice(state.selected, 1);
    state.selected = -1;
    syncStickerEdit();
    drawResult();
  }

  document.addEventListener('keydown', (e) => {
    if (current !== 'result' || state.selected < 0) return;
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); }
    if (e.key === 'Escape') { state.selected = -1; syncStickerEdit(); drawResult(); }
  });

  // drag stickers around on the print
  let drag = null;
  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }
  function hit(p) {
    for (let i = state.stickers.length - 1; i >= 0; i--) {
      const s = state.stickers[i];
      if (Math.hypot(p.x - s.x, p.y - s.y) < s.size * 0.55) return i;
    }
    return -1;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const i = hit(p);
    state.selected = i;
    if (i >= 0) {
      const s = state.stickers[i];
      drag = { id: e.pointerId, dx: p.x - s.x, dy: p.y - s.y };
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('dragging');
    }
    syncStickerEdit();
    drawResult();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const s = state.stickers[state.selected];
    if (!s) return;
    const p = toCanvas(e);
    s.x = p.x - drag.dx;
    s.y = p.y - drag.dy;
    drawResult();
  });
  const endDrag = () => { drag = null; canvas.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  $('#caption').addEventListener('input', (e) => { state.caption = e.target.value; drawResult(); });
  $('#show-date').addEventListener('change', (e) => { state.showDate = e.target.checked; drawResult(); });
  $('#show-stamp').addEventListener('change', (e) => { state.stamp = e.target.checked; drawResult(); });

  $('#btn-download').addEventListener('click', () => {
    ensureFiltered();
    const out = document.createElement('canvas');
    renderStrip(out, printOptions(-1));
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const name = `bisque-ig-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
    out.toBlob((blob) => {
      if (!blob) { toast('couldn’t save the print, sorry!'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('saved to your downloads ♡');
    }, 'image/png');
  });

  $('#btn-new').addEventListener('click', () => {
    state.shots = [];
    state.shotsVersion++;
    state.stickers = [];
    state.selected = -1;
    location.hash = '#/themes';
  });

  /* ───────── music-box chime on presses ───────── */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a[href], label.btn, input[type="checkbox"]');
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('sound-toggle') || el.matches('[data-choose]')) return;
    chime();
  }, true);

  const soundBtn = $('#sound-toggle');
  function syncSoundBtn() {
    soundBtn.textContent = sound.on ? '♪ chimes on' : '♪ chimes off';
    pressed(soundBtn, sound.on);
  }
  soundBtn.addEventListener('click', () => {
    sound.set(!sound.on);
    syncSoundBtn();
    sound.chime();
  });
  syncSoundBtn();

  const ambBtn = $('#ambience-toggle');
  function syncAmbBtn() {
    ambBtn.textContent = sound.ambience ? '☾ lullaby on' : '☾ lullaby off';
    pressed(ambBtn, sound.ambience);
  }
  ambBtn.addEventListener('click', () => { sound.setAmbience(!sound.ambience); syncAmbBtn(); });
  syncAmbBtn();
  // Browsers only allow sound after a gesture, so the lullaby starts on the first touch
  const wake = () => sound.startAmbience();
  document.addEventListener('pointerdown', wake, { once: true });
  document.addEventListener('keydown', wake, { once: true });

  /* ───────── boot ───────── */
  function refresh() {
    if (current === 'themes') renderThemes();
    if (current === 'result') drawResult();
  }

  window.addEventListener('hashchange', route);
  route();
  loadOverlays(refresh);

  // Canvas text needs the web fonts loaded before it can use them.
  if (document.fonts && document.fonts.load) {
    Promise.all([
      'italic 300 80px "Cormorant Garamond"',
      '500 18px "Cormorant SC"',
      'italic 22px "Cormorant Garamond"',
      '30px "VT323"',
    ].map((f) => document.fonts.load(f, 'Bisque I II III IV 0123456789'))).then(refresh).catch(() => {});
  }
})();
