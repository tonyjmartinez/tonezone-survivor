'use strict';
window.addEventListener('error', event => {
  if (window.TonezoneErrors) TonezoneErrors.postMessage(event.message || 'Game error');
});
window.addEventListener('unhandledrejection', event => {
  if (window.TonezoneErrors) TonezoneErrors.postMessage(String(event.reason));
});
