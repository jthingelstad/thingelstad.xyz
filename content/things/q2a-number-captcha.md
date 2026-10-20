---
title: q2a-number-captcha
summary: A Question2Answer CAPTCHA plugin that asks for one digit of a nine-digit number written out in words.
collection: Historical projects
status: retired
url: https://github.com/jthingelstad/q2a-number-captcha
started: '2014-11-16'
topics:
  - play
sources:
  - kind: github
    repository: jthingelstad/q2a-number-captcha
    role: implementation
connections:
  - to: ask-planet-kubb
    label: protected
    detail: I wrote the plugin to stop spam registrations on Ask Planet Kubb, the Question2Answer site I ran.
    source: https://www.thingelstad.com/2014/11/16/questionanswer-number-captcha.html
---

I had used [Question2Answer](https://www.question2answer.org/) for several years to run Ask Planet Kubb, and spam registrations were the problem. ReCaptcha let through four to ten spam sign-ups a day. The [Q2A Logical Captcha](https://github.com/amiyasahu/q2a-logical-captcha) plugin, to which I had contributed a pull request, let through three to four times as many.

So I brought over the defense I was already using on my MediaWiki wikis, which I had first written in 2013 to [stop spam sign-ups on WikiApiary](https://www.thingelstad.com/2013/07/09/stopping-mediawiki-spam.html) and later switched to numbers spelled out in words ([Updated Dynamic Questy Captchas](https://www.thingelstad.com/2014/10/28/updated-dynamic-questy.html)). The plugin spells out a random nine-digit number with the Numbers_Words PHP package and asks for the digit in one position, so the answer never appears in the page. It started as a modified copy of Q2A Logical Captcha. I [released it](https://www.thingelstad.com/2014/11/16/questionanswer-number-captcha.html) on November 16, 2014 under the GPL v2, reporting that early results were great. The last change, in 2015, removed a PHP warning, and the repository is archived.
