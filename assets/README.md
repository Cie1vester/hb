# Drop your character art here

Put two PNG files in this folder and they replace the drawn characters
completely — no code changes needed:

| File | Who |
|---|---|
| `syl.png` | Syl (the pudding-coloured one) |
| `wife.png` | your wife (the one in the hood) |

Reload the page and they appear. If a file isn't here, the game falls back
to the code-drawn version, so nothing ever breaks half-finished.

## What works best

- **Transparent background.** PNG with real alpha, not white-on-white.
- **Small pixel art.** Anything shorter than the target height gets scaled
  up by a whole number using nearest-neighbour, so it stays crisp and
  blocky. A 24–60px tall sprite is the sweet spot.
- **Facing forward, standing.** They're drawn feet-on-the-floor, centred
  horizontally on their position.
- Large images still work — they get smoothly scaled down instead — but
  they won't look pixelated.

## Sizing

On-screen height is set by `ART` at the top of [`../js/sprites.js`](../js/sprites.js):

```js
const ART = {
  purin:  { src: 'assets/syl.png',  h: 52, ... },
  kuromi: { src: 'assets/wife.png', h: 58, ... }
};
```

Change `h` to make either character bigger or smaller. If the cake ends up
sitting too close to Syl or too far away, nudge `CAKE_OFFSET_X` near the top
of [`../js/main.js`](../js/main.js).

## A note on where art comes from

Please use art you have the right to use — something you drew or
commissioned, or art whose licence allows it. This repo is public, so
whatever lands here is published. I'd rather not paste someone else's
drawing in on your behalf, but it's your repo and your call.
