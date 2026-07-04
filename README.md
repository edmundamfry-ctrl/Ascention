# ASCENSION

A dark-comedy survival RPG. 1985. You joined a doomsday cult by accident. You have 40 days to escape, expose the con, or seize control and become the prophet yourself.

Tone: *Commando* meets GTA. Neon, aviators, synth, absurd machismo played completely straight.

---

## Quick start (run it locally, free except API calls)

1. **Install Node.js** (v18+) if you don't have it: https://nodejs.org

2. **Install dependencies** — in this folder, run:
   ```
   npm install
   ```

3. **Get an OpenRouter API key** — sign up at https://openrouter.ai, add a few dollars of credit (DeepSeek is extremely cheap), and create a key at https://openrouter.ai/keys

4. **Add your key** — copy `.env.local.example` to `.env.local` and paste your key in:
   ```
   OPENROUTER_API_KEY=sk-or-your-actual-key
   ```

5. **Run it:**
   ```
   npm run dev
   ```
   Open http://localhost:3000 in your browser.

---

## Deploy to Vercel (public URL)

1. Push this folder to a GitHub repo.
2. Import the repo at https://vercel.com/new
3. In the Vercel project settings → Environment Variables, add `OPENROUTER_API_KEY` with your key.
4. Deploy. Vercel auto-deploys on every push.

---

## Swapping the AI model

The model is one string in `pages/api/gm.js` (line ~19). Default is `deepseek/deepseek-chat` (cheap, creative, good at committing to the comedy). Alternatives are listed in comments right there — Gemini Flash, Grok, Claude Haiku — swap the string and redeploy to try another.

---

## How it works

- `pages/index.js` — the game UI (React). Character select, HUD, chat, dice roller.
- `lib/engine.js` — archetypes, the random character generator, dice, and the system prompt that defines the game.
- `lib/filters.js` — client-side safety nets that strip player-dialogue violations and moralizing from every GM response, independent of what the model does.
- `pages/api/gm.js` — the API handler that calls OpenRouter.

### The two hard-won rules baked in

The GM will **never speak or act for you**, and it will **never get moralistic or preachy** — both enforced twice over: once in the system prompt, and again by client-side filters that catch and strip violations before they ever hit the screen. These were the two biggest problems in development and they're locked out at the code level.

---

## Playing

- Pick one of four archetypes (The Muscle, The Operative, The Cop on the Edge, The Street Tough). Your character's name, look, and backstory are randomly generated — reroll until you like one.
- Type what you want to do. The GM responds.
- When you attempt something risky, a dice roller appears — roll, then see what happens.
- Track your **Heat** (suspicion), **Tier** (cult rank), contraband, and evidence in the HUD.
- Reach Day 40 by escaping, exposing the cult, or taking it over. Getting caught means re-education (a setback). A gunfight can kill you.
- `/remember [fact]` locks something permanently into the GM's memory.

Your save lives in your browser (localStorage). RESET wipes it.
