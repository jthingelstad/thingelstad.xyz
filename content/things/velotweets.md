---
title: VeloTweets
summary: A 2009 site that gathered professional cyclists’ tweets into one grid, built by Luke Francl, Norm Orstad, Chris Hatch, and me.
collection: Historical projects
status: retired
url: https://web.archive.org/web/20090514063346/http://www.velotweets.com/
started: '2009-05-10'
topics:
  - automation
  - open-web
sources:
  - kind: website
    url: https://web.archive.org/web/20090514063346/http://www.velotweets.com/
    role: archive
connections: []
story:
  color: '#56779a'
  introduction: The peloton in its own words, one rider at a time.
  engineering:
    - One Twitter account followed every rider, and a job read its timeline every five minutes.
    - The grid was one query, each rider’s newest tweet from the past seven days, so a rider who posted often still appeared once.
    - TwitPic links became VeloPics. Teams, nationalities, the race calendar and the Message of the Day were kept by hand in a small admin.
  stack:
    - Ruby on Rails 2.3
    - MySQL
    - Phusion Passenger
    - Capistrano
    - Twitter API
    - TwitPic
  questions:
    - How did VeloTweets collect riders’ tweets?
    - Why did VeloTweets show each rider only once?
    - What files are left from VeloTweets?
artifacts:
  - file: masthead-logo.png
    title: The masthead
    caption: The logo and its tagline, “Pulse of the Peloton,” from the top of every page.
    date: '2009-05'
  - file: front-page-2009-05.png
    title: The front page during the Giro
    caption: Launch week, on Stage 4 of the 2009 Giro d’Italia. The Message of the Day names the stage, the grid shows each rider once with their newest tweet, and VeloPics and VeloEvents run down the side.
    date: '2009-05'
    source: https://www.thingelstad.com/2009/05/12/introducing-velotweets-the.html
  - file: team-astana-2009-05.png
    title: A team’s riders
    caption: The same grid for one team, Astana, with each rider’s flag and team badge.
    date: '2009-05'
    source: https://www.thingelstad.com/2009/05/12/introducing-velotweets-the.html
  - file: velopics-2009-05.png
    title: VeloPics
    caption: Photos the riders posted to TwitPic, gathered into one grid.
    date: '2009-05'
    source: https://www.thingelstad.com/2009/05/12/introducing-velotweets-the.html
  - file: color-palette.ase
    title: The colour palette
    caption: 'The site’s colours as Adobe swatches: light blue #A0D3F2, slate blue #56779A, dark brown #261802, yellow #FFFF00, and white.'
  - file: jerseys.zip
    preview: jerseys.png
    title: Jersey icons
    caption: Icons for the yellow, green, polka dot and white jerseys, 20 pixels wide and shown enlarged here. They were never used on the site.
---

VeloTweets, “the Pulse of the Peloton,” collected the Twitter posts of professional road cyclists in one place. In early 2009 I had started following riders like Lance Armstrong through their RSS feeds and noticed that, read together, they gave a first-person view of the peloton during races. I loved that. VeloTweets included only pro riders and a few others in the sport, added each rider’s team and nationality, and showed each rider once in a grid with their most recent message, so frequent posters did not crowd out everyone else. It also gathered TwitPic photos as VeloPics, kept a race calendar, and ran a Message of the Day tied to the day’s racing.

It was a side project with no budget and no business behind it. The idea was mine, and the team made it real. Luke Francl did most of the development, in Rails 2.3; Norm Orstad designed the site; Chris Hatch built the list of riders and filled in their profiles; and I “played sweeper,” helping wherever I could. The grid came out of a working session: I credit Norm’s comparison to a baseball card, and Luke credits me with showing one tweet per rider. Luke [announced the site on Rail Spikes](https://web.archive.org/web/20090514074605/http://railspikes.com/2009/5/10/announcing-velotweets) on May 10, 2009, and I followed two days later with [Introducing VeloTweets](https://www.thingelstad.com/2009/05/12/introducing-velotweets-the.html) and [Why do Cyclists Tweet?](https://www.thingelstad.com/2009/05/12/why-do-cyclists-tweet.html).

VeloTweets read everything through its own Twitter account. The [About page](https://web.archive.org/web/20090603205416/http://www.velotweets.com/about) said so: “This account follows all of the people that we aggregate into VeloTweets.” Every five minutes the site read that account’s timeline, and the page reloaded itself on the same schedule. The grid showed each rider’s newest tweet from the past week, and by January 2010 VeloPics ran to [107 pages](https://web.archive.org/web/20100122083644/http://www.velotweets.com:80/photos?page=107) of photos.

The last Internet Archive capture of the working site is from [March 2010](https://web.archive.org/web/20100318125905/http://www.velotweets.com/), when the grid had 114 riders; by [February 2011](https://web.archive.org/web/20110202042105/http://www.velotweets.com/) velotweets.com was a parked domain. In 2014 I listed @VeloTweets among the Twitter accounts I had deleted ([Twitter Spam #NFL](https://www.thingelstad.com/2014/11/28/twitter-spam-nfl.html)).

I still have the project’s files, which is a small miracle: its source code at the last commit, on March 21, 2010, and the design files from the launch. The artifacts below come from them and from my launch post. Among them are icons for the yellow, green, polka dot and white jerseys that never appeared on the site. We wanted to show how many of each jersey a rider had won, but we never found a free source for that data.
