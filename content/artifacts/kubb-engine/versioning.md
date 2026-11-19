# Versioning

The engine has one version, `major.minor.patch`, in `version.lua` (`tw.engine.version`,
the API's `engineVersion` call) and in `engine.json`; `make test` fails when they differ.
It names the whole engine: `core/`, `room/`, `session/`, `tune/` and `version.lua`.

## What each part means

- **Major**: a format change. The snapshot (`session.snapshotVersion`), an action's
  shape, or a document format a client stores or sends (the recording, the game file
  the session writes, the room's document in a way an older client cannot read) changes, so an old client cannot read what a new one writes.
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

Two clients may share an online match only when their engines' major.minor are equal
(and they load the same tune; docs/SESSION.md "Starting"). Patch versions may differ.
The room's START enforces it: it writes `match.engine` and refuses while a player's
engine differs (docs/ROOM.md "Engines in one match"), and a client joining a running
match checks with `room.mayPlay`. Records of a match should name the engine version it
was played on, so a replay knows which engine reproduces it (`replayOf` carries
`engine`).

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
