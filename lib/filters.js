// ============================================================
// FILTERS — client-side safety nets that work regardless of what
// the model outputs. These are the hard-won fixes from Sunday Country:
// they catch player-dialogue violations and moralizing even when the
// prompt rules fail. Applied to every GM response before display.
// ============================================================

// Remove markdown emphasis, player dialogue/decisions, keep NPC dialogue and game voice.
export function stripPlayerDialogue(text) {
  if (!text) return text
  let result = text

  // 1. Strip markdown emphasis first (DeepSeek wraps dialogue in **bold**, which both
  //    renders as literal asterisks AND breaks the attribution patterns below).
  //    Iterative because emphasis can nest.
  let prev = null
  while (prev !== result) {
    prev = result
    result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    result = result.replace(/\*\*([^*]*?)\*\*/g, '$1')
    result = result.replace(/(?<!\w)\*([^*\n]+?)\*(?!\w)/g, '$1')
    result = result.replace(/__([^_]+)__/g, '$1')
  }
  result = result.replace(/\*\*/g, '').replace(/(?<!\w)\*(?!\w)/g, '')

  // 2. Quote-then-attribution: "...," you say, ... (consume the whole player block,
  //    including any quotes that resume after the attribution clause).
  const quoteAttributionRx = /["“][^"”]*["”]\s*,?\s*you\s+(say|said|tell|told|respond|responded|reply|replied|explain|explained|ask|asked|shoot back|shot back|decide|decided|think to yourself|thought to yourself|nod and say|laugh and say|laughed and said|agree|agreed|grab|grabbed|grin and say|grinned and said|smirk and say|shrug and say|wave|waved|turn to|turned to|walk over|walked over|step up|stepped up|answer|answered|mutter|muttered|snap|snapped|fire back|fired back|counter|countered)\b[^."“”]*\.?\s*(["“][^"”]*["”]\s*)*/gi
  result = result.replace(quoteAttributionRx, '')

  // 3. Attribution-then-quote: You say, "..."
  const leadingAttributionRx = /\byou\s+(say|said|tell|told|respond|responded|reply|replied|explain|explained|ask|asked|shoot back|shot back|decide|decided|think to yourself|thought to yourself|nod and say|laugh and say|laughed and said|agree|agreed|grab|grabbed|grin and say|grinned and said|smirk and say|shrug and say|wave|waved|turn to|turned to|walk over|walked over|step up|stepped up|answer|answered|mutter|muttered|snap|snapped|fire back|fired back|counter|countered)\b[,:]?\s*["“][^"”]*["”]/gi
  result = result.replace(leadingAttributionRx, '')

  // 4. Sentence-start player speech/decision (NOT physical narration — "You cut the rope" is fine).
  const sentences = result.match(/[^.!?]+[.!?]+(\s|$)/g) || [result]
  const startRx = /^\s*You\s+(say|said|tell|told|respond|responded|reply|replied|explain|explained|ask|asked|shoot back|shot back|decide|decided|think to yourself|thought to yourself|nod and say|laugh and say|laughed and said|agree|agreed|grin and say|smirk and say|shrug and say|answer|answered|mutter|muttered|snap|snapped|fire back|fired back|counter|countered|inform|assure|promise|admit|confess|declare|announce|insist|joke|quip|retort|blurt)\b/i
  const cleaned = sentences.filter(s => !startRx.test(s))
  if (cleaned.length < sentences.length) result = cleaned.join('')

  // 5. Compound pivot: "You <physical action> and tell/say/ask him ..." — strip only
  //    from the "and <speech verb>" pivot onward, PRESERVING the physical action before it.
  result = result.replace(/(\byou\b[^.!?]*?)\s+and\s+(say|says|tell|tells|told|ask|asks|asked|reply|replies|replied|respond|responds|answer|answers|answered|inform|informs|promise|promises|admit|admits|declare|declares|announce|announces|insist|insists|whisper|whispers|whispered|mutter|mutters|muttered|shout|shouts|shouted|yell|yells|yelled|explain|explains|explained|threaten|threatens|threatened)\b[^.!?]*/gi, '$1.')
  // Clean up any doubled sentence-ending punctuation left by the pivot strip.
  result = result.replace(/([.!?])[.!?]+/g, '$1')

  result = result.replace(/\s{2,}/g, ' ').trim()
  // Only revert if stripping left essentially nothing; short valid remainders are fine.
  return result.length >= 8 ? result : text
}

// Remove moralizing / concern-trolling / "responsible adult" sentences.
export function stripMoralizing(text) {
  if (!text) return text
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text]
  const moralizingRx = /^\s*(you('re| are) (alone|anonymous|just another)|maybe (you should|it('s| is) time)|part of you (knows|wonders|feels)|this (might|could) be a (good|bad) (idea|decision)|you('ve| have) been through|for a moment you wonder|you can('t| not) help but (feel|wonder|think)|something (nags|pulls|weighs) at you|deep down you know|is this really who you (are|want)|a voice in your head|you feel a pang of|the weight of what)/i
  const cleaned = sentences.filter(s => !moralizingRx.test(s.trim()))
  if (cleaned.length < sentences.length) {
    const result = cleaned.join('').trim()
    return result.length >= 8 ? result : text
  }
  return text
}

// Pure safety backstop against genuine walls of text. Generous ceiling — only catches
// extreme overflow, truncating at a sentence boundary (quote-aware so dialogue isn't
// split at an internal ? or !).
export function truncateToLength(text, maxWords = 220) {
  if (!text) return text
  const words = text.split(/\s+/)
  if (words.length <= maxWords) return text
  const sentences = splitSentencesQuoteAware(text)
  let wordCount = 0, kept = []
  for (const s of sentences) {
    const sWords = s.split(/\s+/).filter(Boolean).length
    if (wordCount + sWords > maxWords && kept.length > 0) break
    kept.push(s)
    wordCount += sWords
  }
  const result = kept.join('').trim()
  return result.length > 20 ? result : text
}

function splitSentencesQuoteAware(text) {
  const sentences = []
  let current = '', inQuote = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    current += ch
    if (ch === '"' || ch === '“' || ch === '”') inQuote = !inQuote
    if (!inQuote && /[.!?]/.test(ch)) { sentences.push(current); current = '' }
  }
  if (current.trim()) sentences.push(current)
  return sentences
}

// Convenience: run the full clean chain in the correct order.
export function cleanGMText(text) {
  let t = stripPlayerDialogue(text)
  t = stripMoralizing(t)
  t = truncateToLength(t)
  return t
}
