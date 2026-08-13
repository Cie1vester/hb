# ♡ Happy Birthday, My Wife ♡

A tiny pixel-art visual novel. Syl sneaks into a cosy house at midnight with a
birthday cake; she gets to answer him however she likes. A few scenes, three
choice points, a cake to blow out, and confetti.

**Live:** https://cie1vester.github.io/hb/

---

## Editing the words

Everything you'd want to change lives in **`js/script.js`** — you don't need to
touch anything else.

| What | Where |
|---|---|
| Banner text / the label above her replies | `CONFIG.NAME` |
| How Syl addresses her out loud | `CONFIG.CALL` |
| The label above his lines | `CONFIG.HIM` |
| The closing love letter | the `LETTER` block, marked `✏️ EDIT ME` |
| Any line of dialogue | the `STORY` object — just edit the `text` |
| Her clickable replies | the `choices` arrays |
| Easter-egg lines on the wall photo | `PHOTO_LINES` |

To use her real name instead, set `NAME: 'Her Name'` and `CALL: 'Her Name'`.
The banner font auto-shrinks for longer names.

A story node looks like this:

```js
q1: {
  speaker: 'kuromi',
  choices: [
    { text: "...I've been awake for hours, dummy.", next: 'q1a', sass: 2 },
    { text: '*pretend to be asleep*',               next: 'q1b', sass: 1 }
  ]
}
```

(`purin` / `kuromi` survive as internal role keys — they just mean him and her.)

`sass` totals across the three choice points (0–7) pick one of three endings:
5+ is bratty, 2–4 is the middle, 0–1 is soft. The wish is weighted heaviest.
`pFace` / `kFace` set expressions (`happy blush smug soft annoyed surprised
sparkle panic proud sneaky wink`), and `action` / `after` fire a cinematic
(`openDoor walkIn lightCandles dimLights blowPrompt celebrate ending finish`).

## Previewing your changes

Just double-click `index.html`. There's no build step and no server needed — the
scripts are plain `<script>` tags on purpose so `file://` works.

## Publishing changes

```bash
git add -A
git commit -m "reword the letter"
git push
```

GitHub Pages redeploys on its own, usually within a minute.

---

## How it's built

No framework, no dependencies, no build, and **no network requests at all** —
so nothing can 404 and it works offline.

- `index.html` / `style.css` — page shell and the chunky pixel UI
- `fonts.css` — Press Start 2P and Silkscreen, embedded as base64 (OFL licensed)
- `js/sprites.js` — the characters, drawn pixel by pixel in code
- `js/scene.js` — the room, plus two hand-made bitmap fonts for the banner
- `js/fx.js` — confetti, hearts, sparkles, smoke, screen shake
- `js/audio.js` — all music and SFX synthesised live with WebAudio
- `js/main.js` — game loop, dialogue runner, cinematics
- `js/script.js` — **the story**

The scene renders to a 320×180 canvas that's upscaled with
`image-rendering: pixelated`, and every position is rounded to a whole pixel so
the motion reads as real pixel-game animation rather than smooth CSS.

Characters are built from rounded-rect and ellipse primitives, then stamped four
times in silhouette to give them the 1px outline hand-made pixel sprites have —
plus internal outlines so an ear reads as separate from a head.

The artwork is original, drawn in code — inspired by Sanrio's Pompompurin and
Kuromi, not copied from them. Made as a birthday present.
