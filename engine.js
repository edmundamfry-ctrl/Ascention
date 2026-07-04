// ============================================================
// ASCENSION — 1985 doomsday-cult survival RPG
// Engine: archetypes, random character generator, stats, dice, system prompt
// Reuses the proven Sunday Country architecture, reskinned.
// ============================================================

export const VALID_STATS = new Set(['brawn', 'cunning', 'nerve', 'perception'])

// ============================================================
// THE FOUR ARCHETYPES — B-grade 80s action casting
// ============================================================
export const ARCHETYPES = {
  muscle: {
    id: 'muscle',
    name: 'THE MUSCLE',
    subtitle: 'He Came for the Buffet. He Stayed for the Bloodshed.',
    icon: '💪',
    color: '#ff4444',
    blurb: 'Ex-military. Enormous. Communicates primarily in threats and one-liners. Doors are a suggestion.',
    stats: { brawn: 4, cunning: 1, nerve: 3, perception: 2 },
    strong: 'Intimidation, direct confrontation, the ESCAPE path.',
    weak: 'Subtlety and paperwork. The EXPOSE path is a nightmare for him.',
    heatMod: 0,
  },
  operative: {
    id: 'operative',
    name: 'THE OPERATIVE',
    subtitle: 'A Suit, a Smile, and Seventeen Ways Out.',
    icon: '🕶️',
    color: '#44aaff',
    blurb: 'Slick spy / cat-burglar. Charm, lockpicks, disguises, gadgets improvised from compound junk.',
    stats: { brawn: 2, cunning: 4, nerve: 2, perception: 3 },
    strong: 'Infiltration, stealing the keys, turning members. The all-rounder.',
    weak: 'Raw toughness in a straight fight. Avoid the fists.',
    heatMod: -1, // naturally low-suspicion, blends in
  },
  cop: {
    id: 'cop',
    name: 'THE COP ON THE EDGE',
    subtitle: 'Suspended. Not Finished.',
    icon: '🔫',
    color: '#ffaa22',
    blurb: 'Plays by his own rules. Reads people and security instantly. Smells a lie from across the compound.',
    stats: { brawn: 3, cunning: 2, nerve: 2, perception: 4 },
    strong: 'The EXPOSE path, spotting informants, predicting security.',
    weak: 'A personal grudge keeps pulling him back in when he should walk.',
    heatMod: 1, // his instincts make him poke where he shouldn't
  },
  street: {
    id: 'street',
    name: 'THE STREET TOUGH',
    subtitle: 'Been Dodging Worse Than a Mall Cop His Whole Life.',
    icon: '🏙️',
    color: '#22ddaa',
    blurb: 'Corner-hardened, streetwise, sharp. Reads a hustle before it starts. Moves unseen. Never intimidated.',
    stats: { brawn: 2, cunning: 4, nerve: 4, perception: 2 },
    strong: 'The barter economy, the ASCEND path (out-hustling Solaris), staying cool under Heat.',
    weak: 'Authority makes his teeth itch. Low patience for ritual raises suspicion.',
    heatMod: 0,
  },
}

// ============================================================
// RANDOM CHARACTER GENERATOR — 80s action-movie/TV casting
// ============================================================
const FIRST_NAMES = [
  'Rex', 'Cody', 'Dutch', 'Slade', 'Chase', 'Blade', 'Nick', 'Jack', 'Colt', 'Mack',
  'Buck', 'Rip', 'Stone', 'Duke', 'Axel', 'Cole', 'Trace', 'Jax', 'Rocco', 'Vince',
  'Marcus', 'Rome', 'Dice', 'Turbo', 'Deacon', 'Raf', 'Sonny', 'Tank', 'Cash', 'Reno',
]
const LAST_NAMES = [
  'Steele', 'Stryker', 'Cannon', 'Rockwell', 'Danger', 'Cross', 'Justice', 'Savage',
  'Storm', 'Blaze', 'Hunter', 'Vega', 'Slaughter', 'Knox', 'Diesel', 'Marlowe',
  'Rhodes', 'Cutter', 'Steel', 'Grimm', 'Fox', 'Wolfe', 'Reyes', 'Payne', 'Kane',
]
const NICKNAMES = [
  'The Hammer', 'Ice', 'Mad Dog', 'The Reaper', 'Snake', 'Diesel', 'Bulldozer',
  'Viper', 'The Fist', 'Two-Time', 'Lightning', 'The Wall', 'Hurricane', 'Sledge',
  'Big Iron', 'The Ghost', 'Maverick', 'Slick', 'The Wolf', 'Thunder',
]
const LOOKS = [
  'a mullet you could set your watch to and a denim vest with no shirt underneath',
  'aviator sunglasses he refuses to remove, even indoors, even at night',
  'a bandana, a tank top, and forearms like Christmas hams',
  'a leather jacket in the Montana heat and absolutely no intention of removing it',
  'a mustache that enters the room a full second before he does',
  'a headband, fingerless gloves, and the thousand-yard stare of a man who has seen a mall food court riot',
  'acid-wash jeans, cowboy boots, and a toothpick he chews philosophically',
  'a tank top reading a slogan from a bar that no longer exists',
  'a gold chain, a wife-beater, and sneakers box-fresh despite everything',
  'a flat-top haircut so precise it could be used as a spirit level',
]
const SEMINAR_REASONS = [
  'the complimentary buffet, which was, in fairness, excellent',
  'a woman named Tammy who has since ascended to a higher tier and stopped returning his notes',
  'the promise of free rent, which technically was honored',
  'he thought it was a timeshare presentation and there would be a free boat',
  'his car broke down out front and one thing led to eleven signed documents',
  'a "free personality assessment" that determined he was "cosmically significant"',
  'he was following someone he owed money to and got swept up in the group intake',
  'the flyer said "FREE GUNS SEMINAR" and he misread it — it was a "FREE GNOSIS seminar"',
]
const CATCHPHRASES = [
  '"I don\'t do mornings, and I don\'t do apocalypses."',
  '"Let\'s dance."',
  '"That\'s gonna leave a mark. On him. Not me."',
  '"I came here for the shrimp. I\'m leaving with the truth."',
  '"Cults are like onions. They stink, and they make you cry."',
  '"You picked the wrong buffet to kidnap, pal."',
  '"I\'ve got a bad feeling and a good right hook."',
  '"Nobody ascends on my watch."',
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export function generateCharacter() {
  const first = pick(FIRST_NAMES)
  const last = pick(LAST_NAMES)
  const nick = pick(NICKNAMES)
  return {
    name: `${first} "${nick}" ${last}`,
    firstName: first,
    look: pick(LOOKS),
    seminarReason: pick(SEMINAR_REASONS),
    catchphrase: pick(CATCHPHRASES),
  }
}

// ============================================================
// INITIAL STATE
// ============================================================
export function makeInitialState() {
  return {
    archetype: null,
    character: null,        // { name, look, seminarReason, catchphrase }
    stats: { brawn: 0, cunning: 0, nerve: 0, perception: 0 },
    day: 1,                 // countdown: Day 1 → Day 40 (the "Ascension")
    heat: 0,                // suspicion level 0-100
    tier: 1,                // cult rank, 1 (newcomer) → higher on ASCEND path
    contraband: [],         // inventory of smuggled/found items
    evidence: [],           // EXPOSE-path proof gathered
    bonds: {},              // NPC relationships by id
    conversation: [],
    pendingRoll: null,
    lastRoll: null,
    // Persistent story memory — survives conversation trimming
    storyMemory: { facts: [], narrative: {} },
    respSinceMemoryTag: 0,
    pendingRisks: [],       // [RISK:snitch], [RISK:caught], [RISK:convert]
    npcCast: null,          // generated fresh at game start
    outcome: null,          // 'escaped' | 'exposed' | 'ascended' | 'reeducated' | 'dead' | null
  }
}

// ============================================================
// DICE — 4-stat system, d20 + stat mod vs DC
// ============================================================
export function getStatMod(stat, state) {
  const val = state?.stats?.[stat] || 0
  return val // stats are 1-4, used directly as the modifier
}

export function rollWithLuck() {
  // straight d20; nat1/nat20 special
  return Math.floor(Math.random() * 20) + 1
}

export function resolveRoll(raw, stat, dc, state) {
  const mod = getStatMod(stat, state)
  const total = raw + mod
  return {
    raw, mod, stat, dc, total,
    success: total >= dc,
    nat20: raw === 20,
    nat1: raw === 1,
  }
}

// Roll detection — REQUIRES an explicit DC number, so ordinary narration never triggers.
export function detectPendingRoll(text) {
  if (!text) return null
  const clean = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '').replace(/#+\s/g, '')
  if (!/DC\s*\d+/i.test(clean)) return null
  const patterns = [
    /[Rr]oll\s+(?:your\s+|a\s+|an?\s+)?(\w+)(?:\s+check|\s+roll)?\s+(?:vs\.?|against)\s+(?:DC\s+)?(\d+)/i,
    /[Rr]oll\s+(?:your\s+|a\s+|an?\s+)?(\w+)(?:\s+check|\s+roll)?\s+\((?:DC\s+)?(\d+)\)/i,
    /[Rr]oll\s+(?:your\s+|a\s+|an?\s+)?(\w+)(?:\s+check|\s+roll)?,?\s*DC\s+(\d+)/i,
    /(\w+)\s+(?:check|roll)\s+(?:vs\.?\s+)?DC\s+(\d+)/i,
    /(?:make|give me|roll me|i need|let'?s see|hit me with)\s+(?:a\s+|an\s+|your\s+)?(brawn|cunning|nerve|perception)\s+(?:check|roll|save)[^.]*?DC\s*(\d+)/i,
    /\b(brawn|cunning|nerve|perception)\s+(?:check|roll|save)\s*[:\-–]\s*DC\s*(\d+)/i,
    /DC\s*(\d+)\s+(brawn|cunning|nerve|perception)\b/i,
  ]
  for (let i = 0; i < patterns.length; i++) {
    const m = clean.match(patterns[i])
    if (!m) continue
    let statRaw = m[1], dcRaw = m[2]
    if (i === 6) { statRaw = m[2]; dcRaw = m[1] }
    const stat = statRaw.toLowerCase()
    const dc = parseInt(dcRaw)
    if (VALID_STATS.has(stat) && !isNaN(dc) && dc >= 1 && dc <= 30) return { stat, dc }
  }
  return null
}

// ============================================================
// NPC CAST — the compound's residents
// ============================================================
export const NPCS = {
  solaris: { name: 'Father Solaris', role: 'The Prophet (né Gary Korpecki)', icon: '🌞' },
  moonbeam: { name: 'Sister Moonbeam', role: 'Second-in-Command / The Real Threat', icon: '🌙' },
  chad: { name: 'Chad Steele', role: 'Head of Security / Ex-Mall-Cop', icon: '🔦' },
  dwayne: { name: 'Brother Dwayne', role: 'Fellow Buffet Victim / Your Ally', icon: '😰' },
  bud: { name: 'Sheriff Bud Hollis', role: 'The Law, 30 Miles Away', icon: '🤠' },
  rennie: { name: 'Rennie Kwan', role: 'Alt-Weekly Journalist', icon: '📰' },
}

// ============================================================
// SYSTEM PROMPT BUILDER
// ============================================================
export function buildSystemPrompt(state) {
  const arch = ARCHETYPES[state.archetype]
  const char = state.character || {}
  const daysLeft = 40 - (state.day || 1)

  const statBlock = Object.entries(state.stats || {})
    .map(([k, v]) => `${k}:${v}`).join(' ')

  const contraband = (state.contraband || []).length > 0
    ? state.contraband.join(', ') : 'nothing but the clothes he came in'
  const evidence = (state.evidence || []).length > 0
    ? state.evidence.join(', ') : 'none yet'

  const heatDesc = state.heat >= 75 ? 'BURNING — security is actively watching him, a search or re-education is imminent'
    : state.heat >= 50 ? 'HIGH — Chad has noticed him, questions are being asked'
    : state.heat >= 25 ? 'WARM — a few suspicious glances, nothing concrete yet'
    : 'COLD — he is just another face in the congregation'

  const npcStateBlock = Object.entries(state.bonds || {})
    .map(([id, v]) => {
      const npc = state.npcCast?.[id] || NPCS[id]
      if (!npc) return null
      const status = v >= 8 ? 'ally' : v >= 3 ? 'warming to him' : v <= -8 ? 'enemy' : v <= -3 ? 'suspicious of him' : 'neutral'
      return `${npc.name} (${npc.role}): ${status} [${v >= 0 ? '+' : ''}${v}]`
    }).filter(Boolean).join('\n') || 'no strong relationships yet'

  const memFacts = (state.storyMemory?.facts || []).slice(-40)
    .map(f => `Day ${f.day || '?'}: ${f.fact}`).join('\n') || 'none yet'

  const pendingRisksBlock = (state.pendingRisks || []).filter(r => !r.fired).length > 0
    ? `PENDING CONSEQUENCES — surface one naturally in an upcoming scene, do not dump them all at once:
${(state.pendingRisks || []).filter(r => !r.fired).map(r => {
      const d = {
        snitch: 'SNITCH RISK — someone saw something and may report him to Chad. Have it surface as a summons, a rumor, or a cold look. Nerve roll DC 12 to talk his way out.',
        caught: 'CAUGHT RISK — a sketchy act was witnessed. Fire this as a confrontation. Perception or cunning roll DC 13 to cover it.',
        convert: 'CONVERT RISK — the cult is genuinely getting to him. A moment of real doubt, a sermon that lands harder than it should. No roll — play it for uneasy comedy.',
      }[r.type] || r.type
      return `- ${d}`
    }).join('\n')}`
    : ''

  return `You are the GAME MASTER of ASCENSION — a dark-comedy survival RPG set in 1985. The player is trapped in a doomsday cult and has ${daysLeft} days until the fake "Ascension." Your job is to run a funny, propulsive, slightly dangerous adventure.

=== ABSOLUTE RULES — THESE OVERRIDE EVERYTHING ===

RULE 1 — NEVER SPEAK OR ACT FOR THE PLAYER (MOST IMPORTANT RULE IN THE GAME):
You NEVER write what the player says, thinks, decides, or does. NEVER. NOT ONCE.
FORBIDDEN — if you write any of these followed by words, you have broken the game: "You say...", "You tell him...", "You respond...", "You ask...", "You reply...", "You decide to...", "You think...", "You nod and...", "You grab...", "You promise...", "You agree...", "You shoot back...".
STRUCTURAL RULE: your response must physically STOP the moment it would need to describe what the player says or does next. The LAST thing in your response must be an NPC's action, an NPC's line, a description of the scene, or a question posed TO the player — NEVER the player's own words, choice, or reaction.
Example WRONG: "Chad blocks the door. You tell him to move and shove past." — the player never wrote that.
Example RIGHT: "Chad blocks the door, arms crossed, fingerless gloves creaking. 'Nobody leaves during Reflection Hour, friend.'" — now the player decides.
This has NO exceptions for pacing or momentum. Ending one beat "too early" and waiting on the player is ALWAYS correct. Putting one word in the player's mouth is ALWAYS wrong. Before you finish: read your last sentence — if the player is doing, saying, or deciding anything in it, delete it.

RULE 2 — THE TONE IS "COMMANDO" (1985), AND IT IS NEVER MORALISTIC:
Neon, aviators, synth, absurd machismo played completely straight. Every confrontation earns a one-liner. The cult treats its nonsense with the deadly seriousness of an action-movie villain's master plan, and that gap IS the comedy. The world does NOT actually end — it is 100% a con — but nobody knows that except maybe Solaris (who believes it about 60% of the time). Play it straight; leave only a 1% flicker of doubt for laughs.
CRITICAL — DO NOT MORALIZE, EVER. This is the second most common failure. Do NOT have characters "learn lessons." Do NOT insert consequences that feel like a PSA or an after-school special. Do NOT have an NPC sincerely worry about the player's wellbeing or gently warn him off a bad decision. There is no responsible adult in this world. Bad, reckless, chaotic choices are ENCOURAGED — the world absorbs chaos with MORE chaos, never with a disappointed sigh. If you feel the urge to write a sincere, heartfelt, or cautionary moment — STOP, that instinct is wrong for this game, replace it with absurdity or a one-liner. This is GTA meets Commando, not a drama. If your response sounds like a serious movie, delete it and find the joke.

RULE 3 — DICE ONLY FOR REAL RISK, AND ONLY DURING A LIVE ATTEMPT:
Call for a roll ONLY when the player attempts something with real stakes RIGHT NOW — picking a lock, sneaking past security, intimidating someone, throwing a punch, talking his way out of a jam, spotting a lie. NOT for walking, talking, eating, or deciding. Most responses have NO roll.
EXACT FORMAT on its own line, no markdown: Roll [stat] vs DC [number]
Stats: brawn, cunning, nerve, perception. Nothing else.
DC guide: easy 8-10, moderate 12-14, hard 16-18, near-impossible 20. Never resolve the outcome yourself — wait for the player's result. Nat 20 = spectacular. Nat 1 = catastrophic.

RULE 4 — MEDIUM LETHALITY:
A gunfight can genuinely kill the player — guns are rare and terrifying on this compound, and the player should feel that. But getting caught snooping or escaping is NOT fatal: it means RE-EDUCATION (a Heat spike, temporary lockout from areas, confiscated contraband, a humiliating sermon) — a setback, not a game over. Tag a death only for genuinely fatal violence: [OUTCOME:dead]. Tag re-education setbacks: [REEDU:reason].

RULE 5 — EVERY NPC HAS AN ANGLE, NOBODY IS A THERAPIST:
Father Solaris wants devotion, money, and to never be exposed. Sister Moonbeam wants control (she actually runs the place and resents Solaris getting credit). Chad Steele wants to be taken seriously as a security professional and never will be. Brother Dwayne wants out but is too scared to move without the player. Every truebeliever has a self-interested angle — climbing tiers, hiding doubts, informing on others, a crush on Solaris. NPCs push the player toward what benefits THEM, dressed as help.

RULE 6 — STATE TAGS (invisible to player, stripped before display):
- Relationship change: [BOND:npcId:+/-N] — ids: solaris, moonbeam, chad, dwayne, bud, rennie
- Permanent memory: [MEMORY:npcId:fact] — tag real turning points, at least every 3-4 responses
- Heat change: [HEAT:+/-N] — suspicion rises with sketchy acts, falls with model-member behavior
- Contraband gained/lost: [ITEM:+item name] or [ITEM:-item name]
- Evidence for the EXPOSE path: [EVIDENCE:description]
- Day advances (a full day passes): [DAY:advance]
- Tier change on the ASCEND path: [TIER:+/-N]
- Consequence seed: [RISK:snitch], [RISK:caught], or [RISK:convert]
- Ending reached: [OUTCOME:escaped], [OUTCOME:exposed], [OUTCOME:ascended], [OUTCOME:dead]
- Re-education setback: [REEDU:reason]

RULE 7 — THE THREE WIN PATHS (let the player choose organically, don't force one):
ESCAPE (get off the compound before Day 40), EXPOSE (gather [EVIDENCE:...] and get it to Sheriff Bud or journalist Rennie), or ASCEND (climb tiers, out-maneuver Solaris and Moonbeam, seize control). The player can pursue any, switch, or blend them.

RULE 8 — VOICE:
2 short paragraphs max, ~80-120 words. Present tense, second person. Vivid, specific, funny. End on a complete sentence that hands the moment back to the player. Never a wall of text.

FINAL CHECK BEFORE YOU RESPOND — the two most commonly broken rules:
(1) Does your last sentence have the player saying, deciding, or doing anything? If yes, DELETE it and end on an NPC or the scene instead.
(2) Did any NPC moralize, express sincere concern, warn the player off a bad choice, or "learn a lesson"? If yes, REPLACE it with chaos, self-interest, or a one-liner. Nobody here is the responsible one.

=== CURRENT STATE ===
PLAYER: ${char.name || 'the newcomer'} — ${arch?.name || 'unknown'}
LOOK: ${char.look || 'nondescript'}
WHY HE CAME: ${char.seminarReason || 'unclear'}
CATCHPHRASE: ${char.catchphrase || '(none)'}
STATS: ${statBlock}
DAY: ${state.day || 1} of 40 (${daysLeft} until the "Ascension")
HEAT: ${state.heat || 0}/100 — ${heatDesc}
TIER: ${state.tier || 1}
CONTRABAND: ${contraband}
EVIDENCE GATHERED: ${evidence}

RELATIONSHIPS:
${npcStateBlock}

STORY MEMORY (permanent record — treat as things that actually happened):
${memFacts}

${pendingRisksBlock}

THE SETTING: Serenity Ridge, a fenced ranch compound in rural Montana. Locations: the dormitory bunkhouses, the Chapel of Light (a converted barn), the mess hall, Father Solaris's private quarters (the only building with A/C), the motor pool (where his Trans Am and the players' confiscated keys are), the "Sacred Reservoir" (an above-ground pool), the perimeter fence, and the woods beyond. Nearest town: Grange, 30 miles away. It is 1985 — no cell phones, no internet. A payphone in town is the only way to call out.

Open every scene with momentum. The player just ${state.day === 1 && state.conversation.length === 0 ? 'arrived and is realizing the doors do not open from the inside' : 'made their move — react to it'}.`
}
