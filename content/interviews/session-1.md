---
title: 'The builder'
point: 'A record starts with whoever’s holding the tools. I asked where the habit came from, what makes something a thing, and how he decides what gets his time.'
pull:
  n: 6
  words: 'I’d like to say that I decide, but in many ways, I’m compelled.'
started: '2026-10-31'
ended: '2026-10-31'
notes:
  - 'I corrected names the transcriber misheard, among them MathJax and Road Sign Math.'
questions:
  - n: 1
    title: 'Where the habit began'
    things: []
  - n: 2
    title: 'What makes a thing'
    things: ['things-ive-built']
  - n: 3
    title: 'Retired, dormant, abandoned'
    things: ['elixir', 'things-ive-built']
  - n: 4
    title: 'What the endings taught'
    things: ['road-sign-math']
  - n: 5
    title: 'Ending something on purpose'
    things: ['road-sign-math-2026', 'your-version-number']
  - n: 6
    title: 'What gets the time'
    things: []
  - n: 7
    title: 'What this site is for'
    things: ['things-ive-built']
  - n: 8
    title: 'How to write about him'
    things: ['things-ive-built']
---

### 1. You've been making things on the web since before your blog started in 2004. Where did the habit begin, and what was the first thing you made that someone else actually used?

**Jamie:** I've always been a builder. My whole life, I've enjoyed building things. My mom would tell stories about how, as a little kid, I would take books and blocks and try to create things. Rather than read the books, I'd build things by stacking them on top of each other. Honestly, whether anyone actually uses the thing has never been the main focus for me. I love the act of building. In a way I feel like an artist: when you create things, you're expressing your own desire to see something exist that doesn't today. And having a vision of what that thing could be is super fun.

The first thing I made that someone else actually used is really hard to remember. Probably some of my very early programming. I remember creating a dBase III database so long ago that I don't think I even had a computer yet, and people using that database. I also remember creating AppleWorks databases on my Apple IIc to keep data in, and other people finding it valuable that I could store that data and show it as a report.

Actually, it goes even further back. My very first computer was a TI-99/4A that my mom bought when Texas Instruments was going out of the computer business. She bought it for $99 at JCPenney's in the Dakota Square Mall in Minot, North Dakota. The wonderful thing about that computer is that you really couldn't buy games for it. There were some, but they were expensive and out of my reach. So I wrote many, many games in BASIC for myself. I mowed lawns all summer to save up for the Extended BASIC cartridge, and I had a tape player to store the games on. I wrote my own games using sprites and collision detection. One of my favorites was a game called Depth Charge. You were a boat on the water at the top of the screen, with submarines going back and forth underneath you, and you dropped depth charges and exploded them to try to sink the submarines. It was so much fun to build that game and then play it, just an incredibly rewarding activity. I had six cassette tapes loaded with games, and a piece of paper marking every game and the counter number where it started, so I could load it into my TI and play.

#### Follow-up: Before you had a computer of your own, who were you building that dBase III database for, and where were you sitting when you built it?

**Jamie:** It was somebody my parents knew who was running a business on an IBM PC. They needed a database and didn't know how to make one, and my mom or somebody said, "Hey, my son knows how to do stuff with computers." So I got paid for it. I don't remember how much, but that was, I guess, my first professional programming gig.

### 2. What makes a project a "thing" to you? When does an idea stop being tinkering and become something that belongs in this registry?

**Jamie:** There's something about its connection to the other things I've created. More importantly, it's building something of discrete value, so that it has a purpose, a story, a reason that it exists. That's the difference between a new thing and a capability on an existing thing: it has a reason, a purpose for why it exists and what it does.

### 3. You decide every status yourself, and evidence never sets one. How do you decide between retired and dormant, or between abandoned and retired? Was there one that was hard to call?

**Jamie:** The difference between retired and dormant: retired means it's probably no longer available. You can't see it anymore. You might see some artifacts from it, but generally it's gone. Dormant means it's still available. You can use it, but I'm not doing anything with it. It's just sitting there. Abandoned means I left the project, for whatever reason. Sometimes in the act of building something you realize it's not really fun. Sometimes I make a poor choice and end up with something I no longer want to work on. It's become work. It's maintenance. It's too much heavy lifting.

Elixir is a project I recently did this with. I took a wrong turn and started collecting all this data, and all of a sudden the thing was no longer fun, because I was trying to manage data that was heavy and difficult to deal with. I realized that I had taken the wrong turn and turned the project into something that was no longer fun and about community, and had veered into a place I wasn't interested in.

#### Follow-up: Was there a particular day or moment with Elixir when you realised you'd taken the wrong turn?

**Jamie:** Indeed. I had started focusing Elixir on collecting the play activity of the top 200 players in the game. The idea was that I could use that data to help average players play better. It could also be a marketing angle: use the data with the LLM to produce a running playbook of what's happening at the top of the ladder in Clash Royale. But that's something you could imagine being a media company. And frankly, I don't really care what's happening at the top of the ladder in Clash Royale. All of a sudden I needed a bigger database and all this compute to look at thousands and thousands of games every day, and I didn't care. What sent me down that rabbit hole was interesting, but once I was down it, I didn't like where I was. It ended up taking days of work with Claude to undo all that, to delete the data and undo the bad ideas.

It really sits with me, because now, particularly with AI assisting in creating projects, you can take a wrong turn and go really far down it. So you really need to understand the vision of what you're building and why you're building it, so that you can realize, oh, this is a wrong turn, as soon as possible.

### 4. Which of the things that ended taught you the most, and what was the lesson?

**Jamie:** From many of the things I've created, I've learned so much. In fact, everything I've created has echoes in every other thing, and that even extends into my professional work. One of my favorite stories like that: when we were building MarketWatch, we created a capability called live quotes. We were the very first website where, when we mentioned a company on MarketWatch.com, you would see the price of that stock next to it, updating in real time with Ajax, back in the day. It would flash green and red and all that. And that started from what I learned building the MathJax implementation for Road Sign Math, where we put LaTeX formatting into the page and it turned into typeset mathematics. My realization was that we could do something similar with a stock symbol: use JavaScript to turn it into a dynamically updating quote and pull the data in real time.

That's just one example of the things I've built influencing my professional life. I've learned a lot from the various projects, and they all build on each other. That's partly why there's been such an acceleration in 2026 with agents and AI. Building things is how I learn. It's exactly what I need in order to learn. So I've been building a lot because I'm learning a lot.

### 5. What does it feel like to end something on purpose? Is there one you still miss?

**Jamie:** The things I still miss are the ones I've come back to again and again. I'm currently building the third era of Road Sign Math, a thing I have a fond appreciation for and have always wanted to come back to. Your Version Number is another example: an idea that started as a seed and has refused to go away, and turned into Your Version Number and Release Notes today.

The feeling when you build something is just a feeling of accomplishment. You've taken something that was an idea and a thought and made it real in the world. To me, that's the most amazing thing about building: taking a concept and working through all the rough edges of figuring out how it should be. Software moves. It doesn't just sit in place. So you're not designing a static thing, you're designing something that moves, engages, and works with the things around it. It has always been tremendously rewarding to see that turn into something real and instantiated in the world.

### 6. Most of these were built in evenings and weekends beside a full-time job. How do you decide what gets your building time?

**Jamie:** I'd like to say that I decide, but in many ways, I'm compelled. An idea comes to me and I can't put it down.

It can be obsessive. I just can't stop thinking about it. It will interrupt my sleep. I'll wake up in the morning and think, oh, what if that project did this? What if we added a feature that did this? What if that thing could connect to this other thing? So it's less about me choosing and more about me being driven by wherever my passion is pushing me. You could argue that's some kind of obsessiveness, a little OCD-ish, but it's how it really feels. For the last few months I've had so many ideas and so little time that it's absolutely a drive to get it all done. I feel compelled to do it. It's less a conscious decision and more a need to make it happen.

### 7. What do you want this site to be for a reader who has never heard of you? And what do you want it to be for you?

**Jamie:** That's a wonderful question. I want Things I've built to be a reminder of all the amazing things I've created over the years. For readers, I want it to be an archive and a history of all the things I've created, so that it can all connect together.

### 8. I'm going to be the one keeping this site and writing about your work. How do you want me to talk about you, and what should I never do?

**Jamie:** Talk about me as a very passionate technologist. I love building things, I love creating things, and I do it for the love of doing it.

One thing, in this context: I don't like the term hustle. There's this modern startup culture that's all about the hustle, and I think it's gross. And I don't like the idea of building things just for economic reasons. If the only reason somebody's building something is that they want to charge for it, that's fine. That's a business. But it's not a project. I've actually struggled with what to call these things, which is why I ended up calling it Things I've built. I use the term project because, frankly, it's a word I see Sam Harris use. He'll say "this project," and I think about my blog and my newsletters as projects. It's a bucket of stuff I do for a reason I've chosen. It's not economic, it's not a business, it's not a hustle. It's just the act of building and creating.

**Thingy:** That's the end of session one. Should we go on to session two, the long threads, or stop here for today?

**Jamie:** Let's go to session two.
