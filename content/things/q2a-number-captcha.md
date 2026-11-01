---
title: q2a-number-captcha
summary: 'A Question2Answer CAPTCHA plugin that spells out a nine-digit number in words and asks for one digit of it.'
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

Jamie ran Ask Planet Kubb on [Question2Answer](https://www.question2answer.org/) for several years, and spam registrations were a constant problem. ReCaptcha let through four to ten spam sign-ups a day. The [Q2A Logical Captcha](https://github.com/amiyasahu/q2a-logical-captcha) plugin, which he had sent a pull request to, let through three to four times that many.

So he brought over the defense that was already working on his MediaWiki wikis. He first wrote it in 2013 to [stop spam sign-ups on WikiApiary](https://www.thingelstad.com/2013/07/09/stopping-mediawiki-spam.html), then switched it to numbers spelled out in words ([Updated Dynamic Questy Captchas](https://www.thingelstad.com/2014/10/28/updated-dynamic-questy.html)). The plugin spells out a random nine-digit number with the Numbers_Words PHP package and asks for the digit in one position, so the answer never shows up in the page. It started life as a modified copy of Q2A Logical Captcha. He [released it](https://www.thingelstad.com/2014/11/16/questionanswer-number-captcha.html) on November 16, 2014 under the GPL v2, and reported that the early results were great. The last change, in 2015, removed a PHP warning. The repository is archived.
