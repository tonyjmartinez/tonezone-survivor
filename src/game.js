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
  zap:   { name: 'Lightning', desc: 'Strikes random foes on screen', max: 6 },
  mine:  { name: 'Mines', desc: 'Drops mines that blast foes', max: 6 },
  frost: { name: 'Frost Shards', desc: 'Ring of shards that slow foes', max: 6 },
};
const PASSIVES = {
  might:  { name: 'Might', desc: '+20% damage', max: 5 },
  speed:  { name: 'Swiftness', desc: '+12% move speed', max: 5 },
  health: { name: 'Vitality', desc: '+25 max HP, heal', max: 5 },
  magnet: { name: 'Magnet', desc: '+40% pickup range', max: 5 },
  haste:  { name: 'Haste', desc: '-10% cooldowns', max: 5 },
  regen:  { name: 'Recovery', desc: '+0.5 HP per second', max: 5 },
  luck:   { name: 'Luck', desc: '+30% pickup drop chance', max: 5 },
  armor:  { name: 'Armor', desc: '-1 damage taken per hit', max: 5 },
  growth: { name: 'Growth', desc: '+15% XP from gems', max: 5 },
};
// Evolution: a maxed weapon + its paired passive, opened via boss chest, jumps to level 8 (EVO).
const EVOLVE = { bolt: 'haste', orbit: 'might', nova: 'magnet', boomer: 'speed', whip: 'health', garlic: 'haste', zap: 'regen', mine: 'luck', frost: 'armor' };
const EVO_LVL = 8;
const ENEMY_TYPES = [
  { name: 'bat',   hp: 8,   speed: 70,  r: 9,  dmg: 6,  xp: 1, color: '#a78bfa', from: 0 },
  { name: 'ghoul', hp: 22,  speed: 55,  r: 12, dmg: 9,  xp: 2, color: '#6ee7b7', from: 45 },
  { name: 'imp',   hp: 14,  speed: 105, r: 8,  dmg: 8,  xp: 2, color: '#fb923c', from: 90 },
  { name: 'brute', hp: 90,  speed: 45,  r: 18, dmg: 16, xp: 8, color: '#f87171', from: 150 },
  { name: 'wisp',  hp: 6,   speed: 120, r: 6,  dmg: 5,  xp: 1, color: '#67e8f9', from: 120, pack: 5 }, // spawns in a swarm
  { name: 'bloat', hp: 40,  speed: 50,  r: 14, dmg: 10, xp: 3, color: '#bef264', from: 180, split: 3 }, // bursts into mini bloats
  { name: 'dasher', hp: 30, speed: 60,  r: 10, dmg: 12, xp: 4, color: '#f472b6', from: 200, lunges: true }, // periodic 3.5x speed lunge
  { name: 'troll', hp: 70, speed: 50,  r: 15, dmg: 14, xp: 6, color: '#65a30d', from: 270, regen: true }, // heals 8% max HP/s unless hit in the last 1.5s
  { name: 'golem', hp: 220, speed: 35,  r: 22, dmg: 22, xp: 15, color: '#94a3b8', from: 240 },
];
const BOSS_EVERY = 120; // seconds
const WIN_TIME = 600; // survive this long to win (10:00)
const HORDE_EVERY = 75; // seconds; ring of enemies closes in on the player
const ELITE_FROM = 180, ELITE_CHANCE = 0.04; // from 3:00, a normal spawn may be an elite

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
let hard = localStorage.getItem('tzs_hard') === '1'; // Hard: +40% spawns, +50% gold
function toggleHard() { hard = !hard; try { localStorage.setItem('tzs_hard', hard ? '1' : '0'); } catch (err) {} }
function pickChar(d) { charIdx = (charIdx + d + CHARS.length) % CHARS.length; try { localStorage.setItem('tzs_char', charIdx); } catch (err) {} }

function newGame() {
  const mu = loadMeta(), ch = CHARS[charIdx];
  G = {
    t: 0, kills: 0, spawnAcc: 0, nextBoss: BOSS_EVERY, nextHorde: HORDE_EVERY, hordeBanner: 0,
    cam: { x: 0, y: 0 },
    p: { x: 0, y: 0, r: 10, hp: 120 + ch.hp + 10 * (mu.hp || 0), maxHp: 120 + ch.hp + 10 * (mu.hp || 0), speed: 140 * ch.spd * (1 + 0.03 * (mu.spd || 0)), dmgMul: ch.dmg * (1 + 0.05 * (mu.dmg || 0)), magnet: 60, cdMul: 1, hurt: 0, dashT: 0, dashCd: 0, face: { x: 1, y: 0 }, xp: 0, lvl: 1, need: 3 },
    w: { [ch.w]: 1 }, pa: {},
    enemies: [], shots: [], gems: [], booms: [], mines: [], bolts: [], hearts: [], vacs: [], bombs: [], ices: [], freeze: 0, chests: [], parts: [], shake: 0, fx: [], mineFx: [], texts: [],
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
  if (state === 'play' && (k === 'shift' || k === ' ') && G.p.dashCd <= 0 && G.p.face) { G.p.dashT = 0.16; G.p.dashCd = 2.5; G.p.hurt = Math.max(G.p.hurt, 0.2); sfx(300, 0.08, 'triangle', 0.05); return; }
  if ((k === 'p' || k === 'escape') && (state === 'play' || state === 'pause')) { state = state === 'play' ? 'pause' : 'play'; return; }
  if (state === 'title' && (k === 'arrowleft' || k === 'a')) { pickChar(-1); return; }
  if (state === 'title' && (k === 'arrowright' || k === 'd')) { pickChar(1); return; }
  if (state === 'title' && k === 'h') { toggleHard(); return; }
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
  amt *= G.p.dmgMul; e.hp -= amt; e.flash = 0.08; e.hitT = 1.5;
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
    if (c.k === 'regen') p.regen = (p.regen || 0) + 0.5;
    if (c.k === 'luck') p.luck = (p.luck || 1) * 1.3;
    if (c.k === 'armor') p.armor = (p.armor || 0) + 1;
    if (c.k === 'growth') p.xpMul = (p.xpMul || 1) + 0.15;
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
  for (let i = 0; i < n; i++) G.enemies.push({ x: G.p.x + Math.cos(a) * d + (i ? rnd(-30, 30) : 0), y: G.p.y + Math.sin(a) * d + (i ? rnd(-30, 30) : 0), r: base.r, hp: base.hp * hpScale * (boss ? 1 + G.t / 240 : 1), speed: base.speed * (1 + Math.min(G.t / 600, 0.6)), dmg: base.dmg, xp: base.xp, color: base.color, flash: 0, boss, kind: base.name, maxHp: base.hp * hpScale * (boss ? 1 + G.t / 240 : 1) });
  if (!boss && n === 1 && G.t >= ELITE_FROM && Math.random() < ELITE_CHANCE) makeElite(G.enemies[G.enemies.length - 1]);
}
// Elite: 2.5x HP, bigger, gold ring; always drops a heart, 20% a chest.
function makeElite(e) { e.elite = true; e.hp *= 2.5; e.maxHp *= 2.5; e.r = Math.round(e.r * 1.3); e.xp *= 3; e.dmg = Math.round(e.dmg * 1.25); return e; }

function spawnHorde() {
  const types = ENEMY_TYPES.filter(t => G.t >= t.from && !t.pack), base = types[types.length - 1 - ((Math.random() * Math.min(2, types.length)) | 0)];
  const n = Math.min(40, 20 + Math.floor(G.t / 20)), d = Math.hypot(W, H) / 2 + 60, hpScale = 1 + G.t / 90;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    G.enemies.push({ x: G.p.x + Math.cos(a) * d, y: G.p.y + Math.sin(a) * d, r: base.r, hp: base.hp * hpScale, speed: base.speed * (1 + Math.min(G.t / 600, 0.6)), dmg: base.dmg, xp: base.xp, color: base.color, flash: 0, kind: base.name });
  }
  G.hordeBanner = 2.5; G.shake = Math.max(G.shake, 0.3);
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
  const fm = Math.hypot(dx, dy); if (fm > 0.05) p.face = { x: dx / fm, y: dy / fm };
  walking = fm > 0.05; // read by drawPlayer to pick the walk animation
  p.dashCd = Math.max(0, p.dashCd - dt);
  if (p.dashT > 0) { p.dashT -= dt; p.x += p.face.x * p.speed * 4 * dt; p.y += p.face.y * p.speed * 4 * dt; }
  else { p.x += dx * p.speed * dt; p.y += dy * p.speed * dt; }
  p.hurt = Math.max(0, p.hurt - dt);
  if (p.regen) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  G.cam.x = p.x - W / 2; G.cam.y = p.y - H / 2;

  // spawn
  G.spawnAcc += spawnRate() * (hard ? 1.4 : 1) * dt;
  while (G.spawnAcc >= 1 && G.enemies.length < 800) { G.spawnAcc--; spawnEnemy(false); }
  if (G.t >= G.nextHorde) { G.nextHorde += HORDE_EVERY; spawnHorde(); }
  G.hordeBanner = Math.max(0, G.hordeBanner - dt);
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
  const wz = G.w.zap;
  if (wz) {
    G.timers.zap = (G.timers.zap || 0) - dt;
    if (G.timers.zap <= 0 && G.enemies.length) {
      G.timers.zap = (2.0 - wz * 0.12) * p.cdMul;
      const n = 1 + Math.ceil(wz / 2), rx = W / 2 + 40, ry = H / 2 + 40;
      const vis = G.enemies.filter(e => Math.abs(e.x - p.x) < rx && Math.abs(e.y - p.y) < ry);
      for (let i = 0; i < n && vis.length; i++) {
        const e = vis.splice((Math.random() * vis.length) | 0, 1)[0];
        damage(e, 18 + wz * 6);
        G.bolts.push({ x: e.x, y: e.y, t: 0.2 });
      }
    }
  }
  const wf = G.w.frost;
  if (wf) {
    G.timers.frost = (G.timers.frost || 0) - dt;
    if (G.timers.frost <= 0) {
      G.timers.frost = (2.2 - wf * 0.1) * p.cdMul;
      const n = 3 + wf, off = Math.random() * Math.PI * 2;
      for (let i = 0; i < n; i++) {
        const a = off + i * Math.PI * 2 / n;
        G.shots.push({ x: p.x, y: p.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, dmg: 5 + wf * 2, life: 0.9, pierce: 1, frost: true });
      }
    }
  }
  const wm = G.w.mine;
  if (wm) {
    G.timers.mine = (G.timers.mine || 0) - dt;
    if (G.timers.mine <= 0 && G.mines.length < 3 + wm) { G.timers.mine = (2.4 - wm * 0.2) * p.cdMul; G.mines.push({ x: p.x, y: p.y, age: 0 }); }
  }
  for (const m of G.mines) {
    m.age += dt;
    if (m.age < 0.5) continue;
    if (G.enemies.some(e => dist2(m, e) < (e.r + 16) ** 2)) {
      m.dead = true; const br = 60 + wm * 6;
      for (const e of G.enemies) if (dist2(m, e) < (br + e.r) ** 2) damage(e, 25 + wm * 8, (e.x - m.x) * 0.1, (e.y - m.y) * 0.1);
      G.mineFx.push({ x: m.x, y: m.y, r: br, t: 0.25, max: 0.25 });
    }
    if (m.age > 20) m.dead = true;
  }
  G.mines = G.mines.filter(m => !m.dead);
  for (const f of G.mineFx) f.t -= dt;
  G.mineFx = G.mineFx.filter(f => f.t > 0);
  for (const b of G.bolts) b.t -= dt;
  G.bolts = G.bolts.filter(b => b.t > 0);
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
        damage(e, s.dmg); if (s.frost) e.slow = Math.max(e.slow || 0, 1.5); s.pierce--; if (s.pierce <= 0) s.life = 0;
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
    const sp = G.freeze > 0 ? 0 : e.slow > 0 ? 0.6 : 1; e.slow = Math.max(0, (e.slow || 0) - dt);
    let lm = 1;
    if (e.kind === 'troll') { e.hitT = (e.hitT || 0) - dt; if (e.hitT <= 0 && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.08 * dt); }
    if (e.kind === 'dasher') { e.ct = (e.ct === undefined ? rnd(1, 3) : e.ct) - dt; if (e.ct <= 0) { e.ct = 3; e.lunge = 0.5; } if (e.lunge > 0) { e.lunge -= dt; lm = 3.5; } }
    e.x += Math.cos(a) * e.speed * sp * lm * dt; e.y += Math.sin(a) * e.speed * sp * lm * dt;
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
    if (p.hurt <= 0 && dist2(p, e) < (e.r + p.r) ** 2) { p.hp -= Math.max(1, e.dmg - (p.armor || 0)); p.hurt = 0.6; G.shake = 0.25; sfx(120, 0.15, 'sawtooth', 0.06); }
  }
  for (const e of G.enemies) if (e.hp <= 0) {
    if (e.kind === 'bloat') for (let k = 0; k < 3; k++) G.enemies.push({ x: e.x + rnd(-14, 14), y: e.y + rnd(-14, 14), r: 7, hp: e.maxHp * 0.15, maxHp: e.maxHp * 0.15, speed: e.speed * 1.8, dmg: 4, xp: 1, color: e.color, flash: 0, kind: 'minibloat' });
    G.kills++; sfx(260 + Math.random() * 80, 0.06);
    G.gems.push({ x: e.x, y: e.y, v: e.xp, big: e.boss });
    if (e.boss || e.elite || Math.random() < 0.025 * (G.p.luck || 1)) G.hearts.push({ x: e.x + 8, y: e.y, heal: e.boss ? 60 : e.elite ? 30 : 20 });
    if (Math.random() < 0.006 * (G.p.luck || 1)) G.vacs.push({ x: e.x - 8, y: e.y });
    if (Math.random() < 0.004 * (G.p.luck || 1)) G.ices.push({ x: e.x, y: e.y + 8 });
    if (Math.random() < 0.004 * (G.p.luck || 1)) G.bombs.push({ x: e.x + 8, y: e.y - 8 });
    if (e.boss || (e.elite && Math.random() < 0.2)) G.chests.push({ x: e.x - 12, y: e.y });
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
    if (d2 < (p.r + 6) ** 2) { g.dead = true; p.xp += g.v * (p.xpMul || 1); }
  }
  G.gems = G.gems.filter(g => !g.dead);
  // merge far-away small gems when too many pile up (keeps XP, saves frame time)
  if (G.gems.length > 300) {
    let pool = 0; const keep = [];
    for (const g of G.gems) { if (!g.pull && !g.big && g.v < 5 && dist2(p, g) > 500 * 500) pool += g.v; else keep.push(g); }
    if (pool) keep.push({ x: p.x + rnd(-1, 1) * 500 + 520, y: p.y + rnd(-1, 1) * 500, v: pool, big: pool >= 5 });
    G.gems = keep;
  }
  if (p.xp >= p.need && state === 'play') {
    p.xp -= p.need; p.lvl++; p.need = Math.round(p.need * 1.22 + 2);
    G.choices = rollChoices();
    if (G.choices.length) { state = 'levelup'; sfx(660, 0.25, 'triangle', 0.07); }
  }
  for (const h of G.hearts) if (dist2(p, h) < (p.r + 10) ** 2 || (dist2(p, h) < mr2 && p.hp < p.maxHp)) {
    if (dist2(p, h) < (p.r + 10) ** 2) { h.dead = true; sfx(520, 0.15, 'sine', 0.06); p.hp = Math.min(p.maxHp, p.hp + h.heal); G.texts.push({ x: p.x, y: p.y - 16, s: '+' + h.heal, t: 0.8 }); }
    else { const a = Math.atan2(p.y - h.y, p.x - h.x); h.x += Math.cos(a) * 200 * dt; h.y += Math.sin(a) * 200 * dt; }
  }
  G.hearts = G.hearts.filter(h => !h.dead);
  for (const v of G.vacs) if (dist2(p, v) < (p.r + 12) ** 2) {
    v.dead = true; sfx(700, 0.25, 'triangle', 0.07); for (const g of G.gems) g.pull = true; G.texts.push({ x: p.x, y: p.y - 16, s: 'VACUUM!', t: 1 });
  }
  G.vacs = G.vacs.filter(v => !v.dead);
  for (const b of G.bombs) if (dist2(p, b) < (p.r + 12) ** 2) {
    b.dead = true; sfx(90, 0.4, 'sawtooth', 0.09); G.shake = 0.5; G.texts.push({ x: p.x, y: p.y - 16, s: 'BOMB!', t: 1 });
    for (const e of G.enemies) if (Math.abs(e.x - p.x) < W / 2 + 40 && Math.abs(e.y - p.y) < H / 2 + 40) damage(e, e.boss ? 120 : 9999);
  }
  G.bombs = G.bombs.filter(b => !b.dead);
  for (const f of G.ices) if (dist2(p, f) < (p.r + 12) ** 2) { f.dead = true; G.freeze = 4; sfx(900, 0.2, 'sine', 0.06); G.texts.push({ x: p.x, y: p.y - 16, s: 'FREEZE!', t: 1 }); }
  G.ices = G.ices.filter(f => !f.dead);
  G.freeze = Math.max(0, G.freeze - dt);
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

  if (p.hp <= 0 || G.t >= WIN_TIME) {
    G.won = p.hp > 0;
    state = 'dead'; sfx(G.won ? 660 : 90, 0.6, G.won ? 'triangle' : 'sawtooth', 0.08);
    const score = Math.floor(G.t);
    G.gold = Math.round((G.kills + Math.floor(G.t / 10) + (G.won ? 200 : 0)) * (hard ? 1.5 : 1));
    localStorage.setItem('tzs_gold', getGold() + G.gold);
    G.newBest = score > +(localStorage.getItem('tzs_best') || 0);
    if (G.newBest) localStorage.setItem('tzs_best', score);
  }
}

// ---------- render ----------
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function buildSummary() {
  const wl = Object.keys(G.w).map(k => WEAPONS[k].name + (G.w[k] >= EVO_LVL ? ' (EVO)' : ' ' + G.w[k])).join(', ');
  const pl = Object.keys(G.pa).map(k => PASSIVES[k].name + ' ' + G.pa[k]).join(', ');
  return { wl, pl };
}
// Dark navy plate with a thin gold rim behind HUD readouts (cheap: one fill + one stroke, no allocation).
// Pixel bar: Ink border, dark trough, fill with a light top row and shaded bottom row (2 shade steps).
function pixBar(x, y, w, h, f, col) {
  ctx.fillStyle = '#0b1020'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#1e2a4a'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  const fw = Math.round((w - 4) * f); if (fw <= 0) return;
  ctx.fillStyle = col; ctx.fillRect(x + 2, y + 2, fw, h - 4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 2, y + 2, fw, 2);
  ctx.fillStyle = 'rgba(11,16,32,0.35)'; ctx.fillRect(x + 2, y + h - 4, fw, 2);
}
function hudPlate(x, y, w, h) { ctx.fillStyle = 'rgba(8,12,30,0.62)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(251,191,36,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
// Pixel font (src/sprites.js): size maps to an integer glyph scale; shrinks to fit the canvas width.
function text(s, x, y, size, color = '#fff', align = 'center', maxW = W - 12) {
  s = String(s).toUpperCase();
  let k = size < 13 ? 1 : size < 27 ? 2 : size < 40 ? 3 : 4;
  while (k > 1 && SPR.fontWidth(s, k) > maxW) k--;
  SPR.drawText(ctx, s, x, y - 7 * k, k, color, align);
}
// Procedural "sprites": body shape + per-type features, eyes face the player.
function drawHeart(x, y) { drawPickup('heart', '#f43f5e', x, y, 2); }
const SPR = window.TZS_SPRITES;
let walking = false; // set in update() from movement input; render only reads it
// Player: baked pixel sprite (src/sprites.js), body tinted per character, drawn at 2x.
function drawPlayer(p) {
  const moved = walking;
  const spr = SPR.variant('player', CHARS[charIdx].color);
  const flash = p.hurt > 0 && ((p.hurt * 20) | 0) % 2;
  const flip = p.face && p.face.x < 0;
  ctx.fillStyle = 'rgba(11,16,32,.4)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + p.r + 2, p.r, 4, 0, 0, 7); ctx.fill();
  if (moved) SPR.drawSprite(ctx, spr, 'walk', (G.t * 10) | 0, p.x, p.y - 4, 2, { flash, flip });
  else SPR.drawSprite(ctx, spr, 'idle', (G.t * 2) | 0, p.x, p.y - 4, 2, { flash, flip });
}
const ENEMY_SPR = {};
function drawEnemy(e) {
  const S = window.TZS_SPRITES, base = S && S.baked[e.kind];
  if (!base) return;
  const spr = ENEMY_SPR[e.kind + e.color] || (ENEMY_SPR[e.kind + e.color] = S.variant(e.kind, e.color));
  const f = Math.floor(G.t * (e.kind === 'bat' || e.kind === 'wisp' ? 12 : 7) + e.x * 0.07);
  const k = e.boss ? 2 : e.elite ? (e.r <= 19 ? 3 : 4) : e.r <= 15 ? 2 : 3;
  if (e.elite) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -G.t * 20; ctx.beginPath(); ctx.arc(e.x, e.y, k * 8 + 4, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  S.drawSprite(ctx, spr, 'walk', f, e.x, e.y, k, { flash: e.flash > 0 });
}
function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }

const PICK_SPR = {};
function pickupSpr(kind, color) { return PICK_SPR[kind + color] || (PICK_SPR[kind + color] = SPR.variant(kind, color)); }
function drawPickup(kind, color, x, y, scale) { SPR.drawSprite(ctx, pickupSpr(kind, color), 'idle', 0, x, y, scale); }
function drawGem(g) {
  drawPickup('gem', g.v >= 5 ? '#f0abfc' : '#38bdf8', g.x, g.y, g.big ? 3 : 2);
}
function drawChest(c) {
  const y = c.y + Math.sin(G.t * 3) * 1.5;
  ctx.fillStyle = 'rgba(11,16,32,.4)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 11, 14, 4, 0, 0, 7); ctx.fill();
  drawPickup('chest', '#b45309', c.x, y, 3);
}

function drawBolt(s) {
  const a = Math.atan2(s.vy, s.vx);
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(a);
  ctx.fillStyle = 'rgba(254,240,138,.25)'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-2, -4); ctx.lineTo(-2, 4); ctx.fill();
  drawPickup('bolt', '#fde047', 0, 0, 2);
  ctx.restore();
}
function drawBoom(b) {
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.age * 18);
  drawPickup('boom', '#fdba74', 0, 0, 2);
  ctx.restore();
}
// --- woodland floor art: cached once, reused every frame ---
// Midnight/navy tiles with moss patches, stones, grass tufts and faint gold/cyan motes.
// The pattern is 4x4 cells of 64px (256px total) and every decoration stays inside its cell,
// so the tile repeats seamlessly. Decorations use cell indices (i, j) modulo 4.
let FLOOR_PAT = null, SHADOW_IMG = null;
function woodlandFloor() {
  if (FLOOR_PAT) return FLOOR_PAT;
  // 8x8 baked 16x16 pixel tiles drawn at 2x = 256px pattern (see sprites.js tiles)
  const N = 8, c = document.createElement('canvas'), T = SPR.tiles;
  c.width = c.height = N * 32;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const h = (Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0, v = h % 9;
    g.drawImage(T[v < 3 ? 0 : v - 2 > 5 ? 5 : v - 2 < 1 ? 1 : v - 2], i * 32, j * 32, 32, 32);
  }
  FLOOR_PAT = ctx.createPattern(c, 'repeat');
  return FLOOR_PAT;
}
// cached radial shadow sprite; drawImage per entity instead of a fresh path each frame
function groundShadow(x, y, r) {
  if (!SHADOW_IMG) {
    SHADOW_IMG = document.createElement('canvas'); SHADOW_IMG.width = SHADOW_IMG.height = 32;
    const g = SHADOW_IMG.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  }
  ctx.drawImage(SHADOW_IMG, x - r * 1.1, y - r * 0.55, r * 2.2, r * 1.1);
}
function render() {
  ctx.imageSmoothingEnabled = false; // resets on canvas resize
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
    text('Mode: ' + (hard ? 'HARD (+40% enemies, +50% gold)' : 'Normal') + '  -  H to toggle', W / 2, H / 2 + 92, 14, hard ? '#f87171' : '#aaa');
    text('Gold: ' + getGold() + '  -  press 1-3 to buy upgrades', W / 2, H / 2 + 110, 16, '#fde047');
    META_KEYS.forEach((k, i) => { const d = META[k], l = mu[k] || 0; text(`${i + 1}. ${d.name} ${l}/${d.max}  ${d.desc}  ` + (l >= d.max ? 'MAX' : d.cost(l) + 'g'), W / 2, H / 2 + 136 + i * 22, 14, l < d.max && getGold() >= d.cost(l) ? '#6ee7b7' : '#888'); });
    return;
  }
  const { cam, p } = G;
  const sh = G.shake * 20;
  ctx.save(); ctx.translate(-cam.x + rnd(-sh, sh), -cam.y + rnd(-sh, sh));
  // themed floor: one cached 4x4-tile pattern (see woodlandFloor), filled over the visible area
  ctx.fillStyle = woodlandFloor(); ctx.fillRect(cam.x - 64, cam.y - 64, W + 128, H + 128);
  // props: sparse trees/rocks/mushrooms on a hashed 112px grid, view-culled, drawn under all units
  if (!window.__tzsNoProps) for (let gy = Math.floor((cam.y - 40) / 112), ey = Math.floor((cam.y + H + 40) / 112); gy <= ey; gy++) for (let gx = Math.floor((cam.x - 40) / 112), ex = Math.floor((cam.x + W + 40) / 112); gx <= ex; gx++) {
    const h = (Math.imul(gx, 374761393) ^ Math.imul(gy, 668265263)) >>> 0;
    if (h % 5 > 1 || (gx === 0 && gy === 0)) continue;
    const k = (h >> 3) % 6, kind = k < 3 ? 'tree' : k < 5 ? 'rock' : 'mush', px = gx * 112 + 16 + (h >> 8) % 80, py = gy * 112 + 16 + (h >> 16) % 80;
    groundShadow(px, py + 12, kind === 'tree' ? 14 : 10);
    SPR.drawSprite(ctx, SPR.baked[kind], 'idle', 0, px, py, 2);
  }
  // soft ground shadows for enemies go under every sprite (player shadow is drawn in drawPlayer)
  // (shadows outside the visible area are culled; crowded scenes can hold hundreds of enemies)
  const vx0 = cam.x - 160, vy0 = cam.y - 160, vx1 = cam.x + W + 160, vy1 = cam.y + H + 160; // margin > largest shadow (boss r*1.1)
  for (const e of G.enemies) if (e.x > vx0 && e.x < vx1 && e.y > vy0 && e.y < vy1) groundShadow(e.x, e.y + e.r * 0.6, e.r);
  for (const g of G.gems) drawGem(g);
  for (const h of G.hearts) drawHeart(h.x, h.y + Math.sin(G.t * 5 + h.x) * 1.5);
  for (const b of G.bombs) drawPickup('bomb', '#374151', b.x, b.y + Math.sin(G.t * 5 + b.x) * 1.5, 2);
  for (const f of G.ices) drawPickup('ice', '#7dd3fc', f.x, f.y + Math.sin(G.t * 5 + f.x) * 1.5, 2);
  for (const v of G.vacs) drawPickup('vac', '#38bdf8', v.x, v.y + Math.sin(G.t * 5 + v.x) * 1.5, 2);
  for (const c of G.chests) drawChest(c);
  for (const e of G.enemies) {
    if (!e.boss && !(e.x > vx0 && e.x < vx1 && e.y > vy0 && e.y < vy1)) continue; // view cull (bosses keep drawing for the HP bar)
    drawEnemy(e);
    if (e.boss) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3, 0, 7); ctx.stroke();
      const bw = e.r * 2.4, f = Math.max(0, e.hp / e.maxHp); ctx.fillStyle = '#000a'; ctx.fillRect(e.x - bw / 2, e.y - e.r - 14, bw, 6); ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - bw / 2, e.y - e.r - 14, bw * f, 6); }
  }
  for (const q of G.parts) { const z = q.t > 0.15 ? 4 : 2, px = Math.round(q.x / 2) * 2, py = Math.round(q.y / 2) * 2; ctx.fillStyle = '#0b1020'; ctx.fillRect(px - z / 2 - 1, py - z / 2 - 1, z + 2, z + 2); ctx.fillStyle = q.c; ctx.fillRect(px - z / 2, py - z / 2, z, z); }
  for (const b of G.booms) drawBoom(b);
  for (const m of G.mines) { drawPickup('mine', m.age < 0.5 ? '#78350f' : '#f59e0b', m.x, m.y, 2); }
  for (const b of G.bolts) {
    ctx.globalAlpha = Math.min(1, b.t / 0.2 + 0.3);
    let x = b.x + rnd(-10, 10), y = b.y - 260;
    for (let i = 1; i <= 6; i++) {
      const nx = i === 6 ? b.x : b.x + rnd(-14, 14), ny = b.y - 260 + i * 260 / 6, n = 6;
      for (let k = 0; k < n; k++) { const px = Math.round((x + (nx - x) * k / n) / 3) * 3, py = Math.round((y + (ny - y) * k / n) / 3) * 3; ctx.fillStyle = '#0b1020'; ctx.fillRect(px - 5, py - 1, 10, 6); ctx.fillStyle = '#fde047'; ctx.fillRect(px - 3, py, 6, 4); }
      x = nx; y = ny;
    }
    ctx.globalAlpha = 1;
  }
  for (const s of G.shots) drawBolt(s);
  if (G.w.orbit) { const n = 1 + G.w.orbit, rad = 60 + G.w.orbit * 4; for (let i = 0; i < n; i++) { const a = G.orbAng + (i / n) * Math.PI * 2; drawPickup('orb', '#a78bfa', p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad, 2); } }
  if (G.w.garlic) { ctx.fillStyle = 'rgba(167,243,208,.12)'; ctx.beginPath(); ctx.arc(p.x, p.y, 50 + G.w.garlic * 12, 0, 7); ctx.fill(); }
  if (G.slash) { const k = G.slash; ctx.fillStyle = 'rgba(253,230,138,' + (k.t / 0.15 * 0.6) + ')'; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.arc(k.x, k.y, k.reach, k.a - k.half, k.a + k.half); ctx.closePath(); ctx.fill(); }
  for (const f of G.mineFx) { ctx.fillStyle = 'rgba(245,158,11,' + (f.t / f.max * 0.6) + ')'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - f.t / f.max * 0.4), 0, 7); ctx.fill(); }
  if (G.novaRing) { ctx.strokeStyle = 'rgba(125,211,252,' + (G.novaRing.t / 0.3) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, p.y, G.novaRing.r, 0, 7); ctx.stroke(); }
  drawPlayer(p);
  for (const t of G.texts) text(t.s, t.x, t.y, 12, '#fff');
  ctx.restore();

  if (G.freeze > 0) { ctx.fillStyle = 'rgba(125,211,252,' + Math.min(0.18, G.freeze * 0.1) + ')'; ctx.fillRect(0, 0, W, H); }
  // HUD
  pixBar(0, 0, W, 14, Math.min(1, p.xp / p.need), '#38bdf8');
  text('LV ' + p.lvl, W / 2, 11, 12);
  pixBar(16, 24, W < 480 ? 108 : 160, 12, Math.max(0, p.hp / p.maxHp), '#ef4444');
  // Readout plates keep text legible over busy floor art; narrow screens drop the key hint so the
  // timer block (center) and dash/kills block (right) never overlap at 390px.
  const narrow = W < 480;
  hudPlate(W / 2 - 62, 22, 124, 46);
  hudPlate(W - (narrow ? 130 : 196), 22, narrow ? 122 : 188, 44);
  text(fmt(G.t), W / 2, 40, 22);
  text('goal ' + fmt(WIN_TIME), W / 2, 54, 11, '#94a3b8');
  // Narrow screens move the banner off the top-left weapon list (it would overlap at 390px).
  if (G.hordeBanner > 0) narrow ? text('A HORDE APPROACHES!', W / 2, Math.round(H * 0.3), 16, '#f87171') : text('A HORDE APPROACHES!', W / 2, 70, 20, '#f87171');
  text('Kills ' + G.kills, W - 16, 40, 16, '#fff', 'right');
  const dashTxt = p.dashCd > 0 ? 'Dash ' + p.dashCd.toFixed(1) : (narrow ? 'Dash READY' : 'Dash READY (Shift/Space)');
  text(dashTxt, W - 16, 58, 12, p.dashCd > 0 ? '#94a3b8' : '#6ee7b7', 'right');
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
      text(`${i + 1}. ${d.name} (Lv ${c.lvl})`, r.x + 12, r.y + 30, 18, '#fff', 'left', r.w - 20);
      text(d.desc, r.x + 12, r.y + 56, 14, '#bbb', 'left', r.w - 20);
    });
  }
  if (state === 'pause') {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
    // Same navy plate as the end screen: title plus a separate hint line, readable over any terrain.
    const pw = Math.min(W - 16, 320), px = (W - pw) / 2;
    hudPlate(px, H / 2 - 52, pw, 104);
    text('PAUSED', W / 2, H / 2 - 6, 36, '#fde047');
    text('P / Esc to resume', W / 2, H / 2 + 28, 16, '#6ee7b7', 'center', pw - 24);
  }
  if (state === 'dead') {
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, W, H);
    // Navy panel behind the summary block gives contrast over the arena; every line is fitted to the panel width.
    const pw = Math.min(W - 16, 520), px = (W - pw) / 2;
    hudPlate(px, H / 2 - 84, pw, 254);
    const fit = (str, max) => Math.max(9, Math.min(max, Math.floor((pw - 24) / (str.length * 0.62))));
    if (G.won) text('YOU SURVIVED!', W / 2, H / 2 - 30, 40, '#fde047'); else text('YOU DIED', W / 2, H / 2 - 30, 40, '#ef4444');
    const survived = `Survived ${fmt(G.t)} - Kills ${G.kills} - Level ${p.lvl}`;
    text(survived, W / 2, H / 2 + 10, Math.max(12, fit(survived, 18)));
    const best = 'Best ' + fmt(+(localStorage.getItem('tzs_best') || 0)) + ' - Gold +' + G.gold;
    text(best, W / 2, H / 2 + 40, fit(best, 16), '#cbd5e1');
    if (G.newBest) text('NEW BEST!', W / 2, H / 2 + 66, 16, '#fde047');
    const { wl, pl } = buildSummary();
    if (wl) { const t = 'Weapons: ' + wl; text(t, W / 2, H / 2 + 126, fit(t, 13), '#93c5fd'); }
    if (pl) { const t = 'Passives: ' + pl; text(t, W / 2, H / 2 + 144, fit(t, 13), '#a7f3d0'); }
    text('SPACE or tap to continue', W / 2, H / 2 + 98, Math.min(18, fit('SPACE or tap to continue', 18)), '#6ee7b7');
  }
}

// ---------- loop ----------
let last = performance.now();
const SHEET = /[?&]sprites=1/.test(location.search); // sprite-sheet review page
function frame(now) {
  if (SHEET) { SPR.drawSheet(ctx, W, H, now / 1000); requestAnimationFrame(frame); return; }
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state === 'play') update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test hook
window.__tzs = { keys, get state() { return state; }, set state(v) { state = v; }, get G() { return G; }, start() { newGame(); state = 'play'; }, update, render, press: onKey, buildSummary, makeElite, spawnEnemy };
})();
