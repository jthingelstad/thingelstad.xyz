# Kubb: Throwing Wood — brief for the design session

Written 2026-11-13 for a Claude Design session. The game plays; it has no look yet. This
session gives it one. Its output goes into `docs/` as the visual spec the remaining stages
are built against.

## The game in one paragraph

A Kubb game for the Playdate. Two teams throw wooden batons to knock down the other side's
kubbs, then the king. The crank is the throwing arm: wind back, flick forward. Outcomes come
from a physics simulation at real dimensions. Today it has a two-player pass-and-play match
and a practice pitch. Still to come: a computer opponent, name entry, saved games, practice
drills and sound.

## Hard constraints

- **Screen:** 400 x 240 px, 1-bit (black and white only). Greys are dither patterns. No
  backlight: thin grey patterns wash out in dim light.
- **Input:** d-pad, A, B, and the crank. The System Menu holds three items per scene.
- **Speed:** a graphics call costs 20 to 50 microseconds on the device and a line of text
  about 0.6 ms. A frame has roughly 8 ms to draw. Static scenery is cached as an image and
  reused; anything that changes every frame should be a handful of lines, small polygons or
  a pre-drawn image. Full-screen effects are affordable only for a few frames.
- **Type:** system fonts today (Asheville 14, Roobert). A custom font is possible; it must
  read at this size in 1 bit.
- **Pieces are real 3D boxes** drawn from the physics: kubbs 7 x 7 x 15 cm, the king 9 x 9 x
  30 cm with a carved crown, batons 30 cm long. The pitch is 5 x 8 m. A far kubb can be 6 to
  12 px tall.
- **What is not a design question:** how the crank feels, the physics, and the rules. Those
  are tuned on hardware.

## Screens as they are now

Each image is a 2x capture (800 x 480) of the real 400 x 240 screen.

| Screen | Image | What is wrong with it |
| --- | --- | --- |
| Title | `brief/title.png` | A placeholder. Needs an identity: a wordmark, a picture, a menu. Also the launcher card and icon. |
| Baton aim | `brief/baton-aim.png` | Plain line drawing. Little sense of grass, depth or place. |
| Swing gauge | `brief/swing-gauge.png` | Works, but looks like a diagram. The prompt text covers the middle of the pitch. |
| Baton in flight | `brief/baton-flight.png` | Readable. The baton is small. |
| The hit | `brief/hit.png` | The best moment in the game has no punch. See "Hit effects". |
| King | `brief/king.png` | The crown reads now. Shading is flat. |
| Hand-off card | `brief/hand-off.png` | A text box. This is where the game tells players whose turn it is and what just happened. |
| Mid-turn | `brief/mid-turn.png` | Thrown batons and fallen kubbs stay on the pitch for the turn. Standing, fallen and thrown pieces need to read apart at a glance. |
| Drill aim | `brief/drill-aim.png` | Throwing a kubb: a landing marker on the ground and a power band on the gauge. The band and marker need to be obvious. |
| Drill result | `brief/drill-rest.png` | A debug readout along the top. Needs a real result callout (short, on, long). |
| Winner | `brief/winner.png` | A text box. Deserves a finish. |

Also on screen and in need of a pass: the minimap (top right), the loft and power panel
(bottom left), and the throw labels.

## What the session should decide

1. **The look.** How wood, grass, lines, stakes and shadows are drawn in 1 bit. Which dither
   patterns, how many greys, how much outline. Ground cues that give depth.
2. **The pieces.** Standing kubb, fallen kubb, king, baton, a kubb in the hand. How a base
   kubb differs from a field kubb, and one team's from the other's, if at all.
3. **The HUD.** The swing gauge, the drill band and marker, loft and power, the minimap,
   whose turn it is, batons and kubbs left. What is always shown, what appears only when
   needed, and where it sits so it never covers the target.
4. **Type and voice.** One or two fonts. Short, plain labels.
5. **Cards and flows.** Title and menu, hand-off between players, throw result, end of
   game. Later screens need at least a sketch: raising kubbs, placing a punishment kubb,
   name entry, saved games, the list of practice drills.
6. **Hit effects.** A comic-book burst ("POW", "BAM") at the point of a hit, with the hit
   sound. Short, cheap to draw, different for a clean hit, a double and the king.
7. **The crown.** The king's carving in the new style.
8. **The launcher.** Card (350 x 155), icon (32 x 32) and launch image, all 1-bit.

## What to bring back

- A style sheet: patterns, line weights, piece drawings at near, middle and far sizes.
- One mock-up per screen above at 400 x 240, pure black and white.
- The HUD layout with pixel positions.
- Hit effect frames.
- Title, card and icon art as 1-bit PNGs.
- Notes on anything that needs more than a few dozen draw calls per frame, so it can be
  checked against the frame budget before it is built.
