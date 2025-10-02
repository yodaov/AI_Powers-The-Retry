import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

// CORS: allow your frontend only (set FRONTEND_ORIGIN in .env)
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8000";
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-User-OpenAI-Key"],
    maxAge: 86400
  })
);

// Health
app.get("/who", (_, res) => res.json({ ok: true, service: "ai-power-foundry", time: Date.now() }));

app.post("/generatePower", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // BYOK: key per request via header; otherwise fallback to server env
  const userKey = req.header("X-User-OpenAI-Key");
  const keyToUse = userKey || process.env.OPENAI_API_KEY;
  if (!keyToUse) return res.status(401).json({ error: "Missing OpenAI key" });

  // IMPORTANT: never log secrets
  // console.log("Got request") — keep logs generic only.

  const client = new OpenAI({ apiKey: keyToUse });

  const systemPrompt = `
You generate 2D game powers with this pipeline:

1) BRAINSTORM (exactly ONE sentence): describe what the power looks like and what it does, in plain language.
2) CODE OUTPUT (strict JSON ONLY): Return an object with keys:
   - "projectile_js": a tiny canvas-drawing function body string
   - "trail_js": a tiny canvas-drawing function body string
   - "impact_js": a tiny canvas-drawing function body string
   - "deathEffect_js": a tiny canvas-drawing function body string
   - "meta": JSON with fields like { name, speed, size, colors, statusEffect }

RULES:
- Output the brainstorm sentence, then a newline, then the JSON only.
- *_js strings must be SAFE, tiny pixel-art style canvas code (no DOM, no eval, no fetch, no imports).
- No text drawing. Only shapes/pixels/paths via CanvasRenderingContext2D.
- Keep values modest so nothing crashes (reasonable speeds/sizes).
- Do NOT echo examples. They limit creativity.
  `;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    });

    const content = completion?.choices?.[0]?.message?.content?.trim() || "";
    if (!content) return res.status(502).json({ error: "Empty response from model" });

    // Return raw content (brainstorm line + JSON). Frontend will split/parse.
    res.json({ output: content });
  } catch (err) {
    // Avoid leaking details; keep user-friendly.
    res.status(500).json({ error: "AI generation failed" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`⚡ Backend running on :${PORT} (allowing origin: ${allowedOrigin})`);
});
