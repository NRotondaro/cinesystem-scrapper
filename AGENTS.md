# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Maceió Cine Bot** is a Telegram bot that queries the Ingresso.com public API for real-time cinema schedules in Maceió, Brazil. It is a single Node.js application (ES Modules, `"type": "module"`).

### Entry points

| Script | Command | Purpose |
|---|---|---|
| `npm start` | `node src/index.js` | CLI — fetches today's schedule and writes to `data/state.json`. No tokens needed. |
| `npm run bot:listen` | `node src/bot.js` | Telegram bot + Express health check server. **Requires** `TELEGRAM_BOT_TOKEN`. |

### Environment variables

Copy `.env.example` to `.env`. Only `TELEGRAM_BOT_TOKEN` is required for the bot; the CLI works without any tokens.

- `TELEGRAM_BOT_TOKEN` — required for `npm run bot:listen`
- `OMDb_API_KEY` — optional, enables IMDb/RT ratings
- `TMDB_API_KEY` — optional, fallback ratings from TMDb

### Running without Telegram token

Use `npm start` to exercise the core data pipeline (API fetch, normalization, cache) without needing a Telegram token. This is the best way to verify the codebase works.

### Lint / Test / Build

This project does **not** currently have lint, test, or build scripts defined in `package.json`. There are no automated tests. To verify correctness, run `npm start` and check the output.

### Notes

- No database — uses a file-based JSON cache at `data/cache.json` and in-memory Maps.
- The `data/` directory is created automatically on first run.
- The Ingresso.com API is public and requires no API key; it uses browser-like User-Agent headers (defined in `src/api.js`).
- Express health check runs on `PORT` (default `10000`) and is part of `bot.js`.
