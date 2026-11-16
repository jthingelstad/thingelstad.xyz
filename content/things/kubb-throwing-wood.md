---
title: 'Kubb: Throwing Wood'
summary: 'A game of Kubb for the Playdate, thrown with the crank. Jamie began it in November 2026. It is not released; a test build is out for friends to try.'
collection: Games
status: active
url: null
started: '2026-11-13'
topics:
  - play
  - agents
sources:
  - kind: website
    url: https://playdate.thingelstad.xyz/throwing-wood/
    role: distribution
connections:
  - to: planet-kubb-score
    label: writes its games in
    detail: Every finished match is saved as a game file in Planet Kubb Notation, the system Jamie began on Planet Kubb in 2012.
    source: https://thingelstad.xyz/things/planet-kubb-score/
face: the-hit.png
bundles:
  - id: release-candidate
    title: '0.9.5, the release candidate'
    caption: The build that went up on November 15, 2026 for anyone to sideload, two days after the first line of code, as the game’s Simulator tests drew it at twice the Playdate’s size, with twenty-six seconds of it in play, filmed frame by frame from the same tests. The names on the teams and players are the tests’ own.
  - id: real-games
    title: Tuned against real games
    caption: The counts behind the computer’s throwing, from November 16, 2026. Each sets 150 recorded tournament games beside 150 matches the game played against itself with its full physics, both read from their game files and counted the same way.
  - id: the-throw
    title: The throw
    caption: One baton from wind-up to wood, on the practice pitch, as the Playdate Simulator drew it on November 13, 2026, the first day of building.
  - id: a-match
    title: A match
    caption: Two teams passing one Playdate, from the same day, and the first match played on the real thing.
  - id: the-brief
    title: The brief
    caption: What a design session was asked on November 13, 2026, with the game playing and no look yet, and five more screens from that day’s build to set beside the ones above.
  - id: woodcut
    title: 'The look: Woodcut'
    caption: The look the design session settled the same day, three tones, hard shadows and a white pitch. Jamie approved it that day, and the game is drawn in it now. The boards set their words in two web fonts that stand in, Londrina Solid and Space Grotesk; the game is to draw its own 1-bit fonts.
  - id: woodcut-screens
    title: Screens in the new look
    caption: The screens from the brief drawn again in Woodcut, at twice the Playdate’s size. They are mock-ups, not captures. ASH and BIRCH stand in for team names, which the game cannot take yet.
  - id: later-screens
    title: Later screens, sketched
    caption: Parts of the game that were not built yet, sketched in the same session so the look was ready for them. The games, names and scores on them are made up.
  - id: launcher
    title: Launcher
    caption: How the game is to look on the Playdate’s home screen.
artifacts:
  - file: rc-title.png
    bundle: release-candidate
    title: The title
    caption: VS PLAYDATE, PASS + PLAY, PRACTICE and PLAYERS, and a line for anyone new pointing at HOW TO PLAY.
    date: '2026-11-15'
  - file: gameplay.gif
    bundle: release-candidate
    title: Two dozen seconds of play
    caption: 'In order: the title, the first card of HOW TO PLAY, the hand-off before a match, a baton wound up on the crank and stopped at 3 o’clock for TOK!, two field kubbs taken with one baton for KLAK!, a drilled kubb with a tap of spin rolling to rest by its circle, a shot at the king, and the winner card.'
    date: '2026-11-15'
  - file: rc-how-to-play.png
    bundle: release-candidate
    title: HOW TO PLAY
    caption: The first of six cards on the rules for someone who has never played, from the pitch to the king. The last one leads into HOW TO THROW.
    date: '2026-11-15'
  - file: rc-how-to-throw.png
    bundle: release-candidate
    title: HOW TO THROW
    caption: 'The second of eight steps, played on the practice pitch with the real crank: the circle already sits on a kubb, so wind back into the left mark, flick, and stop at 3.'
    date: '2026-11-15'
  - file: rc-aim.png
    bundle: release-candidate
    title: The crank as a clock
    caption: The dial bottom right is the crank. The marks on it are this throw’s targets, the backswing on the left and the stop on the right, and they move when the circle or the thrower does.
    date: '2026-11-15'
  - file: rc-plan-view.png
    bundle: release-candidate
    title: Planning with B
    caption: While B is held the camera swings out over the thrower’s shoulder to show the arc, and the d-pad changes it. Let go and it swings back.
    date: '2026-11-15'
  - file: rc-verdicts.png
    bundle: release-candidate
    title: The verdicts
    caption: 'After a throw, a word each for the power, the release and the steadiness of the flick: ON, ON, STEADY, and one base kubb down.'
    date: '2026-11-15'
  - file: rc-two-at-once.png
    bundle: release-candidate
    title: Two at once
    caption: KLAK! as one baton takes two field kubbs standing side by side.
    date: '2026-11-15'
  - file: rc-drill.png
    bundle: release-candidate
    title: A drilled kubb
    caption: Kubbs are thrown back in nose down and spinning, the way drillers throw them. This one came to rest 12 centimeters from its circle.
    date: '2026-11-15'
  - file: rc-playdate-turn.png
    bundle: release-candidate
    title: The Playdate’s turn
    caption: In VS PLAYDATE the computer throws the same way a player does, and its arm swings on the dial while WATCH is up.
    date: '2026-11-15'
  - file: rc-wind.png
    bundle: release-candidate
    title: Wind
    caption: An arrow on the minimap and its speed in meters a second. Wind pushes batons and kubbs while they are in the air.
    date: '2026-11-15'
  - file: rc-kubb-set.png
    bundle: release-candidate
    title: A painted set
    caption: The USA set up close. Only the heads and the king’s crown are painted, so a far kubb reads the same in any set.
    date: '2026-11-15'
  - file: rc-practice.png
    bundle: release-candidate
    title: Practice
    caption: Seven drills, from 8 METERS to THE WALL, each with its best, its last ten runs and its hit rate, for whoever is practising.
    date: '2026-11-15'
  - file: rc-teams.png
    bundle: release-candidate
    title: Teams
    caption: Up to six a side, from saved players or guests, and the order they throw in.
    date: '2026-11-15'
  - file: rc-player.png
    bundle: release-candidate
    title: A player
    caption: Each saved player keeps a Throw level, Beginner, Club or Pro, and their own games and drill bests.
    date: '2026-11-15'
  - file: rc-hand-off.png
    bundle: release-candidate
    title: The hand-off
    caption: Who takes the Playdate next, what the other team just took, and the kubbs to throw in before six batons.
    date: '2026-11-15'
  - file: rc-winner.png
    bundle: release-candidate
    title: The Playdate wins
    caption: The end of a test match against the computer, fifteen turns long. Every finished game is saved as a score sheet.
    date: '2026-11-15'
  - file: real-games-before.txt
    bundle: real-games
    title: The first count
    caption: Before anything was changed. With a field kubb standing, tournament players took two with one baton 16.0 percent of the time and three or more 10.0 percent; the computer 6.8 and 0.4. Its games ran 21.9 turns to their 8.9, and it toppled the king with 46 percent of its shots to their 84.
    date: '2026-11-16'
  - file: real-games-after.txt
    bundle: real-games
    title: The count after the tight groups
    caption: The same 150 recorded games beside 150 new matches, once the computer drilled its kubbs beside one another and threw down the line of them. Two with one baton 18.4 percent, three or more 3.4, the field cleared in 69.6 percent of turns where it had been 46, and 14.6 turns a game. Kubbs thrown a second time are still 0.4 percent to the tournaments’ 14.1.
    date: '2026-11-16'
  - file: wind-up.png
    bundle: the-throw
    title: The wind-up
    caption: The crank turned back past the bottom of its turn. The dial shows the arm, the dark arc is the backswing, and the five kubbs on the far baseline wait.
    date: '2026-11-13'
  - file: baton-in-flight.png
    bundle: the-throw
    title: A baton in flight
    caption: Thrown at full power with 35 degrees of loft. The camera follows the baton down the pitch, and the small map in the corner shows the whole of it.
    date: '2026-11-13'
  - file: the-hit.png
    bundle: the-throw
    title: The hit
    caption: A baton coming off a base kubb, which has started to tip. The game slows down around a hit so it can be watched.
    date: '2026-11-13'
  - file: three-kubbs.png
    bundle: the-throw
    title: Three kubbs and one baton
    caption: A low baton into three field kubbs standing together. Every piece is a solid body, so what falls is worked out, not chosen.
    date: '2026-11-13'
  - file: hand-off.png
    bundle: a-match
    title: The hand-off
    caption: The card between turns. Team A opens with two batons, Team B answers with four, and every turn after that has six.
    date: '2026-11-13'
  - file: team-b-view.png
    bundle: a-match
    title: Team B’s turn
    caption: The pitch turned around for the other team, with one kubb to toss back before the batons. Whoever is throwing always throws up the screen.
    date: '2026-11-13'
  - file: mid-turn.png
    bundle: a-match
    title: Mid-turn
    caption: Team A’s second baton of six. The field kubb the first baton knocked down, and that baton, stay where they fell until the turn is over.
    date: '2026-11-13'
  - file: winner.png
    bundle: a-match
    title: The king is down
    caption: The end of a match the game played against itself as a test, five turns long.
    date: '2026-11-13'
  - file: first-match.txt
    bundle: a-match
    title: The first match
    caption: The game file from the first match played on a Playdate, on November 13, 2026, in Planet Kubb Notation. Six turns in seven minutes, and it ended when Team B resigned.
    date: '2026-11-13'
  - file: design-brief.md
    bundle: the-brief
    title: The design brief
    caption: 'Written for the design session: the game in one paragraph, the Playdate’s limits (400 by 240 pixels, black and white, about 8 milliseconds to draw a frame), what was wrong with each screen, and what to bring back. It names eleven captures of the game as it was; the ones not already shown above are in this bundle.'
    date: '2026-11-13'
  - file: before-title.png
    bundle: the-brief
    title: The title, before
    caption: The name in the system font, a two-line menu of Match and Practice pitch, and a rectangle, a circle and a triangle holding places. The brief called it a placeholder.
    date: '2026-11-13'
  - file: before-aim.png
    bundle: the-brief
    title: Aiming, before
    caption: Five base kubbs on the far baseline, the swing dial in the middle of the pitch with its prompt over it, and the loft at 35 degrees.
    date: '2026-11-13'
  - file: before-king.png
    bundle: the-brief
    title: The king, before
    caption: A baton gone past the king at 27 percent. The crown reads, and the shading is one flat pattern.
    date: '2026-11-13'
  - file: before-drill-aim.png
    bundle: the-brief
    title: Throwing a kubb, before
    caption: 'Aiming a kubb back across the pitch: a landing marker on the grass, a grey power band on the dial, and a note in the corner that the cut curls right.'
    date: '2026-11-13'
  - file: before-drill-result.png
    bundle: the-brief
    title: Where it landed, before
    caption: A thrown kubb at rest beside its marker, ON at 59 percent, under a line of debugging numbers across the top of the screen.
    date: '2026-11-13'
  - file: woodcut-style-sheet.png
    bundle: woodcut
    title: The style sheet
    caption: White is live wood, grey is wood that is down, and black is outline, shadow and anything spent. Kubbs, the king and batons at near, middle and far sizes, the line weights, grass tufts and stakes, and the rules for type and labels.
    date: '2026-11-13'
  - file: woodcut-hud.png
    bundle: woodcut
    title: The HUD layout
    caption: A black rail along the top, three plaques along the bottom and nothing in the middle, with the place of each piece in screen pixels. The minimap sits bottom left and the swing gauge bottom right, beside the crank.
    date: '2026-11-13'
  - file: woodcut-hit-effects.png
    bundle: woodcut
    title: Hit effects
    caption: 'Flash, burst and break-up for each kind of hit: TOK! for one kubb, KLAK and KLAK! for two with one baton, and KING!, where the whole screen inverts for the flash and the burst wears a crown.'
    date: '2026-11-13'
  - file: woodcut-spec.md
    bundle: woodcut
    title: The written spec
    caption: 'The look in words, to build from: the tones, line weights and pieces, every HUD position, the frames of each hit, the type, the drawing budget for each frame, the launcher, and the details still open. The SVG sources it mentions are not published here. Taken out: one sentence quoting Jamie’s approval.'
    date: '2026-11-13'
  - file: woodcut-title.png
    bundle: woodcut-screens
    title: The title
    caption: The KUBB wordmark, its last B knocked over by a baton, above THROWING WOOD on a strip of grass. VS PLAYDATE and GAMES on the menu were for a computer opponent and saved games, which were still to come that day.
    date: '2026-11-13'
  - file: woodcut-aim.png
    bundle: woodcut-screens
    title: Aiming
    caption: The king on the centerline, five base kubbs on the far baseline, the rough past the lines, and WIND BACK over the gauge. Pips on the rail count the batons.
    date: '2026-11-13'
  - file: woodcut-flick.png
    bundle: woodcut-screens
    title: The flick
    caption: The same view with the arm wound back, and the flag turned black for FLICK!
    date: '2026-11-13'
  - file: woodcut-flight.png
    bundle: woodcut-screens
    title: In flight
    caption: A baton in the air, white with two black bands and three speed lines behind it, thrown at full power.
    date: '2026-11-13'
  - file: woodcut-hit.png
    bundle: woodcut-screens
    title: The hit
    caption: TOK! as a baton tips a base kubb, with chips flying off the burst.
    date: '2026-11-13'
  - file: woodcut-king.png
    bundle: woodcut-screens
    title: The king
    caption: A baton gone past at 27 percent, and the flag says KING STANDS. The crown has four points, a black collar, a ring and one diamond.
    date: '2026-11-13'
  - file: woodcut-mid-turn.png
    bundle: woodcut-screens
    title: Mid-turn
    caption: Two field kubbs standing, one grey and down, and two black batons already thrown, so what is left to hit reads at a glance.
    date: '2026-11-13'
  - file: woodcut-drill-aim.png
    bundle: woodcut-screens
    title: Throwing a kubb
    caption: The kubb in the hand at the bottom, the landing marker out on the pitch, the grey band on the gauge, and CUT RIGHT while a button is held.
    date: '2026-11-13'
  - file: woodcut-drill-result.png
    bundle: woodcut-screens
    title: Where it landed
    caption: 'The callout after a thrown kubb stops: ON, 17 centimeters from the mark, between SHORT and LONG.'
    date: '2026-11-13'
  - file: woodcut-hand-off.png
    bundle: woodcut-screens
    title: The hand-off
    caption: PASS THE PLAYDATE TO BIRCH, what ASH just took, and what BIRCH throws next, three kubbs in and then six batons, beside a map of the pitch.
    date: '2026-11-13'
  - file: woodcut-winner.png
    bundle: woodcut-screens
    title: The winner
    caption: ASH WINS, with the turns, the minutes and the hit rate, and a broken king in a burst. Its SAVED TO GAMES line was for saved games, which were still to come that day.
    date: '2026-11-13'
  - file: sketch-raising.png
    bundle: later-screens
    title: Raising a kubb
    caption: Choosing which end of a fallen field kubb to lift, and where it will stand.
    date: '2026-11-13'
  - file: sketch-punishment-kubb.png
    bundle: later-screens
    title: The punishment kubb
    caption: Placing a kubb from above, with grey circles around the stakes where it may not go.
    date: '2026-11-13'
  - file: sketch-names.png
    bundle: later-screens
    title: Naming the teams
    caption: A team’s name, up to ten letters, typed on the Playdate’s own keyboard, and the id it will have in the game file.
    date: '2026-11-13'
  - file: sketch-games.png
    bundle: later-screens
    title: Saved games
    caption: Finished games in a list, with who won, how many turns and how long, and a scoresheet a button away.
    date: '2026-11-13'
  - file: sketch-drills.png
    bundle: later-screens
    title: Practice drills
    caption: Five drills, 8 METERS first, with the best score, the last ten runs and the hit rate.
    date: '2026-11-13'
  - file: woodcut-launcher.png
    bundle: launcher
    title: Card, icon and launch image
    caption: The card at 350 by 155 with the title’s wordmark, whose last B tips over while the card is highlighted; the 32 by 32 icon, the king alone; and the launch image, the title without its menu. All pure black and white.
    date: '2026-11-13'
---

Kubb: Throwing Wood is a game of [Kubb](/things/planet-kubb/) for the [Playdate](https://play.date/), the small yellow handheld with a crank on its side. The crank is the throwing arm, read as a clock. Pulled back up the left side it sets the power, about 4 meters at 9 o’clock and 8 at 10; swung forward, where it stops sets the arc, 3 o’clock for a base kubb and half past 3 for the king. The d-pad moves a target circle over the far half, A and the d-pad walk the thrower, and B plans the arc and a baton’s tilt or a drilled kubb’s spin. A player who never touches A or B can just point and throw.

The pitch is five meters by eight, drawn in the Playdate’s black and white from behind the thrower. Batons, kubbs, the king and the six corner and midline stakes are solid bodies, so a baton tumbles, skids, glances off a stake, and knocks a kubb into its neighbour. A baton thrown side-on is a helicopter, and it does not count.

A match is played to the U.S. Championship rules with a 2-4-6 opening: kubbs tossed back in, field kubbs before base kubbs, the advantage line, and the king last. It is played against the Playdate, which throws the same way and shows its swing on the clock, or by two teams of one to six passing one Playdate. Saved players each keep a Throw level (Beginner, Club or Pro) and a history, and Practice has seven drills, from 8 METERS to THE WALL. Each finished match is saved as a game file in [Planet Kubb Notation](/things/planet-kubb-score/).

Jamie began it on November 13, 2026. Claude writes the code, in Lua, and Jamie plays each build on his Playdate and says what is wrong with it. On November 14 a first test build went out for friends to sideload, from [its page on playdate.thingelstad.xyz](https://playdate.thingelstad.xyz/throwing-wood/), and after a play test the next day the throw was rebuilt as the clock. Version 0.9.5, also on November 15, is the release candidate for 1.0.0, with HOW TO PLAY and HOW TO THROW to teach a new player. It is not released.

The computer’s throwing is tuned against real play. The 150 games recorded in [Planet Kubb Notation](/things/planet-kubb-score/) were all played at tournaments, many of them late in a bracket, so they show what club players and better do with a baton. A tool in the game’s repository reads those game files and 150 matches the game plays against itself, and counts both the same way: how often a baton misses, takes one field kubb, two, or three and more, how often a turn clears the field, and how often the king falls.

The [first count](#artifact-real-games-before.txt), on November 16, 2026, showed where the game and the tournaments parted. With a field kubb standing, tournament players took two or more with one baton 26 times in 100; the computer 7, and its games ran 22 turns to their 9. A steadier arm did not close the gap. The cause was in how it threw its kubbs back in: every one was drilled at the same mark, came down on the kubb already lying there and skipped about a meter off, so its field kubbs stood 39 centimeters apart on average. A baton takes two kubbs when they stand close, one behind the other. So the computer now drills each kubb into the clear spot beside the last, in a line along the throw, and aims its batons down the line with the most kubbs in it. In [the count after](#artifact-real-games-after.txt) it takes two or more 22 times in 100, clears the field in 70 turns of 100 where it had cleared 46, and a game runs about 15 turns. Three with one baton is still rare for it, 3 in 100 to the tournaments’ 10, and it almost never has to throw a kubb a second time, which tournament players do with one kubb in seven. Both are written down as what to work on next. The same throwing is in [the game on the web](/things/kubb-throwing-wood-web/).

On the first day, a design session gave it a look called [Woodcut](#artifacts-woodcut): three tones, hard shadows and a white pitch, with TOK, KLAK and KING bursting off the wood. Jamie approved it, and the game’s title, cards, launcher and pitch are drawn in it now.
