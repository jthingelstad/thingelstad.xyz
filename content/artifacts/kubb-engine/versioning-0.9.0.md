# Versioning

The engine has one version, `major.minor.patch`, in `version.lua` (`tw.engine.version`,
the API's `engineVersion` call) and in `engine.json`; `make test` fails when they differ.
It names the whole engine: `core/`, `room/`, `session/`, `tune/` and `version.lua`.

## What each part means

- **Major**: a format change. The snapshot (`session.snapshotVersion`), an action's
  shape, or a document format a client stores or sends (the recording, the game file
  the session writes, the room's document in a way an older client cannot read) changes, so an old client cannot read what a new one writes.
  A format change an older client cannot read is a major; fields that only add, inside
  a match pinned to its major.minor, go with the minor.
- **Minor**: anything that can change a hash. Any physics, rules, tune or session change
  that alters what a seeded match does: a constant, an order of operations, a rounding,
  a new random draw. If it is not proven hash-neutral, it is a minor change.
- **Patch**: proven hash-neutral. `make golden-check` (part of `make test` and CI)
  replays the golden corpus, `tests/golden/hashes.json`, under wasmoon and every hash
  matches: comments, docs, tools, tests, refactors that give the same numbers.

A change that moves a golden hash needs a minor bump (or major) and `make golden`, which
rewrites the corpus on purpose, in the same pull request. Never run `make golden` to
make a failing check pass without bumping the version.

## Playing together

A match belongs to the engine major.minor it was started on, for its whole life: its
play, its replay, its embed, its highlight reel, a share's check and its score sheet.
Two clients share an online match only when both carry that engine (and load the same
tune; docs/SESSION.md "Starting"). Patch versions may differ.

The room enforces it: START writes `match.engine` and refuses while a player names
another engine, and a client joining a running match checks with `room.mayPlay`
(docs/ROOM.md "Engines in one match"). When clients carry several engines, the next
match runs on the room's engine, the newest that the host and every player carry
(`room.engineFor`), and a client that carries several speaks down to it so a client
that carries one agrees. Records of a match name the engine it was played on
(`replayOf` carries `engine`), so a replay knows which engine reproduces it.

## Carrying several engines

A client need not carry only one engine. The web carries every minor that kept matches
still need, each at that minor's last tag, byte for byte, and loads only the one a page
needs; the iPhone app carries what its build shipped with, and may bundle the previous
one or two so phones on different builds can play together. How a room picks between
them is the room's (docs/ROOM.md "The room's engine" and "Speaking down").

- **The principle.** A match runs, replays, renders and is checked on its own
  `match.engine`. A client that carries it uses it; one that does not says so, as
  `mayPlay` does. A kept match from an engine no client carries any more falls back to
  the newest engine, with the hash that disagrees noted, as replays always have.
- **The support window.** An engine stays in the set while a kept match may need it:
  rooms and replays are kept a year from the end of their match, so a minor stays until
  a year after the last match started on it ended, and while clients that carry only it
  are still about (an iPhone build in testers' or players' hands). Dropping a minor is a
  client's release, never the engine's.
- **What clients call only grows.** Within the window one client code base drives every
  engine it carries, so from one minor to the next the session's and the room's calls,
  their arguments and their results only gain: no call, field or value a client relies
  on is renamed, removed or changes meaning. A client feature-detects anything newer
  (a call that answers `{"error": "unknown call ..."}`, a field that is absent) and does
  without it on an older engine. The room's document grows the same way: new top-level
  keys only, which `lobbyOf` keeps, because a watcher on another engine writes its own
  seat. A change that cannot keep to this is a major version.

## What a client shows

Every client shows its own version with the engine's beside it, in one form:

    <app version> (<engine version>)        0.9.8 (0.8.1)

- The app's version comes first. The engine's full version (`engineVersion`, read from
  the vendored copy at run time, never typed a second time) is in the parentheses, and
  nothing else is.
- A client that carries several engines shows the newest it carries, the one a new
  match against the computer plays on. Where it shows detail it lists the others after
  the label ("Also plays 0.7.4").
- A platform's build number is not part of the label. Where it is shown it stands
  apart, as "build 114".
- The label is for a person reading the app and for a private feedback report. It is
  never on the room's wire or in a kept match, replay or share: those name only the
  engine the match was played on, and say nothing of which client played.

## Releases and vendoring

- A release is a tag `vX.Y.Z` on `main`, made after the pull request that sets
  `version.lua` and `engine.json` to `X.Y.Z` has merged. Tags are never moved.
- Clients (the Playdate game, the web game, the iPhone app) vendor a tagged release byte
  for byte and never edit their copy: the Playdate takes `core/`; the web and the iPhone
  take the bundle (`make bundle`: one JSON module map of every engine Lua file and its
  sha256) or the files themselves.
- Each client checks its copy against that tag's `engine.json`: a sha256 per file
  (keyed by path, `core/world.lua`) and the bundle's. A fix belongs here, then each
  client moves to the new tag.

## Release notes

- **0.9.0** (minor). Physics and the computer change what a seeded match does, so the
  golden corpus is new (13 matches, 523 action hashes, header 0.9.0). A 0.8 match
  replays differently on 0.9, and the room refuses a match between 0.8 and 0.9.

  What a player sees:
  - A kubb held up by the ground alone comes to rest only on a face, never balanced
    on an edge or a corner.
  - Batons aim lower, at a kubb's body rather than its top (`aimHeightShare` 0.5 to
    0.3), so fewer bounce off the top.
  - The computer steps up to a kubb a step away from the line (`minRange` 2.0 to
    0.25 m) and throws the low, hard point-blank baton.
  - The computer's target label names the kubb it is aiming at.
  - A kubb's spin is kept for the side's next kubb in the inkast turn, and goes when
    the turn ends, the side changes or a match starts. Arc and tilt go back to the
    plan's own at every throw.
  - Tilt, arc and spin take any value in their range, not only the steps.
  - The computer's level (beginner, club or pro) and the scene are match options.
  - The Playdate's match options have no kubb set row. Sets are a web and iPhone look.
  - A save keeps automatic raising for the rest of the match.

  For clients:
  - Sync the tag. Rooms refuse mixed minors, so the web and the iPhone carry 0.9 next
    to 0.8 for 0.8 matches.
  - Web and iPhone: draw the plan's sliders from `view.aim.controls`
    (`{ min, max, value, default, tick, step, unit, scope }`) and call `setArc`,
    `setTilt` or `setSpin` with any value. The step calls are unchanged.
  - Web and iPhone: offer Computer (from `MATCH_OPTIONS`) and a scene, and pass
    `computer` and `scene` to `setOptions` (the same call as the other options) and to
    a solo `newMatch`. In a room they are kept in the document's top-level `settings`,
    not in `options`, so a 0.8 client's lobby write keeps them: read every option, with
    defaults filled in, from the new room call `optionsOf { doc }`, not from
    `doc.options` (docs/ROOM.md difference 9). Club and day,
    the defaults, are not written, so a start without them is unchanged. A scene is an
    id of lowercase letters, digits and hyphens, up to 24 characters
    (`room/lobby.isScene`). Draw `view.scene`, and draw an unknown one as day.
  - A person's throw action now carries `plan` (`{ release, tilt }` or
    `{ release, spin }`). Send the action as `frame` returns it.
  - Playdate: a d-pad tap moves a control one tick (`plan.tune.arcTickDeg`,
    `tiltTickDeg`, `spinTick`); held, it slides a tick a frame, clamped by
    `plan.clampRelease`, `clampTilt` and `clampSpin`.
  - Playdate: keep a kubb's spin for the turn as the session does, or decide not to.
  - Playdate: show the COMPUTER row from `core/matchopts`. Give each computer
    player `opts.computer` as its level, so the game file and a resume carry it.
  - Playdate: drop its SET filter. `matchopts.apply` no longer sets `opts.set`.
  - Playdate: pass `autoRaise` (true, or nil for by hand) to `save.write`. It comes
    back from `save.unpack`, so the side file can go.
  - A client that throws the computer's batons through `autothrow.launch` now gets
    the plan's hand (`handZ`, `handFwd`, `handTip`), as the session throws them.
  - Known gap: `checkThrow` takes a forged `noseDown` on a drill released very early
    or at the sky end (docs/SESSION.md "What a server can prove").

- **0.8.2** (patch). A short baton's plan skips the carries whose answers it already
  has: the aim height's last `speedForCarry` repeated the one made for its answer, and a
  bisection whose ends are neighbouring floats (only a 32-bit float gets there) stops;
  `flight.carry` works its step's constant products out once, grouped as before. About
  10% off `plan.solve` at 1 m on the desktop. Every number `plan.solve`, `flight.handAt`
  and `flight.carry` return is the same as in 0.8.1 bit for bit, on doubles and on 32-bit
  floats: `tests/lua/planref.lua` keeps 0.8.1's plan and the identity tests compare the
  two over 431,516 cases on the desktop and under wasmoon. All 505 reference action
  hashes match 0.8.1 (the corpus keeps its 0.8.0 header).

  For clients: sync the tag; nothing else changes.

- **0.8.1** (patch). Several engines in one room (docs/ROOM.md "Engines in one match",
  "Carrying several engines" above). New room calls: `engineFor` (the room's engine:
  the newest major.minor that the host and every player carry, or null with who is
  missing it), `carried` (what a member's presence says it carries), `announce` (the
  presence a client carrying several sends: `engines`, and `engine` as the room's engine
  marked `+engines`), `speakAs` (the members as a host passes them to its START on the
  room's engine) and `compareEngines`. A client carrying several engines speaks down: it
  announces the room's engine and runs the lobby, START and the match on that engine's
  own calls, so a client carrying one (every earlier release, the iPhone's TestFlight
  build among them) agrees with it unchanged. Nothing else changes: `startCheck`,
  `startMatch`, `mayPlay` and every other call decide exactly as in 0.8.0, `constants`
  is unchanged, and all 505 reference action hashes match 0.8.0 (the corpus keeps its
  0.8.0 header).

  For clients: sync the tag. A client that carries one engine need do nothing; one that
  carries several uses the new calls from its newest engine (they are not in 0.8.0 or
  earlier) and every other call from the engine the room or the match runs on.

- **0.8.0** (minor). A person's baton planned under 2 m (`flight.tune.nearM`, the
  stance to the circle) is now a low, firm bowl: the hand lower and ahead of the feet,
  the baton tipped toward the kubb, the loft flatter, the aim into the kubb's face, an
  arrival turn that comes in flat or end over end rather than end down, and a swing past
  the power target heaving the baton up over the kubb (docs/notes/throw.md "The hand at
  a short throw"). What did not change: every throw planned at 2 m and over, every
  computer throw (the computer never stands nearer than 2 m) and every drilled kubb are
  bit-identical to 0.7.4, and all 437 reference action hashes match it. It is a minor
  version all the same: the action's format is unchanged, and the hand is worked out
  from the action's stance and circle, so a 0.7 client applying a 0.8 player's short
  baton throws it from the feet and falls out of step from that throw on. What it costs:
  the web and the iPhone move to 0.8 together (the room already refuses a match between
  0.7 and 0.8, docs/ROOM.md), and a kept 0.7 match with a person's baton under 2 m
  replays differently on 0.8 from that throw on. The golden corpus gains a thirteenth
  match that throws such batons (docs/DETERMINISM.md "The gate"); its header is 0.8.0.
  `checkThrow` (a server's `checkThrows`) holds a short baton's loft to what
  `plan.launch` gives it, the share and the heave included.

  For clients: sync the tag; no action, snapshot, document or recording format changes,
  and no session call or field is added. `flight.handAt(d)` (new in the core) returns
  five values: the hand's height, how far ahead of the feet it lets go, the share of the
  loft kept, the short throw's share s and the tip; `plan.solve`'s result gains
  `handZ`, `handFwd`, `loftShare`, `handTip` and `nearShare` for a baton. The aim arc
  (`aim.arc`) already starts at the hand and ends where the throw meets the aim; it is
  the planned arc, so it neither tips nor shows a live swing's overpower. A client
  whose own test pins the corpus at twelve matches (the iPhone's `GoldenTests`) needs
  thirteen.

- **0.7.4** (patch). The short words of a resignation (`need.short`, `last.short`) are `"RESIGNED"`: the ruling begins with the team's name
  (`"Riverside resigned: Oak wins"`), so no rule matched and the words were cut to 12
  characters (`"RIVERSIDE RE"`). Words no rule knows are now cut at a word.
  `setClient` returns `{ client, location }` with `location` always the game file's
  Location line (`"Playdate"` when none is given); the web and the iPhone app pass
  `location = "throwingwood.com"`. The location reaches the live sheet, the over card's
  file and a replay's, and is in no snapshot, document or hash. Output only: no throw,
  action, snapshot, document or file format changes, and all 437 reference action
  hashes match 0.7.3.

- **0.7.3** (patch). A server checking a shared match in one pass (`replayLoad` with
  `document`) no longer measures the whole room document on every action. The log
  budget's measure, the document's size counted as the room counts it, is now worked out
  as the size with an empty log plus each entry's size, kept once measured, plus the
  commas between them (`lobby.docSize`), which is the same number exactly: every piece of
  the text starts and ends on an ASCII character. The cost of `document` had grown with
  the square of the match's length (a 400-action match took several times as long as
  the replay without it). No throw and no document changes: the log is dropped at the
  same action as before, live play and the room's `commitAction` call measure as they
  did, and all 437 reference action hashes match 0.7.2.

- **0.7.2** (patch). What a server needs to check and publish a shared match against
  the computer (docs/SESSION.md "What a server can prove"): `replayLoad` options
  `checkCpu` (the computer's throws made again from the snapshot; `forged`, `forgedAt`),
  `checkThrows` (a person's throws held to bounds worked out from the code;
  `outOfBounds`, `outOfBoundsAt`) and `document`, with `replayFinish`,
  `replayDocument`, `refusedAt` and standing counts per step; `checkThrow`,
  `checkStart` and `renameStart`. Rulings carry codes beside their words. The wide view
  also un-turns a recording's landing, rest and first hit. `setClient` takes a
  `location` for the game file's Location line (default `"Playdate"`, as before).
  Snapshots, actions and recordings keep their shape (fields only added). All 437
  reference action hashes match 0.7.1.

- **0.7.1** (patch). The game file writes fewer player names: no prefix on a throw by a
  one-player team, and the player's initial (or the shortest start that tells two apart)
  on a team of more, with `[Team X Players]` and `[Throw Levels]` naming the same ids.
  Only the rendered file changes; game state, snapshots and saved history keep the full
  ids, and older files still read. All 437 reference action hashes match 0.7.0.

- **0.7.0**. Retires the straight-through practice input and its three exercises. The crank, pointer dial and touch pendulum follow the 0.5.1 throw model.

- **0.6.0**. A straight-through input and three practice exercises. Existing match actions retain their physics and wire format.

- **0.5.1** (patch). A compact practice checkpoint replays the reported throw,
  including accumulated wood and its surface. All 437 reference action hashes match 0.5.0.

- **0.5.0**. Baton rotation follows the thrower’s level. Skilled computer players add
  drill spin. Slow contact wakes resting pieces. These changes alter match hashes.

- **0.4.1** (patch). Optional dial band crossings, contact strengths and baton ground
  landings for presentation. The 453 reference action hashes and wire formats are unchanged.
- **0.4.0** (minor, additive input API). A touch pendulum feeds the existing swing at
  120 Hz. Human throw actions, recordings and crank traces can carry optional tuning
  metadata. Existing actions and snapshots remain readable. As with 0.3.0, the new
  engine capability gets a minor version. All 453 reference action hashes are unchanged.
- **0.3.0** (minor: a new API, hash-neutral). The room (`room/`, docs/ROOM.md): the web's
  online-play logic (`src/net/lobby.js`, `seats.js`, `sync.js`) in Lua behind
  `kubbCall("room.<name>")`, proven equal to the JavaScript by recorded vectors; START
  stamps `match.engine` and refuses a different engine. `json.decode(text, true)` keeps
  nulls and empty objects (the plain decode is unchanged). A snapshot restored while
  raising, placing a punishment kubb or after the end now shows the match's pitch, in the
  frame a live session shows it in, instead of the practice layout (display only). Every golden hash is
  unchanged.
- **0.2.0**: the engine extracted from playdate-kubb and the web's session.
