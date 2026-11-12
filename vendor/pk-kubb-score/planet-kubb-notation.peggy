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

{{
  function count(n, dflt) { return n === null ? dflt : parseInt(n, 10); }
}}

{
  function hit(field, base, e) {
    return { text: text(), kind: 'hit', field, base: base || 0, illegalKing: !!e };
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

// ---------- characters ----------

_ "space"
  = [ \t]*

EOL "end of line"
  = "\r\n" / "\n" / "\r"
