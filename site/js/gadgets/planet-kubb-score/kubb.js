// Planet Kubb Notation: parser, game-state simulator and statistics.
// No dependencies. Runs in the browser (ES module) and in Node for tests.
//
// This is the tolerant reader. The grammar (grammar/planet-kubb-notation.peggy)
// says what the notation is; this reads whatever it can and warns. Where it
// reads something the grammar refuses, it says so in a warning, so a repair
// is never mistaken for valid notation.

const ACTIONS_INKAST = 'IRPYQNE';

// ---------- tokens ----------

// Inkast token: "0", "3", "I", "5I2R", "2IRP", "2Y", "IQ", "4IE".
function parseInkast(u) {
  if (/^\d+$/.test(u)) return { I: +u, R: 0, P: 0, Y: 0, Q: 0, N: 0, E: false };
  if (!/^(\d*[IRPYQNE])+$/.test(u) || !/[IRPYQN]/.test(u)) return null;
  const k = { I: 0, R: 0, P: 0, Y: 0, Q: 0, N: 0, E: false };
  for (const [, n, a] of u.matchAll(/(\d*)([IRPYQNE])/g)) {
    if (a === 'E') { k.E = true; continue; }
    k[a] += n === '' ? 1 : +n;
  }
  return k;
}

// Advantage: "A", "0A".."4A", and the 2012 forms "BA", "MA", "CA".
function parseAdvantage(u) {
  let m = u.match(/^(\d?)A$/);
  if (m) return { meters: m[1] === '' ? null : +m[1], over: m[1] !== '' && +m[1] > 4 };
  m = u.match(/^([BMC])A$/);
  if (m) return { meters: null, old: m[1] };
  return null;
}

// Baton: "-", "F", "3F", "B", "2B", "FB", "2FB", "K", "=", "X", "E", "!", "Z", "W", "G", "3FE".
function parseBaton(u) {
  const single = { '-': 'miss', 'K': 'king', '=': 'kingmiss', 'X': 'unthrown', 'E': 'illegalking',
    '!': 'illegalking', 'Z': 'illegal', 'W': 'win', 'G': 'resign' };
  if (single[u]) return { kind: single[u], f: 0, b: 0 };
  const m = u.match(/^(?:(\d*)F)?(?:(\d*)B)?(E)?$/);
  if (!m || (m[1] === undefined && m[2] === undefined)) return null;
  const f = m[1] === undefined ? 0 : m[1] === '' ? 1 : +m[1];
  const b = m[2] === undefined ? 0 : m[2] === '' ? 1 : +m[2];
  return { kind: f + b ? 'hit' : 'miss', f, b, e: !!m[3] };
}

function parseAction(s, phase) {
  let u = s.toUpperCase();
  let fixed = false;
  if (/^\d*F-$/.test(u)) { u = u.slice(0, -1); fixed = true; }
  if (phase === 'inkast') {
    const k = parseInkast(u);
    if (k) return { type: 'inkast', ...k };
  }
  if (phase !== 'batons') {
    const a = parseAdvantage(u);
    if (a) return { type: 'advantage', ...a };
  }
  const b = parseBaton(u);
  if (b) return { type: 'baton', ...b, fixed };
  if (phase === 'batons') {
    const a = parseAdvantage(u);
    if (a) return { type: 'advantage', ...a, late: true };
  }
  return null;
}

// Split an optional player token off an action. The colon is optional, so
// "jtB" is player jt throwing B; lowercase players and uppercase actions keep
// that unambiguous ("fB" is player f, "FB" is a field-then-base baton).
function parseToken(raw, phase) {
  // BA, MA and CA are the 2012 advantage markers in any case, never a player.
  if (phase !== 'batons' && /^[BMC]A$/i.test(raw)) {
    const a = parseAction(raw, phase);
    if (a) return { ...a, player: null, raw };
  }
  let m = raw.match(/^([A-Za-z_]+):(.+)$/);
  if (m) {
    const a = parseAction(m[2], phase);
    return a ? { ...a, player: m[1].toLowerCase(), raw } : null;
  }
  m = raw.match(/^([a-z_]+)([^a-z].*)$/);
  if (m) {
    const a = parseAction(m[2], phase);
    if (a) return { ...a, player: m[1], raw };
  }
  const a = parseAction(raw, phase);
  if (a) return { ...a, player: null, raw };
  for (let i = raw.length - 1; i > 0; i--) {
    if (!/^[A-Za-z_]+$/.test(raw.slice(0, i))) continue;
    const b = parseAction(raw.slice(i), phase);
    // The grammar wants a colon here (jtb, EB), so this reading is a repair.
    if (b) {
      const player = raw.slice(0, i).toLowerCase();
      return { ...b, player, raw, repaired: `${player}:${raw.slice(i).toUpperCase()}` };
    }
  }
  return null;
}

// ---------- position lines ----------

// A position line sits under its turn line and answers one question:
//   @  where each field kubb in that half stands when the first baton is thrown
//   ~  where each kubb thrown in lay before it was raised (its two ends)
//   ^  where each baton was thrown from
//   *  which kubbs each baton felled
// A position is across, a comma, depth: whole numbers for a one-metre cell
// (4,0), two decimals each for a point (4.48,0.11).
const ACROSS = '(?:[0-4]\\.\\d\\d|5\\.00)';
const DEPTH = '(?:[0-3]\\.\\d\\d|4\\.00)';
const WIDE_ACROSS = '(?:-0\\.(?!00)(?:[01]\\d|20)|[0-4]\\.\\d\\d|5\\.(?:[01]\\d|20))';
const WIDE_DEPTH = '(?:-0\\.(?!00)(?:[01]\\d|20)|[0-3]\\.\\d\\d|4\\.(?:[01]\\d|20))';
const RE_CELL = /^(?:(10|[1-9])x)?([0-4]),([0-3])$/i;
const RE_POINT = new RegExp(`^(${ACROSS}),(${DEPTH})$`);
const RE_LAY = new RegExp(`^(${WIDE_ACROSS}),(${WIDE_DEPTH})/(${WIDE_ACROSS}),(${WIDE_DEPTH})$`);
const RE_STANCE = new RegExp(`^(${ACROSS}),(\\d\\.\\d\\d)$`);
const LINE_NAME = { '@': 'pitch', '~': 'lay', '^': 'stance', '*': 'felled' };

function parsePlace(w) {
  let m = w.match(RE_CELL);
  if (m) return { kind: 'cell', at: [+m[2], +m[3]], count: m[1] ? +m[1] : 1 };
  m = w.match(RE_POINT);
  if (m) return { kind: 'point', at: [+m[1], +m[2]], count: 1 };
  return null;
}

// Returns the line, or null when any part of it does not read.
function parsePositionLine(s) {
  const head = s.match(/^([@~^*])([ab])\s+(\S.*)$/i);
  if (!head) return null;
  const mark = head[1], half = head[2].toLowerCase(), words = head[3].trim().split(/\s+/);
  const kinds = new Set();
  const entries = [];
  for (const w of words) {
    if (mark === '@') {
      const how = /[sp]$/i.test(w) ? w.slice(-1).toLowerCase() : null;
      const e = parsePlace(how ? w.slice(0, -1) : w);
      if (!e) return null;
      kinds.add(e.kind);
      entries.push({ at: e.at, count: e.count, mark: how });
    } else if (mark === '~') {
      const m = w.match(RE_LAY);
      if (!m) return null;
      entries.push({ ends: [[+m[1], +m[2]], [+m[3], +m[4]]] });
    } else if (mark === '^') {
      const m = w === '-' ? null : w.match(RE_STANCE);
      if (w !== '-' && !m) return null;
      entries.push(m ? [+m[1], +m[2]] : null);
    } else {
      if (w === '-') { entries.push(null); continue; }
      const word = w.split('+').map(parsePlace);
      if (word.some(e => !e)) return null;
      word.forEach(e => kinds.add(e.kind));
      entries.push(word.map(e => ({ at: e.at, count: e.count })));
    }
  }
  if (kinds.size > 1) return null;
  const precision = mark === '~' || mark === '^' ? 'point' : (kinds.has('point') ? 'point' : 'cell');
  return { mark, half, precision, entries };
}

const kubbsIn = entries => entries.reduce((n, e) => n + e.count, 0);
const some = n => `${n} ${n === 1 ? 'kubb' : 'kubbs'}`;

// Where the lines of one turn disagree with each other. The grammar makes the
// same checks; in the canonical form they are errors.
function positionWarnings(turn) {
  const w = [];
  const seen = {}, pitch = {};
  for (const l of turn.lines) {
    const k = l.mark + l.half;
    if (seen[k]) w.push(`A turn has one ${k} line, and this turn has a second.`);
    seen[k] = true;
    if (l.mark === '@' && !pitch[l.half]) pitch[l.half] = l;
  }
  const thrownInto = Object.values(pitch).find(l => l.entries.some(e => e.mark !== 's'));
  if (thrownInto) {
    const P = turn.inkasts.reduce((n, k) => n + k.P, 0);
    const p = kubbsIn(Object.values(pitch).flatMap(l => l.entries.filter(e => e.mark === 'p')));
    if (p !== P) w.push(`The pitch line marks ${p} with p, and the turn line has ${P}P.`);
  }
  for (const l of turn.lines) {
    if (l.mark === '~') {
      const on = pitch[l.half];
      if (!on) w.push(`A lay line needs the pitch line @${l.half} above it.`);
      else if (on.precision !== 'point') w.push('A lay line needs its pitch line in points, not cells.');
      else {
        const thrown = on.entries.filter(e => e.mark === null).length;
        if (thrown !== l.entries.length) w.push(`The lay line has ${some(l.entries.length)}, and its pitch line has ${thrown} thrown in.`);
      }
    }
    if (l.mark === '^' || l.mark === '*') {
      if (l.entries.length !== turn.batons.length) {
        w.push(`The ${LINE_NAME[l.mark]} line has ${l.entries.length} words, and the turn line has ${turn.batons.length} batons.`);
      } else if (l.mark === '*') {
        l.entries.forEach((word, i) => {
          if (word === null) return;
          const b = turn.batons[i], want = (b.f || 0) + (b.b || 0), have = kubbsIn(word);
          if (have !== want) w.push(`Word ${i + 1} of the felled line has ${some(have)}, and baton ${i + 1} felled ${want}.`);
        });
      }
    }
  }
  return w;
}

// ---------- lines ----------

function parseTurnLine(line, lineNo) {
  const turn = { line: lineNo, source: line, n: null, inkasts: [], advantage: null,
    batons: [], note: '', comments: [], warnings: [], lines: [] };
  let nested = false;
  let body = '';
  let depth = 0, comment = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (depth === 0 && c === '#') { turn.note = line.slice(i + 1).trim(); break; }
    if (c === '(') { if (depth++ > 0) { comment += c; nested = true; } continue; }
    if (c === ')' && depth > 0) {
      if (--depth === 0) { turn.comments.push(comment.trim()); comment = ''; body += ' '; }
      else comment += c;
      continue;
    }
    if (depth > 0) comment += c; else body += c;
  }
  if (depth > 0) {
    turn.comments.push(comment.trim());
    turn.warnings.push('A comment is opened with ( and never closed; read the rest of the line as the comment.');
  }
  if (nested) turn.warnings.push('A comment inside a comment; read them as one.');
  const m = body.match(/^\s*(\d+)\.(.*)$/);
  if (m) { turn.n = +m[1]; body = m[2]; }
  let phase = 'inkast';
  for (const raw of body.split(/[\s,\/]+/).filter(Boolean)) {
    const t = parseToken(raw, phase);
    if (!t) { turn.warnings.push(`Couldn't read "${raw}"; ignored it.`); continue; }
    if (t.fixed) turn.warnings.push(`Read "${raw}" as ${raw.replace(/-$/, '')}.`);
    if (t.repaired) turn.warnings.push(`Read "${raw}" as ${t.repaired}; the grammar wants the colon there.`);
    for (const [, n, code] of raw.matchAll(/(\d+)([A-Za-z])/g)) {
      const most = code.toUpperCase() === 'N' ? 5 : 10;
      if (t.type !== 'advantage' && +n > most) turn.warnings.push(`A count before ${code.toUpperCase()} goes up to ${most}, and "${raw}" has ${+n}.`);
    }
    if (t.type === 'inkast') turn.inkasts.push(t);
    else if (t.type === 'advantage') {
      if (t.player) turn.warnings.push(`An advantage line has no player; read "${raw}" as A.`);
      if (t.over) turn.warnings.push(`An advantage line is 0 to 4 metres from the baseline, and "${raw}" has more.`);
      if (t.late) turn.warnings.push(`The advantage marker "${raw}" belongs before the batons.`);
      if (turn.advantage) turn.warnings.push(`Advantage marked twice.`);
      turn.advantage = t;
      if (phase === 'inkast') phase = 'advantage';
    } else {
      turn.batons.push(t);
      phase = 'batons';
    }
  }
  return turn;
}

export function parseGame(text) {
  const headers = {};
  const turns = [];
  const warnings = [];
  text.replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
    const s = line.trim();
    if (!s) return;
    const h = s.match(/^\[\s*([^"\]]+?)\s+"(.*)"\s*\]$/);
    if (h) {
      if (turns.length) warnings.push(`Line ${i + 1}: a header after the turns; headers come first.`);
      headers[h[1]] = h[2];
      return;
    }
    if (s.startsWith('#')) return;
    if (/^[@~^*]/.test(s)) {
      const l = parsePositionLine(s);
      const on = turns[turns.length - 1];
      if (!l) warnings.push(`Line ${i + 1}: couldn't read the position line "${s}"; ignored it.`);
      else if (!on) warnings.push(`Line ${i + 1}: a position line with no turn above it; ignored it.`);
      else on.lines.push({ ...l, line: i + 1 });
      return;
    }
    const t = parseTurnLine(s, i + 1);
    if (!t.inkasts.length && !t.advantage && !t.batons.length) {
      if (t.warnings.length || t.n !== null) warnings.push(`Line ${i + 1}: nothing here reads as notation.`);
      return;
    }
    turns.push(t);
  });
  turns.forEach((t, i) => {
    if (t.n !== null && t.n !== i + 1) t.warnings.push(`Numbered ${t.n}, but it is turn ${i + 1}.`);
    if (t.lines.length) t.warnings.push(...positionWarnings(t));
  });
  const notation = headers['Notation'];
  if (notation !== undefined && notation !== '1' && notation !== '2') {
    warnings.push(`This reader knows notation 1 and 2, and the file says notation ${notation}.`);
  }
  return { headers, turns, warnings };
}

// ---------- players ----------

export function playerNames(headers) {
  const names = {};
  for (const side of ['A', 'B']) {
    const v = headers[`Team ${side} Players`];
    if (!v) continue;
    for (const part of v.split(',')) {
      const m = part.trim().match(/^(.*?)\s*\(([^)]+)\)$/);
      if (m) names[m[2].toLowerCase()] = m[1];
    }
  }
  return names;
}

// ---------- simulation ----------

const isThrown = b => b.kind !== 'unthrown' && b.kind !== 'win' && b.kind !== 'resign';
const isHit = b => (b.kind === 'hit' && !b.e) || b.kind === 'king';

function teamSide(v) {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (s === 'team a' || s === 'a') return 'A';
  if (s === 'team b' || s === 'b') return 'B';
  return null;
}

function blankStats() {
  return { turns: 0, batons: 0, hits: 0, misses: 0, field: 0, base: 0, kings: 0, kingMisses: 0,
    illegal: 0, I: 0, R: 0, P: 0, Y: 0, Q: 0, N: 0, effF: 0, effI: 0, zeroBaseAt: null,
    btc: [], uncleared: 0, advTurns: 0, advBatons: 0, advHits: 0, bestBlast: 0,
    hotStreak: 0, coldStreak: 0, _run: 0, _runHit: null };
}

// The rules a game was played under, from its headers. A file that says
// nothing was played with five base kubbs a side and six batons a turn.
//   [Base kubbs "3"]    the base kubbs each side starts with
//   [Batons "6"]        the batons in a full turn
//   [Opening "2-4-6"]   the batons in the first turns, in order; later turns
//                       have Batons. With no Opening, any turn may have Batons.
function readRules(headers, warnings) {
  const whole = (key, dflt) => {
    const v = headers[key];
    if (v === undefined) return dflt;
    if (/^\d+$/.test(v) && +v >= 1 && +v <= 10) return +v;
    warnings.push(`The ${key} header should be a number from 1 to 10; read it as ${dflt}.`);
    return dflt;
  };
  const rules = { baseKubbs: whole('Base kubbs', 5), batons: whole('Batons', 6), opening: [] };
  const o = headers['Opening'];
  if (o !== undefined) {
    if (/^\d+(-\d+)*$/.test(o)) rules.opening = o.split('-').map(Number);
    else warnings.push('The Opening header should be batons joined by hyphens, as in 2-4-6; ignored it.');
  }
  return rules;
}

export function analyze(text) {
  const game = parseGame(text);
  const { headers, turns } = game;
  const warnings = [...game.warnings];
  const names = playerNames(headers);
  const teamName = { A: headers['Team A'] || 'Team A', B: headers['Team B'] || 'Team B' };

  // Who opened: the First header; otherwise work it back from a king in the
  // last turn and the Win header; otherwise Team A.
  let first = teamSide(headers['First']);
  let firstSource = 'header';
  if (!first) {
    const win = teamSide(headers['Win']);
    const last = turns[turns.length - 1];
    if (win && last && last.batons.some(b => b.kind === 'king' || b.kind === 'win')) {
      const lastIsFirst = (turns.length - 1) % 2 === 0;
      first = lastIsFirst ? win : (win === 'A' ? 'B' : 'A');
      firstSource = 'inferred';
    } else {
      first = 'A';
      firstSource = 'default';
    }
  }
  const other = s => (s === 'A' ? 'B' : 'A');

  const rules = readRules(headers, warnings);
  const base = { A: rules.baseKubbs, B: rules.baseKubbs };
  const field = { A: 0, B: 0 };
  const stats = { A: blankStats(), B: blankStats() };
  const players = {};
  const rows = [];
  let prevKnocked = 0;
  let winner = null, winHow = null, endTurn = null;

  const player = (id, side) => {
    if (!players[id]) players[id] = { id, name: names[id] || null, side, batons: 0, hits: 0,
      field: 0, base: 0, kings: 0, kingMisses: 0, bestBlast: 0, I: 0, R: 0, P: 0, Y: 0, Q: 0 };
    else if (players[id].side !== side) players[id].bothSides = true;
    return players[id];
  };

  turns.forEach((t, idx) => {
    const att = idx % 2 === 0 ? first : other(first);
    const def = other(att);
    const st = stats[att];
    const w = t.warnings;
    st.turns++;
    if (winner) w.push(`The game was already over after turn ${endTurn}.`);

    // Inkast
    const ink = { I: 0, R: 0, P: 0, Y: 0, Q: 0, N: 0, E: false };
    for (const k of t.inkasts) {
      for (const key of ['I', 'R', 'P', 'Y', 'Q', 'N']) ink[key] += k[key];
      if (k.E) ink.E = true;
      if (k.player) {
        const p = player(k.player, att);
        for (const key of ['I', 'R', 'P', 'Y', 'Q']) p[key] += k[key];
      }
    }
    const expected = prevKnocked;
    const recorded = t.inkasts.length > 0;
    const thrown = recorded ? ink.I + ink.Y : expected;
    if (recorded && thrown !== expected + ink.Q) {
      w.push(`Inkast of ${thrown}, but ${expected + ink.Q} ${expected + ink.Q === 1 ? 'kubb was' : 'kubbs were'} knocked down last turn.`);
    }
    for (const key of ['I', 'R', 'P', 'Y', 'Q', 'N']) st[key] += key === 'I' && !recorded ? 0 : ink[key];
    field[def] = Math.max(0, field[def] - ink.Q) + thrown;

    // Advantage: the opponent left field kubbs standing on the attacker's half.
    const leftover = field[att];
    const shouldHaveAdvantage = leftover > 0;
    if (t.advantage && !shouldHaveAdvantage && idx > 0) w.push('Marked advantage, but no field kubbs were left standing.');
    if (!t.advantage && shouldHaveAdvantage) w.push(`No advantage marked, but ${leftover} field ${leftover === 1 ? 'kubb was' : 'kubbs were'} left standing.`);
    const advantage = !!t.advantage || shouldHaveAdvantage;
    if (advantage) st.advTurns++;

    // Position lines against the count so far. Kubbs are thrown into the
    // defender's half; the thrower's own half holds what the other team left.
    const thrownInto = def.toLowerCase();
    let advantageLine = null;
    for (const l of t.lines) {
      const own = l.half !== thrownInto;
      if (l.mark === '@') {
        const total = kubbsIn(l.entries);
        const standing = own ? field[att] : field[def];
        if (total !== standing) {
          w.push(`The pitch line @${l.half} has ${some(total)}, and ${standing} field ${standing === 1 ? 'kubb stands' : 'kubbs stand'} in that half.`);
        } else if (own) {
          if (l.entries.some(e => e.mark !== 's')) w.push(`The pitch line @${l.half} is the thrower's own half, where every kubb is marked s.`);
        } else {
          const s = kubbsIn(l.entries.filter(e => e.mark === 's'));
          if (s !== standing - thrown) w.push(`The pitch line @${l.half} marks ${s} with s, and ${standing - thrown} ${standing - thrown === 1 ? 'was' : 'were'} left from earlier turns.`);
        }
        // The advantage line runs through the nearest kubb in the thrower's own half.
        if (own && l.entries.length) advantageLine = { depth: Math.min(...l.entries.map(e => e.at[1])), precision: l.precision };
      } else if (l.mark === '^' ? !own : own) {
        w.push(`The ${LINE_NAME[l.mark]} line ${l.mark}${l.half} is in the wrong half for this turn.`);
      }
    }
    // A felled field kubb is one of the kubbs on the pitch line.
    const felled = t.lines.find(l => l.mark === '*' && l.half === thrownInto);
    const pitch = t.lines.find(l => l.mark === '@' && l.half === thrownInto);
    if (felled && pitch && felled.precision === pitch.precision && felled.entries.length === t.batons.length) {
      const left = {};
      for (const e of pitch.entries) left[e.at] = (left[e.at] || 0) + e.count;
      felled.entries.forEach((word, bi) => {
        let f = t.batons[bi].f || 0;
        for (const e of word || []) {
          const n = Math.min(f, e.count);
          f -= n;
          if (n > (left[e.at] || 0)) w.push(`Baton ${bi + 1} fells a field kubb at ${e.at}, which is not on the pitch line.`);
          left[e.at] = (left[e.at] || 0) - n;
        }
      });
    }

    const startField = field[def];
    const startBase = base[def];
    let knocked = 0;
    let btc = startField === 0 ? 0 : null;
    let thrownThisTurn = 0;

    if (ink.E && !winner) { winner = def; winHow = 'illegal king (inkast)'; endTurn = idx + 1; }

    t.batons.forEach((b, bi) => {
      const p = b.player ? player(b.player, att) : null;
      // Scorers sometimes write "-" for the batons left after the king falls.
      // Those were never thrown, so they don't count against Hit %.
      if (winner && isThrown(b)) {
        if (endTurn === idx + 1) w.push(`Baton ${bi + 1} comes after the game ended; counted as unthrown (X).`);
        b.void = true;
        return;
      }
      if (b.kind === 'unthrown') {
        b.void = true;
        if (!winner && idx < turns.length - 1) w.push(`Baton ${bi + 1} is marked unthrown (X) before the game ended.`);
        return;
      }
      if (b.kind === 'win') { if (!winner) { winner = att; winHow = 'called (W)'; endTurn = idx + 1; } return; }
      if (b.kind === 'resign') { if (!winner) { winner = def; winHow = 'resigned (G)'; endTurn = idx + 1; } return; }

      thrownThisTurn++;
      st.batons++;
      const throwNo = st.batons;
      if (advantage) st.advBatons++;
      if (p) p.batons++;
      const hit = isHit(b);
      if (hit) { st.hits++; if (p) p.hits++; if (advantage) st.advHits++; }
      else st.misses++;
      if (st._runHit === hit) st._run++; else { st._runHit = hit; st._run = 1; }
      if (hit) st.hotStreak = Math.max(st.hotStreak, st._run);
      else st.coldStreak = Math.max(st.coldStreak, st._run);

      if (b.kind === 'hit') {
        if (b.f) {
          if (b.f > field[def]) w.push(`Baton ${bi + 1} knocks ${b.f} field ${b.f === 1 ? 'kubb' : 'kubbs'}, but only ${field[def]} ${field[def] === 1 ? 'was' : 'were'} standing.`);
          const f = Math.min(b.f, field[def]);
          field[def] -= f;
          knocked += f;
          st.field += b.f;
          st.bestBlast = Math.max(st.bestBlast, b.f);
          if (p) { p.field += b.f; p.bestBlast = Math.max(p.bestBlast, b.f); }
          if (thrownThisTurn === 1) st.effF += b.f;
          if (field[def] === 0 && btc === null) btc = thrownThisTurn;
        }
        if (b.b) {
          if (field[def] > 0) w.push(`Baton ${bi + 1} hits a base kubb with ${field[def]} field ${field[def] === 1 ? 'kubb' : 'kubbs'} still standing.`);
          if (b.b > base[def]) w.push(`Baton ${bi + 1} knocks ${b.b} base ${b.b === 1 ? 'kubb' : 'kubbs'}, but only ${base[def]} ${base[def] === 1 ? 'was' : 'were'} standing.`);
          const n = Math.min(b.b, base[def]);
          base[def] -= n;
          knocked += n;
          st.base += b.b;
          if (p) p.base += b.b;
          if (base[def] === 0 && st.zeroBaseAt === null) st.zeroBaseAt = throwNo;
        }
        if (b.e && !winner) { st.illegal++; winner = def; winHow = 'illegal king (kubb hit the king)'; endTurn = idx + 1; }
      } else if (b.kind === 'king') {
        st.kings++;
        if (p) p.kings++;
        if (field[def] + base[def] > 0) w.push(`King taken with ${field[def] + base[def]} ${field[def] + base[def] === 1 ? 'kubb' : 'kubbs'} still standing.`);
        if (!winner) { winner = att; winHow = 'king'; endTurn = idx + 1; }
      } else if (b.kind === 'kingmiss') {
        st.kingMisses++;
        if (p) p.kingMisses++;
        if (field[def] + base[def] > 0) w.push(`King shot (=) with ${field[def] + base[def]} ${field[def] + base[def] === 1 ? 'kubb' : 'kubbs'} still standing.`);
      } else if (b.kind === 'illegalking') {
        st.illegal++;
        if (!winner) { winner = def; winHow = 'illegal king'; endTurn = idx + 1; }
      }
    });

    const most = idx < rules.opening.length ? rules.opening[idx] : rules.batons;
    if (thrownThisTurn > most) {
      w.push(most === 6 ? `${thrownThisTurn} batons thrown; a turn has six.` : `${thrownThisTurn} batons thrown; this turn has ${most}.`);
    }
    if (startField > 0) {
      if (btc !== null) st.btc.push(btc);
      else st.uncleared++;
    }
    if (ink.I > 0 && recorded) st.effI += ink.I;
    else if (!recorded && thrown > 0) st.effI += thrown;

    rows.push({
      turn: idx + 1, n: t.n, team: att, inkast: thrown, inkastRecorded: recorded, ink,
      advantage, advantageMarked: t.advantage, advantageLine, lines: t.lines, leftover, startField, startBase,
      batons: t.batons, note: t.note, comments: t.comments, knocked, btc,
      fieldLeft: field[def], base: { ...base }, warnings: w, source: t.source,
    });
    prevKnocked = knocked;
  });

  const headerWin = teamSide(headers['Win']);
  if (headerWin && winner && headerWin !== winner) warnings.push(`The Win header says ${teamName[headerWin]}, but the turns end with ${teamName[winner]} winning.`);
  if (!winner && headerWin) { winner = headerWin; winHow = 'Win header'; }
  if (turns.length && !winner) warnings.push('The turns never finish the game (no K, E, W or G).');

  for (const s of ['A', 'B']) {
    const st = stats[s];
    delete st._run; delete st._runHit;
    st.hitPct = st.batons ? st.hits / st.batons : null;
    st.efficiency = st.effI ? st.effF / st.effI : null;
    st.rethrowPct = st.I + st.Y ? st.R / (st.I + st.Y) : null;
    st.btcAvg = st.btc.length ? st.btc.reduce((a, b) => a + b, 0) / st.btc.length : null;
    st.advHitPct = st.advBatons ? st.advHits / st.advBatons : null;
  }
  for (const p of Object.values(players)) p.hitPct = p.batons ? p.hits / p.batons : null;

  return { headers, rules, teamName, first, firstSource, winner, winHow, endTurn, rows, stats,
    players: Object.values(players), warnings,
    turnWarnings: rows.reduce((n, r) => n + r.warnings.length, 0) };
}
