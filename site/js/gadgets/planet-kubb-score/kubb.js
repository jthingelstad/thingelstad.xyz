// Planet Kubb Notation: parser, game-state simulator and statistics.
// No dependencies. Runs in the browser (ES module) and in Node for tests.

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
  if (m) return { meters: m[1] === '' ? null : +m[1] };
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
    if (b) return { ...b, player: raw.slice(0, i).toLowerCase(), raw };
  }
  return null;
}

// ---------- lines ----------

function parseTurnLine(line, lineNo) {
  const turn = { line: lineNo, source: line, n: null, inkasts: [], advantage: null,
    batons: [], note: '', comments: [], warnings: [] };
  let body = '';
  let depth = 0, comment = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (depth === 0 && c === '#') { turn.note = line.slice(i + 1).trim(); break; }
    if (c === '(') { if (depth++ > 0) comment += c; continue; }
    if (c === ')' && depth > 0) {
      if (--depth === 0) { turn.comments.push(comment.trim()); comment = ''; body += ' '; }
      else comment += c;
      continue;
    }
    if (depth > 0) comment += c; else body += c;
  }
  if (depth > 0) turn.comments.push(comment.trim());
  const m = body.match(/^\s*(\d+)\.(.*)$/);
  if (m) { turn.n = +m[1]; body = m[2]; }
  let phase = 'inkast';
  for (const raw of body.split(/[\s,\/]+/).filter(Boolean)) {
    const t = parseToken(raw, phase);
    if (!t) { turn.warnings.push(`Couldn't read "${raw}"; ignored it.`); continue; }
    if (t.fixed) turn.warnings.push(`Read "${raw}" as ${raw.replace(/-$/, '')}.`);
    if (t.type === 'inkast') turn.inkasts.push(t);
    else if (t.type === 'advantage') {
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
    if (h) { headers[h[1]] = h[2]; return; }
    if (s.startsWith('#')) return;
    const t = parseTurnLine(s, i + 1);
    if (!t.inkasts.length && !t.advantage && !t.batons.length) {
      if (t.warnings.length) warnings.push(`Line ${i + 1}: nothing here reads as notation.`);
      return;
    }
    turns.push(t);
  });
  turns.forEach((t, i) => {
    if (t.n !== null && t.n !== i + 1) t.warnings.push(`Numbered ${t.n}, but it is turn ${i + 1}.`);
  });
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

  const base = { A: 5, B: 5 };
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

    if (thrownThisTurn > 6) w.push(`${thrownThisTurn} batons thrown; a turn has six.`);
    if (startField > 0) {
      if (btc !== null) st.btc.push(btc);
      else st.uncleared++;
    }
    if (ink.I > 0 && recorded) st.effI += ink.I;
    else if (!recorded && thrown > 0) st.effI += thrown;

    rows.push({
      turn: idx + 1, n: t.n, team: att, inkast: thrown, inkastRecorded: recorded, ink,
      advantage, advantageMarked: t.advantage, leftover, startField, startBase,
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

  return { headers, teamName, first, firstSource, winner, winHow, endTurn, rows, stats,
    players: Object.values(players), warnings,
    turnWarnings: rows.reduce((n, r) => n + r.warnings.length, 0) };
}
