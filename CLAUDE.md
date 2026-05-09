# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server on 0.0.0.0 (network-accessible)
npm run build    # TypeScript type-check + Vite production build
npm run preview  # Preview production build locally
```

No test suite exists. Type checking via `tsc` runs as part of `npm run build`.

## Architecture

**Treech Flappy** is a Telegram Web App-integrated Flappy Bird-style game built with Phaser 3, TypeScript, and Vite. The game deploys to subdirectory `/namorevo-gore/` and communicates with a backend at `/saturn-api` (proxied to `localhost:5001` in dev).

### Entry Point Flow

1. `index.html` → `src/main.ts`: initializes i18n (Russian), calls `initTelegram()`, creates `Phaser.Game`
2. `src/game/config.ts` → `createGameConfig()`: sets viewport (base 480×720, responsive), single scene
3. `FlappyScene` runs the full game loop (preload → create → update)

### Scene & Systems

**`src/scenes/FlappyScene.ts`** is the only Phaser scene. It owns:
- Game state machine (idle → running → game over) via `GameSession`
- Collision detection between Bird ↔ Ground, Bird ↔ Pipes, Bird ↔ ScorerZones
- Viewport resize handling (Telegram WebApp `viewportChanged` events)

**Key subsystems:**

| Module | Location | Responsibility |
|---|---|---|
| `Bird` | `src/game/entities/Bird.ts` | Player sprite, physics, jump/death animation |
| `PipeManager` | `src/game/obstacles/PipeManager.ts` | Pipe pair spawning, scroll speed, cleanup |
| `GameWorld` | `src/game/world/GameWorld.ts` | Layered parallax background (wall, ceiling, chains, ground) |
| `GameHud` | `src/game/ui/GameHud.ts` | Score display, leaderboard panel, game-over/start screens |
| `GameSession` | `src/game/state/GameSession.ts` | Score, best score, game state flags |
| `difficulty` | `src/game/difficulty.ts` | Scales pipe speed/gap/spawn rate every 3 points (max level 8) |
| `BestScoreRepository` | `src/game/scoring/BestScoreRepository.ts` | `localStorage` persistence under key `treechFlappyBestScore` |

### Textures

All textures are **procedurally generated** via Phaser Graphics API in `src/game/textures/createWorldTextures.ts` — no image files for the environment. Only the bird sprite (`treech`) is a loaded image asset.

### Telegram Integration

`src/telegram.ts` wraps the TWA SDK: initializes the app, extracts `userId`/`chatId` from launch params, fires haptic feedback (light impact on flap, error/success on game over), and emits viewport change events for responsive resizing.

### Backend API

`src/api/namorevoGore.ts` — REST client for the leaderboard:
- `POST /saturn-api/api/namorevo-gore/score` — submit score
- `GET /saturn-api/api/namorevo-gore/leaderboard?limit=10` — fetch top scores
- Passes Telegram init data in `X-Telegram-Init-Data` header

### Physics Constants

Core tuning lives in `src/game/constants.ts`:
- Gravity: 1450, jump velocity: −470
- Pipe gap: 185px → 140px (difficulty levels 0–8)
- Pipe speed: −190 → −635
- Spawn interval: 1450ms → 1000ms
- `DIFFICULTY_TUNING_MULTIPLIER` in `difficulty.ts` steepens the progression curve
