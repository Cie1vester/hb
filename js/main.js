/* ══════════════════════════════════════════════════════════════
   main.js — game loop, dialogue runner and the little cinematics.
   ══════════════════════════════════════════════════════════════ */

const cv = document.getElementById('game');
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;

const els = {
  app: document.getElementById('app'),
  dialog: document.getElementById('dialog'),
  speaker: document.getElementById('speaker'),
  nameplate: document.getElementById('nameplate'),
  text: document.getElementById('text'),
  choices: document.getElementById('choices'),
  advance: document.getElementById('advance'),
  title: document.getElementById('title'),
  start: document.getElementById('start'),
  mute: document.getElementById('mute'),
  blowbar: document.getElementById('blowbar'),
  blow: document.getElementById('blow'),
  meter: document.querySelector('#meter i'),
  finale: document.getElementById('finale'),
  openLetter: document.getElementById('openLetter'),
  hugBtn: document.getElementById('hugBtn'),
  replay: document.getElementById('replay'),
  letterWrap: document.getElementById('letterWrap'),
  letterText: document.getElementById('letterText'),
  closeLetter: document.getElementById('closeLetter'),
  toast: document.getElementById('toast')
};

/* ═══════════════ world state ═══════════════ */

const HOME = { purinX: 118, kuromiX: 216, floorY: 158 };

let W, sass, balloons, running;

function resetWorld() {
  W = {
    t: 0,
    purin: { x: 26, y: HOME.floorY, visible: false, face: 'sneaky', walk: 0, walking: false, armsUp: true, blink: 0, nextBlink: 2 },
    kuromi: { x: HOME.kuromiX, y: HOME.floorY, visible: true, face: 'smug', blink: 0, nextBlink: 3.4 },
    cake: { x: 0, y: 0, visible: false, lit: 0, blow: 0, smoke: false, smokeT: 0 },
    doorOpen: 0, dim: 0.55, glow: 0, glowX: 160, glowY: 130,
    bannerY: -70, nameIn: 0, flash: 0, fade: 0, photoGlow: 0,
    talker: null, celebrating: false, hugging: false
  };
  sass = 0;
  balloons = [];
  FX.parts = [];
  FX.shake = 0;
  FX.dust(20);
  tweens.length = 0;
}

/* ═══════════════ tweening ═══════════════ */

const tweens = [];
const ease = {
  out: p => 1 - Math.pow(1 - p, 3),
  inOut: p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  linear: p => p,
  bounce: p => {
    const n = 7.5625, d = 2.75;
    if (p < 1 / d) return n * p * p;
    if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
    return n * (p -= 2.625 / d) * p + 0.984375;
  }
};

function tween(obj, props, ms, easing) {
  return new Promise(res => {
    const from = {};
    for (const k in props) from[k] = obj[k];
    tweens.push({ obj, from, to: props, dur: Math.max(0.001, ms / 1000), t: 0, e: easing || ease.inOut, res });
  });
}
function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const p = Math.min(1, tw.t / tw.dur), v = tw.e(p);
    for (const k in tw.to) tw.obj[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * v;
    if (p >= 1) { tweens.splice(i, 1); tw.res(); }
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

resetWorld();

/* ═══════════════ dialogue ═══════════════ */

let typing = false, skipType = null, onAdvance = null;

function setSpeaker(who) {
  W.talker = who === 'narrator' ? null : who;
  els.dialog.dataset.who = who;
  els.speaker.textContent = who === 'narrator' ? ''
    : (who === 'kuromi' ? CONFIG.NAME : CONFIG.HIM).toUpperCase();
  els.nameplate.hidden = who === 'narrator';
}

function typeText(txt, opt = {}) {
  return new Promise(res => {
    els.dialog.hidden = false;
    els.choices.hidden = true;
    els.text.textContent = '';
    els.text.classList.remove('empty');
    els.advance.classList.remove('on');
    let i = 0, done = false;
    typing = true;

    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(iv);
      typing = false;
      skipType = null;
      W.talker = null;
      if (opt.noAdvance) { res(); return; }
      els.advance.classList.add('on');
      onAdvance = () => { els.advance.classList.remove('on'); res(); };
    };

    skipType = () => { els.text.textContent = txt; i = txt.length; finish(); };

    const iv = setInterval(() => {
      if (i >= txt.length) { finish(); return; }
      const ch = txt[i];
      els.text.textContent += ch;
      if (ch !== ' ' && i % 2 === 0) AudioKit.blip();
      i++;
    }, 26);
  });
}

function showChoices(list) {
  return new Promise(res => {
    els.text.textContent = '';
    els.text.classList.add('empty');
    els.advance.classList.remove('on');
    els.choices.textContent = '';
    list.forEach((c, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      const cur = document.createElement('span');
      cur.className = 'cur';
      cur.textContent = '♥';
      const tx = document.createElement('span');
      tx.textContent = c.text;
      b.append(cur, tx);
      b.style.animationDelay = (idx * 70) + 'ms';
      b.addEventListener('mouseenter', () => AudioKit.hover());
      b.addEventListener('click', e => {
        e.stopPropagation();
        AudioKit.select();
        FX.heartBurst(W.kuromi.x, W.kuromi.y - 44, 8);
        els.choices.textContent = '';
        els.choices.hidden = true;
        res(c);
      });
      els.choices.appendChild(b);
    });
    els.choices.hidden = false;
  });
}

function tapStage() {
  if (typing && skipType) { skipType(); return; }
  if (onAdvance) { const f = onAdvance; onAdvance = null; f(); }
}

/* ═══════════════ cinematics ═══════════════ */

let blowResolve = null, blowHeld = false, whooshCd = 0;

const ACTIONS = {

  async openDoor() {
    AudioKit.creak();
    await tween(W, { dim: 0.34 }, 900);
    await tween(W, { doorOpen: 1 }, 1100, ease.out);
  },

  async walkIn() {
    W.purin.visible = true;
    W.cake.visible = true;
    W.purin.walking = true;
    const steps = setInterval(() => AudioKit.step(), 250);
    await tween(W.purin, { x: HOME.purinX }, 2700, ease.linear);
    clearInterval(steps);
    W.purin.walking = false;
    tween(W, { doorOpen: 0 }, 700);
    await wait(220);
  },

  async lightCandles() {
    W.purin.face = 'proud';
    W.kuromi.face = 'surprised';
    for (let i = 0; i < 3; i++) {
      AudioKit.spark();
      for (let k = 0; k < 4; k++) FX.sparkle(W.cake.x + (Math.random() - 0.5) * 26, W.cake.y - 22);
      await wait(150);
    }
    W.glowX = W.cake.x; W.glowY = W.cake.y - 16;
    await Promise.all([tween(W.cake, { lit: 1 }, 700), tween(W, { glow: 0.7 }, 900)]);
    for (let i = 0; i < 10; i++) FX.sparkle(W.cake.x + (Math.random() - 0.5) * 34, W.cake.y - 18 - Math.random() * 12);
    await wait(250);
  },

  async dimLights() {
    AudioKit.duckMusic(0.07);
    /* "come closer" — she actually does */
    tween(W.kuromi, { x: 200 }, 1600, ease.inOut);
    await Promise.all([tween(W, { dim: 0.66 }, 1500), tween(W, { glow: 1 }, 1500)]);
    for (let i = 0; i < 6; i++) { FX.heart(W.cake.x + (Math.random() - 0.5) * 40, W.cake.y - 10, { life: 2.4 }); }
  },

  async blowPrompt() {
    els.blowbar.hidden = false;
    els.blow.focus({ preventScroll: true });
    await new Promise(res => { blowResolve = res; });
    els.blowbar.hidden = true;
  },

  /* sass runs 0..7 across the three choices; the wish is worth 3 of it */
  async ending() {
    if (sass >= 5) return 'end_sass';
    if (sass >= 2) return 'end_mid';
    return 'end_soft';
  },

  async celebrate() {
    AudioKit.stopMusic();
    await wait(400);
    W.cake.smoke = false;
    await tween(W, { flash: 0.85 }, 200);
    tween(W, { dim: 0, glow: 0 }, 500);
    await tween(W, { flash: 0 }, 600);

    AudioKit.confettiPop();
    AudioKit.fanfare();
    FX.confetti(120);
    FX.shake = 1;
    W.celebrating = true;

    await tween(W, { bannerY: 0 }, 950, ease.bounce);
    spawnBalloons();
    await tween(W, { nameIn: 1 }, 550, ease.out);
    FX.confetti(70);                 // second wave, so it's still falling on the name
    FX.heartBurst(160, 120, 16);
    await wait(500);
  },

  async finish() {
    els.finale.hidden = false;
    await wait(50);
  }
};

function spawnBalloons() {
  const cols = ['#FF9EC4', '#FFD98A', '#A8E0F0', '#C7B0F0', '#A8E6A0', '#FFB3D4'];
  /* kept to the sides so they never sit on top of the name */
  const xs = [16, 44, 74, 246, 278, 306];
  xs.forEach((x, i) => {
    balloons.push({ x, y: 200 + Math.random() * 90, col: cols[i % cols.length], v: 11 + Math.random() * 9, stop: 46 + Math.random() * 34 });
  });
  AudioKit.pop();
}

async function extinguish() {
  blowHeld = false;
  AudioKit.poof();
  W.cake.lit = 0;
  W.cake.smoke = true;
  W.cake.smokeT = 0;
  W.cake.blow = 0;
  FX.puff(W.cake.x, W.cake.y - 24);
  FX.shake = 0.5;
  els.meter.style.width = '0%';
  els.blowbar.hidden = true;
  await Promise.all([tween(W, { glow: 0 }, 800), tween(W, { dim: 0.88 }, 800)]);
  await wait(650);
  if (blowResolve) { const r = blowResolve; blowResolve = null; r(); }
}

/* ═══════════════ story runner ═══════════════ */

async function runNode(id) {
  let cur = id;
  while (cur) {
    const n = STORY[cur];
    if (!n) { console.warn('missing node:', cur); return; }

    if (n.action && ACTIONS[n.action]) {
      const jump = await ACTIONS[n.action]();
      if (jump) { cur = jump; continue; }
    }
    if (n.pFace) W.purin.face = n.pFace;
    if (n.kFace) W.kuromi.face = n.kFace;

    if (n.text) {
      setSpeaker(n.speaker || 'narrator');
      await typeText(n.text, { noAdvance: n.noAdvance });
    }

    if (n.after && ACTIONS[n.after]) {
      const jump = await ACTIONS[n.after]();
      if (jump) { cur = jump; continue; }
    }

    if (n.choices) {
      setSpeaker(n.speaker || 'kuromi');   // her nameplate, not whoever spoke last
      const c = await showChoices(n.choices);
      sass += c.sass || 0;
      cur = c.next;
      continue;
    }
    cur = n.next;
  }
}

/* ═══════════════ update ═══════════════ */

function updateChar(c, dt) {
  c.nextBlink -= dt;
  if (c.nextBlink <= 0) { c.blink = 0.12; c.nextBlink = 2.2 + Math.random() * 3.4; }
  if (c.blink > 0) c.blink -= dt;
}

function update(dt) {
  W.t += dt;
  updateTweens(dt);
  updateChar(W.purin, dt);
  updateChar(W.kuromi, dt);

  if (W.purin.walking) W.purin.walk += dt * 2.6;
  W.cake.x = Math.round(W.purin.x + 32);
  W.cake.y = W.purin.y - 6;
  if (W.cake.smoke) W.cake.smokeT = Math.min(1, W.cake.smokeT + dt * 0.5);
  if (W.photoGlow > 0) W.photoGlow = Math.max(0, W.photoGlow - dt * 2);

  /* blowing */
  if (blowResolve && !W.cake.smoke) {
    if (blowHeld) {
      W.cake.blow = Math.min(1, W.cake.blow + dt * 0.85);
      whooshCd -= dt;
      if (whooshCd <= 0) { AudioKit.whoosh(W.cake.blow); whooshCd = 0.22; }
      if (Math.random() < 0.4) FX.sparkle(W.cake.x + 14, W.cake.y - 22, '#FFF3B0');
      if (W.cake.blow >= 1) extinguish();
    } else {
      W.cake.blow = Math.max(0, W.cake.blow - dt * 1.4);
    }
    els.meter.style.width = Math.round(W.cake.blow * 100) + '%';
  }

  for (const b of balloons) if (b.y > b.stop) b.y -= b.v * dt * 6;

  FX.update(dt);
}

/* ═══════════════ render ═══════════════ */

function bobOf(who, c) {
  let b = Math.sin(W.t * 1.8 + (who === 'kuromi' ? 1.3 : 0)) * 1;
  if (W.talker === who) b += Math.sin(W.t * 16) * 1.4;
  if (W.celebrating) b += Math.abs(Math.sin(W.t * 5 + (who === 'kuromi' ? 0.5 : 0))) * 4;
  return Math.round(b);
}

function render() {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, 320, 180);
  g.save();
  if (FX.shake > 0) {
    g.translate(Math.round((Math.random() - 0.5) * FX.shake * 6), Math.round((Math.random() - 0.5) * FX.shake * 5));
  }

  drawRoom(g, W);

  const k = W.kuromi, p = W.purin;
  if (k.visible) {
    drawKuromi(g, k.x, k.y, {
      face: k.face, eyeFace: k.blink > 0 ? 'blink' : null,
      bob: bobOf('kuromi', k), t: W.t, talking: W.talker === 'kuromi' && Math.sin(W.t * 22) > 0
    });
  }
  if (p.visible) {
    drawPurin(g, p.x, p.y, {
      face: p.face, eyeFace: p.blink > 0 ? 'blink' : null,
      bob: bobOf('purin', p), t: W.t, walk: p.walking ? p.walk : 0,
      armsUp: p.armsUp && W.cake.visible,
      talking: W.talker === 'purin' && Math.sin(W.t * 22) > 0
    });
  }
  if (W.cake.visible) {
    drawCake(g, W.cake.x, W.cake.y, { lit: W.cake.lit, blow: W.cake.blow, smoke: W.cake.smoke, smokeT: W.cake.smokeT, t: W.t });
  }

  for (const b of balloons) drawBalloon(g, b.x, b.y, b.col, W.t);

  FX.draw(g);
  applyMood(g, W);
  g.restore();
}

let last = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ═══════════════ input ═══════════════ */

/* tapping the picture frame on the wall is a little easter egg */
const PHOTO_HIT = { x: 169, y: 23, w: 26, h: 22 };
let photoIdx = 0;

function canvasPoint(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * 320, y: (e.clientY - r.top) / r.height * 180 };
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('on');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove('on'), 3200);
}

cv.addEventListener('click', e => {
  const pt = canvasPoint(e);
  if (pt.x >= PHOTO_HIT.x && pt.x <= PHOTO_HIT.x + PHOTO_HIT.w &&
      pt.y >= PHOTO_HIT.y && pt.y <= PHOTO_HIT.y + PHOTO_HIT.h) {
    W.photoGlow = 1;
    AudioKit.pop();
    FX.heartBurst(182, 34, 6);
    showToast(PHOTO_LINES[photoIdx++ % PHOTO_LINES.length]);
    return;
  }
  for (let i = 0; i < 3; i++) FX.heart(pt.x, pt.y, { spread: 1.4, life: 1.2 });
  tapStage();
});

els.dialog.addEventListener('click', e => {
  if (e.target.closest('.choice')) return;
  tapStage();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (els.title.classList.contains('gone') && !els.choices.hidden) return;
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
    e.preventDefault();
    tapStage();
  }
});

/* hold-to-blow.
   Pointer events cover every modern browser, but touch/mouse are listened for
   too — some mobile engines never synthesise pointer events from a real tap,
   and this button is the one interaction the whole ending depends on.
   Double-firing is harmless: holdOn/holdOff just set a boolean. */
const holdOn = e => { if (e.cancelable) e.preventDefault(); blowHeld = true; els.blow.classList.add('held'); };
const holdOff = () => { blowHeld = false; els.blow.classList.remove('held'); };
for (const ev of ['pointerdown', 'touchstart', 'mousedown']) els.blow.addEventListener(ev, holdOn, { passive: false });
for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'touchend', 'touchcancel', 'mouseup', 'mouseleave']) {
  els.blow.addEventListener(ev, holdOff);
}
els.blow.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); blowHeld = true; } });
els.blow.addEventListener('keyup', () => { blowHeld = false; });
window.addEventListener('blur', holdOff);

/* ═══════════════ finale buttons ═══════════════ */

els.letterText.textContent = LETTER;

els.openLetter.addEventListener('click', () => {
  els.letterWrap.hidden = false;
  AudioKit.pop();
  requestAnimationFrame(() => els.letterWrap.classList.add('on'));
  els.closeLetter.focus({ preventScroll: true });
});
els.closeLetter.addEventListener('click', () => {
  els.letterWrap.classList.remove('on');
  setTimeout(() => { els.letterWrap.hidden = true; }, 260);
});
els.letterWrap.addEventListener('click', e => { if (e.target === els.letterWrap) els.closeLetter.click(); });

let hugged = false;
els.hugBtn.addEventListener('click', async () => {
  if (hugged) { FX.heartBurst(W.kuromi.x - 12, W.kuromi.y - 46, 12); AudioKit.pop(); return; }
  hugged = true;
  els.hugBtn.disabled = true;
  W.cake.visible = false;
  W.purin.armsUp = false;
  W.purin.walking = true;
  await tween(W.purin, { x: W.kuromi.x - 36 }, 800, ease.out);
  W.purin.walking = false;
  W.purin.face = 'blush';
  W.kuromi.face = 'blush';
  AudioKit.pop();
  FX.shake = 0.6;
  FX.heartBurst((W.purin.x + W.kuromi.x) / 2, W.kuromi.y - 48, 22);
  for (let i = 0; i < 30; i++) FX.heart(Math.random() * 320, 178, { speed: 1.5, life: 2.8, s: 3 });
  setSpeaker('purin');
  await typeText('...There. I got you. Happy birthday, ' + CONFIG.CALL + '. ♡', { noAdvance: true });
  els.hugBtn.disabled = false;
  els.hugBtn.textContent = '🎀 again ♡';
});

els.replay.addEventListener('click', () => {
  els.finale.hidden = true;
  els.blowbar.hidden = true;
  els.letterWrap.hidden = true;
  els.letterWrap.classList.remove('on');
  els.choices.hidden = true;
  els.choices.textContent = '';
  els.advance.classList.remove('on');
  hugged = false;
  els.hugBtn.disabled = false;
  els.hugBtn.textContent = '🎀 Hug her';
  onAdvance = null; skipType = null; typing = false; blowResolve = null;
  resetWorld();
  AudioKit.unduckMusic(0.16, 0.3);
  AudioKit.startMusic();
  runNode(CONFIG.START_NODE);
});

/* ═══════════════ mute ═══════════════ */

let muted = localStorage.getItem('hb-muted') === '1';
function paintMute() {
  els.mute.textContent = muted ? '♪̸' : '♪';
  els.mute.classList.toggle('off', muted);
  els.mute.setAttribute('aria-pressed', String(muted));
}
paintMute();
els.mute.addEventListener('click', e => {
  e.stopPropagation();
  muted = !muted;
  localStorage.setItem('hb-muted', muted ? '1' : '0');
  AudioKit.setMuted(muted);
  paintMute();
});

/* ═══════════════ start ═══════════════ */

els.start.addEventListener('click', () => {
  AudioKit.init();
  AudioKit.resume();
  AudioKit.setMuted(muted);
  AudioKit.startMusic();
  els.title.classList.add('gone');
  setTimeout(() => { els.title.style.display = 'none'; }, 700);
  els.dialog.hidden = false;
  runNode(CONFIG.START_NODE);
});
els.title.classList.add('ready');
