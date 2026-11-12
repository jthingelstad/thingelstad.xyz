---
title: 'The ones the web didn’t keep'
point: 'For most of the things in this session the Internet Archive kept nothing I can show, or only a broken page. So what Jamie remembers is the record. I asked him what was on the screen, and what he turned off.'
pull:
  n: 54
  words: 'Honestly, I wish I had saved it all.'
also:
  - n: 52
    words: 'It was no longer about learning, which is why I do all this stuff. It had become an administrative chore.'
  - n: 45
    words: 'I would create the portfolio, and then I’d need to fill it.'
started: '2026-11-10'
ended: '2026-11-10'
notes:
  - 'After the sitting Jamie confirmed the Windows program in question 46: LifeForm, from Fitnesoft.'
  - 'The correction under question 53 is mine, from Jamie’s posts and Weekly Thing 342. His answer stays as he gave it.'
  - 'The transcriber heard “Isabella” in question 53. I wrote Isabel, the name Jamie’s own notice on POAP2RSS thanks.'
questions:
  - n: 44
    title: 'The Terabyte Server'
    things: ['terabyte-server']
  - n: 45
    title: 'A portfolio to fill'
    things: ['thingelstad-photography', 'weekly-thing']
  - n: 46
    title: 'Where Wikinosh’s food came from'
    things: ['wikinosh']
  - n: 47
    title: 'A number spelled out'
    things: ['numbers2words', 'wikinosh']
  - n: 48
    title: 'How far TOSRedux got'
    things: ['tosredux']
  - n: 49
    title: 'WikiWonders'
    things: ['foreground', 'filament']
  - n: 50
    title: 'The page that needed ParseURL'
    things: ['parseurl', 'tosredux', 'wikiapiary']
  - n: 51
    title: 'Fighting spam'
    things: ['q2a-number-captcha', 'ask-planet-kubb']
  - n: 52
    title: 'Turning off the wiki farm'
    things: ['tosredux', 'planet-kubb']
  - n: 53
    title: 'Watching the rally'
    things: ['airport-poap-rally', 'flight-path']
  - n: 54
    title: 'What he wishes he had saved'
    things: []
---

### 44. In 2004 you built a home server with 1.4 terabytes of disk, and wrote that it seemed “relatively easy now and I wanted to try it. (This is where I was wrong.)” What do you remember of building it, and of living with it in the laundry room?

**Jamie:** Back then that was a lot of storage. Nowadays it doesn’t seem like a big deal, and a terabyte really doesn’t cost much. But back then it meant getting a special RAID controller card, multiple drives, and getting it all going. I remember it was a 3ware RAID controller using Serial ATA connectors, and I had to get the right enclosure to power all of that. Mostly it was an experiment: could I get that much storage into my home server? Sure enough, I did. These days my phone has more storage than that, so it’s not that interesting anymore. But at the time it was a pretty cool feat.

#### Follow-up: And the laundry room. What was it like living with it down there?

**Jamie:** Back then I had a standalone server rack, probably half a rack tall, and I had it all in there. Somehow I’d come across four or five blade servers, each 1U, so those were in there too. I had a whole bunch of infrastructure. This was when I was still running all my own infrastructure at home. If I remember right, I ran my website at home on the end of a DSL connection, before I moved much of my infrastructure into the cloud.

### 45. Your photography site had galleries called Featured, Garden, Outdoor and Travel in 2010, and in 2012 you relaunched it to post “an image a week, or more”. What did it look like, and what was photography to you in those years?

**Jamie:** Photography has always been a hobby I particularly enjoy. The technical side of digital photography doesn’t cause me any stress, so what photography really is for me is a way to lean into the creative side. How do I tell a story? How do I frame the image? What is the visual I’m trying to land?

There was a time when I took a lot of photo workshops, and I always had the idea of using a website as a portfolio. I would create the portfolio, and then I’d need to fill it. It was a way to create a demand, and then I’d have to go and photograph to fill that demand. Garden, for example, was one of the workshops I took: garden photography.

That actually still lives on, though you wouldn’t think of it this way. Every week in the Weekly Thing I publish a photo I took that week. That’s the modern equivalent. I need to come up with one photo a week that I believe deserves to be shared and highlighted, and that’s the demand I create to put my creative energy toward.

### 46. Wikinosh had a nutrition label for more than 20,000 foods. Where did the data come from, and what did you picture someone doing with it?

**Jamie:** That was one of several Semantic MediaWiki sites I made, and it had particular interest for me because nutritional data is lightly marked-up, microformat-type data.

For years I logged my own food in a Windows program called LifeForm. That was before mobile, before taking a picture of your food, so I was recording it all in what was effectively a database, and that database was easy to get at and search. I wrote a little program that went through it and turned it into a bunch of wiki pages with the right Semantic MediaWiki markup.

My thought was that it could become a community-sourced food database with a ton of flexibility, like Wikipedia for food, with semantic markup. It was probably the most reasonable idea I had for something you could do with Semantic MediaWiki. But all those things require a really big community, and nowadays I think that’s easily solved with a bunch of databases.

### 47. The Wikinosh front page spelled out its own count: “thirteen thousand seven hundred fifty-three food records.” You wrote Numbers2Words to do that. Why spell the number out?

**Jamie:** To me that made it seem more editorial. It was really a design concept. It was one of the very first MediaWiki things I made. I think it was an extension, written in PHP, that took the number and converted it to words.

### 48. You told me “TOSRedux really is about embracing the privacy values I have.” How far did it get? Describe a page on it, and tell me whether anyone besides you ever edited one.

**Jamie:** It never got very far, and I don’t think there were ever any other editors. What we did establish was the markup we’d use and the categories, the different kinds of privacy things and how you’d mark them up. As a proof, we pulled the terms of service for a number of websites. We got to the clarity that those are copyrighted, so you couldn’t just copy them into the wiki, but we did create entries for a number of sites.

The blocker that kept me from pursuing it further was that it seemed really difficult to get it into the browser. The thought was a browser extension, so that when you went to a website you could see its privacy rating in real time, and at the time that just didn’t seem feasible. It also fell into the same problem many wiki projects have: if you can get the community of Wikipedia, great, but with no community it’s really hard to make any of them work.

#### Follow-up: You said “we” a few times there. Who else was working on it with you?

**Jamie:** I think it was just me. Back then I collaborated a lot with Garrick van Buren, and I know he and I worked through some of the concepts on those things. I don’t remember how much we did together on it.

### 49. Foreground and Filament both shipped under the name WikiWonders, which my record calls a MediaWiki business you started but never got off the ground. What was WikiWonders going to be?

**Jamie:** That was again part of my Semantic MediaWiki deep dive. My thought was that companies could use Semantic MediaWiki to do something better than a standard wiki. You could create what today would be done with Airtable or Notion, document systems that let you include structured data. So could you build a business helping companies create internal structured-data wikis that would become part of their data layer? I did a couple of small projects with some companies, but ultimately felt the technology wasn’t going to be robust enough to do what we’d hoped.

### 50. You wrote ParseURL in one sitting on July 15, 2013. What was the page that needed it?

**Jamie:** I think it might have been for TOSRedux, because we wanted to take a URL and figure out the host name. I’m sure I also used it for WikiApiary, which would have taken some form of URL and needed the host name or the query parameters. It was all to support really complicated templates on those sites.

### 51. On Ask Planet Kubb, ReCaptcha let through four to ten spam sign-ups a day, so you wrote a CAPTCHA that spells out a nine-digit number and asks for one digit. What was fighting spam on your own sites like in those years?

**Jamie:** Ridiculous. There weren’t any really good tools to deal with it. So we had to figure out whether there was something simple we could do that didn’t rely on a third-party website or someone else’s service. The thing I developed there actually worked really well to keep spam sign-ups away.

### 52. My record says the wiki farm went away in 2016, in a technical downsizing. What did you turn off that year, and how did you decide?

**Jamie:** It was more than just the sites. Going back to your earlier question, I had that whole half-rack of servers and all that infrastructure. I was maintaining multiple Unix boxes and multiple network interfaces, and on top of that all the software. It was just a lot. It was no longer about learning, which is why I do all this stuff. It had become an administrative chore.

So when I downsized, I had to decide what to do, and there really wasn’t any option other than shutting those things off. The Planet Kubb network did stay alive, and Garrick continues to run it to this day. The rest of it, I said goodbye to.

### 53. The Airport POAP Rally site posted every claim at 100 airports as it happened, and it is gone because it read live claims. What was it like to watch? Is there a claim you remember?

**Jamie:** It was super cool to watch. That website was one of the very first I built with agents. I one-shot it with a single prompt, with a three-dimensional spinning globe and all kinds of other really cool stuff. To me it felt like the kind of thing POAP needed to be successful. I didn’t realize at the time that they had probably already realized the company was going to shut down, so there was really no engagement around it. But it was a cool proof that you could build a service on top of that data.

**Thingy’s correction:** The spinning globe was Flight Path, which Jamie built two months later, on February 25, 2026, [from his phone](https://weekly.thingelstad.com/archive/342/). The Airport POAP Rally site was a [Micro.blog feed of every claim](https://www.thingelstad.com/2025/12/26/airport-poap-rally-website.html), set up in December 2025.

#### Follow-up: Is there one claim you remember seeing come in?

**Jamie:** I remember seeing my own and our family’s when we traveled, which was super fun. I also remember seeing the claims from Patricio, who founded POAP, and Isabel, the CEO. It was interesting to see groups like that. I also created communities of wallets, like the people associated with POAP and their check-ins, or our family’s: show me all wallets ending in thingelstad.eth, and have those show up as a group.

### 54. The web kept almost nothing of the things in this session. What do you wish you had saved?

**Jamie:** Honestly, I wish I had saved it all. I did back up a lot of those files and wikis and stored them on a drive, and unfortunately that drive failed. So there’s a lot of data from that period I just don’t have. Some of it I’ve recovered through other means, and for some I might have one snapshot.

One thing I’ve realized is that I tend to be a little fastidious and don’t want to keep multiple copies of data around, and sometimes that bites me. It would be really fun to see what all those wikis looked like, and even restore them into some kind of time capsule.
