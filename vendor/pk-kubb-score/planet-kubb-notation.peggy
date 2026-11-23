// Planet Kubb Notation 2: formal grammar
//
// This is a parsing expression grammar (PEG) in Peggy syntax (https://peggyjs.org).
// It is the definition of what counts as valid notation, and it is also
// executable: tools/build-grammar.mjs turns it into a parser.
//
// It has two start rules, for the notation's two forms:
//   Game            the lenient form: everything notation 1 allowed, and
//                   position lines. Sheets typed in from paper are read with it.
//   CanonicalGame   the canonical form: one spelling of each thing, for
//                   programs to write and compare. Every canonical file is
//                   also a lenient one, with the same reading.
//
// How to read it:
//   Rule = ...        a named piece of the language
//   "F"i              the literal text F, ignoring case
//   [0-9]             one character from a set
//   A B               A followed by B
//   A / B             A, or if that fails, B (the first one that works wins)
//   A?  A*  A+        optional, zero or more, one or more
//   &A  !A            "A comes next" / "A does not come next" (looks, doesn't consume)
//   label:A { ... }   the code in braces builds the parsed result; it doesn't
//                     change what is valid
//
// What the grammar checks is the shape of the notation: which tokens exist,
// what order they come in, how they are separated, and whether the lines of
// one turn agree with each other. Whether a game adds up (the right number of
// kubbs thrown in, an advantage line when field kubbs were left standing) is
// checked afterwards by replaying the game.

{{
  function count(n, dflt) { return n === null ? dflt : parseInt(n, 10); }

  // The header keys the notation defines, in their canonical order. Any other
  // key is the writer's own and sorts after these, by code point.
  const KEYS = ['Notation', 'Event', 'Location', 'Start', 'Event date', 'End', 'Duration',
    'Surface', 'Rules', 'Base kubbs', 'Batons', 'Opening', 'Team A', 'Team A Players',
    'Team B', 'Team B Players', 'First', 'Win', 'Scored by', 'Entered by', 'Video',
    'Player note', 'Video offset', 'Stats', 'Scoresheet', 'Source'];

  function byCodePoint(a, b) {
    const x = Array.from(a), y = Array.from(b);
    for (let i = 0; i < x.length && i < y.length; i++) {
      const d = x[i].codePointAt(0) - y[i].codePointAt(0);
      if (d) return d;
    }
    return x.length - y.length;
  }

  function headerOrder(a, b) {
    const i = KEYS.indexOf(a), j = KEYS.indexOf(b);
    if (i >= 0 || j >= 0) return (i < 0 ? KEYS.length : i) - (j < 0 ? KEYS.length : j);
    return byCodePoint(a, b);
  }

  // The comments in parentheses on a turn line, up to its # note.
  function commentsIn(line) {
    const found = [];
    for (let i = 0; i < line.length && line[i] !== '#'; i++) {
      if (line[i] !== '(') continue;
      const end = line.indexOf(')', i);
      found.push(line.slice(i + 1, end).trim());
      i = end;
    }
    return found;
  }

  const LINES = ['@a', '@b', '~a', '~b', '^a', '^b', '*a', '*b'];
  const NAMES = { '@': 'pitch', '~': 'lay', '^': 'stance', '*': 'felled' };
  const HOW = { s: 0, null: 1, p: 2 };
  const kubbsIn = entries => entries.reduce((n, e) => n + e.count, 0);
  const some = n => `${n} ${n === 1 ? 'kubb' : 'kubbs'}`;
  const place = (a, b) => a.at[0] - b.at[0] || a.at[1] - b.at[1];

  // Where the lines of one turn disagree with each other. Each is checked
  // from the turn alone: nothing here knows whose turn it is or what has
  // been standing since earlier turns.
  function turnIssues(turn) {
    const issues = [];
    const add = (line, message) => issues.push({ message, location: line.location });
    const seen = {}, pitch = {};
    for (const l of turn.lines) {
      const k = l.mark + l.half;
      if (seen[k]) add(l, `A turn has one ${k} line, and this is a second.`);
      seen[k] = true;
      if (l.mark === '@' && !pitch[l.half]) pitch[l.half] = l;
    }
    // Punishment kubbs are in the half that was thrown into: the pitch line
    // with entries other than kubbs left from earlier turns.
    const thrownInto = Object.values(pitch).find(l => l.entries.some(e => e.mark !== 's'));
    if (thrownInto) {
      const P = turn.inkasts.reduce((n, k) => n + k.P, 0);
      const p = kubbsIn(Object.values(pitch).flatMap(l => l.entries.filter(e => e.mark === 'p')));
      if (p !== P) add(thrownInto, `The pitch line marks ${p} with p, and the turn line has ${P}P.`);
    }
    for (const l of turn.lines) {
      const name = NAMES[l.mark];
      if (l.mark === '~') {
        const on = pitch[l.half];
        if (!on) add(l, `A lay line needs the pitch line @${l.half} above it.`);
        else if (on.precision !== 'point') add(l, `A lay line needs its pitch line in points, not cells.`);
        else {
          const thrown = on.entries.filter(e => e.mark === null).length;
          if (thrown !== l.entries.length) add(l, `The lay line has ${some(l.entries.length)}, and its pitch line has ${thrown} thrown in.`);
        }
      }
      if (l.mark === '^' || l.mark === '*') {
        if (l.entries.length !== turn.batons.length) {
          add(l, `The ${name} line has ${l.entries.length} words, and the turn line has ${turn.batons.length} batons.`);
        } else if (l.mark === '*') {
          l.entries.forEach((word, i) => {
            if (word === null) return;
            const b = turn.batons[i], want = (b.field || 0) + (b.base || 0), have = kubbsIn(word);
            if (have !== want) add(l, `Word ${i + 1} of the felled line has ${some(have)}, and baton ${i + 1} (${b.text}) felled ${want}.`);
          });
        }
      }
    }
    return issues;
  }

  // What the canonical form adds: one order for a turn's lines and for the
  // entries on them, and a repeated cell gathered into a count.
  function canonicalIssues(turn) {
    const issues = [];
    const add = (line, message) => issues.push({ message, location: line.location });
    let last = -1;
    for (const l of turn.lines) {
      const at = LINES.indexOf(l.mark + l.half);
      if (at < last) add(l, `Position lines come in the order ${LINES.join(' ')}.`);
      last = Math.max(last, at);
      const cells = l.precision === 'cell';
      const sorted = (list, cmp, message) => {
        for (let i = 1; i < list.length; i++) {
          const d = cmp(list[i - 1], list[i]);
          if (d > 0) return add(l, message);
          if (d === 0 && cells) return add(l, `Kubbs in one cell are written once, with a count.`);
        }
      };
      if (l.mark === '@') {
        sorted(l.entries, (a, b) => HOW[a.mark] - HOW[b.mark] || place(a, b),
          'Pitch line entries come s first, then unmarked, then p, each group by across and then depth.');
      }
      if (l.mark === '*') {
        l.entries.forEach((word, i) => {
          if (word === null || i >= turn.batons.length) return;
          // Field kubbs first, then base kubbs, as in the baton's token.
          const field = [], base = [];
          let left = turn.batons[i].field || 0;
          for (const e of word) {
            if (left > 0) { field.push(e); left -= e.count; } else base.push(e);
          }
          if (left < 0) return add(l, `Word ${i + 1} of the felled line counts a field kubb and a base kubb together.`);
          sorted(field, place, `The field kubbs in word ${i + 1} of the felled line go by across and then depth.`);
          sorted(base, place, `The base kubbs in word ${i + 1} of the felled line go by across and then depth.`);
        });
      }
    }
    return issues;
  }
}}

{
  function hit(field, base, e) {
    return { text: text(), kind: 'hit', field, base: base || 0, illegalKing: !!e };
  }

  // A position line is all cells or all points.
  function precisionOf(kinds) {
    const cells = kinds.includes('cell'), points = kinds.includes('point');
    if (cells && points) error('A position line is all cells or all points, not a mix.');
    return cells ? 'cell' : 'point';
  }
}

// ---------- a game ----------

// A game is optional header lines, then turns. Blank lines and lines that
// are only a # note can go anywhere.
Game
  = Spacer* headers:(@Header Spacer*)* turns:(@Turn Spacer*)* !.
    {
      // A file that names a notation this grammar does not know is refused,
      // so that a later notation is never misread as this one.
      const notation = headers.find(h => h.key === 'Notation');
      if (notation && notation.value !== '1' && notation.value !== '2') {
        error(`This grammar reads notation 1 and 2, and the file says notation ${notation.value}.`, notation.location);
      }
      return { headers, turns };
    }

Spacer "blank line"
  = _ Note? EOL
  / [ \t]+ !.

// ---------- headers ----------

// [Event "US National Kubb Championship 2013"]
Header
  = _ "[" _ key:Key [ \t]+ value:Value _ "]" _ (EOL / !.)
    { return { key, value, location: location() }; }

Key
  = $(KeyWord (" " KeyWord)*)

KeyWord
  = [^ \t"\]\r\n]+

Value
  = '"' chars:(@'\\' @[\\"] / [^"\\\r\n])* '"'
    { return chars.map(c => Array.isArray(c) ? c[1] : c).join(''); }

// ---------- turns ----------

// A turn is its turn line and then, if anyone recorded them, position lines.
//
// 9. a:7I2R2P d:3F d:2F a:F a:- y:F c:B
// @b 5x4,0 0,3p 2,0p
Turn
  = line:TurnLine lines:(Spacer* @PositionLine)*
    {
      const turn = { ...line, lines };
      turn.issues = turnIssues(turn);
      return turn;
    }

// 7. 3I 2F F - B B = # Missed king shot!
TurnLine
  = _ number:TurnNumber? Gap* body:TurnBody Gap* note:Note? (EOL / !.)
    { return { number, ...body, note, comments: commentsIn(text()), location: location() }; }

TurnNumber
  = digits:$[0-9]+ "."
    { return parseInt(digits, 10); }

// The phases come in order: kubbs thrown in, then the advantage line, then
// the batons. Each part is optional, but a turn has at least one of them.
TurnBody
  = inkasts:InkastList advantage:(Gap+ @Advantage)? batons:(Gap+ @BatonList)?
    { return { inkasts, advantage, batons: batons || [] }; }
  / advantage:Advantage batons:(Gap+ @BatonList)?
    { return { inkasts: [], advantage, batons: batons || [] }; }
  / batons:BatonList
    { return { inkasts: [], advantage: null, batons }; }

InkastList
  = first:Inkast rest:(Gap+ @Inkast)*
    { return [first, ...rest]; }

BatonList
  = first:Baton rest:(Gap+ @Baton)*
    { return [first, ...rest]; }

// ---------- separators, notes, comments ----------

// Actions are separated by spaces, commas or forward slashes. A comment in
// parentheses also separates.
Gap "separator"
  = [ \t,/]
  / Comment

Comment "comment"
  = "(" text:$[^()\r\n]* ")"
    { return text; }

// Everything after # to the end of the line.
Note "note"
  = "#" text:$[^\r\n]*
    { return text.trim(); }

// A token has to end at a separator, a comment, a note or the end of the line.
// This is what stops "32F" from being read as "3" then "2F".
End "separator or end of line"
  = &([ \t,/(#] / EOL / !.)

// ---------- players ----------

// A player token is letters, before the action: jt:2F. The colon can be left
// out (jt2F, gvK) when the player is lowercase and the action starts with a
// capital, a digit or a symbol. "fB" is player f knocking down a base kubb;
// "FB" and "fb" are a field kubb that took a base kubb, with no player.
Player "player"
  = id:$[a-z_]i+ ":"
    { return id.toLowerCase(); }

CompactPlayer "player"
  = $[a-z_]+

// ---------- kubb tossing ----------

// 5I2R  2IRP  j:2Y  m:2IQ  0  3  4IE
Inkast
  = player:Player body:InkastBody End { return { ...body, player, location: location() }; }
  / player:CompactPlayer body:InkastBody End { return { ...body, player, location: location() }; }
  / body:InkastBody End { return { ...body, player: null, location: location() }; }

InkastBody
  = n:$[0-9]+ &End
    { return { text: n, I: parseInt(n, 10), R: 0, P: 0, Y: 0, Q: 0, N: 0, illegalKing: false }; }
  / parts:InkastPart+ e:IllegalKing?
    {
      const k = { text: text(), I: 0, R: 0, P: 0, Y: 0, Q: 0, N: 0, illegalKing: !!e };
      for (const [code, n] of parts) k[code] += n;
      return k;
    }

InkastPart "kubb tossing code (I R P Y Q N)"
  = n:Count? code:[IRPYQ]i { return [code.toUpperCase(), count(n, 1)]; }
  / n:[0-5]? "N"i          { return ['N', count(n, 1)]; }

// A count in front of an action: 0 to 10.
Count "number (0-10)"
  = $("10" / [0-9])

// ---------- advantage line ----------

// A  2A  4A, and the 2012 markers BA, MA and CA.
Advantage "advantage line (A)"
  = meters:$[0-4]? "A"i End
    { return { text: text(), meters: meters ? parseInt(meters, 10) : null, legacy: null, location: location() }; }
  / place:[BMC]i "A"i End
    { return { text: text(), meters: null, legacy: place.toUpperCase() + 'A', location: location() }; }

// ---------- batons ----------

Baton
  = player:Player body:BatonBody End { return { ...body, player, location: location() }; }
  / player:CompactPlayer body:BatonBody End { return { ...body, player, location: location() }; }
  / body:BatonBody End { return { ...body, player: null, location: location() }; }

BatonBody
  = f:Field b:Base? e:IllegalKing? { return hit(f, b, e); }
  / b:Base e:IllegalKing?          { return hit(0, b, e); }
  / BatonCode

BatonCode "baton code (- = K X E Z W G)"
  = "-"   { return { text: '-', kind: 'miss' }; }
  / "="   { return { text: '=', kind: 'king-miss' }; }
  / "!"   { return { text: '!', kind: 'illegal-king' }; }
  / "K"i  { return { text: 'K', kind: 'king' }; }
  / "X"i  { return { text: 'X', kind: 'unthrown' }; }
  / "E"i  { return { text: 'E', kind: 'illegal-king' }; }
  / "Z"i  { return { text: 'Z', kind: 'illegal-throw' }; }
  / "W"i  { return { text: 'W', kind: 'win' }; }
  / "G"i  { return { text: 'G', kind: 'resign' }; }

Field "field kubbs (F)"
  = n:Count? "F"i { return count(n, 1); }

Base "base kubbs (B)"
  = n:Count? "B"i { return count(n, 1); }

// A kubb knocked into the king: 3FE.
IllegalKing "E (kubb knocked over the king)"
  = "E"i

// ---------- position lines ----------

// A position line answers one question about the turn above it. It starts
// with a mark and the half it describes: a is Team A's half, b is Team B's.
//
//   @  pitch line    where each field kubb in that half stands when the
//                    first baton is thrown
//   ~  lay line      where each kubb thrown in lay before it was raised
//   ^  stance line   where each baton was thrown from
//   *  felled line   which kubbs each baton felled
PositionLine
  = _ line:(PitchLine / LayLine / StanceLine / FelledLine) _ (EOL / !.)
    { return { ...line, location: location() }; }

// @b 5x4,0 0,3p 2,0p        @b 4.48,0.11 4.52,0.34 0.40,3.80p
PitchLine
  = "@" half:Half entries:(Blank @Standing)+
    { return { mark: '@', half, precision: precisionOf(entries.map(e => e.kind)), entries: entries.map(({ kind, ...e }) => e) }; }

// A field kubb, or several in one cell. The letter says how it came to be
// there: none for thrown in this turn, p for a punishment kubb placed this
// turn, s for standing since an earlier turn.
Standing "position"
  = n:(@LooseCount "x"i)? at:Cell mark:Mark? PositionEnd
    { return { kind: 'cell', at, count: count(n, 1), mark }; }
  / at:Point mark:Mark? PositionEnd
    { return { kind: 'point', at, count: 1, mark }; }

Mark "s or p"
  = m:[sp]i { return m.toLowerCase(); }

// ~b 4.59,0.06/4.63,-0.08 4.94,0.13/5.08,0.17
// The two ends of each lying kubb; the first is the end it was stood up on.
LayLine
  = "~" half:Half entries:(Blank @Lay)+
    { return { mark: '~', half, precision: 'point', entries }; }

Lay "two ends of a lying kubb"
  = a:WidePoint "/" b:WidePoint PositionEnd
    { return { ends: [a, b] }; }

// ^a 4.20,4.00 4.20,4.00 - 1.40,4.25
// One word for each baton: where it was thrown from, or - when not recorded.
StanceLine
  = "^" half:Half entries:(Blank @(@StancePoint PositionEnd / Dash))+
    { return { mark: '^', half, precision: 'point', entries }; }

// *b 4.48,0.11+4.52,0.34 - 1.50,4.00        *b 3x4,0 2x4,0 - 1,3
// One word for each baton: where each kubb it felled stood, or -.
FelledLine
  = "*" half:Half words:(Blank @(FelledWord / Dash))+
    {
      const kinds = words.filter(w => w !== null).flatMap(w => w.map(e => e.kind));
      return { mark: '*', half, precision: kinds.length ? precisionOf(kinds) : 'cell',
        entries: words.map(w => w && w.map(({ kind, ...e }) => e)) };
    }

FelledWord
  = first:Felled rest:("+" @Felled)* PositionEnd
    { return [first, ...rest]; }

Felled "position"
  = n:(@LooseCount "x"i)? at:Cell { return { kind: 'cell', at, count: count(n, 1) }; }
  / at:Point                    { return { kind: 'point', at, count: 1 }; }

Dash "-"
  = "-" PositionEnd { return null; }

Half "half (a or b)"
  = h:[ab]i { return h.toLowerCase(); }

LooseCount "count (1-10)"
  = $("10" / [1-9])

Blank "space"
  = [ \t]+

PositionEnd "space or end of line"
  = &([ \t] / EOL / !.)

// ---------- positions ----------

// One frame for the whole game. Across runs 0 to 5 from the centre-line stake
// on Team A's left, so the king is at 2.5. Depth runs 0 to 4 from the centre
// line toward a baseline, the same in both halves. A position is across, a
// comma, depth.

// A cell is one metre square, in whole numbers: 4,0 is the cell at across 4
// beside the centre line.
Cell "cell"
  = a:[0-4] "," d:[0-3]
    { return [parseInt(a, 10), parseInt(d, 10)]; }

// A point has exactly two decimals: 4.48,0.11. Dropping the decimals gives
// its cell, and the far edges (5.00 across, 4.00 deep) belong to the last cell.
Point "point"
  = a:Across "," d:Depth
    { return [parseFloat(a), parseFloat(d)]; }

Across "across (0.00-5.00)"
  = $([0-4] "." [0-9] [0-9]) / "5.00"

Depth "depth (0.00-4.00)"
  = $([0-3] "." [0-9] [0-9]) / "4.00"

// On a lay line an end may lie up to 0.20 m outside the half. A negative
// depth is wood over the centre line. This is the only place a minus sign
// appears, and a zero never has one.
WidePoint "point"
  = a:WideAcross "," d:WideDepth
    { return [parseFloat(a), parseFloat(d)]; }

WideAcross "across (-0.20 to 5.20)"
  = $("-0." !"00" ("20" / [01] [0-9])) / $([0-4] "." [0-9] [0-9]) / $("5." ("20" / [01] [0-9]))

WideDepth "depth (-0.20 to 4.20)"
  = $("-0." !"00" ("20" / [01] [0-9])) / $([0-3] "." [0-9] [0-9]) / $("4." ("20" / [01] [0-9]))

// A thrower may stand behind the baseline, which is depth 4.00.
StancePoint "point"
  = a:Across "," d:$([0-9] "." [0-9] [0-9])
    { return [parseFloat(a), parseFloat(d)]; }

// ---------- the canonical form ----------

// One spelling of everything: two writers that record the same game the same
// way produce the same bytes. Lines end with a line feed, the last one too.
//
// [Notation "2"]
// [Team A "Ringers"]
//
// 1. j:B m:-
// 2. k:I k:F s:B s:B k:-
// @a 2,1
CanonicalGame
  = headers:CHeader+ turns:("\n" @CTurn+)? !.
    {
      if (headers[0].key !== 'Notation' || headers[0].value !== '2') {
        error('A canonical file starts with [Notation "2"].', headers[0].location);
      }
      headers.forEach((h, i) => {
        if (i === 0) return;
        const d = headerOrder(headers[i - 1].key, h.key);
        if (d === 0) error(`The header ${h.key} is there twice.`, h.location);
        if (d > 0) error(`The header ${h.key} comes before ${headers[i - 1].key}.`, h.location);
      });
      (turns || []).forEach((t, i) => {
        if (t.number !== i + 1) error(`This is turn ${i + 1}, and it is numbered ${t.number}.`, t.location);
      });
      return { headers, turns: turns || [] };
    }

CHeader
  = "[" key:Key " " value:Value "]" "\n"
    { return { key, value, location: location() }; }

CTurn
  = line:CTurnLine lines:CPositionLine*
    {
      const turn = { ...line, lines };
      turn.issues = [...turnIssues(turn), ...canonicalIssues(turn)];
      if (turn.issues.length) error(turn.issues[0].message, turn.issues[0].location);
      return turn;
    }

// The turn number, tokens with one space between them, and an optional note.
CTurnLine
  = number:CTurnNumber ". " body:CTurnBody note:CNote? "\n"
    { return { number, ...body, note, comments: [], location: location() }; }

CTurnNumber "turn number"
  = digits:$([1-9] [0-9]*)
    { return parseInt(digits, 10); }

CTurnBody
  = first:CKubbs rest:(" " @CKubbs)* advantage:(" " @CAdvantage)? batons:(" " @CBaton)*
    { return { inkasts: [first, ...rest], advantage, batons }; }
  / advantage:CAdvantage batons:(" " @CBaton)*
    { return { inkasts: [], advantage, batons }; }
  / first:CBaton rest:(" " @CBaton)*
    { return { inkasts: [], advantage: null, batons: [first, ...rest] }; }

CNote "note"
  = " # " text:$([^ \t\r\n] [^\r\n]*)
    {
      if (/[ \t]$/.test(text)) error('A note has no spaces after it.');
      return text;
    }

// A player is lowercase letters and _, with the colon. A token may have none.
CPlayer "player"
  = @$[a-z_]+ ":"

// A count of one is never written, and 2 to 10 always are.
CCount "count (2-10)"
  = $("10" / [2-9])

// 7I2R2P  j:2I  IRP  0I: the codes in the order I R P Y Q N, then E. 0I says
// the scorer knows no kubbs were thrown; no token says it was not recorded.
CKubbs "kubbs thrown in"
  = player:CPlayer? body:CKubbsBody
    { return { ...body, player, location: location() }; }

CKubbsBody
  = "0I"
    { return { text: '0I', I: 0, R: 0, P: 0, Y: 0, Q: 0, N: 0, illegalKing: false }; }
  / i:(n:CCount? "I" { return count(n, 1); })?
    r:(n:CCount? "R" { return count(n, 1); })?
    p:(n:CCount? "P" { return count(n, 1); })?
    y:(n:CCount? "Y" { return count(n, 1); })?
    q:(n:CCount? "Q" { return count(n, 1); })?
    nn:(n:[2-5]? "N" { return count(n, 1); })?
    &{ return [i, r, p, y, q, nn].some(v => v !== null); }
    e:"E"?
    { return { text: text(), I: i || 0, R: r || 0, P: p || 0, Y: y || 0, Q: q || 0, N: nn || 0, illegalKing: !!e }; }

// The advantage line is a bare A. Where it runs is on the pitch line for the
// thrower's own half: through the kubb there with the least depth.
CAdvantage "advantage line (A)"
  = "A"
    { return { text: 'A', meters: null, legacy: null, location: location() }; }

CBaton "baton"
  = player:CPlayer? body:CBatonBody
    { return { ...body, player, location: location() }; }

CBatonBody
  = f:(n:CCount? "F" { return count(n, 1); }) b:(n:CCount? "B" { return count(n, 1); })? e:"E"?
    { return hit(f, b, e); }
  / b:(n:CCount? "B" { return count(n, 1); }) e:"E"?
    { return hit(0, b, e); }
  / "-"  { return { text: '-', kind: 'miss' }; }
  / "="  { return { text: '=', kind: 'king-miss' }; }
  / "K"  { return { text: 'K', kind: 'king' }; }
  / "X"  { return { text: 'X', kind: 'unthrown' }; }
  / "E"  { return { text: 'E', kind: 'illegal-king' }; }
  / "Z"  { return { text: 'Z', kind: 'illegal-throw' }; }
  / "W"  { return { text: 'W', kind: 'win' }; }
  / "G"  { return { text: 'G', kind: 'resign' }; }

CPositionLine
  = line:(CPitchLine / CLayLine / CStanceLine / CFelledLine) "\n"
    { return { ...line, location: location() }; }

CPitchLine
  = "@" half:[ab] entries:(" " @CStanding)+
    { return { mark: '@', half, precision: precisionOf(entries.map(e => e.kind)), entries: entries.map(({ kind, ...e }) => e) }; }

CStanding "position"
  = n:(@CCount "x")? at:Cell mark:[sp]?
    { return { kind: 'cell', at, count: count(n, 1), mark }; }
  / at:Point mark:[sp]?
    { return { kind: 'point', at, count: 1, mark }; }

CLayLine
  = "~" half:[ab] entries:(" " @CLay)+
    { return { mark: '~', half, precision: 'point', entries }; }

CLay "two ends of a lying kubb"
  = a:WidePoint "/" b:WidePoint
    { return { ends: [a, b] }; }

CStanceLine
  = "^" half:[ab] entries:(" " @(StancePoint / CDash))+
    { return { mark: '^', half, precision: 'point', entries }; }

CFelledLine
  = "*" half:[ab] words:(" " @(CFelledWord / CDash))+
    {
      const kinds = words.filter(w => w !== null).flatMap(w => w.map(e => e.kind));
      return { mark: '*', half, precision: kinds.length ? precisionOf(kinds) : 'cell',
        entries: words.map(w => w && w.map(({ kind, ...e }) => e)) };
    }

CFelledWord
  = first:CFelled rest:("+" @CFelled)*
    { return [first, ...rest]; }

CFelled "position"
  = n:(@CCount "x")? at:Cell { return { kind: 'cell', at, count: count(n, 1) }; }
  / at:Point                { return { kind: 'point', at, count: 1 }; }

CDash "-"
  = "-" { return null; }

// ---------- characters ----------

_ "space"
  = [ \t]*

EOL "end of line"
  = "\r\n" / "\n" / "\r"
