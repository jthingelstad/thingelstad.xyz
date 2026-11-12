---
pull:
  n: 71
  words: 'The way that Strava is to workouts, Elixir is to Clash Royale.'
title: Elixir
summary: 'A service that records Clash Royale history and serves it to players, clans, and their AI agents over MCP.'
tagline: 'Clash Royale history for players, clans, and their AI agents, with clan management built in.'
collection: Games
status: active
url: https://elixir.poapkings.com/
started: '2026-09-03'
topics:
  - agents
  - mcp
  - play
sources:
  - kind: github
    repository: jthingelstad/elixir-mcp
    role: implementation
  - kind: website
    url: https://elixir.poapkings.com/
    role: website
    sitemap: https://elixir.poapkings.com/sitemap.xml
    feed: https://elixir.poapkings.com/feed.xml
connections:
  - to: elixir-mcp-discord
    label: provides recorded facts to
    detail: The configurable Discord agent gets its game facts through Elixir MCP tools.
    source: https://github.com/jthingelstad/elixir-mcp-discord
  - to: elixir-clan
    label: includes
    detail: Clan management is a feature of the same Elixir platform and shares its recorded history, application, and runtime.
    source: https://elixir.poapkings.com/updates/2026-10-02-clan-is-part-of-elixir
  - to: poap-kings
    label: supplies clan data to
    detail: The POAP KINGS website reads clan and roster data from Elixir’s JSON API.
    source: https://poapkings.com/elixir/
story:
  color: '#8860d9'
  introduction: The game remembers the present. Elixir remembers what happened.
  engineering:
    - Independent collectors fetch public game observations from machines with allowlisted IP addresses, sharing one rate budget.
    - One recorded history serves the browser application, a remote MCP server, and a versioned JSON API.
    - Everything cloud-side is serverless, with PostgreSQL, S3, and Lambda functions in one CloudFormation stack.
    - Clan management and Ladder are features of the same platform, sharing its record and application shell.
  stack:
    - Eleventy
    - React
    - PostgreSQL
    - AWS Lambda
    - MCP
  source: https://elixir.poapkings.com/docs/architecture
  sourceLabel: Architecture
  related:
    - elixir-drop
    - elixir-mcp-discord
    - elixir-mcp-collector
    - poap-kings
  questions:
    - How does Elixir keep the history?
    - What grew out of Elixir Bot?
---

The Clash Royale API gives you a current snapshot and a short, rotating battle log of about 30 battles, and then it is gone. Elixir records observations continuously so players, clans, and their agents can ask questions about the history: battles, rosters, river races, and seasons.

Jamie built it by turning [Elixir Bot](https://github.com/jthingelstad/elixir-bot), the POAP KINGS clan agent, “upside-down.” Instead of one bot keeping its own database, the record became a service that any agent can use over MCP. He and Claude wrote the specification, then he put Claude Code in a loop. [Six hours later](https://www.thingelstad.com/2026/09/03/i-had-an-idea-to.html) there was a working system, and [Elixir MCP launched](https://elixir.poapkings.com/updates/2026-09-03-elixir-mcp-launches) on September 3, 2026. The next day the old bot’s archive was [replayed into the recorder](https://elixir.poapkings.com/updates/2026-09-04-four-months-of-history-imported), bringing battles back to mid-May.

What he did during the six hours: [“On each turn it would come back with a recommendation for what it thought was the most important thing to do, plus a secondary option. I would weigh in on what I felt the next most important thing was, then come back once it finished that loop.”](https://thingelstad.xyz/interviews/session-10/#q75) His verdict on the loop: [“It worked okay.”](https://thingelstad.xyz/interviews/session-10/#q75) What kept it at okay became a rule of his:

> That’s a principle I’ve developed for agentic software development. You can move very fast, so you need a clear idea of what you’re building. If you don’t have that, the speed means you can end up very off target very quickly, so staying diligent to the goal is really important.
>
> [Jamie, question 75](https://thingelstad.xyz/interviews/session-10/#q75)

The MCP endpoint carries its own documentation, and a feedback tool that an agent is told to use when it cannot answer a question or something does not work. [“On the other side, a coding agent watches that queue and makes whatever changes are needed to fulfill the request.”](https://thingelstad.xyz/interviews/session-9/#q70) He then built what he calls an Elixir gym, a set of tests an LLM runs against the endpoint: [“We fixed hundreds of bugs just by running that in a loop.”](https://thingelstad.xyz/interviews/session-9/#q70) The queue takes praise too, and it has had some.

> Two things surprised me. At one point Claude filed a message into the feedback queue, the agents on the other end picked it up, built it, and responded within about an hour, and Claude commented, “maintainer is fast.” I thought that was really humorous: Claude responding to how quickly what it filed got fixed. The other thing is that you can also send praise through the interface, and on a couple of occasions Claude has actually sent praise to the project for things it thinks it does really well.
>
> [Jamie, question 70](https://thingelstad.xyz/interviews/session-9/#q70)

In the browser, Elixir is the Console for a player’s own history and the [Ladder](https://elixir.poapkings.com/ladder) for exploring ladder results. Elixir Clan runs in the same application, and Elixir Drop signs its players in with Elixir. Collectors do all of the fetching, and for now Jamie runs every one of them. Elixir is free for anyone, and its [updates feed](https://elixir.poapkings.com/updates) records every user-visible change.

Elixir is also the thing Jamie named when asked about wrong turns. For a while he had pointed it at the play of the top 200 players in the game, and [“I realized that I had taken the wrong turn and turned the project into something that was no longer fun and about community”](https://thingelstad.xyz/interviews/session-1/#q3). Undoing it took days. It was not the only time: [“Elixir has gone off the rails a couple of times. The way I noticed is that it became very difficult to make changes in the code.”](https://thingelstad.xyz/interviews/session-10/#q73) The lesson he took from it:

> you really need to understand the vision of what you’re building and why you’re building it, so that you can realize, oh, this is a wrong turn, as soon as possible.
>
> [Jamie, question 3](https://thingelstad.xyz/interviews/session-1/#q3)

Where it is going, as of November 2026:

> Right now I’m transitioning Elixir to what I believe is the right landing place: the missing social layer of Clash Royale. The way that Strava is to workouts, Elixir is to Clash Royale. We’ll see how that goes, and if it works, I think it will attract other users.
>
> [Jamie, question 71](https://thingelstad.xyz/interviews/session-9/#q71)

How many users he would like: [“I would love to see a few hundred, maybe a thousand, Clash Royale players sign up and use it to keep up with what their friends are doing in Clash Royale.”](https://thingelstad.xyz/interviews/session-9/#q71)

He does not expect it to last the way the blog will: [“I’m sure 20 years from now, Elixir will be done and retired.”](https://thingelstad.xyz/interviews/session-5/#q35)
