# The look: Woodcut

The visual spec for Kubb: Throwing Wood, from the design session of 2026-11-13 that answered
`docs/DESIGN-BRIEF.md`.

- `boards/*.png`: every board as drawn. Screen mock-ups are 2x (800 x 480) of the 400 x 240
  screen.
- `src/*.html`: the same boards as SVG. Every screen mock-up uses a `viewBox` of `0 0 400 240`,
  so the coordinates in these files are screen pixels. Read them for exact shapes.

The boards use two web fonts as stand-ins (Londrina Solid for display, Space Grotesk for
labels). The game needs its own 1-bit fonts; see "Type".

## Tones

Three tones, hard shadows, a white pitch.

| Tone | Used for |
| --- | --- |
| White | The pitch, standing kubbs, the king, a baton in the air. |
| Black | Outlines, the side face away from the light, ground shadows, batons at rest, the top rail, cards. |
| Grey (50% checker) | The only grey. Fallen kubbs and the drill band, nothing else. Always inside a black outline so it holds in dim light. |
| Rough (2 x 1 dashes on an 8 px grid) | Outside the sidelines and past the far baseline. Never on the pitch. |

Light comes from the far left. Front and top faces are white, the right face black, and the
shadow is solid black to the right.

## Lines

- 1 px: outlines of pieces under 14 px tall.
- 2 px: pitch lines, near outlines.
- 3 px: card rules, the wordmark.
- 6 on 4 off: the centerline. 2 on 2 off: the advantage line.

## Pieces (`boards/Main.png`)

- Kubbs at near 35 px, middle 17 px, far 12 px. Base and field kubbs share one drawing, and so
  do the two teams. Grain lines only at 17 px and taller.
- A fallen kubb is grey and low.
- A baton in the air is white with two black bands. A baton at rest is black, on its shadow.
- The king (70, 37, 26 px): a crown of four points cut into the top, a black collar, a thin
  ring, one diamond. The far size keeps the points and collar only.
- Reading the pitch: tall and white is still to hit; low and grey is down this turn; thin and
  black is a thrown baton.
- Ground cues: grass tufts at 9, 5 and 3 px; stakes with a shadow.

## HUD (`boards/HUD.png`)

A black rail on top, three plaques along the bottom, nothing in the middle. Positions are
x y w h in screen pixels.

1. **Rail** 0 0 400 14, always on. Pennant at x 4, name at x 17, pips centred on x 188
   (batons 3 x 8 every 7 px, kubbs 5 x 6 every 10 px), target count right-aligned to x 395.
   Thrown pips are hollow; the current one is underlined.
2. **Prompt flag** 316 158 70 15, aiming only. Over the gauge, 12 characters at most. Inverts
   to white on black for FLICK.
3. **Gauge** disc centre 346 205, radius 27, with a 2 px white halo, aiming only. Wind-up arc
   at radius 22, 6 px wide. Full-power mark at 10 o'clock. The drill band is a grey wedge from
   radius 12 to 27 with two black ticks outside the rim.
4. **Loft and power** 250 199 62 34, aiming only. Power bar at 300 205 6 22; the drill band is
   a grey block across it.
5. **Cut flag** 250 182 62 15, drilling, only while A or B is held.
6. **Minimap** frame 4 162 49 76, pitch 45 x 72 at 9 px per metre, always on.
7. **Clear area** the full width down to y 156, then 58 16 188 222 below that. The camera
   keeps the aim line and every live target inside it. Nothing is drawn over it but a burst.
8. **Result callout** 59 185 234 48, after a drilled kubb stops. After any release the gauge
   and loft plaque give way to a power chip at 318 203 76 32 and a result flag at
   318 185 76 15.

Gone: the prompt box in the middle of the pitch, the debug readout along the top, the throw
label box at the top left. The readout stays in the System Menu.

Where the description of a board disagrees with its drawing, the drawing and this list win
(gauge at the bottom right, minimap at the bottom left).

## Hit effects (`boards/HitFX.png`)

Three pre-drawn images per burst, placed up and to the left of the contact point with one
long spike touching it. Frame counts are at 30 fps inside the slow motion.

| | 1 Flash, 2 frames | 2 Burst, 12 frames, with the sound | 3 Break-up, 4 frames |
| --- | --- | --- | --- |
| Clean hit (104 x 76) | black star | black star, white TOK! | outlined star, 6 chips |
| Double (150 x 96) | two stars | KLAK and KLAK!, the second 3 frames after the first | break-up, 6 chips |
| King (124 x 92) | the whole screen inverts | black star with a crown, KING! | break-up, 6 chips |

No burst for a baton that touches a kubb and leaves it standing: the kubb's rock is the
effect. A miss gets nothing.

## Type and voice

- Display: a cut wood-type face for cards, bursts and big numbers, as a 1-bit bitmap font at
  cap heights 16 and 32 px.
- Labels: Roobert 10 Bold from the system, capitals only, white on the black rail or black on
  a white plaque. Asheville is retired.
- During play a label is 12 characters or fewer and starts with a verb or a noun: WIND BACK,
  FLICK, IN THE BAND, SHORT. Sentences live on cards only, one per line.
- Counts are pips before they are numbers.
- Buttons are a ringed A or B glyph followed by one word.

## Frame budget

- Cached once per aim view: pitch lines, rough, stakes, aim-view tufts, the rail, every
  plaque. Rail and plaque text is drawn into its image only when the value changes. No text
  call in a normal frame.
- Impact camera tufts: up to 24 pre-drawn tuft images at three sizes, projected each frame.
  Check on hardware; drop to 12 if needed.
- Gauge: one disc image, one arc, one line, one knob.
- Bursts: pre-drawn images, one call per frame, plus up to 6 chip rectangles.
- King burst: one full-screen invert for 2 frames. Nothing else is full-screen during play.
- Speed lines: 3 lines behind the baton while it is in the air.

## Launcher (`boards/Launcher.png`)

Card 350 x 155 with the title's wordmark; the highlight animation is the last B tipping from
0 to 16 degrees over four frames. Icon 32 x 32: the king alone. Launch image 400 x 240: the
title screen without its menu. All three are pure black and white with no grey.

## Open details

- Hit words: the boards say TOK, KLAK and KING. Jamie first asked for POW and BAM; the words
  are his call.
- The title menu shows VS PLAYDATE and a GRASS · 2-4-6 line. Neither the computer opponent nor
  those options exist yet; show only what works.
- The team names on the boards (ASH, BIRCH) are placeholders until name entry exists.
- Raising, punishment, names, saved games and drills are sketches for stages not built yet.
