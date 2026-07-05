import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ARCHETYPES, NPCS, makeInitialState, generateCharacter,
  rollWithLuck, getStatMod, resolveRoll, detectPendingRoll, buildSystemPrompt,
} from '../lib/engine'
import { cleanGMText } from '../lib/filters'

// ── 1985 NEON PALETTE ─────────────────────────────────────────────────────────
const PINK = '#ff2d95', CYAN = '#05d9e8', PURPLE = '#a020f0', AMBER = '#ffb627'
const GREEN = '#39ff14', RED = '#ff3131', DIM = '#7a6a8a', BORDER = '#2a1a3a'
const BG = '#0a0410', PANEL = '#140a20'

const MONO = "'Share Tech Mono','Courier New',monospace"

const S = {
  page: { minHeight: '100vh', background: BG, color: '#e8d8f8', fontFamily: MONO, display: 'flex', flexDirection: 'column' },
  scoreboard: { background: '#0d0518', borderBottom: `2px solid ${PINK}`, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: PINK, letterSpacing: '0.06em', position: 'sticky', top: 0, zIndex: 100, boxShadow: `0 2px 14px ${PINK}44` },
  hudBar: { background: '#0b0416', borderBottom: `1px solid ${CYAN}33`, padding: '5px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', letterSpacing: '0.04em', position: 'sticky', top: 33, zIndex: 99, gap: 8, flexWrap: 'wrap' },
  hudChip: (color) => ({ color, whiteSpace: 'nowrap' }),
  chat: { flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 },
  gmMsg: { background: '#0f0620', border: `1px solid ${CYAN}44`, borderLeft: `3px solid ${CYAN}`, borderRadius: 4, padding: '12px 14px', fontSize: '1rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  playerMsg: { background: '#1a0a12', border: `1px solid ${PINK}44`, borderRight: `3px solid ${PINK}`, borderRadius: 4, padding: '10px 14px', fontSize: '0.95rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', textAlign: 'right', color: '#f0c8e0' },
  label: (c) => ({ fontSize: '0.6rem', letterSpacing: '0.12em', color: c, marginBottom: 4 }),
  inputWrap: { borderTop: `2px solid ${PURPLE}`, background: '#0d0518', padding: '10px 12px', position: 'sticky', bottom: 0 },
  input: { width: '100%', background: '#160b24', border: `1px solid ${PURPLE}66`, borderRadius: 4, color: '#e8d8f8', fontFamily: MONO, fontSize: '0.95rem', padding: '10px', resize: 'none', outline: 'none', boxSizing: 'border-box' },
  btn: (c) => ({ background: 'transparent', border: `1.5px solid ${c}`, color: c, fontFamily: MONO, fontSize: '0.8rem', letterSpacing: '0.1em', padding: '10px 16px', borderRadius: 4, cursor: 'pointer' }),
  card: { background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 16 },
  tag: { display: 'inline-block', fontSize: '0.6rem', padding: '2px 6px', border: '1px solid', borderRadius: 3, marginRight: 4, marginBottom: 4 },
  title: { fontSize: '2rem', color: PINK, letterSpacing: '0.15em', textShadow: `0 0 12px ${PINK}88`, textAlign: 'center', margin: '4px 0' },
  sub: { fontSize: '0.7rem', color: CYAN, textAlign: 'center', letterSpacing: '0.1em', marginBottom: 20 },
}

const STORAGE_KEY = 'ascension_save_v1'

// ── ERROR BOUNDARY ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (this.state.err) return <div style={{ padding: 24, color: RED, fontFamily: MONO }}>Something broke: {String(this.state.err)}. Hit RESET.</div>
    return this.props.children
  }
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function HUD({ state, onReset }) {
  if (!state.archetype) return null
  const arch = ARCHETYPES[state.archetype]
  const daysLeft = 40 - (state.day || 1)
  const heatColor = state.heat >= 75 ? RED : state.heat >= 50 ? AMBER : state.heat >= 25 ? '#ffe066' : GREEN
  return (
    <>
      <div style={S.scoreboard}>
        <span style={{ color: arch.color }}>{arch.icon} {arch.name}</span>
        <span style={{ color: CYAN }}>DAY {state.day}/40 · {daysLeft} LEFT</span>
        <button onClick={onReset} style={{ background: 'none', border: 'none', color: DIM, cursor: 'pointer', fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.1em' }}>RESET</button>
      </div>
      <div style={S.hudBar}>
        <span style={S.hudChip(heatColor)}>🔥 HEAT {state.heat}/100</span>
        <span style={S.hudChip(PURPLE)}>⬆ TIER {state.tier}</span>
        <span style={S.hudChip(AMBER)}>📦 {(state.contraband || []).length} ITEMS</span>
        <span style={S.hudChip(GREEN)}>📄 {(state.evidence || []).length} EVIDENCE</span>
      </div>
    </>
  )
}

// ── ROLL WIDGET ───────────────────────────────────────────────────────────────
function RollWidget({ pendingRoll, state, onResult }) {
  const [rolling, setRolling] = useState(false)
  const [display, setDisplay] = useState(null)
  if (!pendingRoll) return null
  const { stat, dc } = pendingRoll
  const mod = getStatMod(stat, state)

  const doRoll = () => {
    setRolling(true)
    let ticks = 0
    const iv = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 20) + 1)
      if (++ticks > 12) {
        clearInterval(iv)
        const raw = rollWithLuck()
        const res = resolveRoll(raw, stat, dc, state)
        setDisplay(raw)
        setRolling(false)
        setTimeout(() => onResult(res), 700)
      }
    }, 60)
  }

  return (
    <div style={{ ...S.card, borderColor: AMBER, textAlign: 'center' }}>
      <div style={S.label(AMBER)}>ROLL {stat.toUpperCase()} vs DC {dc}  (mod +{mod})</div>
      {display !== null && (
        <div style={{ fontSize: '2.4rem', color: rolling ? DIM : (display + mod >= dc ? GREEN : RED), margin: '6px 0', textShadow: `0 0 14px currentColor` }}>
          {display}{!rolling && ` + ${mod} = ${display + mod}`}
        </div>
      )}
      {display === null && (
        <button onClick={doRoll} style={{ ...S.btn(AMBER), fontSize: '1rem', marginTop: 6 }}>🎲 ROLL THE DICE</button>
      )}
    </div>
  )
}

// ── ARCHETYPE / CHARACTER SELECT ──────────────────────────────────────────────
function CharacterSelect({ onStart }) {
  const [rolled, setRolled] = useState(() => generateCharacter())
  const [archId, setArchId] = useState(null)

  return (
    <div style={{ padding: 20, maxWidth: 640, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={S.title}>ASCENSION</div>
      <div style={S.sub}>MONTANA · 1985 · YOU HAVE 40 DAYS</div>

      <div style={{ ...S.card, marginBottom: 16, borderColor: PINK }}>
        <div style={S.label(PINK)}>YOUR CHARACTER (RANDOMLY GENERATED)</div>
        <div style={{ fontSize: '1.15rem', color: '#fff', margin: '4px 0' }}>{rolled.name}</div>
        <div style={{ fontSize: '0.8rem', color: DIM, lineHeight: 1.5 }}>
          <b style={{ color: CYAN }}>Look:</b> {rolled.look}<br />
          <b style={{ color: CYAN }}>Why he came:</b> {rolled.seminarReason}<br />
          <b style={{ color: CYAN }}>Catchphrase:</b> {rolled.catchphrase}
        </div>
        <button onClick={() => setRolled(generateCharacter())} style={{ ...S.btn(PINK), marginTop: 10, fontSize: '0.7rem' }}>🎲 REROLL CHARACTER</button>
      </div>

      <div style={S.label(CYAN)}>PICK YOUR TYPE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {Object.values(ARCHETYPES).map(a => (
          <div key={a.id} onClick={() => setArchId(a.id)}
            style={{ ...S.card, cursor: 'pointer', borderColor: archId === a.id ? a.color : BORDER, boxShadow: archId === a.id ? `0 0 14px ${a.color}66` : 'none' }}>
            <div style={{ color: a.color, fontSize: '1rem' }}>{a.icon} {a.name}</div>
            <div style={{ fontSize: '0.68rem', color: AMBER, fontStyle: 'italic', margin: '2px 0 6px' }}>{a.subtitle}</div>
            <div style={{ fontSize: '0.78rem', color: '#c8b8d8', lineHeight: 1.4 }}>{a.blurb}</div>
            <div style={{ fontSize: '0.66rem', color: DIM, marginTop: 6 }}>
              {Object.entries(a.stats).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' · ')}
            </div>
            <div style={{ fontSize: '0.66rem', color: GREEN, marginTop: 4 }}>▲ {a.strong}</div>
            <div style={{ fontSize: '0.66rem', color: RED, marginTop: 2 }}>▼ {a.weak}</div>
          </div>
        ))}
      </div>

      <button disabled={!archId} onClick={() => onStart(archId, rolled)}
        style={{ ...S.btn(archId ? GREEN : DIM), width: '100%', fontSize: '1rem', padding: '14px', opacity: archId ? 1 : 0.5, cursor: archId ? 'pointer' : 'default' }}>
        {archId ? 'BEGIN — THE DOORS LOCK BEHIND YOU' : 'SELECT A TYPE'}
      </button>
    </div>
  )
}

// ── INTRO / SET THE SCENE ─────────────────────────────────────────────────────
function IntroScreen({ onContinue }) {
  return (
    <div style={{ padding: 24, maxWidth: 620, margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ ...S.title, fontSize: '2.6rem' }}>ASCENSION</div>
      <div style={S.sub}>A SURVIVAL STORY · RURAL MONTANA · 1985</div>

      <div style={{ ...S.card, borderColor: CYAN, lineHeight: 1.65, fontSize: '0.92rem', color: '#d8c8e8' }}>
        <p style={{ marginTop: 0 }}>
          It's the summer of <b style={{ color: AMBER }}>1985</b>. Reagan's on the TV, synth is on the radio, and there are no cell phones, no internet, no way to call for help that doesn't involve a payphone thirty miles away.
        </p>
        <p>
          A week ago you walked into a free seminar. There was a buffet. There were smiling people in matching robes. There was a charismatic man in aviator sunglasses called <b style={{ color: PINK }}>Father Solaris</b> who said the world would end in forty days, and that only the worthy would <i>ascend</i>.
        </p>
        <p style={{ marginBottom: 0 }}>
          You signed some papers. You don't fully remember which ones. Now you're one of three hundred souls living behind the wire at <b style={{ color: CYAN }}>Serenity Ridge</b> — a compound patrolled by dozens of armed "Shepherds" in matching jumpsuits, watchtowers on the fence line, spotlights sweeping the yard. They've got your car keys. The doors don't open from the inside. You don't believe the world is ending — but you're stuck here, the clock is ticking, and there are a lot of Uzis between you and the front gate.
        </p>
      </div>

      <div style={{ ...S.card, borderColor: GREEN, marginTop: 12, fontSize: '0.85rem', color: '#d8c8e8', lineHeight: 1.55 }}>
        <div style={S.label(GREEN)}>YOUR GOAL — SURVIVE 40 DAYS. THREE WAYS TO WIN:</div>
        <p style={{ margin: '8px 0' }}>
          <b style={{ color: CYAN }}>🚗 ESCAPE</b> — Get off the compound before Day 40. Find your keys or another way out, learn the grounds, and slip past security without getting caught.
        </p>
        <p style={{ margin: '8px 0' }}>
          <b style={{ color: AMBER }}>📰 EXPOSE</b> — Take the cult down from the inside. Dig up proof that Solaris is a fraud, then get it to the sheriff or the journalist sniffing around outside.
        </p>
        <p style={{ margin: '8px 0 0' }}>
          <b style={{ color: PURPLE }}>👑 ASCEND</b> — Don't run. <i>Win.</i> Climb the cult's ranks, out-scheme Solaris and his second-in-command, and take the whole operation — and its bank account — for yourself.
        </p>
        <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: DIM }}>
          You don't have to pick now. Try things, change your mind, blend them. The story reacts to whatever you do.
        </p>
      </div>

      <div style={{ ...S.card, borderColor: PURPLE, marginTop: 12, fontSize: '0.82rem', color: '#d8c8e8', lineHeight: 1.55 }}>
        <div style={S.label(PURPLE)}>HOW TO PLAY</div>
        <p style={{ margin: '8px 0' }}>
          <b style={{ color: CYAN }}>Just type what you want to do.</b> It's a conversation with a game master — "search the office," "sweet-talk the guard," "sprint for the fence." Plain English. There are no menus.
        </p>
        <p style={{ margin: '8px 0' }}>
          <b style={{ color: AMBER }}>Risky moves need a dice roll.</b> When you try something that could go wrong, a dice button appears. Tap it, then hit "see what happens" — your character's stats and a bit of luck decide the outcome.
        </p>
        <p style={{ margin: '8px 0' }}>
          <b style={{ color: RED }}>Watch your HEAT.</b> The meter up top is how suspicious security is of you. Sketchy behavior raises it; blending in lowers it. Let it get too high and you'll get searched or hauled into "re-education."
        </p>
        <p style={{ margin: '8px 0 0' }}>
          <b style={{ color: GREEN }}>Stakes are real.</b> Getting caught snooping is a setback, not the end. But this is 1985 and guns exist — a real fight can get you killed. Play smart. Or don't. It's your funeral.
        </p>
      </div>

      <button onClick={onContinue} style={{ ...S.btn(GREEN), width: '100%', fontSize: '1rem', padding: '16px', marginTop: 16 }}>
        CREATE YOUR CHARACTER →
      </button>
      <div style={{ textAlign: 'center', fontSize: '0.6rem', color: DIM, marginTop: 10, letterSpacing: '0.1em' }}>
        TONE: COMMANDO MEETS GTA. NOBODY HERE IS THE RESPONSIBLE ONE.
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Ascension() {
  const [state, setState] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [rollResult, setRollResult] = useState(null)
  const [seenIntro, setSeenIntro] = useState(false)
  const chatEndRef = useRef(null)

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        const def = makeInitialState()
        setState({ ...def, ...saved, stats: { ...def.stats, ...(saved.stats || {}) }, storyMemory: { facts: saved.storyMemory?.facts || [], narrative: saved.storyMemory?.narrative || {} } })
      } else {
        setState(makeInitialState())
      }
    } catch { setState(makeInitialState()) }
  }, [])

  const saveGame = useCallback((s) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [state?.conversation, loading, rollResult])

  const callGM = useCallback(async (playerMessage, isOpener = false) => {
    setLoading(true)
    const newConv = isOpener ? (state.conversation || []) : [...(state.conversation || []), { role: 'user', content: playerMessage }]
    const messages = (isOpener ? [{ role: 'user', content: playerMessage }] : newConv).slice(-50)
    const respSince = state.respSinceMemoryTag || 0
    const needsNudge = respSince >= 3
    try {
      const base = (() => { try { return buildSystemPrompt(state) } catch (e) { return 'You are the GM of a dark comedy cult-escape game. Be brief and funny. Never speak for the player.' } })()
      const sys = needsNudge ? base + '\n\nURGENT: tag a [MEMORY:...] fact this turn — you have not in several responses.' : base
      const res = await fetch('/api/gm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, systemPrompt: sys }) })
      const data = await res.json()
      let gmText = data.text
      if (!gmText) throw new Error(data.error || 'empty')

      // ── SAFETY NETS (independent of model behaviour) ──
      gmText = cleanGMText(gmText)

      let roll = detectPendingRoll(gmText)
      // Backstop: if the GM bundled a roll into a response that's OFFERING CHOICES
      // (asking what to do, laying out options), suppress the roll — the player must
      // pick first, then roll on their next turn. Prevents the dice hijacking the choice.
      if (roll) {
        const offersChoice = /(what do you do|what'?s your (move|play|call)|do you\b[^.?!]{0,80}\bor\b|which (one|option|approach)|option\s*[a-c1-3]\s*[:)]|^\s*[a-c1-3]\s*[:)]\s)/im.test(gmText)
        if (offersChoice) roll = null
      }
      const next = { ...state, conversation: [...newConv, { role: 'assistant', content: gmText }], pendingRoll: roll }

      // ── TAG PARSING ──
      // Relationships
      const bondRx = /\[BOND:(\w+):([+-]?\d+)\]/g; let m
      while ((m = bondRx.exec(gmText)) !== null) { next.bonds = { ...next.bonds }; next.bonds[m[1]] = (next.bonds[m[1]] || 0) + parseInt(m[2]) }
      // Memory
      const memRx = /\[MEMORY:(\w+):([^\]]+)\]/g; const facts = []
      while ((m = memRx.exec(gmText)) !== null) facts.push({ npcId: m[1], fact: m[2].trim(), day: state.day })
      if (facts.length) { next.storyMemory = { facts: [...(state.storyMemory?.facts || []), ...facts].slice(-60), narrative: { ...(state.storyMemory?.narrative || {}) } }; next.respSinceMemoryTag = 0 }
      else next.respSinceMemoryTag = respSince + 1
      // Heat
      const heatRx = /\[HEAT:([+-]?\d+)\]/g; let heatDelta = 0
      while ((m = heatRx.exec(gmText)) !== null) heatDelta += parseInt(m[1])
      if (heatDelta) next.heat = Math.max(0, Math.min(100, (state.heat || 0) + heatDelta + (ARCHETYPES[state.archetype]?.heatMod || 0)))
      // Items
      const itemRx = /\[ITEM:([+-])([^\]]+)\]/g
      while ((m = itemRx.exec(gmText)) !== null) {
        next.contraband = [...(next.contraband || state.contraband || [])]
        if (m[1] === '+') next.contraband.push(m[2].trim())
        else next.contraband = next.contraband.filter(x => x.toLowerCase() !== m[2].trim().toLowerCase())
      }
      // Evidence
      const evRx = /\[EVIDENCE:([^\]]+)\]/g
      while ((m = evRx.exec(gmText)) !== null) { next.evidence = [...(next.evidence || []), m[1].trim()].slice(-20) }
      // Day advance
      if (/\[DAY:advance\]/i.test(gmText)) next.day = Math.min(40, (state.day || 1) + 1)
      // Tier
      const tierRx = /\[TIER:([+-]?\d+)\]/g; let tierDelta = 0
      while ((m = tierRx.exec(gmText)) !== null) tierDelta += parseInt(m[1])
      if (tierDelta) next.tier = Math.max(1, (state.tier || 1) + tierDelta)
      // Risks
      const riskRx = /\[RISK:(snitch|caught|convert)\]/gi; const risks = []
      while ((m = riskRx.exec(gmText)) !== null) risks.push({ type: m[1].toLowerCase(), day: state.day, fired: false })
      if (risks.length) next.pendingRisks = [...(state.pendingRisks || []), ...risks].slice(-10)
      // Re-education
      if (/\[REEDU:[^\]]*\]/i.test(gmText)) next.heat = Math.max(0, (next.heat ?? state.heat ?? 0) - 20) // caught & re-educated: heat resets somewhat after the setback
      // Outcome / ending
      const outMatch = gmText.match(/\[OUTCOME:(escaped|exposed|ascended|dead)\]/i)
      if (outMatch) next.outcome = outMatch[1].toLowerCase()

      // strip all tags from display
      next.conversation[next.conversation.length - 1].content = gmText
        .replace(/\[BOND:\w+:[+-]?\d+\]/g, '').replace(/\[MEMORY:\w+:[^\]]+\]/g, '')
        .replace(/\[HEAT:[+-]?\d+\]/g, '').replace(/\[ITEM:[+-][^\]]+\]/g, '')
        .replace(/\[EVIDENCE:[^\]]+\]/g, '').replace(/\[DAY:advance\]/gi, '')
        .replace(/\[TIER:[+-]?\d+\]/g, '').replace(/\[RISK:\w+\]/gi, '')
        .replace(/\[REEDU:[^\]]*\]/gi, '').replace(/\[OUTCOME:\w+\]/gi, '').trim()

      setState(next); saveGame(next)
    } catch (err) {
      setState({ ...state, conversation: [...newConv, { role: 'assistant', content: '[The synth cuts out. Static. Try again.]' }] })
    }
    setLoading(false)
  }, [state, saveGame])

  // opener
  useEffect(() => {
    if (state && state.archetype && (state.conversation || []).length === 0 && !loading) {
      callGM('BEGIN. Drop me into the cold open — I have just arrived at Serenity Ridge and realized the doors do not open from the inside. Set the scene with menace and comedy.', true)
    }
  }, [state?.archetype])

  const handleStart = (archId, character) => {
    const arch = ARCHETYPES[archId]
    const next = { ...makeInitialState(), archetype: archId, character, stats: { ...arch.stats } }
    setState(next); saveGame(next)
  }

  const handleSend = () => {
    if (!input.trim() || loading || state.pendingRoll || rollResult) return
    const msg = input.trim()
    // /remember manual memory
    const rem = msg.match(/^\/remember\s+(.+)$/i)
    if (rem) {
      const next = { ...state, storyMemory: { facts: [...(state.storyMemory?.facts || []), { npcId: 'world', fact: rem[1].trim(), day: state.day }].slice(-60), narrative: { ...(state.storyMemory?.narrative || {}) } }, respSinceMemoryTag: 0, conversation: [...state.conversation, { role: 'user', content: msg }, { role: 'assistant', content: `📌 Locked in: "${rem[1].trim()}"` }] }
      setInput(''); setState(next); saveGame(next); return
    }
    setInput(''); callGM(msg)
  }

  const handleRollResult = (res) => {
    setRollResult(res)
    setState(prev => ({ ...prev, pendingRoll: null, lastRoll: res }))
  }
  const sendRoll = () => {
    if (!rollResult) return
    const nat = rollResult.nat20 ? ' (NAT 20!)' : rollResult.nat1 ? ' (NAT 1!)' : ''
    const msg = `[ROLL] ${rollResult.stat} ${rollResult.raw}+${rollResult.mod}=${rollResult.total} vs DC ${rollResult.dc}${nat} — ${rollResult.success ? 'SUCCESS' : 'FAILURE'}.`
    setRollResult(null); callGM(msg)
  }

  if (!state) return <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center' }}><div style={{ color: PINK }}>LOADING…</div></div>

  const doReset = () => {
    if (window.confirm('Start over? This wipes your save.')) {
      localStorage.removeItem(STORAGE_KEY)
      setState(makeInitialState()); setRollResult(null); setInput('')
    }
  }

  return (
    <ErrorBoundary>
      <div style={S.page}>
        {!state.archetype ? (
          seenIntro ? (
            <CharacterSelect onStart={handleStart} />
          ) : (
            <IntroScreen onContinue={() => setSeenIntro(true)} />
          )
        ) : (
          <>
            <HUD state={state} onReset={doReset} />
            {state.outcome && (
              <div style={{ ...S.card, margin: 12, borderColor: PINK, textAlign: 'center' }}>
                <div style={{ color: PINK, fontSize: '1.2rem', letterSpacing: '0.1em' }}>
                  {state.outcome === 'escaped' ? '🚗 YOU ESCAPED SERENITY RIDGE' :
                   state.outcome === 'exposed' ? '📰 YOU BROUGHT THE WHOLE THING DOWN' :
                   state.outcome === 'ascended' ? '👑 YOU ARE THE PROPHET NOW' :
                   '💀 YOU DID NOT MAKE IT'}
                </div>
                <button onClick={doReset} style={{ ...S.btn(CYAN), marginTop: 10 }}>PLAY AGAIN</button>
              </div>
            )}
            <div style={S.chat}>
              {(state.conversation || []).map((msg, i) => (
                <div key={i} style={msg.role === 'assistant' ? S.gmMsg : S.playerMsg}>
                  {msg.role === 'assistant' && <div style={S.label(CYAN)}>GM</div>}
                  {msg.content}
                </div>
              ))}
              {loading && <div style={{ ...S.gmMsg, color: DIM }}>…the synth swells…</div>}
              {state.pendingRoll && !rollResult && (
                <RollWidget pendingRoll={state.pendingRoll} state={state} onResult={handleRollResult} />
              )}
              {rollResult && (
                <div style={{ ...S.card, borderColor: rollResult.success ? GREEN : RED, textAlign: 'center' }}>
                  <div style={{ color: rollResult.success ? GREEN : RED, fontSize: '1.1rem' }}>
                    {rollResult.raw} + {rollResult.mod} = {rollResult.total} vs DC {rollResult.dc} — {rollResult.success ? 'SUCCESS' : 'FAILURE'}
                    {rollResult.nat20 ? ' · NAT 20!' : rollResult.nat1 ? ' · NAT 1!' : ''}
                  </div>
                  <button onClick={sendRoll} style={{ ...S.btn(rollResult.success ? GREEN : RED), marginTop: 8 }}>SEE WHAT HAPPENS →</button>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {!state.outcome && (
              <div style={S.inputWrap}>
                <textarea rows={2} style={S.input}
                  placeholder={loading ? 'the GM is talking…' : state.pendingRoll ? 'roll the dice first…' : rollResult ? 'see what happens first…' : 'What do you do?'}
                  value={input} disabled={loading || !!state.pendingRoll || !!rollResult}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} />
                <div style={{ ...S.label(DIM), marginTop: 5, fontSize: '0.55rem' }}>ENTER to send · /remember [fact] to lock something in</div>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
