// Rule-based rap lyric engine: couplets are drawn from rhyme families so every
// pair of bars rhymes (AABB). `{t}` is replaced with the user's topic.

export type Style = 'trap' | 'drill' | 'boombap' | 'motivational';

export const STYLES: Record<Style, { label: string; adlibs: string[]; topic: string }> = {
  trap: { label: 'Trap', adlibs: ['(yeah)', '(skrrt)', '(ice)', '(woo)', '(gang)'], topic: 'the money' },
  drill: { label: 'Drill', adlibs: ['(brr)', '(grrah)', '(on the block)', '(slide)'], topic: 'the block' },
  boombap: { label: 'Boom Bap', adlibs: ['(word)', '(check it)', '(uh)', '(yo)'], topic: 'the culture' },
  motivational: { label: 'Motivational', adlibs: ['(let\'s go)', '(c\'mon)', '(uh)', '(rise)'], topic: 'the dream' },
};

/** Lines grouped by end rhyme. Keep lines original and topic-agnostic. */
export const FAMILIES: Record<string, string[]> = {
  ame: [
    'Came up from nothing, now they all know the name',
    'Every single verse about {t}, never the same',
    'They was laughing at me, now they feeling the shame',
    'I just keep my head down and I stay in my lane',
    'Ten toes on the ground while I\'m playing the game',
    'Light up the stage like I\'m holding a flame',
    'Got {t} in the picture, I\'m the one in the frame',
    'Big dreams, little room, but I\'m staking my claim',
  ],
  ight: [
    'Stay up writing bars from the dusk to the night',
    'Every time I talk about {t}, I get it right',
    'Built it from the bottom, now look at the height',
    'They don\'t want the smoke, they don\'t want the fight',
    'Diamonds on the wrist, I don\'t need the light',
    'Keep my circle small and I keep it tight',
    'Pen on the paper, I\'m catching a flight',
    'Future looking crazy and the future look bright',
  ],
  ow: [
    'Pull up to the spot and they feeling the flow',
    'Talking about {t}, yeah, I already know',
    'Started from the bottom, had to take it slow',
    'Every single city wanna book me for a show',
    'Plant a little seed, now watch it grow',
    'Stay humble in the light, keep it lowkey and low',
    'When the beat drop, baby, you already know',
    'Put my heart in the verse, let the whole world know',
  ],
  ay: [
    'Grinding every hour, every night, every day',
    'Ain\'t nobody gave me {t}, had to find my own way',
    'They was never with me, now they asking to stay',
    'Too busy getting paid, ain\'t got nothing to say',
    'Carry all the pressure and I never once sway',
    'Hit the booth like it\'s nothing, every take is a play',
    'Dark clouds coming but I\'m shining through the gray',
    'Put the work in early, now I\'m watching it pay',
  ],
  eal: [
    'Everything I spit, every bar is for real',
    'They ain\'t live through {t}, they don\'t know how it feel',
    'Heart cold as winter, my nerves made of steel',
    'Moving with the gang, we ain\'t cutting a deal',
    'Mama said keep going, let the hard times heal',
    'Foot on the gas and my hands on the wheel',
    'Nobody fed me, had to cook my own meal',
    'Shook a lot of hands, never signed on the seal',
  ],
  ound: [
    'Bass in the trunk, you can hear the sound',
    'Built my whole life around {t}, I hold it down',
    'Started in the basement, came up from the ground',
    'Look at all the faces when I\'m pulling around',
    'Lost a lot of things but my focus I found',
    'Every single word that I spit is profound',
    'From the underground to the top of the town',
    'Kings never sleep, that\'s why I wear the crown',
  ],
  ip: [
    'Got the pen in my hand and a hell of a grip',
    'Talking about {t} every time I hit the strip',
    'Ice on my neck, yeah, I\'m dripping in drip',
    'Ain\'t no looking back now, it\'s a one-way trip',
    'They want me to fall but I\'m never gonna slip',
    'Took a couple losses, now I\'m ready to flip',
    'Captain of my life, yeah, I\'m steering the ship',
    'Wrote it all down and I\'m flipping the script',
  ],
  ack: [
    'Never looking back, I just stay on track',
    'Bring {t} with me, yeah, I carry the pack',
    'Every single day, yeah, I\'m adding to the stack',
    'Hoodie on, mask on, everything black',
    'They be talking big but they never attack',
    'Used to be broke, now they cutting me slack',
    'Every single bar got the weight of a sack',
    'Fell down twice but I\'m bouncing right back',
  ],
  ore: [
    'Every time I win, yeah, I want a little more',
    'Put {t} first, that\'s what I\'m living for',
    'Came in quiet, now they all on the floor',
    'Opportunity knocking, I\'m opening the door',
    'Life is a battle, yeah, I\'m built for the war',
    'Keep my eyes on the prize, keep my eyes on the score',
    'I ain\'t the same person that I was before',
    'Hit them with the truth and it shook them to the core',
  ],
  ine: [
    'Everything I got, I put it all on the line',
    'Dream about {t} and I know that it\'s mine',
    'Chains on my neck and I\'m starting to shine',
    'Grinding on the clock, I ain\'t wasting my time',
    'All my brothers solid, we was cut from the vine',
    'Universe talking and I\'m reading the sign',
    'Built it from scratch, every piece by design',
    'They ain\'t thinking straight but I\'m reading the lines',
  ],
  eat: [
    'Heart beating loud as I\'m riding the beat',
    'Came from {t} and I came from the street',
    'They can\'t take the pressure, they can\'t take the heat',
    'Never took a break, never taking a seat',
    'Every single loss, never call it defeat',
    'Run it up again, put the plan on repeat',
    'Took my first steps, now I\'m light on my feet',
    'Wasn\'t even close, now the circle complete',
  ],
  ust: [
    'Tell me who to love and I tell you who to trust',
    'Fighting for {t} and I do what I must',
    'Leave them in the rear, leave them choking on dust',
    'Gold on my teeth, never gathering rust',
    'All my old plans had to change and adjust',
    'Kept it to myself, never made a big fuss',
    'Hit them with the truth and the whole thing bust',
    'Never looked back, no regrets, just us',
  ],
};

const HOOKS: Record<Style, string[][]> = {
  trap: [
    ['{T}, {T}, got it on my mind', 'Running up {t} and I\'m running out of time', 'Pull up with the gang, everybody in line', 'Drip on my body and I\'m starting to shine'],
    ['Ice on my wrist, I\'m talking {t}', 'Baby, I\'m the plug and they know who to get', 'Racks in my pocket, ain\'t no sweat', 'Haven\'t even started, you ain\'t seen nothing yet'],
  ],
  drill: [
    ['Slide through {t}, we don\'t play', 'Masked up, gang, move the same way', 'Cold in the heart, ain\'t nothing to say', 'On the block, yeah, we here to stay'],
    ['{T} on my mind, keep it on the low', 'Pull up quiet, now they know', 'Ain\'t no talking, we just go', 'Cold outside, still we flow'],
  ],
  boombap: [
    ['This one for {t}, yo, check the rhyme', 'Golden era feeling, I\'m rewinding time', 'Pen to the pad and the pad to the mind', 'Real hip-hop, the original kind'],
    ['Yo, {t} is the reason that I write', 'Ink on the page every single night', 'Boom bap knocking and the snare hit right', 'Mic in my hand and I\'m holding it tight'],
  ],
  motivational: [
    ['They said I couldn\'t do it, now look at me rise', 'Chasing {t} with the fire in my eyes', 'Every single setback was a gift in disguise', 'I\'m reaching for the top, gonna touch the skies'],
    ['Keep on going, never stop', '{T} got me working, gonna make it to the top', 'Every time I fall, I get back up', 'Started from the bottom with an empty cup'],
  ],
};

const pick = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T>(a: readonly T[]) => [...a].sort(() => Math.random() - 0.5);

export type Line = { text: string; family?: string };
export type Section = { label: string; lines: Line[] };

function fill(text: string, topic: string) {
  const T = topic.charAt(0).toUpperCase() + topic.slice(1);
  return text.replaceAll('{T}', T).replaceAll('{t}', topic);
}

/** One verse of `bars` lines (even number), never reusing a line across the song. */
function verse(bars: number, style: Style, topic: string, used: Set<string>): Line[] {
  const lines: Line[] = [];
  for (const fam of shuffle(Object.keys(FAMILIES))) {
    if (lines.length >= bars) break;
    const pair = shuffle(FAMILIES[fam].filter((l) => !used.has(l))).slice(0, 2);
    if (pair.length < 2) continue;
    for (const l of pair) {
      used.add(l);
      const adlib = Math.random() < 0.2 ? ` ${pick(STYLES[style].adlibs)}` : '';
      lines.push({ text: fill(l, topic) + adlib, family: fam });
    }
  }
  return lines;
}

export function generate(opts: { topic: string; style: Style; length: 'verse' | 'song' }): Section[] {
  const topic = opts.topic.trim() || STYLES[opts.style].topic;
  const used = new Set<string>();
  const hook: Section = { label: 'Hook', lines: pick(HOOKS[opts.style]).map((l) => ({ text: fill(l, topic) })) };
  if (opts.length === 'verse') return [{ label: 'Verse', lines: verse(16, opts.style, topic, used) }];
  return [
    { label: 'Intro', lines: [{ text: `${pick(STYLES[opts.style].adlibs)} ${pick(STYLES[opts.style].adlibs)}` }] },
    hook,
    { label: 'Verse 1', lines: verse(16, opts.style, topic, used) },
    hook,
    { label: 'Verse 2', lines: verse(16, opts.style, topic, used) },
    hook,
  ];
}
