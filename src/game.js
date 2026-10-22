// Tone Zone Survivors - MVP. Plain canvas, no build step. Open index.html.
(() => {
'use strict';
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let W, H;
function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
addEventListener('resize', resize); resize();

// ---------- input ----------
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; onKey(e.key.toLowerCase()); });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let touch = null; // {sx,sy,x,y}
cv.addEventListener('pointerdown', e => { touch = { sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY }; if (state !== 'play') onKey('tap', e); });
cv.addEventListener('pointermove', e => { if (touch) { touch.x = e.clientX; touch.y = e.clientY; } });
addEventListener('pointerup', () => { touch = null; });

// ---------- data ----------
const WEAPONS = {
  bolt:  { name: 'Magic Bolt', desc: 'Fires at nearest enemy', max: 6 },
  orbit: { name: 'Orbiting Orbs', desc: 'Orbs circle you', max: 6 },
  nova:  { name: 'Pulse Nova', desc: 'Periodic shockwave', max: 6 },
};
const PASSIVES = {
  might:  { name: 'Might', desc: '+20% damage', max: 5 },
  speed:  { name: 'Swiftness', desc: '+12% move speed', max: 5 },
  health: { name: 'Vitality', desc: '+25 max HP, heal', max: 5 },
  magnet: { name: 'Magnet', desc: '+40% pickup range', max: 5 },
  haste:  { name: 'Haste', desc: '-10% cooldowns', max: 5 },
};
const ENEMY_TYPES = [
  { name: 'bat',   hp: 8,   speed: 70,  r: 9,  dmg: 6,  xp: 1, color: '#a78bfa', from: 0 },
  { name: 'ghoul', hp: 22,  speed: 55,  r: 12, dmg: 9,  xp: 2, color: '#6ee7b7', from: 45 },
  { name: 'imp',   hp: 14,  speed: 105, r: 8,  dmg: 8,  xp: 2, color: '#fb923c', from: 90 },
  { name: 'brute', hp: 90,  speed: 45,  r: 18, dmg: 16, xp: 8, color: '#f87171', from: 150 },
];
const BOSS_EVERY = 120; // seconds

// ---------- state ----------
let state = 'title'; // title | play | levelup | dead | pause
let G; // game world
const best = +(localStorage.getItem('tzs_best') || 0);

function newGame() {
  G = {
    t: 0, kills: 0, spawnAcc: 0, nextBoss: BOSS_EVERY,
    cam: { x: 0, y: 0 },
    p: { x: 0, y: 0, r: 10, hp: 120, maxHp: 120, speed: 140, dmgMul: 1, magnet: 60, cdMul: 1, hurt: 0, xp: 0, lvl: 1, need: 5 },
    w: { bolt: 1 }, pa: {},
    enemies: [], shots: [], gems: [], hearts: [], parts: [], shake: 0, fx: [], texts: [],
    timers: { bolt: 0, nova: 0 }, orbAng: 0, novaRing: null,
    choices: [],
  };
}

function onKey(k, e) {
  if ((k === 'p' || k === 'escape') && (state === 'play' || state === 'pause')) { state = state === 'play' ? 'pause' : 'play'; return; }
  if (state === 'title' && (k === ' ' || k === 'enter' || k === 'tap')) { newGame(); state = 'play'; }
  else if (state === 'dead' && (k === ' ' || k === 'enter' || k === 'tap')) { state = 'title'; }
  else if (state === 'levelup') {
    let i = -1;
    if (k >= '1' && k <= '3') i = +k - 1;
    if (k === 'tap' && e) i = pickAt(e.clientX, e.clientY);
    if (i >= 0 && G.choices[i]) { applyChoice(G.choices[i]); state = 'play'; }
  }
}

// ---------- helpers ----------
const rnd = (a, b) => a + Math.random() * (b - a);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
function nearest(from, maxD) {
  let best = null, bd = maxD * maxD;
  for (const e of G.enemies) { const d = dist2(from, e); if (d < bd) { bd = d; best = e; } }
  return best;
}
function damage(e, amt, kx, ky) {
  amt *= G.p.dmgMul; e.hp -= amt; e.flash = 0.08;
  if (kx !== undefined) { e.x += kx; e.y += ky; }
  G.texts.push({ x: e.x, y: e.y - e.r, s: Math.round(amt), t: 0.5 });
  if (G.parts.length < 200) for (let i = 0; i < 2; i++) G.parts.push({ x: e.x, y: e.y, vx: rnd(-80, 80), vy: rnd(-80, 80), t: 0.3, c: e.color });
}

// ---------- level up ----------
function rollChoices() {
  const pool = [];
  for (const k in WEAPONS) { const l = G.w[k] || 0; if (l < WEAPONS[k].max) pool.push({ kind: 'w', k, lvl: l + 1 }); }
  for (const k in PASSIVES) { const l = G.pa[k] || 0; if (l < PASSIVES[k].max) pool.push({ kind: 'p', k, lvl: l + 1 }); }
  pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, 3);
}
function applyChoice(c) {
  const p = G.p;
  if (c.kind === 'w') G.w[c.k] = c.lvl;
  else {
    G.pa[c.k] = c.lvl;
    if (c.k === 'might') p.dmgMul *= 1.2;
    if (c.k === 'speed') p.speed *= 1.12;
    if (c.k === 'health') { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 40); }
    if (c.k === 'magnet') p.magnet *= 1.4;
    if (c.k === 'haste') p.cdMul *= 0.9;
  }
}
const choiceRects = () => [0, 1, 2].map(i => ({ x: W / 2 - 150, y: H / 2 - 120 + i * 90, w: 300, h: 76 }));
function pickAt(x, y) { return choiceRects().findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); }

// ---------- spawning / difficulty ----------
function spawnRate() { return 0.8 + G.t / 30 + (G.t / 130) ** 2; } // enemies per second, ramps up
function spawnEnemy(boss) {
  const types = ENEMY_TYPES.filter(t => G.t >= t.from);
  const base = boss ? { name: 'boss', hp: 600, speed: 60, r: 34, dmg: 25, xp: 40, color: '#fde047' } : types[(Math.random() * types.length) | 0];
  const a = rnd(0, Math.PI * 2), d = Math.hypot(W, H) / 2 + 40;
  const hpScale = 1 + G.t / 90;
  G.enemies.push({ x: G.p.x + Math.cos(a) * d, y: G.p.y + Math.sin(a) * d, r: base.r, hp: base.hp * hpScale * (boss ? 1 + G.t / 240 : 1), speed: base.speed * (1 + Math.min(G.t / 600, 0.6)), dmg: base.dmg, xp: base.xp, color: base.color, flash: 0, boss });
}

// ---------- update ----------
function update(dt) {
  const p = G.p;
  G.t += dt;
  // movement
  let dx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  let dy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  if (touch) { dx = touch.x - touch.sx; dy = touch.y - touch.sy; const tm = Math.hypot(dx, dy); if (tm > 8) { const k = Math.min(tm, 60) / 60; dx = dx / tm * k; dy = dy / tm * k; } else { dx = dy = 0; } }
  const m = Math.hypot(dx, dy);
  if (m > 1) { dx /= m; dy /= m; }
  p.x += dx * p.speed * dt; p.y += dy * p.speed * dt;
  p.hurt = Math.max(0, p.hurt - dt);
  G.cam.x = p.x - W / 2; G.cam.y = p.y - H / 2;

  // spawn
  G.spawnAcc += spawnRate() * dt;
  while (G.spawnAcc >= 1 && G.enemies.length < 400) { G.spawnAcc--; spawnEnemy(false); }
  if (G.t >= G.nextBoss) { G.nextBoss += BOSS_EVERY; spawnEnemy(true); }

  // weapons
  const wb = G.w.bolt;
  if (wb) {
    G.timers.bolt -= dt;
    if (G.timers.bolt <= 0) {
      G.timers.bolt = 0.9 * p.cdMul;
      const n = 1 + Math.floor((wb - 1) / 2) + (wb >= 6 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const t = nearest(p, 500);
        if (!t) break;
        const a = Math.atan2(t.y - p.y, t.x - p.x) + (i - (n - 1) / 2) * 0.18;
        G.shots.push({ x: p.x, y: p.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, dmg: 8 + wb * 3, life: 1.6, pierce: wb >= 4 ? 2 : 1 });
      }
    }
  }
  const wo = G.w.orbit;
  if (wo) {
    G.orbAng += dt * (2.2 + wo * 0.2);
    const n = 1 + wo, rad = 60 + wo * 4;
    for (let i = 0; i < n; i++) {
      const a = G.orbAng + (i / n) * Math.PI * 2, o = { x: p.x + Math.cos(a) * rad, y: p.y + Math.sin(a) * rad };
      for (const e of G.enemies) {
        if (dist2(o, e) < (e.r + 7) ** 2 && !(e.orbHit > G.t)) { e.orbHit = G.t + 0.4; damage(e, 6 + wo * 2.5, Math.cos(a + 1.57) * 4, Math.sin(a + 1.57) * 4); }
      }
    }
  }
  const wn = G.w.nova;
  if (wn) {
    G.timers.nova -= dt;
    if (G.timers.nova <= 0) {
      G.timers.nova = (4.2 - wn * 0.35) * p.cdMul;
      const r = 90 + wn * 18;
      G.novaRing = { r: 0, max: r, t: 0.3 };
      for (const e of G.enemies) if (dist2(p, e) < (r + e.r) ** 2) { const a = Math.atan2(e.y - p.y, e.x - p.x); damage(e, 14 + wn * 6, Math.cos(a) * 25, Math.sin(a) * 25); }
    }
  }
  if (G.novaRing) { G.novaRing.t -= dt; G.novaRing.r = G.novaRing.max * (1 - G.novaRing.t / 0.3); if (G.novaRing.t <= 0) G.novaRing = null; }

  // shots
  for (const s of G.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    for (const e of G.enemies) {
      if (s.life > 0 && dist2(s, e) < (e.r + 5) ** 2) {
        damage(e, s.dmg); s.pierce--; if (s.pierce <= 0) s.life = 0;
        if (s.life <= 0) break;
      }
    }
  }
  G.shots = G.shots.filter(s => s.life > 0);

  // enemies
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i];
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    e.x += Math.cos(a) * e.speed * dt; e.y += Math.sin(a) * e.speed * dt;
    e.flash = Math.max(0, e.flash - dt);
    // soft separation (cheap: only against next few)
    for (let j = i + 1; j < Math.min(i + 6, G.enemies.length); j++) {
      const o = G.enemies[j], d = Math.hypot(e.x - o.x, e.y - o.y) || 1, min = e.r + o.r;
      if (d < min) { const k = (min - d) / 2 / d; e.x += (e.x - o.x) * k; e.y += (e.y - o.y) * k; o.x -= (e.x - o.x) * k; o.y -= (e.y - o.y) * k; }
    }
    if (p.hurt <= 0 && dist2(p, e) < (e.r + p.r) ** 2) { p.hp -= e.dmg; p.hurt = 0.6; G.shake = 0.25; }
  }
  for (const e of G.enemies) if (e.hp <= 0) {
    G.kills++;
    G.gems.push({ x: e.x, y: e.y, v: e.xp, big: e.boss });
    if (e.boss || Math.random() < 0.025) G.hearts.push({ x: e.x + 8, y: e.y, heal: e.boss ? 60 : 20 });
    if (e.boss) for (let k = 0; k < 8; k++) G.gems.push({ x: e.x + rnd(-30, 30), y: e.y + rnd(-30, 30), v: 5 });
  }
  G.enemies = G.enemies.filter(e => e.hp > 0);
  // despawn very far
  G.enemies = G.enemies.filter(e => e.boss || dist2(p, e) < 1600 * 1600);

  // gems
  const mr2 = p.magnet * p.magnet;
  for (const g of G.gems) {
    const d2 = dist2(p, g);
    if (d2 < mr2 || g.pull) { g.pull = true; const a = Math.atan2(p.y - g.y, p.x - g.x); g.x += Math.cos(a) * 320 * dt; g.y += Math.sin(a) * 320 * dt; }
    if (d2 < (p.r + 6) ** 2) { g.dead = true; p.xp += g.v; }
  }
  G.gems = G.gems.filter(g => !g.dead);
  if (p.xp >= p.need && state === 'play') {
    p.xp -= p.need; p.lvl++; p.need = Math.round(p.need * 1.35 + 3);
    G.choices = rollChoices();
    if (G.choices.length) state = 'levelup';
  }
  for (const h of G.hearts) if (dist2(p, h) < (p.r + 10) ** 2 || (dist2(p, h) < mr2 && p.hp < p.maxHp)) {
    if (dist2(p, h) < (p.r + 10) ** 2) { h.dead = true; p.hp = Math.min(p.maxHp, p.hp + h.heal); G.texts.push({ x: p.x, y: p.y - 16, s: '+' + h.heal, t: 0.8 }); }
    else { const a = Math.atan2(p.y - h.y, p.x - h.x); h.x += Math.cos(a) * 200 * dt; h.y += Math.sin(a) * 200 * dt; }
  }
  G.hearts = G.hearts.filter(h => !h.dead);
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.t -= dt; }
  G.parts = G.parts.filter(q => q.t > 0);
  G.shake = Math.max(0, G.shake - dt);
  for (const t of G.texts) { t.t -= dt; t.y -= 24 * dt; }
  G.texts = G.texts.filter(t => t.t > 0);

  if (p.hp <= 0) {
    state = 'dead';
    const score = Math.floor(G.t);
    if (score > +(localStorage.getItem('tzs_best') || 0)) localStorage.setItem('tzs_best', score);
  }
}

// ---------- render ----------
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function text(s, x, y, size, color = '#fff', align = 'center') { ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.fillText(s, x, y); }
function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }

function render() {
  ctx.fillStyle = '#1b1b26'; ctx.fillRect(0, 0, W, H);
  if (state === 'title') {
    text('TONE ZONE SURVIVORS', W / 2, H / 2 - 40, 36, '#fde047');
    text('WASD / arrows / drag to move. Weapons fire automatically.', W / 2, H / 2, 16);
    text('Press SPACE or tap to start', W / 2, H / 2 + 40, 20, '#6ee7b7');
    const b = +(localStorage.getItem('tzs_best') || 0);
    if (b) text('Best survival: ' + fmt(b), W / 2, H / 2 + 80, 16, '#aaa');
    return;
  }
  const { cam, p } = G;
  const sh = G.shake * 20;
  ctx.save(); ctx.translate(-cam.x + rnd(-sh, sh), -cam.y + rnd(-sh, sh));
  // grid floor
  ctx.strokeStyle = '#262636'; ctx.lineWidth = 1; ctx.beginPath();
  const gs = 64, x0 = Math.floor(cam.x / gs) * gs, y0 = Math.floor(cam.y / gs) * gs;
  for (let x = x0; x < cam.x + W + gs; x += gs) { ctx.moveTo(x, cam.y); ctx.lineTo(x, cam.y + H); }
  for (let y = y0; y < cam.y + H + gs; y += gs) { ctx.moveTo(cam.x, y); ctx.lineTo(cam.x + W, y); }
  ctx.stroke();
  for (const g of G.gems) circle(g.x, g.y, g.big ? 7 : 4, g.v >= 5 ? '#f0abfc' : '#38bdf8');
  for (const h of G.hearts) circle(h.x, h.y, 6, '#f43f5e');
  for (const e of G.enemies) {
    circle(e.x, e.y, e.r, e.flash > 0 ? '#fff' : e.color);
    if (e.boss) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3, 0, 7); ctx.stroke(); }
  }
  for (const q of G.parts) circle(q.x, q.y, 2, q.c);
  for (const s of G.shots) circle(s.x, s.y, 5, '#fef08a');
  if (G.w.orbit) { const n = 1 + G.w.orbit, rad = 60 + G.w.orbit * 4; for (let i = 0; i < n; i++) { const a = G.orbAng + (i / n) * Math.PI * 2; circle(p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad, 7, '#c4b5fd'); } }
  if (G.novaRing) { ctx.strokeStyle = 'rgba(125,211,252,' + (G.novaRing.t / 0.3) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, p.y, G.novaRing.r, 0, 7); ctx.stroke(); }
  circle(p.x, p.y, p.r, p.hurt > 0 && ((p.hurt * 20) | 0) % 2 ? '#fca5a5' : '#f8fafc');
  circle(p.x, p.y - 2, 3, '#1e293b');
  for (const t of G.texts) text(t.s, t.x, t.y, 12, '#fff');
  ctx.restore();

  // HUD
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 14);
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(0, 0, W * Math.min(1, p.xp / p.need), 14);
  text('LV ' + p.lvl, W / 2, 11, 12);
  ctx.fillStyle = '#333'; ctx.fillRect(16, 24, 160, 12);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(16, 24, 160 * Math.max(0, p.hp / p.maxHp), 12);
  text(fmt(G.t), W / 2, 40, 22);
  text('Kills ' + G.kills, W - 16, 40, 16, '#fff', 'right');
  let y = 56; ctx.textAlign = 'left';
  for (const k in G.w) { text(`${WEAPONS[k].name} ${G.w[k]}`, 16, y, 12, '#fde047', 'left'); y += 14; }
  for (const k in G.pa) { text(`${PASSIVES[k].name} ${G.pa[k]}`, 16, y, 12, '#a7f3d0', 'left'); y += 14; }

  if (state === 'levelup') {
    ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
    text('LEVEL UP! Pick one (1-3 or tap)', W / 2, H / 2 - 150, 22, '#fde047');
    choiceRects().forEach((r, i) => {
      const c = G.choices[i]; if (!c) return;
      const d = c.kind === 'w' ? WEAPONS[c.k] : PASSIVES[c.k];
      ctx.fillStyle = '#2d2d44'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = c.kind === 'w' ? '#fde047' : '#6ee7b7'; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
      text(`${i + 1}. ${d.name} (Lv ${c.lvl})`, r.x + 12, r.y + 30, 18, '#fff', 'left');
      text(d.desc, r.x + 12, r.y + 56, 14, '#bbb', 'left');
    });
  }
  if (state === 'pause') {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
    text('PAUSED (P / Esc to resume)', W / 2, H / 2, 24, '#fde047');
  }
  if (state === 'dead') {
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, W, H);
    text('YOU DIED', W / 2, H / 2 - 30, 40, '#ef4444');
    text(`Survived ${fmt(G.t)}  |  Kills ${G.kills}  |  Level ${p.lvl}`, W / 2, H / 2 + 10, 18);
    text('Best: ' + fmt(+(localStorage.getItem('tzs_best') || 0)), W / 2, H / 2 + 40, 16, '#aaa');
    text('SPACE or tap to continue', W / 2, H / 2 + 80, 18, '#6ee7b7');
  }
}

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state === 'play') update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test hook
window.__tzs = { get state() { return state; }, get G() { return G; }, start() { newGame(); state = 'play'; }, update, render, press: onKey };
})();
