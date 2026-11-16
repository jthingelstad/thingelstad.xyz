// Planet Kubb Notation: formal grammar
//
// This is a parsing expression grammar (PEG) in Peggy syntax (https://peggyjs.org).
// It is the definition of what counts as valid notation, and it is also
// executable: tools/build-grammar.mjs turns it into a parser.
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
// what order they come in, and how they are separated. Whether a game adds up
// (the right number of kubbs thrown in, an advantage line when field kubbs
// were left standing) is checked afterwards by replaying the game.
//
// Positions on the pitch are optional. They are written as a comment that
// starts with @, straight after the action they describe: 2I (@ b6 c7).
// A reader that knows nothing of positions sees an ordinary comment, so a
// game with positions is still a valid game everywhere.

{{
  function count(n, dflt) { return n === null ? dflt : parseInt(n, 10); }
}}

{
  function hit(field, base, e) {
    return { text: text(), kind: 'hit', field, base: base || 0, illegalKing: !!e };
  }
  // The middle of a grid square, in meters: a to e across, 1 to 8 up the pitch.
  function cell(col, row) {
    return { x: 'abcde'.indexOf(col.toLowerCase()) + 0.5, y: parseInt(row, 10) - 0.5 };
  }
}

// ---------- a game ----------

// A game is optional header lines, then turn lines. Blank lines and lines that
// are only a # note can go anywhere.
Game
  = Spacer* headers:(@Header Spacer*)* turns:(@Turn Spacer*)* !.
    { return { headers, turns }; }

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

// 7. 3I 2F F - B B = # Missed king shot!
Turn
  = _ number:TurnNumber? Gap* body:TurnBody Gap* note:Note? (EOL / !.)
    { return { number, ...body, note, location: location() }; }

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
  = @$[a-z_]i+ ":"

CompactPlayer "player"
  = $[a-z_]+

// ---------- kubb tossing ----------

// 5I2R  2IRP  j:2Y  m:2IQ  0  3  4IE
Inkast
  = player:Player body:InkastBody End at:At? { return { ...body, player, at, location: location() }; }
  / player:CompactPlayer body:InkastBody End at:At? { return { ...body, player, at, location: location() }; }
  / body:InkastBody End at:At? { return { ...body, player: null, at, location: location() }; }

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
  / n:$[0-5]? "N"i         { return ['N', count(n, 1)]; }

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
  = player:Player body:BatonBody End at:At? { return { ...body, player, at, location: location() }; }
  / player:CompactPlayer body:BatonBody End at:At? { return { ...body, player, at, location: location() }; }
  / body:BatonBody End at:At? { return { ...body, player: null, at, location: location() }; }

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

// ---------- positions (optional) ----------

// 2I (@ b6 c7)   2F (@ b6 c7)   B (@ ^c1 d8)   F (@ 1.32,5.87)
//
// Where things were on the pitch, in a comment that starts with @ and follows
// the action it describes. The pitch is seen from Team A's baseline, in every
// turn of the game: across it is a to e from the left sideline (1 m each), up
// it is 1 to 8 from Team A's baseline (1 m each). The king stands in the
// middle of column c, on the line between rows 4 and 5. A position is a grid square (b6), or exact meters
// across and up the same pitch (1.32,5.87). The two can be mixed.
//
// After kubbs thrown in: where each kubb stood once raised. After a baton:
// the kubbs it knocked down. A position with ^ in front is where the thrower
// stood. Anything in the comment that is not a position makes it an ordinary
// comment again, so positions can never make a game invalid.
At
  = [ \t]* @Positions &([ \t,/(#] / EOL / !.)

Positions "positions (@ b6 c7)"
  = "(@" [ \t]* first:Position rest:([ \t]+ @Position)* [ \t]* ")"
    { return [first, ...rest]; }

Position "position (b6 or 1.32,5.87)"
  = from:"^"? p:(Exact / Square) &([ \t)])
    { return { text: text(), thrower: !!from, ...p }; }

Square "grid square (a1 to e8)"
  = col:[a-e]i row:[1-8]
    { return { square: col.toLowerCase() + row, ...cell(col, row) }; }

Exact "meters across and up (1.32,5.87)"
  = x:Meters "," y:Meters
    { return { square: null, x: parseFloat(x), y: parseFloat(y) }; }

Meters
  = $([0-9]+ ("." [0-9]+)?)

// ---------- characters ----------

_ "space"
  = [ \t]*

EOL "end of line"
  = "\r\n" / "\n" / "\r"
