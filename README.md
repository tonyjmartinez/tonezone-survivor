# Tone Zone Survivors

A Vampire Survivors-like in plain HTML5 canvas. No build step: open `index.html`.
Move with WASD/arrows (or drag on touch). Weapons fire automatically. Pick upgrades on level-up (1-3 or tap).

Smoke test: `NODE_PATH=$(npm root -g) node tests/smoke.js`

See `CLAUDE.md` (agent rules), `ROADMAP.md` (plan) and `MEMORY.md` (living log).

Flutter Android/iOS packaging port: see [mobile/README.md](mobile/README.md).

## Deploy

Cloudflare deploys every push to `main` through its GitHub connection: `npm run build` copies the game into `dist/`, then `npx wrangler deploy` (config in `wrangler.jsonc`). Live at https://tonezone-survivor.ajosephmartinez.workers.dev.
