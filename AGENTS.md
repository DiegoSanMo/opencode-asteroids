# AGENTS.md

## What this is

Vanilla HTML5 canvas Asteroids clone: `index.html` + `game.js`. No package manager, bundler, dependencies, tests, lint, or build step. There is no `package.json` — do not invent npm scripts.

## Run

Open `index.html` directly, or serve the directory:

```bash
npx serve .
```

There is no verification command. After edits, reload the page (or reopen the file) and play to confirm behavior.

## Structure

- `game.js` — everything: input, entities (`Ship`, `Asteroid`, `Bullet`, `Particle`, `PowerUp`, `Enemy`, `EnemyBullet`), game loop, HUD, overlays.
- `index.html` — fixed `<canvas id="canvas" width="800" height="600">` plus inline CSS.
- `favicon.svg` — static asset.

## Quirks to know before editing

- **Canvas size is duplicated**: `800`/`600` live in `index.html` and again as `W`/`H` at the top of `game.js`. Change both together.
- **Classic script, not a module**: `game.js` is loaded via `<script src="game.js">`; no `import`/`export`. Everything is global under `'use strict'`.
- **Game state is module-level globals** (`ship`, `bullets`, `asteroids`, `particles`, `powerUps`, `enemies`, `enemyBullets`, `score`, `lives`, `level`, `state`) initialized by `initGame()` at the bottom of the file. Restart/reset logic lives there and in `nextLevel()`.
- **Collections are reassigned, not mutated**: `bullets = bullets.filter(...)`, same for `particles`/`asteroids`. Don't hold stale references across updates.
- **One-shot input**: `pressed(code)` reads and clears `justPressed[code]`. Call it at most once per frame per key — calling it again returns `false`.
- **Toroidal space**: movement wraps with `wrap(v, max)`, but collision checks use plain `dist()` with no wrap-aware distance, so collisions across screen edges do not register. Keep this in mind if you add entity types or "fix" collisions.
- **Frame timing**: `dt` is seconds and clamped to `0.05` in `loop()`; all speeds are per-second. Use `dt` for new motion, never assume a fixed frame rate.
- **Rendering state**: `ctx` is reused directly. Pair `ctx.save()`/`ctx.restore()` around translate/rotate blocks (as existing `draw()` methods do) so HUD text and fill styles don't leak.
- **Skins**: `SKINS` (before `class Ship`) holds each silhouette and palette; `currentSkin` is the active index, persisted in `localStorage` under `asteroids.skin`. Appearance is purely cosmetic — collision `radius` stays 12. Per-skin `nose`/`rear`/`flameSpread` drive bullet origin and thruster flame, so any new shape must set them. `drawShipShape()` is shared by the ship and the life icons.

## Conventions

- UI and HUD copy is in Spanish (`NIVEL`, `PUNTAJE`, `GAME OVER`); code identifiers and comments are English/Spanish mixed. Match existing style in the file you touch.
- Size-indexed arrays (`RADII`, `SPEEDS`, `POINTS`) are indexed by asteroid `size` 1–3; index `0` is unused.

## Docs caveat

`README.md` documents the speed/shield power-ups, the enemy UFO, the triple shot, the skins, and the "estrella fugaz" asteroid; all are implemented in `game.js` (see `PowerUp`, `Enemy`, `Ship`, `SKINS`, and the `fugaz` flag on `Asteroid`). Keep the README in sync with the code.
