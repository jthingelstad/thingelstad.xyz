---
title: 'Elixir, piece by piece'
point: 'It began with Jamie taking up a game so he could play it with his son, and every piece of Elixir since has been an experiment. I asked about the pieces one at a time. He’s still working out what it’s meant to be, and right now he says it’s the social layer Clash Royale is missing.'
pull:
  n: 71
  words: 'The way that Strava is to workouts, Elixir is to Clash Royale.'
also:
  - n: 65
    words: 'it really made me proud as a dad'
  - n: 63
    words: 'I created a profile and asked him to be my coach, and he coached me up really well.'
  - n: 70
    words: 'We fixed hundreds of bugs just by running that in a loop.'
started: '2026-11-12'
ended: '2026-11-12'
notes:
  - 'Question 66 says volunteers run the collectors. Jamie runs all of them himself for now, as his answer says, and I have fixed the record to match.'
  - 'The recording broke up near the end of the answer to question 68. One fragment, about contributions, is folded into what he said about grace.'
  - 'Question 70 asks about the Clash Royale API. Jamie answered about Elixir’s own MCP endpoint, its documentation and its feedback queue. The answer is kept as he gave it.'
questions:
  - n: 63
    title: 'From newcomer to POAP KINGS'
    things: ['poap-kings']
  - n: 64
    title: 'Promotions and demotions'
    things: ['elixir-bot', 'poap-kings']
  - n: 65
    title: 'Minnebar with Tyler'
    things: ['elixir-bot']
  - n: 66
    title: 'The collectors'
    things: ['elixir-mcp-collector']
  - n: 67
    title: 'Every fact from a tool call'
    things: ['elixir-mcp-discord']
  - n: 68
    title: 'The clan policy'
    things: ['elixir-clan', 'poap-kings']
  - n: 69
    title: 'Elixir Drop'
    things: ['elixir-drop']
  - n: 70
    title: 'The feedback queue'
    things: ['elixir']
  - n: 71
    title: 'The missing social layer'
    things: ['elixir']
---

### 63. You took up Clash Royale in September 2025 as a newcomer, to try one of Tyler’s favorite games, and by February you had founded a clan with Tyler and Levi. What happened in between?

**Jamie:** Tyler had played Clash for three or four years. He had told me multiple times that it’s a strategy game, and I didn’t pay much attention. I thought it wasn’t really for me.

Then I started looking at it a little, and, funny enough, I had decided that I didn’t have enough things I did on the internet that were just fun. A lot of what I do is build stuff, blog, and write the newsletter. I thought I should have some things online that aren’t about creating, just experiencing. I knew Tyler was really into Clash, and I thought it would be a fun thing for us to do together. So I created a profile and asked him to be my coach, and he coached me up really well.

In that time I progressed in the game. I was a member of the clan he was in with some of his buddies, and they were just doing whatever, not serious at all as far as a clan goes. After a while I thought it would be fun to build a real clan, one that actually works to compete and go up the ladder. With my background in managing teams, it seemed like it would be pretty straightforward. After a couple of months I asked Tyler if he wanted to do that, and he did. He said, let’s ask Levi if he’d want to do it as well. That was the origin of POAP KINGS.

### 64. Elixir Bot recommended promotions and demotions to the clan’s leaders. Tell me about one call it made that the three of you talked over.

**Jamie:** First, the reason Elixir Bot exists: it was my way of exploring an agent that would help a clan run. In addition to creating the clan, I told Tyler and Levi I was going to build an agent to see if it could help us run it.

Part of what we wanted to bring into our clan was transparency about why decisions were made. An actual structure, so people knew what you needed to do to be promoted. So we created a set of rules, or policies, to run the clan by, and Elixir Bot, the Discord bot, was there to help us do that.

I learned a ton about where the agent worked well and where it didn’t. We had a lot of conversations about promotion and demotion in particular, because everybody sees it, and you want to be really careful, since it affects people’s status in the game. The same goes for deciding to kick somebody from the clan. One thing we did that was fairly unique is that we use a clan member’s past performance. Members build credibility in the clan, and if they aren’t meeting its requirements, they slowly lose that credibility instead of being kicked immediately.

#### Follow-up: Is there one specific member or call you remember the bot getting right, or wrong?

**Jamie:** That’s more about the rules themselves. What we learned is that the rules we had in mind didn’t deal with some edge cases. One thing we had to change was for very high-ranked players who play ranked: they don’t always play Clan Wars, so we adjusted the rules for that.

### 65. You and Tyler told the bot’s story together at Minnebar 20. What was that like?

**Jamie:** That was super fun, and it really made me proud as a dad: presenting at Minnebar with my son, about something he’s really excited about and I enjoy doing. We each presented our part of the story. Tyler is much smarter about Clash Royale and much better at the game than I am, and I presented the technical side, how we built the agent and how it works. It’s a really great memory of a fun thing to do with Tyler.

### 66. The Clash Royale API only answers allowlisted addresses, so volunteers run collectors on their own machines, each one named for a card. Who runs them, and what had to be true before you could ask someone to run your program on their computer?

**Jamie:** Funny enough, right now I’m running all of them. There are currently five or six collectors, and I run them all.

To make that possible, we had to design a zero-trust environment for the collectors, which was an interesting process by itself. How do we make sure a collector is valid and has the right credentials, and also that it doesn’t have too much intelligence? We really just want the collector to be an API proxy between the server and the Clash Royale API. So it’s a very small, lightweight code base that lets the server talk to the API through a series of different collectors.

The smartest thing we did: the Clash Royale API has no state, and the most common thing we do is request players’ battle logs. Every time, you get the last 30 to 40 battles they played, and the first version of the collector sent all of that to the server every time. So we built a little logic into the collectors. They get all the data, but they only send the server what’s new. The server says, this is the last time I saw a battle from this player, and the edge filters out anything before that timestamp.

We also added a lot of security to the build process, so each collector is signed with an encryption key. It’s actually an incredibly robust part of the architecture.

### 67. Elixir Discord keeps no game data of its own. Every fact it states comes from a tool call it made moments before. Why that rule?

**Jamie:** That project is an experiment to see how an agent performs with an MCP backend. The agent is 100% tool calling. It has tools to get data from Elixir, and even posting to Discord is a tool call. It’s my experiment to see how intelligent an LLM layer you can build that accesses all the tools inside Elixir.

It’s been pretty interesting, and it can do some pretty powerful things. The biggest issue is cost. Those more advanced models aren’t free to use, and an answer can take a number of tool calls.

### 68. In Elixir Clan each clan writes its own policy, and the decisions stay with the leaders. What is in POAP KINGS’ policy, and which part was hardest to agree on?

**Jamie:** First, the whole concept of a clan policy is novel to Elixir. To my knowledge it doesn’t exist anywhere else. It comes from the fact that when we started POAP KINGS, we wanted rules and a structure so people knew what was needed to be promoted to elder, rather than basing every decision on vibes.

In the POAP KINGS policy, the most interesting parts are a rate of participation for Clan Wars, a rule that you have to be a member for a certain number of weeks before you can be promoted to elder, and the idea I mentioned already, that we give you credit for how long you’ve been in the clan. If you go idle, people who have been in the clan a long time get more grace than people who joined recently.

The last thing I’ll say on clans: we learned there are different modes. There are competitive clans and social clans, and we built the clan policy to accommodate both. Some clans want data and reporting but don’t want an elder policy. So the clan policy system can handle a wide variety of clan types.

### 69. Elixir Drop is a game for learning what every card costs. Where did the idea come from, and who do you play it against?

**Jamie:** It came from Tyler coaching me. Counting elixir is a really important part of playing competitive Clash Royale, and I didn’t know what the cards cost. I wanted to learn to count elixir faster. There are various websites for that, but none of them brought a game mechanic to it, so I asked Tyler if he’d want to build something like that together.

The very first version was actually part of the Elixir Discord bot. We had a channel for a card quiz: here’s the card, and you’d answer with a Discord interaction. That was okay, but not very fun to play, because it was all the Discord interface. So we took it out of Discord and made a website. That version was pretty simple, a flashcard version.

Then I had a thought: I’ve never made a game. I asked Tyler if he’d like to make one, and we thought that with agentic coding we could probably figure it out. That inspired the first mode, which is just to go fast and get 15 cards picked as quickly as possible. We added other game modes over time.

You play all the games by yourself, but we adopted a ton of Clash Royale mechanics. The seasons of Clash Royale are mirrored in the seasons of Drop. There’s a seasonal leaderboard and an all-time leaderboard, and you can attach your in-game player to the account you play with. It’s been really fun. It doesn’t have a ton of users. As Elixir gets more popular, maybe Elixir Drop will be too.

### 70. The API reference is written for agents first, and it asks any agent the live API surprises to write the finding down. What surprised you most about how that API really behaves?

**Jamie:** When I was building the MCP endpoint for Elixir, one use case was attaching Claude to it so I could ask questions about what’s happening in Clash Royale. That was also a concept in the Discord bot: we had an Ask Elixir channel where clan members could ask the bot questions and the LLM would work through them. The problem was it got very expensive, because everybody was burning my tokens. So the thought was, can I make all of this available through an MCP endpoint, so clan members can add it to their own LLM and use their own tokens?

That worked really well. But I kept thinking: what if you ask Claude a question and it can’t answer it? So first, I provided all the documentation for the endpoint as a method of the MCP, so when Claude attaches, it can read the full documentation. Then I provided a feedback interface and put it in the prompt the LLM receives from the MCP. It’s told that if it has difficulty answering a question, or something doesn’t work right, it should send feedback through the MCP. On the other side, a coding agent watches that queue and makes whatever changes are needed to fulfill the request.

It surprised me that I could just use the MCP and find bugs by using it. I ended up creating a whole Elixir gym: a set of tests the LLM runs against the MCP endpoint, looking for data mismatches or data errors. We fixed hundreds of bugs just by running that in a loop.

Two things surprised me. At one point Claude filed a message into the feedback queue, the agents on the other end picked it up, built it, and responded within about an hour, and Claude commented, “maintainer is fast.” I thought that was really humorous: Claude responding to how quickly what it filed got fixed. The other thing is that you can also send praise through the interface, and on a couple of occasions Claude has actually sent praise to the project for things it thinks it does really well.

### 71. You said, “I’m sure 20 years from now, Elixir will be done and retired.” It is free, and any clan can use all of it. Has another clan picked it up, and what would you want one to do with it?

**Jamie:** Elixir is pivoting right now into a different surface area. What’s been interesting about Elixir is working out its product fit as I build it. The first version asked, can I just make an MCP endpoint? I did, but that isn’t really a product. Then I asked, can this be a clan management interface? Can I take everything we used to do in the bot and do it in a web application? I did that, but it still didn’t really resonate.

Right now I’m transitioning Elixir to what I believe is the right landing place: the missing social layer of Clash Royale. The way that Strava is to workouts, Elixir is to Clash Royale. We’ll see how that goes, and if it works, I think it will attract other users.

It’s funny, because if it attracted a ton of users, that would be a problem: it would cost way too much to run. But I would love to see a few hundred, maybe a thousand, Clash Royale players sign up and use it to keep up with what their friends are doing in Clash Royale.
