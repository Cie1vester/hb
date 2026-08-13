/* ══════════════════════════════════════════════════════════════
   script.js  ♡  THE STORY. This is the only file you need to edit.

   Every node looks like:
     id: { speaker, text, next }                 ← a spoken line
     id: { speaker:'kuromi', choices:[ ... ] }   ← her clickable replies

   speaker : 'purin' (= Syl) | 'kuromi' (= her) | 'narrator'
   pFace   : Syl's expression — normal happy blush proud sneaky panic
                                surprised sparkle wink closed
   kFace   : her expression   — smug happy blush soft annoyed
                                surprised sparkle wink closed
   action  : a cinematic to play BEFORE the line
             openDoor · walkIn · lightCandles · dimLights · blowPrompt
             celebrate · ending · finish
   sass    : on a choice, 0 = soft, 2 = bratty. The total picks the ending.
   ══════════════════════════════════════════════════════════════ */

const CONFIG = {
  NAME: 'My Wife',     // the banner, and the label above her replies
  CALL: 'my love',     // how Syl actually addresses her out loud
  HIM: 'Syl',          // the label above his lines
  START_NODE: 'start'
};

/* ✏️ ─────────── EDIT ME ─────────── ✏️
   Your note to her, shown behind the 💌 button at the end.
   Write it in your own words — line breaks are kept as-is. */
const LETTER = `Happy birthday, my love.

I built this whole tiny world just so a very round someone in a brown beret could walk through a door and hand you a cake. It seemed like the correct amount of effort.

Thank you for every ordinary evening. For the bickering, for the snacks at midnight, for being the sharpest and the softest person I know — usually within the same ten seconds.

I don't need a wish this year. I already got the good one.

I love you. Please eat the cake. It took four tries.

— your Syl ♡`;

/* little lines that pop up if she clicks the photo on the wall */
const PHOTO_LINES = [
  'The photo from that day. You were mid-sentence, as usual.',
  'Syl insisted this one goes on the wall. He picked the frame himself.',
  'Two idiots. One heart. Excellent hair days all round.'
];

const STORY = {

  /* ═══ scene 1 — the sneak-in ═══ */

  start: {
    action: 'openDoor', speaker: 'narrator',
    text: 'It is 11:58pm. The house is dark and quiet. Somewhere down the hall, a door creaks open...',
    next: 'walkin'
  },

  walkin: {
    action: 'walkIn', speaker: 'purin', pFace: 'sneaky', kFace: 'smug',
    text: 'Psst... my love... are you awake?',
    next: 'q1'
  },

  q1: {
    speaker: 'kuromi', kFace: 'smug',
    choices: [
      { text: "...I've been awake for hours, dummy.", next: 'q1a', sass: 2 },
      { text: '*pretend to be asleep*', next: 'q1b', sass: 1 },
      { text: "You're carrying something. I can smell butter.", next: 'q1c', sass: 0 }
    ]
  },

  q1a: {
    speaker: 'purin', pFace: 'surprised',
    text: 'Hours?! You could have HELPED me find the matches!',
    next: 'q1a2'
  },
  q1a2: {
    speaker: 'kuromi', kFace: 'smug',
    text: 'I watched you search for twenty minutes. It was the best part of my night.',
    next: 's2'
  },

  q1b: {
    speaker: 'purin', pFace: 'sneaky',
    text: "...She's asleep. Perfect. That means more cake for—",
    next: 'q1b2'
  },
  q1b2: { speaker: 'kuromi', kFace: 'annoyed', text: 'I heard that.', next: 'q1b3' },
  q1b3: {
    speaker: 'purin', pFace: 'panic',
    text: "AAH— I mean! More cake for YOU! Obviously! That's what I said!",
    next: 's2'
  },

  q1c: {
    speaker: 'purin', pFace: 'surprised', kFace: 'smug',
    text: 'You can SMELL in the dark?! That is genuinely terrifying.',
    next: 'q1c2'
  },
  q1c2: { speaker: 'purin', pFace: 'blush', text: '...I love you so much.', next: 's2' },

  /* ═══ scene 2 — the cake ═══ */

  s2: {
    action: 'lightCandles', speaker: 'purin', pFace: 'proud', kFace: 'surprised',
    text: 'Ta-daaa! I baked it myself. The kitchen and I are no longer on speaking terms.',
    next: 'q2'
  },

  q2: {
    speaker: 'kuromi', kFace: 'smug',
    choices: [
      { text: 'Is that frosting on your beret?', next: 'q2a', sass: 2 },
      { text: "You could've just bought one, you know.", next: 'q2b', sass: 0 },
      { text: 'How many did you burn before this one?', next: 'q2c', sass: 1 }
    ]
  },

  q2a: { speaker: 'purin', pFace: 'proud', text: "That's a design choice.", next: 'q2a2' },
  q2a2: {
    speaker: 'purin', pFace: 'panic',
    text: "...It's frosting. It has been there since 4am. Please don't tell anyone.",
    next: 's3pre'
  },

  q2b: {
    speaker: 'purin', pFace: 'normal',
    text: "I could have. But then it wouldn't be FROM me. It'd just be... from a shop.",
    next: 'q2b2'
  },
  q2b2: { speaker: 'kuromi', kFace: 'blush', text: '...', next: 'q2b3' },
  q2b3: {
    speaker: 'kuromi', kFace: 'annoyed',
    text: "Don't just SAY things like that with your whole chest. Warn a girl.",
    next: 's3pre'
  },

  q2c: { speaker: 'purin', pFace: 'normal', text: 'Three.', next: 'q2c2' },
  q2c2: {
    speaker: 'purin', pFace: 'panic',
    text: "...Four. The fourth one doesn't count though. That one escaped.",
    next: 'q2c3'
  },
  q2c3: { speaker: 'kuromi', kFace: 'surprised', text: 'It ESCAPED?', next: 'q2c4' },
  q2c4: {
    speaker: 'purin', pFace: 'sneaky',
    text: "We don't talk about the fourth cake.",
    next: 's3pre'
  },

  /* ═══ scene 3 — the wish ═══ */

  s3pre: {
    action: 'dimLights', speaker: 'purin', pFace: 'blush', kFace: 'soft',
    text: 'Okay. Okay okay okay. Come closer. Close your eyes.',
    next: 's3'
  },
  s3: {
    speaker: 'purin', pFace: 'happy', kFace: 'soft',
    text: 'Make a wish, my love. But keep it small — I still have to make it come true.',
    next: 'q3'
  },

  q3: {
    speaker: 'kuromi', kFace: 'soft',
    choices: [
      /* the wish carries the most weight — it decides the tone of the ending */
      { text: 'I wish for another year of exactly this.', next: 'q3a', sass: 0 },
      { text: "I wish you'd stop being so sappy.", next: 'q3b', sass: 3 },
      { text: "I don't need one. He's right there holding a cake.", next: 'q3c', sass: 0 }
    ]
  },

  q3a: {
    speaker: 'purin', pFace: 'blush',
    text: "That's an easy one. I can do that one. I already started.",
    next: 's4pre'
  },

  q3b: {
    speaker: 'kuromi', kFace: 'blush',
    text: '(...then, much quieter) ...Don\'t, though. Don\'t stop.',
    next: 'q3b2'
  },
  q3b2: {
    speaker: 'purin', pFace: 'sparkle',
    text: "I didn't hear that! I'm going to think about it every day for a year, but I didn't hear it.",
    next: 's4pre'
  },

  q3c: { speaker: 'purin', pFace: 'blush', text: '...', next: 'q3c2' },
  q3c2: {
    speaker: 'purin', pFace: 'blush',
    text: "That's not fair. You're supposed to be the mean one. I had a whole speech prepared.",
    next: 's4pre'
  },

  /* ═══ scene 4 — blow out the candles ═══ */

  s4pre: {
    speaker: 'purin', pFace: 'happy', kFace: 'happy',
    text: 'Ready? Big breath. On three — one... two...',
    next: 's4'
  },
  s4: {
    after: 'blowPrompt', speaker: 'narrator', noAdvance: true,
    text: '✧ hold the button below and blow the candles out ✧',
    next: 's5'
  },

  /* ═══ scene 5 — celebration ═══ */

  s5: {
    action: 'celebrate', speaker: 'purin', pFace: 'sparkle', kFace: 'surprised',
    text: 'HAPPY BIRTHDAY, MY LOVE!!!',
    next: 'endpick'
  },

  endpick: { action: 'ending' },   // engine routes to one of the three below

  end_sass: {
    speaker: 'kuromi', kFace: 'smug',
    text: 'This is the loudest, messiest, most over-decorated thing anyone has ever done for me.',
    next: 'end_sass2'
  },
  end_sass2: {
    speaker: 'kuromi', kFace: 'blush',
    text: '...Do it again next year. Exactly like this. I mean it.',
    next: 'finale'
  },

  end_mid: {
    speaker: 'kuromi', kFace: 'blush',
    text: 'Okay. Okay, fine. That was... that was really nice.',
    next: 'end_mid2'
  },
  end_mid2: {
    speaker: 'kuromi', kFace: 'happy',
    text: 'Thank you, Syl. Now put me down before you drop the cake.',
    next: 'finale'
  },

  end_soft: {
    speaker: 'kuromi', kFace: 'blush',
    text: "I'm not crying. It's the candle smoke.",
    next: 'end_soft2'
  },
  end_soft2: {
    speaker: 'kuromi', kFace: 'soft',
    text: "...It's not the candle smoke.",
    next: 'finale'
  },

  finale: {
    after: 'finish', speaker: 'purin', pFace: 'happy', kFace: 'happy',
    noAdvance: true,
    text: "I'd do it all again tomorrow. Maybe with fewer smoke alarms. ♡"
  }
};
