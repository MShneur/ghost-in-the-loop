# Worker 2 — ChatGPT native takeover production slice

Status: BUILT + focused tests green; not self-certified.
Product head: d73ec1dfe84fe93f59b84e78bca04ba23e5671a2
Branch: feature/native-site-takeover

Implemented:
- strict reviewed ChatGPT structural resolver requiring the unified composer, one visible composer-actions row, and one exact reviewed Send control;
- one ordinary in-flow open-Shadow Ghost host inside composer-actions;
- exact Send identity preservation with fail-closed demotion on target replacement/ambiguity;
- zero passive Send/submit/input/keydown actuation and focus preservation coverage;
- scoped mutation/resize repair that moves only Ghost;
- passive rail/panel suppression only while native verification is active, with sentinel awareness and explicit user-open escape;
- generated Firefox extension runtime parity;
- Chromium desktop and Chromium-mobile focused production regression coverage.

Focused commands run before commit:
- npm run build:extension
- npm run lint
- npm run check:generated
- npx jest tests/choice-state.test.js tests/tablock.test.js tests/wake-recovery.test.js tests/directives.test.js tests/repo-nanny/composer-evidence.test.js --runInBand
- npx playwright test tests/e2e/native-chatgpt-takeover.spec.js --project=chromium --project=chromium-mobile

Focused result:
- Jest: 45/45 passed.
- Playwright native takeover: 8/8 passed across Chromium desktop and Chromium mobile.
- Extension generated parity and syntax checks passed.

Handoff to Worker 3:
Falsify this exact product head for wrong/ambiguous structure, Send replacement, rerender/repair, clipping, duplicate mount, focus retention, rail restoration, and adjacent Send/CHOICE/lease/uncertainty regressions. Do not accept this Worker 2 evidence as independent certification.
