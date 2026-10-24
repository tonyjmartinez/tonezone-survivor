# Agent instructions
This repo is iterated on by an hourly scheduled Claude run. Every run:
0. FIRST command: `git fetch origin main && git reset --hard origin/main` (session branches start stale and have repeatedly re-built features already on main).
1. Read `MEMORY.md` and `ROADMAP.md` first.
2. Pick the next unchecked roadmap item(s); keep changes small and playable.
3. Run `node --check src/game.js` and the smoke test in `tests/smoke.js`.
4. Update `MEMORY.md` (append a dated log entry, update "Next steps") and tick `ROADMAP.md`.
5. Commit and push to the designated session branch; try to merge to `main` (via PR + merge) when green.
Keep it dependency-free (vanilla JS canvas) unless there's a strong reason.
