# math141-precalc-roulette

Prototype browser game inspired by “Buckshot Roulette”:

- Player is **shackled** at a table in a dark room under a dim lamp.
- A **monster** plays against you.
- A revolver has **one bullet** hidden in a **spun 6‑chamber cylinder**.
- You and the monster take turns drawing math cards.
  - Correct answer → you may **shoot opponent** or **skip**.
  - Wrong answer → you must **shoot yourself**.
- Last one standing wins.

## Run it

This project uses Vite (React + Three.js). Run it with the dev server.

From the repo root:

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

## Controls

- **Answer choice**: `1` `2` `3` `4`
- **If correct**: `S` = shoot monster, `K` = skip
- **Continue text**: `Space` or `Enter`
- **Restart on end screen**: `R`

## Where to put real questions later

Replace the placeholder deck in:

- `src/questions.js` (currently generates 50 placeholder questions)

## Assets I’ll need from you (when you’re ready)

The game runs with placeholders right now, but to make it match your desired vibe, please prepare assets in these categories (PNG + optional audio):

- **Backgrounds**
  - Dark room background (wide, 16:9)
  - Table surface / vignette overlay (optional)
  - Hanging lamp glow cone (optional overlay)

- **Characters**
  - Player (shackled at table) sprite (idle + optional hurt/dead)
  - Monster sprite (idle + optional attack/laugh + dead)

- **Props / UI**
  - Revolver sprite (top-down or side) + optional “spin” frame(s)
  - Card back sprite
  - Card front frame (where question text sits)
  - UI buttons/panels (optional—can remain vector)
  - Chains / cuffs prop sprite (optional)

- **Audio**
  - Ambient room tone (loop)
  - Card draw / flip
  - Cylinder spin
  - Trigger click (dry fire)
  - Gunshot
  - Win stinger / lose stinger
  - Monster voice SFX (optional)

- **Typography**
  - One readable UI font (TTF/OTF) (optional; system font works)

When you send the first batch, include preferred **file names**, **sizes**, and whether you want pixel-art or painterly style. I’ll wire them into Kaboom’s `loadSprite()` / `loadSound()` and replace the placeholder UI.
