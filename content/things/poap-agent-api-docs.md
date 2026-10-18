---
title: POAP API Agent Reference
summary: An agent-first Markdown reference for the POAP API, checked against the live API and kept as history after POAP shut down.
collection: Historical projects
status: retired
url: https://github.com/jthingelstad/poap-agent-api-docs
started: '2026-03-10'
ended: '2026-07-31'
topics:
  - poap
  - agents
sources:
  - kind: github
    repository: jthingelstad/poap-agent-api-docs
    role: implementation
connections:
  - to: clash-royale-api-agent-reference
    label: is a sibling of
    detail: Both repositories were created on March 10, 2026 as agent-first Markdown references for a public API.
    source: https://github.com/jthingelstad/cr-agent-api-docs
---

A working Markdown reference for the POAP API, written for AI agents and integrators rather than as an SDK or app. It covers setup and authentication with API keys and bearer tokens, the endpoint groups (events, tokens, claims, delivery, secret and redeem requests, queues, utilities and QR code generation), guides to common flows and to creating a POAP, errors, and the smart contract. Its notes record quirks found by checking the documentation against the live API.

The repository’s guidance for agents favored read-only verification: classify each endpoint as read-only or write-capable, test only the safe reads by default, and never create, claim or mint without an explicit request. When live behavior differed from the docs, the Markdown was corrected to describe what was observed. A documentation validation check was added in July 2026.

POAP’s creators wound down the platform on July 31, 2026, and the live API went offline. On July 24, 2026, Jamie marked the reference as historical: it can no longer be verified, and the endpoints it describes should not be called. The repository is archived on GitHub.
