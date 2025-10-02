# AI Power Foundry

Generate **AI-created game powers** instantly from text prompts.

## Features
- Type any theme → AI brainstorms and scripts a power.
- Returns JSON with projectile, trail, impact, and death effect.
- Click in the canvas to test it live.

## Run locally
1. `cd backend && npm install`
2. Copy `.env.example` → `.env` and add your `OPENAI_API_KEY`.
3. Run backend: `npm start`
4. Open `frontend/index.html` in your browser.

## Deploy online
- Deploy backend on **Render/Vercel/Railway**.
- Deploy frontend on **GitHub Pages** (update `API_URL` in `main.js`).
