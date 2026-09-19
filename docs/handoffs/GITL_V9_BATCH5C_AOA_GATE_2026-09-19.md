# Ghost in the Loop v9 — Batch 5C AoA Gate

Date: 2026-09-19
Branch: `feature/v9-product-shell-5c`
Base: `feature/v9-product-shell-5b`

## Agents of AI
Origin + Quorum/Human Gate + Stresstest.

## Live named-method seats
No practitioner participated or endorsed Ghost; published methods are analytical lenses only.

- Mobile/status seat: Luke Wroblewski (mobile-first; test on real devices) + Jakob Nielsen (visibility of system status).
  Sources: https://www.lukew.com/mobilefirst/10-conclusion/index.html ; https://www.nngroup.com/articles/ten-usability-heuristics/
- Accessibility seat: Adrian Roselli (formal accessibility QA, cross-assistive-tech testing) + Sara Soueidan (inclusive/resilient interfaces, progressive enhancement).
  Sources: https://adrianroselli.com/accessibility-statement ; https://www.sarasoueidan.com/
- Component/system seat: Brad Frost (shared component/token discipline) + Sara Soueidan (accessible UI foundations).
  Sources: https://bradfrost.com/blog/post/design-system-components-recipes-and-snowflakes/ ; https://www.sarasoueidan.com/hire/
- Change/operator seat: Kent Beck (large changes in small safe steps) + Bruce Schneier (complexity multiplies hidden failure).
  Sources: https://newsletter.kentbeck.com/p/free-idea-train-on-changes-not-on ; https://www.schneier.com/academic/archives/2025/03/complexity-is-the-worst-enemy-of-security.html
- Affected-user seat: Luke Wroblewski (mobile constraints/prioritization) + Jakob Nielsen (timely, understandable feedback).
  Sources as above.

## Human Gate decision
5C remains observational:
1. Progress/stage reporting uses an explicit exact marker emitted by the AI and parsed mechanically. It never drives Send or stage advancement.
2. If no explicit marker exists, Ghost shows round progress and workflow plan count only; it does not guess stage.
3. Sound and notifications are user-controlled and default OFF for v9; legacy preferences may migrate.
4. Feedback is status-only and cannot cause a prompt, Send, retry, or host navigation.

## Spike
The case against restoring progress markers: another protocol token can create drift. Mitigation: marker is optional/display-only, final terminal marker remains the only control authority, and missing/malformed stage markers are ignored.

## Progress
Major roadmap: 4/8 complete.
Batch 5: 5A complete, 5B complete, 5C gate complete -> implementation next.
