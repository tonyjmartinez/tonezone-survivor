(() => {
  'use strict';
  const game = window.__tzs, $ = id => document.getElementById(id);
  const characters = [
    ['Mage', 'Magic Bolt · Balanced', '#e6c36a'],
    ['Knight', 'Whip · +30 HP · Slower', '#93c5fd'],
    ['Druid', 'Garlic Aura · +10% speed', '#86efac'],
    ['Rogue', 'Boomerang · +15% damage · -20 HP', '#fda4af'],
    ['Pyro', 'Mines · -10% speed', '#fdba74'],
    ['Storm', 'Lightning · Splash damage', '#7dd3fc'],
  ];
  let muted = false, lastState = '';
  const savedNumber = key => Number(localStorage.getItem(key) || 0);
  const press = key => game.press(key);
  const format = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  function refreshTitle() {
    const index = Math.max(0, Math.min(5, savedNumber('tzs_char')));
    const [name, desc, color] = characters[index];
    $('character-name').textContent = name; $('character-name').style.color = color;
    $('character-desc').textContent = desc; $('character-count').textContent = `0${index + 1} / 06`;
    $('character-dots').replaceChildren(...characters.map((_, i) => {
      const dot = document.createElement('span'); dot.className = i === index ? 'active' : ''; return dot;
    }));
    $('mode').textContent = savedNumber('tzs_hard') ? 'HARD MODE' : 'NORMAL MODE';
    $('gold').textContent = `${savedNumber('tzs_gold')} GOLD`;
    const best = savedNumber('tzs_best');
    $('best').textContent = best ? `BEST SURVIVAL ${format(best)} · CAN YOU BEAT IT?` : 'OFFLINE · NO ADS · JUST SURVIVE';
    let meta = {}; try { meta = JSON.parse(localStorage.getItem('tzs_meta')) || {}; } catch (_) { /* no saved upgrades */ }
    const upgrades = [['hp', 'Toughness', 20, 15, 10], ['dmg', 'Power', 30, 20, 10], ['spd', 'Fleetfoot', 25, 20, 8]];
    document.querySelectorAll('[data-upgrade]').forEach((button, i) => {
      const [key, label, base, step, max] = upgrades[i], level = meta[key] || 0;
      button.textContent = `${label} ${level}/${max}\n${level >= max ? 'MAX' : `${base + step * level} GOLD`}`;
    });
  }
  $('previous').onclick = () => { press('arrowleft'); refreshTitle(); };
  $('next').onclick = () => { press('arrowright'); refreshTitle(); };
  $('mode').onclick = () => { press('h'); refreshTitle(); };
  $('sound').onclick = () => { press('m'); muted = !muted; $('sound').textContent = muted ? 'SOUND OFF' : 'SOUND ON'; };
  $('start').onclick = () => { press('enter'); sync(); };
  $('pause').onclick = () => { press('p'); sync(); };
  $('resume').onclick = () => { press('p'); sync(); };
  $('menu').onclick = () => { game.state = 'title'; sync(); };
  document.querySelectorAll('[data-upgrade]').forEach(button => {
    button.onclick = () => { press(button.dataset.upgrade); refreshTitle(); };
  });
  function pause() {
    for (const key of Object.keys(game.keys)) game.keys[key] = false;
    window.dispatchEvent(new PointerEvent('pointerup'));
    if (game.state === 'play') game.state = 'pause';
    sync();
  }
  function back() {
    if (game.state === 'play') pause();
    else if (game.state === 'pause') { press('p'); sync(); }
    else if (game.state === 'dead') { game.state = 'title'; sync(); }
  }
  // Keep the movement finger held while the second finger taps DASH.
  const dashPointers = new Set();
  $('c').addEventListener('pointerdown', event => {
    if (game.state === 'play' && game.hitDash(event.clientX, event.clientY)) {
      dashPointers.add(event.pointerId); press('shift'); event.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('pointerup', event => {
    if (dashPointers.delete(event.pointerId)) event.stopImmediatePropagation();
  }, true);
  window.addEventListener('pointercancel', () => { dashPointers.clear(); window.dispatchEvent(new PointerEvent('pointerup')); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  game.touchUi = true;
  function sync() {
    const state = game.state;
    $('title').hidden = state !== 'title'; $('paused').hidden = state !== 'pause';
    $('pause').style.display = state === 'play' ? 'block' : 'none';
    if (state === 'title' && lastState !== state) refreshTitle();
    lastState = state;
  }
  const portrait = $('portrait').getContext('2d');
  function draw(now) {
    sync();
    if (game.state === 'title') {
      portrait.clearRect(0, 0, 128, 128); portrait.imageSmoothingEnabled = false;
      portrait.fillStyle = '#0005'; portrait.beginPath(); portrait.ellipse(64, 96, 30, 7, 0, 0, Math.PI * 2); portrait.fill();
      const color = characters[Math.max(0, Math.min(5, savedNumber('tzs_char')))][2];
      TZS_SPRITES.drawSprite(portrait, TZS_SPRITES.variant('player', color), 'idle', Math.floor(now / 250), 64, 76 + Math.sin(now / 500) * 2, 4);
    }
    requestAnimationFrame(draw);
  }
  window.TonezoneMobile = { pause, back, sync, sourceRevision: '1a6b3f5', version: '0.1.0' };
  refreshTitle(); sync(); requestAnimationFrame(draw);
})();
