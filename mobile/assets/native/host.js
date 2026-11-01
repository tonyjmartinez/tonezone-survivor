// Platform lifecycle only. Menus, input, farming and combat belong in shared src/.
(() => {
  'use strict';
  const game = window.__tzs;
  if (!game) throw new Error('The bundled game did not initialize');
  function pause() {
    for (const key of Object.keys(game.keys)) game.keys[key] = false;
    game.setTouch(null);
    if (game.state === 'play') game.state = 'pause';
  }
  function back() {
    if (game.state === 'play') pause();
    else if (game.state === 'pause') game.press('p');
    else if (game.state === 'dead') game.state = 'title';
  }
  window.addEventListener('error', event => {
    if (window.TonezoneErrors) TonezoneErrors.postMessage(event.message || 'Game error');
  });
  window.addEventListener('unhandledrejection', event => {
    if (window.TonezoneErrors) TonezoneErrors.postMessage(String(event.reason));
  });
  game.touchUi = true;
  window.TonezoneHost = { pause, back };
})();
