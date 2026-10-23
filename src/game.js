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
  boomer: { name: 'Boomerang', desc: 'Flies out and returns, piercing', max: 6 },
  whip:  { name: 'Whip', desc: 'Wide arc slash at nearest foe', max: 6 },
  garlic: { name: 'Garlic Aura', desc: 'Damages & slows nearby foes', max: 6 },
};
const PASSIVES = {
  might:  { name: 'Might', desc: '+20% damage', max: 5 },
  speed:  { name: 'Swiftness', desc: '+12% move speed', max: 5 },
  health: { name: 'Vitality', desc: '+25 max HP, heal', max: 5 },
  magnet: { name: 'Magnet', desc: '+40% pickup range', max: 5 },
  haste:  { name: 'Haste', desc: '-10% cooldowns', max: 5 },
};
// Evolution: a maxed weapon + its paired passive, opened via boss chest, jumps to level 8 (EVO).
const EVOLVE = { bolt: 'haste', orbit: 'might', nova: 'magnet', boomer: 'speed', whip: 'health', garlic: 'haste' };
const EVO_LVL = 8;
const ENEMY_TYPES = [
  { name: 'bat',   hp: 8,   speed: 70,  r: 9,  dmg: 6,  xp: 1, color: '#a78bfa', from: 0 },
  { name: 'ghoul', hp: 22,  speed: 55,  r: 12, dmg: 9,  xp: 2, color: '#6ee7b7', from: 45 },
  { name: 'imp',   hp: 14,  speed: 105, r: 8,  dmg: 8,  xp: 2, color: '#fb923c', from: 90 },
  { name: 'brute', hp: 90,  speed: 45,  r: 18, dmg: 16, xp: 8, color: '#f87171', from: 150 },
  { name: 'wisp',  hp: 6,   speed: 120, r: 6,  dmg: 5,  xp: 1, color: '#67e8f9', from: 120, pack: 5 }, // spawns in a swarm
  { name: 'golem', hp: 220, speed: 35,  r: 22, dmg: 22, xp: 15, color: '#94a3b8', from: 240 },
];
const BOSS_EVERY = 120; // seconds

// ---------- state ----------
let state = 'title'; // title | play | levelup | dead | pause
let G; // game world
const best = +(localStorage.getItem('tzs_best') || 0);

// ---------- meta upgrades (gold persists in localStorage; buy on title with 1-3) ----------
const META = {
  hp:  { name: 'Toughness', desc: '+10 starting HP', max: 10, cost: l => 20 + l * 15 },
  dmg: { name: 'Power', desc: '+5% damage', max: 10, cost: l => 30 + l * 20 },
  spd: { name: 'Fleetfoot', desc: '+3% move speed', max: 8, cost: l => 25 + l * 20 },
};
const META_KEYS = Object.keys(META);
function loadMeta() { try { return JSON.parse(localStorage.getItem('tzs_meta')) || {}; } catch (err) { return {}; } }
const getGold = () => +(localStorage.getItem('tzs_gold') || 0);
function buyMeta(k) {
  const m = loadMeta(), l = m[k] || 0, d = META[k];
  if (!d || l >= d.max || getGold() < d.cost(l)) return false;
  localStorage.setItem('tzs_gold', getGold() - d.cost(l)); m[k] = l + 1; localStorage.setItem('tzs_meta', JSON.stringify(m));
  return true;
}

// ---------- characters (title: left/right to choose) ----------
const CHARS = [
  { name: 'Mage',   w: 'bolt',  desc: 'Magic Bolt. Balanced.',          hp: 0,  spd: 1,    dmg: 1,    color: '#f8fafc' },
  { name: 'Knight', w: 'whip',  desc: 'Whip. +30 HP, slower.',          hp: 30, spd: 0.92, dmg: 1,    color: '#93c5fd' },
  { name: 'Druid',  w: 'garlic',  desc: 'Garlic Aura. +10% speed.',       hp: 0,  spd: 1.1,  dmg: 1,    color: '#86efac' },
  { name: 'Rogue',  w: 'boomer', desc: 'Boomerang. +15% dmg, -20 HP.',   hp: -20, spd: 1.05, dmg: 1.15, color: '#fda4af' },
];
let charIdx = Math.min(CHARS.length - 1, +(localStorage.getItem('tzs_char') || 0));
function pickChar(d) { charIdx = (charIdx + d + CHARS.length) % CHARS.length; try { localStorage.setItem('tzs_char', charIdx); } catch (err) {} }

function newGame() {
  const mu = loadMeta(), ch = CHARS[charIdx];
  G = {
    t: 0, kills: 0, spawnAcc: 0, nextBoss: BOSS_EVERY,
    cam: { x: 0, y: 0 },
    p: { x: 0, y: 0, r: 10, hp: 120 + ch.hp + 10 * (mu.hp || 0), maxHp: 120 + ch.hp + 10 * (mu.hp || 0), speed: 140 * ch.spd * (1 + 0.03 * (mu.spd || 0)), dmgMul: ch.dmg * (1 + 0.05 * (mu.dmg || 0)), magnet: 60, cdMul: 1, hurt: 0, xp: 0, lvl: 1, need: 5 },
    w: { [ch.w]: 1 }, pa: {},
    enemies: [], shots: [], gems: [], booms: [], hearts: [], chests: [], parts: [], shake: 0, fx: [], texts: [],
    timers: { bolt: 0, nova: 0 }, orbAng: 0, novaRing: null,
    choices: [], gold: 0,
  };
}

// ---------- sound (WebAudio bleeps; M toggles mute) ----------
let ac = null, muted = false, lastSfx = 0;
function sfx(freq, dur = 0.08, type = 'square', vol = 0.04) {
  if (muted || typeof AudioContext === 'undefined') return;
  try {
    ac = ac || new AudioContext();
    const now = ac.currentTime; if (now - lastSfx < 0.02) return; lastSfx = now;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(freq * 0.5, now + dur);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now + dur);
  } catch (err) { muted = true; }
}

function onKey(k, e) {
  if (k === 'm') { muted = !muted; return; }
  if ((k === 'p' || k === 'escape') && (state === 'play' || state === 'pause')) { state = state === 'play' ? 'pause' : 'play'; return; }
  if (state === 'title' && (k === 'arrowleft' || k === 'a')) { pickChar(-1); return; }
  if (state === 'title' && (k === 'arrowright' || k === 'd')) { pickChar(1); return; }
  if (state === 'title' && k >= '1' && k <= '3') { buyMeta(META_KEYS[+k - 1]); return; }
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
  const n = base.pack || 1;
  for (let i = 0; i < n; i++) G.enemies.push({ x: G.p.x + Math.cos(a) * d + (i ? rnd(-30, 30) : 0), y: G.p.y + Math.sin(a) * d + (i ? rnd(-30, 30) : 0), r: base.r, hp: base.hp * hpScale * (boss ? 1 + G.t / 240 : 1), speed: base.speed * (1 + Math.min(G.t / 600, 0.6)), dmg: base.dmg, xp: base.xp, color: base.color, flash: 0, boss, kind: base.name });
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
  while (G.spawnAcc >= 1 && G.enemies.length < 800) { G.spawnAcc--; spawnEnemy(false); }
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
  const wbm = G.w.boomer;
  if (wbm) {
    G.timers.boomer = (G.timers.boomer || 0) - dt;
    if (G.timers.boomer <= 0) {
      const t = nearest(p, 600);
      if (t) {
        G.timers.boomer = (2.2 - wbm * 0.15) * p.cdMul;
        const a = Math.atan2(t.y - p.y, t.x - p.x);
        G.booms.push({ x: p.x, y: p.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, age: 0, dmg: 10 + wbm * 3 });
      }
    }
  }
  for (const b of G.booms) {
    b.age += dt;
    const k = b.age < 0.7 ? 1 : 0; // outbound, then home on player
    if (!k) { const a = Math.atan2(p.y - b.y, p.x - b.x); b.vx = Math.cos(a) * 380; b.vy = Math.sin(a) * 380; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    for (const e of G.enemies) if (dist2(b, e) < (e.r + 9) ** 2 && !(e.boomHit > G.t)) { e.boomHit = G.t + 0.35; damage(e, b.dmg); }
    if (!k && dist2(b, p) < (p.r + 8) ** 2) b.dead = true;
    if (b.age > 4) b.dead = true;
  }
  G.booms = G.booms.filter(b => !b.dead);
  const ww = G.w.whip;
  if (ww) {
    G.timers.whip = (G.timers.whip || 0) - dt;
    if (G.timers.whip <= 0) {
      const t = nearest(p, 220);
      if (t) {
        G.timers.whip = (1.5 - ww * 0.1) * p.cdMul;
        const a = Math.atan2(t.y - p.y, t.x - p.x), reach = 80 + ww * 12, half = 0.9 + ww * 0.1;
        G.slash = { x: p.x, y: p.y, a, reach, half, t: 0.15 };
        for (const e of G.enemies) {
          if (dist2(p, e) > (reach + e.r) ** 2) continue;
          let d = Math.atan2(e.y - p.y, e.x - p.x) - a; d = Math.atan2(Math.sin(d), Math.cos(d));
          if (Math.abs(d) <= half) damage(e, 14 + ww * 5, Math.cos(a) * 12, Math.sin(a) * 12);
        }
      } else G.timers.whip = 0.1;
    }
  }
  if (G.slash) { G.slash.t -= dt; if (G.slash.t <= 0) G.slash = null; }
  const wg = G.w.garlic;
  if (wg) {
    const gr = 50 + wg * 12;
    G.timers.garlic = (G.timers.garlic || 0) - dt;
    const tick = G.timers.garlic <= 0; if (tick) G.timers.garlic = 0.5 * p.cdMul;
    for (const e of G.enemies) if (dist2(p, e) < (gr + e.r) ** 2) { e.slow = 0.1; if (tick) damage(e, 3 + wg * 1.5); }
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
  const grid = new Map(), CELL = 48;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i]; e.idx = i;
    const k = Math.floor(e.x / CELL) * 100003 + Math.floor(e.y / CELL);
    const c = grid.get(k); if (c) c.push(e); else grid.set(k, [e]);
  }
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i];
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    const sp = e.slow > 0 ? 0.6 : 1; e.slow = Math.max(0, (e.slow || 0) - dt);
    e.x += Math.cos(a) * e.speed * sp * dt; e.y += Math.sin(a) * e.speed * sp * dt;
    e.flash = Math.max(0, e.flash - dt);
    // soft separation via spatial hash (cells of CELL px; each pair resolved once via index order)
    const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
    for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
      const cell = grid.get(gx * 100003 + gy); if (!cell) continue;
      for (const o of cell) {
        if (o === e || o.idx < i) continue;
        const dx = e.x - o.x, dy = e.y - o.y, min = e.r + o.r;
        if (dx * dx + dy * dy < min * min) { const d = Math.hypot(dx, dy) || 1, k = (min - d) / 2 / d; e.x += dx * k; e.y += dy * k; o.x -= dx * k; o.y -= dy * k; }
      }
    }
    if (p.hurt <= 0 && dist2(p, e) < (e.r + p.r) ** 2) { p.hp -= e.dmg; p.hurt = 0.6; G.shake = 0.25; sfx(120, 0.15, 'sawtooth', 0.06); }
  }
  for (const e of G.enemies) if (e.hp <= 0) {
    G.kills++; sfx(260 + Math.random() * 80, 0.06);
    G.gems.push({ x: e.x, y: e.y, v: e.xp, big: e.boss });
    if (e.boss || Math.random() < 0.025) G.hearts.push({ x: e.x + 8, y: e.y, heal: e.boss ? 60 : 20 });
    if (e.boss) G.chests.push({ x: e.x - 12, y: e.y });
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
    if (G.choices.length) { state = 'levelup'; sfx(660, 0.25, 'triangle', 0.07); }
  }
  for (const h of G.hearts) if (dist2(p, h) < (p.r + 10) ** 2 || (dist2(p, h) < mr2 && p.hp < p.maxHp)) {
    if (dist2(p, h) < (p.r + 10) ** 2) { h.dead = true; sfx(520, 0.15, 'sine', 0.06); p.hp = Math.min(p.maxHp, p.hp + h.heal); G.texts.push({ x: p.x, y: p.y - 16, s: '+' + h.heal, t: 0.8 }); }
    else { const a = Math.atan2(p.y - h.y, p.x - h.x); h.x += Math.cos(a) * 200 * dt; h.y += Math.sin(a) * 200 * dt; }
  }
  G.hearts = G.hearts.filter(h => !h.dead);
  for (const c of G.chests) if (dist2(p, c) < (p.r + 14) ** 2) {
    c.dead = true; sfx(880, 0.3, 'triangle', 0.07);
    const evo = Object.keys(G.w).filter(k => G.w[k] === WEAPONS[k].max && G.pa[EVOLVE[k]]);
    const up = Object.keys(G.w).filter(k => G.w[k] < WEAPONS[k].max);
    if (evo.length) { const k = evo[(Math.random() * evo.length) | 0]; G.w[k] = EVO_LVL; G.shake = 0.4; G.texts.push({ x: p.x, y: p.y - 24, s: WEAPONS[k].name + ' EVOLVED!', t: 2 }); }
    else if (up.length) { const k = up[(Math.random() * up.length) | 0]; G.w[k]++; G.texts.push({ x: p.x, y: p.y - 24, s: WEAPONS[k].name + ' +1!', t: 1.4 }); }
    else { p.hp = p.maxHp; G.texts.push({ x: p.x, y: p.y - 24, s: 'Full heal!', t: 1.4 }); }
  }
  G.chests = G.chests.filter(c => !c.dead);
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.t -= dt; }
  G.parts = G.parts.filter(q => q.t > 0);
  G.shake = Math.max(0, G.shake - dt);
  for (const t of G.texts) { t.t -= dt; t.y -= 24 * dt; }
  G.texts = G.texts.filter(t => t.t > 0);

  if (p.hp <= 0) {
    state = 'dead'; sfx(90, 0.6, 'sawtooth', 0.08);
    const score = Math.floor(G.t);
    G.gold = G.kills + Math.floor(G.t / 10);
    localStorage.setItem('tzs_gold', getGold() + G.gold);
    if (score > +(localStorage.getItem('tzs_best') || 0)) localStorage.setItem('tzs_best', score);
  }
}

// ---------- render ----------
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function text(s, x, y, size, color = '#fff', align = 'center') { ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.fillText(s, x, y); }
// Procedural "sprites": body shape + per-type features, eyes face the player.
function drawHeart(x, y) {
  ctx.fillStyle = '#f43f5e'; ctx.beginPath();
  ctx.arc(x - 3, y - 2, 4, 0, 7); ctx.arc(x + 3, y - 2, 4, 0, 7); ctx.moveTo(x - 7, y - 1); ctx.lineTo(x, y + 8); ctx.lineTo(x + 7, y - 1); ctx.fill();
}
function drawPlayer(p) {
  const body = p.hurt > 0 && ((p.hurt * 20) | 0) % 2 ? '#fca5a5' : CHARS[charIdx].color;
  const mx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  if (mx) p.face = mx;
  const f = p.face || 1;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + p.r, p.r, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.moveTo(p.x - f * 4, p.y - 4); ctx.lineTo(p.x - f * 16, p.y + 10 + Math.sin(G.t * 12) * 2); ctx.lineTo(p.x - f * 2, p.y + 8); ctx.fill();
  circle(p.x, p.y, p.r, body);
  circle(p.x + f * 4, p.y - 2, 3, '#fff'); circle(p.x + f * 5, p.y - 2, 1.5, '#1e293b');
  ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(p.x - 7, p.y - 7); ctx.lineTo(p.x - 4, p.y - 15); ctx.lineTo(p.x, p.y - 9); ctx.lineTo(p.x + 4, p.y - 15); ctx.lineTo(p.x + 7, p.y - 7); ctx.fill();
}
function drawEnemy(e) {
  const { x, y, r } = e, c = e.flash > 0 ? '#fff' : e.color;
  const a = Math.atan2(G.p.y - y, G.p.x - x), ex = Math.cos(a) * r * 0.25, ey = Math.sin(a) * r * 0.25;
  ctx.fillStyle = c;
  if (e.kind === 'bat') { // flapping wings
    const f = Math.sin(G.t * 18 + x * 0.1) * r * 0.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - r * 1.7, y - r * 0.6 + f); ctx.lineTo(x - r * 0.4, y + r * 0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 1.7, y - r * 0.6 + f); ctx.lineTo(x + r * 0.4, y + r * 0.6); ctx.closePath(); ctx.fill();
    circle(x, y, r * 0.7, c);
  } else if (e.kind === 'imp' || e.kind === 'brute') { // horns
    circle(x, y, r, c);
    ctx.beginPath(); ctx.moveTo(x - r * 0.8, y - r * 0.3); ctx.lineTo(x - r * 0.5, y - r * 1.3); ctx.lineTo(x - r * 0.1, y - r * 0.8); ctx.moveTo(x + r * 0.8, y - r * 0.3); ctx.lineTo(x + r * 0.5, y - r * 1.3); ctx.lineTo(x + r * 0.1, y - r * 0.8); ctx.fill();
  } else if (e.kind === 'golem') { // blocky
    ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
  } else if (e.kind === 'wisp') { // teardrop with a tail
    circle(x, y, r, c); ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r * 2.2, y - Math.sin(a) * r * 2.2); ctx.lineTo(x - Math.sin(a) * r, y + Math.cos(a) * r); ctx.lineTo(x + Math.sin(a) * r, y - Math.cos(a) * r); ctx.fill();
  } else circle(x, y, r, c);
  if (e.kind === 'wisp') return;
  const eo = r * 0.35, er = Math.max(1.5, r * 0.2);
  circle(x - eo + ex, y - r * 0.1 + ey, er, '#fff'); circle(x + eo + ex, y - r * 0.1 + ey, er, '#fff');
  circle(x - eo + ex * 1.6, y - r * 0.1 + ey * 1.6, er * 0.5, '#111'); circle(x + eo + ex * 1.6, y - r * 0.1 + ey * 1.6, er * 0.5, '#111');
}
function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }

function render() {
  ctx.fillStyle = '#1b1b26'; ctx.fillRect(0, 0, W, H);
  if (state === 'title') {
    text('TONE ZONE SURVIVORS', W / 2, H / 2 - 40, 36, '#fde047');
    text('WASD / arrows / drag to move. Weapons fire automatically.', W / 2, H / 2, 16);
    const ch = CHARS[charIdx];
    text(`< ${ch.name} >  ${ch.desc}`, W / 2, H / 2 + 22, 16, ch.color);
    text('Press SPACE or tap to start', W / 2, H / 2 + 46, 20, '#6ee7b7');
    const b = +(localStorage.getItem('tzs_best') || 0);
    if (b) text('Best survival: ' + fmt(b), W / 2, H / 2 + 70, 16, '#aaa');
    const mu = loadMeta();
    text('Gold: ' + getGold() + '  -  press 1-3 to buy upgrades', W / 2, H / 2 + 110, 16, '#fde047');
    META_KEYS.forEach((k, i) => { const d = META[k], l = mu[k] || 0; text(`${i + 1}. ${d.name} ${l}/${d.max}  ${d.desc}  ` + (l >= d.max ? 'MAX' : d.cost(l) + 'g'), W / 2, H / 2 + 136 + i * 22, 14, l < d.max && getGold() >= d.cost(l) ? '#6ee7b7' : '#888'); });
    return;
  }
  const { cam, p } = G;
  const sh = G.shake * 20;
  ctx.save(); ctx.translate(-cam.x + rnd(-sh, sh), -cam.y + rnd(-sh, sh));
  // themed floor: checker tiles + hashed decorations (stones/grass tufts), deterministic per tile
  const gs = 64, x0 = Math.floor(cam.x / gs), y0 = Math.floor(cam.y / gs);
  for (let ty = y0; ty <= y0 + Math.ceil(H / gs) + 1; ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / gs) + 1; tx++) {
    const h = (Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663)) >>> 0, px = tx * gs, py = ty * gs;
    if ((tx + ty) & 1) { ctx.fillStyle = '#1f1f2c'; ctx.fillRect(px, py, gs, gs); }
    const d = h % 11;
    if (d === 0) { ctx.fillStyle = '#2f2f42'; ctx.beginPath(); ctx.ellipse(px + (h >> 4) % 48 + 8, py + (h >> 9) % 48 + 8, 7, 4, 0, 0, 7); ctx.fill(); }
    else if (d === 1) { ctx.strokeStyle = '#2f4a3c'; ctx.lineWidth = 2; const gx = px + (h >> 4) % 48 + 8, gy = py + (h >> 9) % 48 + 12; ctx.beginPath(); ctx.moveTo(gx - 4, gy); ctx.lineTo(gx - 6, gy - 7); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 9); ctx.moveTo(gx + 4, gy); ctx.lineTo(gx + 6, gy - 7); ctx.stroke(); }
  }
  for (const g of G.gems) circle(g.x, g.y, g.big ? 7 : 4, g.v >= 5 ? '#f0abfc' : '#38bdf8');
  for (const h of G.hearts) drawHeart(h.x, h.y + Math.sin(G.t * 5 + h.x) * 1.5);
  for (const c of G.chests) { ctx.fillStyle = '#b45309'; ctx.fillRect(c.x - 12, c.y - 9, 24, 18); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.strokeRect(c.x - 12, c.y - 9, 24, 18); }
  for (const e of G.enemies) {
    drawEnemy(e);
    if (e.boss) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3, 0, 7); ctx.stroke(); }
  }
  for (const q of G.parts) circle(q.x, q.y, 2, q.c);
  for (const b of G.booms) circle(b.x, b.y, 8, '#fdba74');
  for (const s of G.shots) circle(s.x, s.y, 5, '#fef08a');
  if (G.w.orbit) { const n = 1 + G.w.orbit, rad = 60 + G.w.orbit * 4; for (let i = 0; i < n; i++) { const a = G.orbAng + (i / n) * Math.PI * 2; circle(p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad, 7, '#c4b5fd'); } }
  if (G.w.garlic) { ctx.fillStyle = 'rgba(167,243,208,.12)'; ctx.beginPath(); ctx.arc(p.x, p.y, 50 + G.w.garlic * 12, 0, 7); ctx.fill(); }
  if (G.slash) { const k = G.slash; ctx.fillStyle = 'rgba(253,230,138,' + (k.t / 0.15 * 0.6) + ')'; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.arc(k.x, k.y, k.reach, k.a - k.half, k.a + k.half); ctx.closePath(); ctx.fill(); }
  if (G.novaRing) { ctx.strokeStyle = 'rgba(125,211,252,' + (G.novaRing.t / 0.3) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, p.y, G.novaRing.r, 0, 7); ctx.stroke(); }
  drawPlayer(p);
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
  for (const k in G.w) { text(`${WEAPONS[k].name} ${G.w[k] >= EVO_LVL ? 'EVO' : G.w[k]}`, 16, y, 12, '#fde047', 'left'); y += 14; }
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
    text('Best: ' + fmt(+(localStorage.getItem('tzs_best') || 0)) + '   Gold earned: +' + G.gold, W / 2, H / 2 + 40, 16, '#aaa');
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
window.__tzs = { keys, get state() { return state; }, set state(v) { state = v; }, get G() { return G; }, start() { newGame(); state = 'play'; }, update, render, press: onKey };
})();
