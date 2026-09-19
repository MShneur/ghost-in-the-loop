# Ghost in the Loop v9 — Batch 5B AoA Gate

Date: 2026-09-19
Branch: `feature/v9-product-shell-5b`
Base: `feature/v9-product-shell-5a`

## Agents of AI
Origin + Quorum/Human Gate + Cleanerz + Stresstest.

## Named method pairs
- Prompt/control boundary: Simon Willison (privileged vs untrusted prompt/tool separation) + Martin Fowler/David Rice plugin/configuration pattern.
  Sources: https://simonwillison.net/2023/May/2/prompt-injection-explained/ ; https://martinfowler.com/eaaCatalog/plugin.html
- Change safety/operator: Kent Beck (small, safe, interruptible changes) + Pete Hodgson (feature/configuration complexity must be constrained).
  Sources: https://newsletter.kentbeck.com/p/free-idea-train-on-changes-not-on ; https://martinfowler.com/articles/feature-toggles.html
- Import safety: Troy Hunt (treat outside input as untrusted; prefer allowlists) + OWASP Input Validation.
  Sources: https://www.troyhunt.com/understanding-xss-input-sanitisation/ ; https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- Affected/mobile UX: Luke Wroblewski (mobile-first) + Jakob Nielsen (progressive disclosure).
  Sources: https://www.lukew.com/resources/mobile_first.asp ; https://www.nngroup.com/articles/progressive-disclosure/

No named practitioner participated or endorsed Ghost; these are published-method lenses only.

## Decision
Restore personas, workflows, postures and custom imports as **data that changes prompt construction only**.

Do NOT restore:
- controller-side semantic workflow decisions;
- alternate Send engines;
- host control automation;
- executable/script/style imports;
- automatic stage advancement based on interpretation.

## 5B contract
- Built-in personas: legacy v8 set.
- Built-in workflows: legacy v8 set, expressed as prompt guidance; the AI owns stage progress.
- Postures: Locked / Adaptive / Audit.
- Custom Workshop JSON: additive, strict type/size/count/length limits, built-ins immutable, display escaped.
- Progressive disclosure: one Prompt tab; Workshop import/export behind an Advanced disclosure.
- All generated prompt feature text must be appended before Play stages/sends it; only canonical `sendOnce()` actuates Send.

## Human Gate
No owner interruption required. The reversible safe path is clear and matches the locked architecture.

## Progress
Major roadmap: 4/8 complete.
Batch 5: 5A complete; 5B gate complete; implementation next.
