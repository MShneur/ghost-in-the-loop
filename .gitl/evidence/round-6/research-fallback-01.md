# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: Worker 6 / Devil's Advocate / release auditor
- Executed role: Researcher / architect with adversarial audit lens
- Research fallback ID: `R6-RESEARCH-FALLBACK-ADOPTION-DRIFT-01`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T13:53:54Z
- Finished at: 2026-08-07T13:56:23Z
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`
- State before claim: active, Round 6 in progress, `publishReady: false`, lease null.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` is blocked locally on `DQ-R6-LIVE-STRUCTURE-CAPTURE`; `R6-A2-MOBILE-SHELL-BUILD` remains dependency-waiting.
- No dependency-ready implementation/test/certification assignment existed, so the canonical maker and succession rule required one bounded non-conflicting research fallback rather than repeating the same permission-gated live-browser call or deterministic probe.
- Immediately before claim, the connector verified the isolated branch was exactly one state-only commit ahead of recorded handoff `561cabe0b80a341c94900e493e1a6dcb6cef0b71`; the connector did not expose that intermediate tip SHA, so the exact pre-claim head remains **UNKNOWN** rather than inferred.
- No open pull request had `agent/8.8-repair-resume` as its head when checked.
- Lease claim commit: `ca988504ddcd35784fcee1fa5aeef795a60c11f5`.

## Research Question
Does fresh maintained-project/adoption evidence materially change the current Blue-versus-Teal structural-mount risk ranking while authenticated live ChatGPT structure remains unavailable?

This research is deliberately lower-ranked than the missing live A1X evidence. It may narrow hypotheses and capture requirements, but it may not authorize a production selector or insertion slot.

## Research Sources and Implications

### 1. Maintained multi-site extension: Ophel Atlas changelog
Source: https://github.com/urzeye/ophel/blob/main/CHANGELOG.md

Fresh maintained-project evidence is materially relevant:
- Release `1.1.8` dated 2026-07-28 records a ChatGPT input-width regression after the site's 2026 redesign. That is direct adoption evidence that composer-area geometry is still changing enough to break third-party UI accommodation.
- An earlier 2026 ChatGPT redesign removed Ophel's former header model-switcher target; Ophel retargeted model detection to a composer-area pill and new menu semantics. This is evidence that a control formerly associated with the header migrated into the composer region.
- The same project has moved background UI work away from broad repeated scans where possible and has features that avoid/disable injected anchors when they conflict with native editor popovers. That is compatible with Ghost's scoped-observer and fail-closed fallback philosophy.

Implication: the evidence **weakens a header-first/Teal assumption** and strengthens the need for composer-local adapter ownership, but it simultaneously increases the risk that Blue's action row is crowded and breakpoint-sensitive. It does not reveal the current authenticated action row or an insertion slot.

### 2. VoiceType ChatGPT selector configuration
Source: https://gist.github.com/machinefriendly/97784f9a2673cc90f48843e122d871cd

The configuration was updated 2026-05-16 and independently records:
- `#prompt-textarea` for the editor;
- `button[data-testid="send-button"]` / `aria-label="Send prompt"` for Send;
- `[data-testid="composer-plus-btn"]` for upload;
- a composer-tools selector and a voice-mode button;
- only a broad `.draggable` selector for the header.

Implication: adoption evidence continues to be more specific around editor/composer/Send controls than around a stable header action row. This supports the **shape** of an explicit composer-local discovery contract. It remains adoption evidence, not proof of the current production DOM.

### 3. Context-Sync toolbar injection
Source: https://github.com/Vineetpandey0/context-sync

This project publicly reports a ChatGPT composer-toolbar injection kept alive by `MutationObserver`, with multiple fallback selectors and SPA-rerender repair.

Useful implication: structural/toolbar injection is operationally possible but maintenance-sensitive under SPA rerenders.

Critical rejection: Context-Sync also fills editors and auto-clicks Send. That violates Ghost's reviewed authority boundary. It is therefore **rejected as a safety architecture precedent** and used only as evidence that toolbar injection and rerender repair exist in deployed code.

### 4. Target-project evidence
- `.gitl/evidence/round-6/worker-2.md`
- `.gitl/briefs/mobile-shell-concepts.md`
- `tests/e2e/mobile-shell-structure-probe.spec.js`

The target-project evidence remains stronger than all external sources: current Blue implementation is unauthorized until A1X obtains a current authenticated structure map and proves exact Send identity, active-composer scoping, zero actuation, and a concrete normal-flow insertion rule.

## Competing Expert Interpretations

### Expert A — composer-local evidence strengthens Blue-first
The editor, Send, upload, voice, and model controls have independently observed/adopted composer-local anchors. A maintained extension had to move model handling from a removed header target into the composer after a redesign. Prediction: once live capture is available, an explicit adapter-owned composer root is more likely than a generic header strategy to yield a falsifiable mount contract.

### Expert B — the same evidence increases Blue fragility
The composer is accumulating native controls and has already experienced width regressions after redesign. Putting Ghost into that row could shrink the editor, wrap controls, or collide with breakpoint-specific host logic. Prediction: a live action row may prove too dense for Blue, in which case Teal or Red should remain viable rather than forcing Blue because its anchors are easier to find.

### Reliability / security / maintenance lens
The highest-consequence failure remains near Send. A generic inferred toolbar is unacceptable without active-composer scoping and exact Send identity. External code that auto-submits demonstrates why adoption alone cannot be treated as a Ghost safety precedent.

### Mobile / constrained-hardware lens
Composer control density makes narrow-width behavior a first-class risk. The prior deterministic 390 px oracle proves only the fixture contract; it does not prove current ChatGPT's mobile composer can absorb another in-flow cell.

### End-user lens
Blue still offers the strongest one-handed reach. That usability advantage is meaningful only if the host reflows without reducing text-entry usability or hiding native controls. Current evidence does not yet prove that tradeoff is acceptable.

### Outside-frame candidate
A header/Teal mount is lower consequence near Send, but fresh redesign evidence shows header-level controls can disappear or migrate. Teal should remain a candidate, not become a shortcut around the missing live composer evidence.

### Test/certification lead
The discriminating test remains the unchanged A1X live capture. External adoption cannot replace it. The next live capture must record current desktop and narrow structures, exact active composer/Send relationship, action/header/footer candidates, and zero probe actuation before any build assignment becomes ready.

## Decision / Novel Finding
The research changes the **confidence distribution**, not the authorization state:

1. **Blue remains the smallest architecture to test first**, because independent maintained/adoption evidence is still strongest at the composer/editor/Send boundary.
2. **Blue is not safer merely because it is easier to discover.** Fresh evidence of composer redesign, control migration, and input-width regressions increases the importance of narrow-width and host-control-density falsification.
3. **Teal is somewhat weaker as a first prototype** because maintained evidence shows a significant ChatGPT control moved from a header model-switcher into the composer after redesign.
4. **No exact Blue insertion slot is authorized.** Current authenticated DOM evidence remains UNKNOWN.

## Capture-Contract Narrowing
The deferred capture option needs one clarification:

- A screenshot can help identify visual layout, control ordering, crowding, and narrow-width behavior.
- A screenshot **cannot by itself prove exact Send JavaScript node identity, hidden/secondary composer status, DOM containment, or rerender identity preservation**.
- Therefore the strongest non-interactive alternative to interactive browser inspection is a sanitized DOM/computed-style/relationship capture (with screenshots as optional supplements), not screenshot-only evidence for the identity-sensitive A1X acceptance criteria.

This narrows the local human gate without expanding it: no new human decision is required beyond providing/allowing evidence that can actually satisfy the existing A1X contract.

## Tests / Execution
- Repeated live browser permission call: **NOT RUN**, by explicit no-repeat/diminishing-return rule.
- Deterministic structure probe: **NOT RE-RUN**; exact A1X run `31181719403` already passed 2/2 and unchanged repetition would not discriminate the architecture.
- Product syntax/lint/generated/unit/browser tests: **NOT APPLICABLE**, no product code changed.

## Changes
- `.gitl/autopilot-state.json` — research-fallback lease claim only before this evidence.
- `.gitl/evidence/round-6/research-fallback-01.md` — this durable finding.
- Planned same-handoff coordination update: narrow `DQ-R6-LIVE-STRUCTURE-CAPTURE` evidence guidance, record this finding in state, then release the lease.
- Product source: **NONE**.

## Safety Checks
- Send authority: unchanged.
- CHOICE behavior: unchanged.
- Route safety: unchanged.
- Lease semantics: unchanged.
- Uncertainty behavior: unchanged.
- Existing rail fallback: unchanged.
- `main`, merge, auto-merge, tag, publish, release: none.

## Risks and Limits
- Ophel, VoiceType, and Context-Sync are external/adoption evidence, not authenticated current ChatGPT source of truth.
- Public projects can lag A/B tests, account variants, locale variants, and responsive variants.
- The maintained-project evidence is directional: it supports composer locality and host volatility, but cannot choose a child index or prove normal-flow safety.
- A screenshot-only capture is insufficient for identity-sensitive acceptance criteria unless supplemented with structural DOM/relationship evidence.
- This is the first recorded post-A1X research fallback; diminishing returns cannot be declared. A later wake should use a **different evidence mode** if the local capture gate is unchanged.

## Recommended Next Action
- If `DQ-R6-LIVE-STRUCTURE-CAPTURE` changes, resume A1X exactly as written and do not weaken the existing oracle.
- If it remains unchanged, the next wake should not repeat this adoption-drift search. A materially different bounded fallback should investigate either (a) scoped structural repair/Custom Element/Shadow DOM lifecycle patterns or (b) narrow/mobile keyboard and footer reflow failure modes, producing a new falsifiable test/risk update.
- Keep `R6-A2-MOBILE-SHELL-BUILD` waiting until A1X is submitted with current-host evidence.

## Assignment Status
- research-only
