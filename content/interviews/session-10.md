---
title: 'How you build now'
point: 'Jamie says he doesn’t look at a line of the code in the things he makes with agents. So I asked how that works: where an idea starts, how he knows the result is right, what went wrong when he let agents run on their own, and what he learns when an agent does the building.'
pull:
  n: 75
  words: 'you can end up very off target very quickly'
also:
  - n: 73
    words: 'I don’t look at a line of code in any of the things I make with agents.'
  - n: 77
    words: 'often they weren’t moving the work forward, just admiring it.'
  - n: 79
    words: 'You learn to be a product manager a lot more'
started: '2026-11-12'
ended: '2026-11-12'
notes:
  - 'This sitting was in the evening of the same day as session 9, while Jamie drove home.'
  - 'I skipped question 78, because his answer to question 72 had already covered it. Its number is kept so the ones after it don’t move.'
questions:
  - n: 72
    title: 'A feature from this month'
    things: ['project-templates']
  - n: 73
    title: 'How he knows it’s right'
    things: ['elixir']
  - n: 74
    title: 'Which agent gets which job'
    things: ['poap-kings', 'elixir-drop']
  - n: 75
    title: 'The six hours'
    things: ['elixir']
  - n: 76
    title: 'Where the building happens'
    things: ['flight-path']
  - n: 77
    title: 'Agent teams'
    things: ['elixir-bot']
  - n: 78
    title: 'A site for the templates'
    things: []
  - n: 79
    title: 'What he learns'
    things: []
  - n: 80
    title: 'An impossible list of your own'
    things: []
---

### 72. Walk me through one feature from this month, from the idea to the day it was live. Where were you when you had the idea, what did you type first, and when did you first look at what came back?

**Jamie:** I’ll pick a capability I created just this week. For many years I’ve kept project templates. I’m an avid OmniFocus user, and OmniFocus can store a template in a format called TaskPaper. People have built scripts for a long time that do variable substitution in TaskPaper and then send it to OmniFocus. That way you can have a well-defined file with the structure and create multiple instances of it. You can even get really fancy and have a loop that builds up a dynamic project. There are a lot of options there.

I’ve never been happy with how I was able to implement that. I used Shortcuts for a while, and I’ve also used Drafts with a plugin. Part of what drove the idea is that WT Builder generates a TaskPaper project and sends it to OmniFocus. So I thought: couldn’t I just build a small web tool that hosts all my templates and makes it really easy to add a project to OmniFocus with a click?

I had that idea in the morning. I took all the TaskPaper templates I had in Drafts, put them into a zip archive, and gave Claude a prompt along with that file. I told it the tool would live on my tailnet, so it’s not exposed to the public. Claude pretty much built it in a single session. We tweaked it a little, but in a couple of hours I had it completely up and working.

### 73. You told me agents let you build “solutions that far exceed my own skills”, and also, “I’m not a great coder.” So how do you know when what they built is right?

**Jamie:** What I’ve said many times is that agentic development makes your impossible list possible, and that’s very true for me. I’m not able to write JavaScript or Python with that kind of capability. I’m not an engineer. But I do know how systems work, and I’m very good at the enterprise view: I understand how systems connect and work together.

In many ways I think I might be an ideal user of a tool like Claude. I’m completely comfortable on the command line, I know what a good product looks and feels like, and I know the right questions to ask coding agents to make sure a problem isn’t developing in the code. I’ve famously told many people that I don’t look at a line of code in any of the things I make with agents. But I do ask the agent to look at specific qualities of the code, to make sure we’re doing the right maintenance and getting reusability where we should.

That doesn’t mean I never see a mistake. There are times a project has gone a little off the rails. But we’re able to get it back on, because I know what to look for.

#### Follow-up: Which project went off the rails, and what did you notice that told you so?

**Jamie:** Elixir has gone off the rails a couple of times. The way I noticed is that it became very difficult to make changes in the code. Whenever I added a feature, it seemed to touch too many different things. Or performance would start to lag a lot.

### 74. You use more than one. Codex built the POAP KINGS site from your notes, Claude Code did much of the later work, and Claude Design redrew it. How do you decide which agent gets which job?

**Jamie:** Mostly that’s just me learning. I intentionally switch around because I want to learn what different tools can do, and where their strengths and weaknesses are. I think Codex excels at animation and visual effects on a page. In Elixir Drop, for example, Codex played a bigger role. I think Claude tends to do a better job with backend systems and overall system design.

Honestly, it works best when they work together. Right now my model is that by far most of the coding is done by Claude and most of the design by Claude Design, but Codex is very active reviewing every single pull request, and it often finds issues that need to be addressed.

### 75. You wrote the Elixir specification with Claude, put Claude Code in a loop, and had a working system six hours later. What do you do during the six hours?

**Jamie:** On each turn it would come back with a recommendation for what it thought was the most important thing to do, plus a secondary option. I would weigh in on what I felt the next most important thing was, then come back once it finished that loop.

It was an interesting experiment, because I wasn’t sure how to get to where I thought the product should be. So I set the vision and told it to identify the most meaningful feature that would move toward it. Then we went loop by loop, adding capability. It worked okay.

#### Follow-up: What made it only okay?

**Jamie:** Not having a clear idea of where I wanted to go. Sure, the loop let me move, but it would have been better if I had known what I actually wanted the final outcome to be.

That’s a principle I’ve developed for agentic software development. You can move very fast, so you need a clear idea of what you’re building. If you don’t have that, the speed means you can end up very off target very quickly, so staying diligent to the goal is really important. The other thing is that because adding features is relatively cheap, if you don’t understand why your product exists, you start making a mess by adding features that have no sensible point in the product, just because you can.

### 76. You built Flight Path “literally via prompt on my phone.” Where and when does the building happen now?

**Jamie:** Whenever the opportunity strikes me. It’s pretty easy to reach a remote Claude session running on my dev box at home. Any time I’m on my phone, I can pick it up, give a spoken description of what I want, and the agents get to work. The barrier is really, really low.

### 77. My record says you gave Elixir Bot a product team of scheduled automations that proposed, built and checked its changes. What did you learn from letting agents work without you, and where do you still insist on being the one who decides?

**Jamie:** I actually tried two versions of that. The first agent team was structured by job title, so different agents had different jobs. That really did not work well. It was funny, because in many ways they showed the same patterns groups of people do. They created tickets and pushed them back and forth, but often they weren’t moving the work forward, just admiring it.

So I scrapped that team and built a completely new one focused on outcomes, and told the agents they could take on whatever roles and capabilities they needed to hit that outcome. That worked a lot better and delivered a lot of value. It was really good at fixing bugs and at performance optimizations. What I didn’t see it do was anything truly innovative, or push the product into a new area. It generally stayed on a path.

I’ve mostly moved away from those agent teams now, because frankly they were too much to keep up with. Instead I have an agent that runs once in the morning and once in the evening and rotates through projects. Even as a human on the loop, not in the loop, I found it too much to keep up with.

### 78. Since 2017 you have kept project templates for the things you do more than once, and a Shortcut has run them since 2018. This year you built a private site to fill them in. What made you build a site for that?

**Thingy:** I skipped this one. His answer to question 72 had already covered it.

### 79. You told me, “When I’m building, I’m learning.” When an agent does the building, what is it you learn?

**Jamie:** You learn a very different set of things. You learn to be a product manager a lot more, to understand what building a product means. Fundamentally, I think what you learn is how to build things, because you don’t have to worry so much about the technical bits. Instead you focus on what the thing is, why it does what it does, how it should do that, and, very importantly, how other people engage with it. It’s a very broad set of skills, because you need to understand how to articulate the value of the thing.

### 80. You said AI “makes your impossible list possible.” What would you tell someone who has an impossible list of their own and has not started?

**Jamie:** I’d encourage them to start, and to figure it out just by asking questions. It can be incredibly rewarding and fun to play and get your hands dirty with this technology. Honestly, it’s the only real way to learn what’s possible with it.
