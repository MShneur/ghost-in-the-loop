// ==UserScript==
// @name         Ghost in the Loop
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      4.2.3
// @description  👻 Your AI never shuts up (on purpose). Universal auto-proceed for ChatGPT, Perplexity, Gemini, DeepSeek, Copilot, Grok.
// @author       Michael S (CTRL-AI)
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://www.perplexity.ai/*
// @match        https://gemini.google.com/*
// @match        https://chat.deepseek.com/*
// @match        https://copilot.microsoft.com/*
// @match        https://grok.com/*
// @match        https://claude.ai/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js
// @downloadURL   https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js
// @run-at        document-idle
// @license      AGPL-3.0
// ==/UserScript==

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // 1. PLATFORM PROFILES
    // ═══════════════════════════════════════════════════════════════
    const PLATFORMS = {
        chatgpt: {
            hostMatch: /chatgpt\.com|chat\.openai\.com/,
            label: 'ChatGPT',
            inputSelectors: ['#prompt-textarea','textarea[data-id="root"]','div[contenteditable="true"][id="prompt-textarea"]','textarea'],
            sendSelectors: ['button[data-testid="send-button"]','button[aria-label="Send prompt"]','form button[class*="bottom"]'],
            generatingSelectors: ['button[aria-label="Stop generating"]','button[data-testid="stop-button"]'],
            continueSelectors: ['button.btn-neutral:has(svg)'],
            continueText: ['Continue generating','Continue'],
            assistantSelector: 'div[data-message-author-role="assistant"]',
            useNativeSetter: true
        },
        perplexity: {
            hostMatch: /perplexity\.ai/,
            label: 'Perplexity',
            inputSelectors: ['textarea[placeholder*="Ask"]','textarea[placeholder*="Search"]','textarea[placeholder*="Follow"]','div[contenteditable="true"][role="textbox"]','div[class*="ProseMirror"]','[data-testid="composer"]','textarea:not([disabled]):not([readonly])'],
            sendSelectors: ['button[aria-label="Submit"]','button[aria-label="Send"]','button[type="submit"]'],
            generatingSelectors: ['button[aria-label="Stop"]','[data-testid="stop-button"]'],
            continueSelectors: [],
            continueText: [],
            assistantSelector: ['div[class*="prose"]','div[dir="auto"][class*="break-words"]','.pb-md > div'],
            useNativeSetter: false,
            useContentEditable: true
        },
        gemini: {
            hostMatch: /gemini\.google\.com/,
            label: 'Gemini',
            inputSelectors: ['div.ql-editor[contenteditable="true"]','rich-textarea div[contenteditable="true"]','.input-area textarea','div[contenteditable="true"]'],
            sendSelectors: ['button[aria-label="Send message"]','button.send-button','button[mat-icon-button][aria-label*="Send"]'],
            generatingSelectors: ['button[aria-label="Stop response"]'],
            continueSelectors: [],
            continueText: [],
            assistantSelector: 'model-response message-content',
            useNativeSetter: false,
            useContentEditable: true
        },
        deepseek: {
            hostMatch: /chat\.deepseek\.com/,
            label: 'DeepSeek',
            inputSelectors: ['textarea[placeholder]','#chat-input','textarea'],
            sendSelectors: ['div[class*="send"]','button[class*="send"]','button[aria-label*="Send"]'],
            generatingSelectors: ['div[class*="stop"]','button[class*="stop"]'],
            continueSelectors: [],
            continueText: [],
            assistantSelector: 'div[class*="markdown"]',
            useNativeSetter: false
        },
        copilot: {
            hostMatch: /copilot\.microsoft\.com/,
            label: 'Copilot',
            inputSelectors: ['textarea#userInput','#searchbox','textarea[placeholder*="message"]','textarea'],
            sendSelectors: ['button[aria-label="Submit"]','button[title="Submit"]'],
            generatingSelectors: ['button[aria-label="Stop Responding"]','cib-typing-indicator'],
            continueSelectors: [],
            continueText: [],
            assistantSelector: 'cib-message-group[source="bot"]',
            useNativeSetter: false
        },
        grok: {
            hostMatch: /grok\.com/,
            label: 'Grok',
            inputSelectors: ['textarea[placeholder*="Ask"]','textarea','div[contenteditable="true"]'],
            sendSelectors: ['button[aria-label="Send"]','button[type="submit"]'],
            generatingSelectors: ['button[aria-label="Stop"]'],
            continueSelectors: [],
            continueText: [],
            assistantSelector: 'div[class*="message"][class*="bot"], div[data-role="assistant"]',
            useNativeSetter: false
        }
    };

    const hostname = location.hostname;
    let PLATFORM = null;
    for (const [key, profile] of Object.entries(PLATFORMS)) {
        if (profile.hostMatch.test(hostname)) { PLATFORM = { id: key, ...profile }; break; }
    }
    if (!PLATFORM) return;

    // ═══════════════════════════════════════════════════════════════
    // 2. PAYLOADS
    // ═══════════════════════════════════════════════════════════════

    const PAYLOADS = {

        // LOOP MODE — user trusts the AI to execute a known multi-step task
        loop: {
            label: '▶ Loop',
            hint: 'Execute step by step. You define the pace.',
            inject: `

---
[Ghost in the Loop — loop mode]
Execute this task step by step. One focused section per response — don't try to do everything at once.

At the end of every response, print:
████░░░░ [Step X of Y] — one line describing what you just completed

Then on a new line:
• If more steps remain → last word: PROCEED
• If fully done → last word: SYSTEM_HALT

Do not skip the progress line. Do not ask clarifying questions — make reasonable assumptions and proceed.
---`,
            preview: [
                '▶ LOOP MODE',
                '─────────────────────────',
                'Executes the task step by step.',
                'You define the task; the AI',
                'works through it one piece',
                'at a time.',
                '',
                'End of each response:',
                '  ████░░░░ [Step X of Y]',
                '  Last word: PROCEED or',
                '             SYSTEM_HALT',
            ].join('\n')
        },

        // THINK FIRST MODE — AI reads the task, plans its own batch structure,
        // self-determines how many batches are needed at ~80% response capacity
        think: {
            label: '🧠 Think First',
            hint: 'AI plans its own batches. Best for complex or open-ended tasks.',
            inject: `

---
[Ghost in the Loop — think first mode]
Before doing any work, read this task carefully and plan how to complete it in focused batches.

PLANNING RULES:
• Decide how many separate responses (batches) the task needs.
• Keep each batch to roughly 80% of your comfortable response length — thorough but not rushed.
• Don't try to estimate a fixed number up front and then pad to fill it; let the task complexity set the count.

YOUR FIRST RESPONSE should be the plan only — no execution yet:
"I'll complete this in [N] batches. Here's what each covers:
  Batch 1: [description]
  Batch 2: [description]
  ...etc."
End your plan with: PROCEED

EACH SUBSEQUENT RESPONSE: complete one batch. End with:
████░░░░ [Batch X of Y] — brief description of what this batch covered
Then: PROCEED (more remain) or SYSTEM_HALT (fully done)

Why this matters: accurate output comes from focused responses, not compressed ones. The script sends "Continue" automatically — you don't need to wait for the user.
---`,
            preview: [
                '🧠 THINK FIRST MODE',
                '─────────────────────────',
                'Response 1: AI reads the task',
                'and plans its own batch count',
                'at ~80% response capacity.',
                'Outputs the plan → PROCEED',
                '',
                'Each batch after that:',
                '  ████░░░░ [Batch X of Y]',
                '  Last word: PROCEED or',
                '             SYSTEM_HALT',
                '',
                'Best for: long writing, research,',
                'code projects, anything complex.',
            ].join('\n')
        }
    };

    const STOP_KEYWORD    = 'SYSTEM_HALT';
    const PROCEED_KEYWORD = 'PROCEED';
    const PROCEED_TEXT    = 'Continue';

    const CONFIG = {
        checkInterval: 2500,
        maxRounds: GM_getValue('maxRounds', 50),
        soundOnComplete: GM_getValue('soundOnComplete', true),
    };

    // ═══════════════════════════════════════════════════════════════
    // 3. STATE
    // ═══════════════════════════════════════════════════════════════
    const STATE = {
        mode: 'IDLE',       // IDLE | RUNNING | PAUSED | COMPLETE | ERROR
        payloadMode: GM_getValue('payloadMode', 'loop'), // 'loop' | 'think'
        rounds: 0,
        needsPayload: true,
        loopTimer: null,
        panelPos: GM_getValue('panelPos', null),
        lastProgress: null, // { step, total, desc }
        collapsed: GM_getValue('panelCollapsed', false)
    };

    // ═══════════════════════════════════════════════════════════════
    // 4. DOM HELPERS
    // ═══════════════════════════════════════════════════════════════
    function qFirst(selectors) {
        const sels = Array.isArray(selectors) ? selectors : [selectors];
        for (const sel of sels) { try { const el = document.querySelector(sel); if (el) return el; } catch(_){} }
        return null;
    }
    function qAll(selectors) {
        const sels = Array.isArray(selectors) ? selectors : [selectors];
        for (const sel of sels) { try { const els = document.querySelectorAll(sel); if (els.length) return els; } catch(_){} }
        return [];
    }
    const getInput    = () => qFirst(PLATFORM.inputSelectors);
    const getSendBtn  = () => qFirst(PLATFORM.sendSelectors);
    const isGenerating= () => !!qFirst(PLATFORM.generatingSelectors);
    const getLastText = () => { const els = qAll(PLATFORM.assistantSelector); return els.length ? els[els.length-1].innerText.trim() : ''; };

    // ═══════════════════════════════════════════════════════════════
    // 5. INJECT TEXT + SEND
    // ═══════════════════════════════════════════════════════════════
    function injectText(el, text) {
        if (!el) return false;
        if (el.getAttribute('contenteditable') === 'true') {
            el.focus(); el.innerHTML = '';
            if (!document.execCommand('insertText', false, text)) el.textContent = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        if (PLATFORM.useNativeSetter && el.tagName === 'TEXTAREA') {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            if (setter) { setter.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); return true; }
        }
        el.focus(); el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function injectAndSend(text) {
        const input = getInput();
        if (!input) { setRunMode('ERROR', 'Input not found'); return false; }
        if (!injectText(input, text)) { setRunMode('ERROR', 'Inject failed'); return false; }
        setTimeout(() => {
            if (STATE.mode !== 'RUNNING') return;
            const tryClick = () => { const btn = getSendBtn(); if (btn && !btn.disabled) { btn.click(); STATE.rounds++; render(); return true; } return false; };
            if (!tryClick()) setTimeout(tryClick, 800);
        }, 600);
        return true;
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. CONTINUE-GENERATING AUTO-CLICK
    // ═══════════════════════════════════════════════════════════════
    function clickContinueIfPresent() {
        const btn = qFirst(PLATFORM.continueSelectors || []);
        if (btn) { btn.click(); return true; }
        if (PLATFORM.continueText?.length) {
            for (const b of document.querySelectorAll('button')) {
                if (PLATFORM.continueText.some(ct => b.textContent.trim().includes(ct))) { b.click(); return true; }
            }
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. PROGRESS PARSER
    // Matches: [Step 3/10], [Batch 2 of 5], ████░ [Step 3/10] — desc
    // ═══════════════════════════════════════════════════════════════
    function parseProgress(text) {
        const m = text.match(/\[(?:Step|Batch)\s*(\d+)\s*(?:of|\/)\s*(\d+)\](?:\s*[—–\-]\s*(.+))?/i);
        if (!m) return null;
        return { step: parseInt(m[1],10), total: parseInt(m[2],10), desc: (m[3]||'').trim() };
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. STATE MACHINE
    // ═══════════════════════════════════════════════════════════════
    let statusDetail = '';

    function setRunMode(mode, detail='') {
        STATE.mode = mode;
        statusDetail = detail;
        render();
    }

    function tick() {
        if (STATE.mode !== 'RUNNING') return;
        if (STATE.rounds >= CONFIG.maxRounds) { halt('Round limit hit'); return; }
        if (isGenerating()) return;
        if (clickContinueIfPresent()) return;

        const sendBtn = getSendBtn();
        if (!sendBtn || sendBtn.disabled) return;

        const lastText = getLastText();
        if (!lastText) return;

        const progress = parseProgress(lastText);
        if (progress) { STATE.lastProgress = progress; render(); }

        const tail = lastText.slice(-300);
        if (tail.includes(STOP_KEYWORD))    { halt('✅ Done!'); return; }
        if (tail.includes(PROCEED_KEYWORD)) { statusDetail = ''; injectAndSend(PROCEED_TEXT); return; }

        // AI deviated — auto-pause
        STATE.mode = 'PAUSED';
        clearInterval(STATE.loopTimer);
        setRunMode('PAUSED', 'AI deviated — review then resume');
    }

    function halt(reason) {
        STATE.mode = 'COMPLETE';
        STATE.needsPayload = true;
        clearInterval(STATE.loopTimer);
        setRunMode('COMPLETE', reason);
        if (CONFIG.soundOnComplete) playBeep();
    }

    function hasConversation() {
        // Returns true if there are already assistant messages on the page
        return qAll(PLATFORM.assistantSelector).length > 0;
    }

    function startLoop() {
        if (STATE.mode === 'RUNNING') return;

        const input = getInput();
        const typedText = input ? (input.value || input.textContent || '').trim() : '';

        // CASE 1: Resume from pause — already mid-loop, no payload needed
        if (!STATE.needsPayload) {
            STATE.mode = 'RUNNING';
            STATE.loopTimer = setInterval(tick, CONFIG.checkInterval);
            render();
            tick();
            return;
        }

        // CASE 2: Input has text — new cycle with payload injection
        if (typedText) {
            if (!input) { setRunMode('ERROR', 'No input element'); return; }
            STATE.needsPayload = false;
            STATE.rounds = 0;
            STATE.lastProgress = null;
            STATE.mode = 'RUNNING';
            injectAndSend(typedText + PAYLOADS[STATE.payloadMode].inject);
            STATE.loopTimer = setInterval(tick, CONFIG.checkInterval);
            render();
            return;
        }

        // CASE 3: Input empty but conversation exists — resume mid-session
        // (covers crashes, refreshes, or manual mid-conversation starts)
        if (hasConversation()) {
            STATE.needsPayload = false;
            STATE.rounds = 0;
            STATE.lastProgress = null;
            STATE.mode = 'RUNNING';
            setRunMode('RUNNING', 'Resuming existing session…');
            injectAndSend(PROCEED_TEXT);
            STATE.loopTimer = setInterval(tick, CONFIG.checkInterval);
            return;
        }

        // CASE 4: Nothing to work with
        setRunMode('ERROR', 'Type a prompt or open an existing chat');
    }

    function pauseLoop() {
        STATE.mode = 'PAUSED';
        clearInterval(STATE.loopTimer);
        setRunMode('PAUSED', 'Paused');
    }

    function stopLoop() {
        STATE.mode = 'IDLE';
        STATE.rounds = 0;
        STATE.lastProgress = null;
        STATE.needsPayload = true;
        clearInterval(STATE.loopTimer);
        setRunMode('IDLE');
    }

    // ═══════════════════════════════════════════════════════════════
    // 9. AUDIO
    // ═══════════════════════════════════════════════════════════════
    function playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [520,680].forEach((freq,i) => {
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.type='sine'; osc.frequency.value=freq;
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.6);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + i*0.18);
                osc.stop(ctx.currentTime + 0.6 + i*0.18);
            });
        } catch(_){}
    }

    // ═══════════════════════════════════════════════════════════════
    // 10. UI
    // ═══════════════════════════════════════════════════════════════
    GM_addStyle(`
        #gitl-panel {
            position:fixed; top:16px; right:16px; width:248px;
            background:#18191c; border:1px solid #2e2f35; border-radius:11px;
            padding:11px 13px; z-index:99999;
            font-family:'SF Mono','Cascadia Code','JetBrains Mono',monospace;
            font-size:12px; color:#ccc;
            box-shadow:0 8px 28px rgba(0,0,0,0.55); user-select:none;
        }
        #gitl-panel * { box-sizing:border-box; }
        .g-header { display:flex; justify-content:space-between; align-items:center;
            margin-bottom:9px; cursor:grab; padding:2px 0; }
        .g-header:active { cursor:grabbing; }
        .g-title { font-weight:700; font-size:11px; letter-spacing:.5px;
            text-transform:uppercase; color:#888; }
        .g-plat { font-size:10px; background:#25262b; padding:2px 7px;
            border-radius:4px; color:#818cf8; font-weight:600; }

        /* Mode toggle */
        .g-modes { display:flex; gap:4px; margin-bottom:9px; }
        .g-mode { flex:1; padding:5px 0; border:1px solid #2e2f35; border-radius:6px;
            background:#25262b; color:#888; font-size:10px; cursor:pointer;
            text-align:center; transition:all 0.15s; font-family:inherit; font-weight:600; }
        .g-mode.active { background:#1e1b4b; border-color:#4338ca; color:#a5b4fc; }
        .g-mode-hint { font-size:9px; color:#555; margin-bottom:8px;
            padding:4px 6px; background:#1a1b1e; border-radius:4px;
            border-left:2px solid #2e2f35; line-height:1.4; }
        .g-mode-hint.think { border-left-color:#4338ca; color:#6b7280; }

        /* Control buttons */
        .g-btns { display:flex; gap:4px; margin-bottom:8px; }
        .g-btn { flex:1; padding:7px 0; border:1px solid #2e2f35; border-radius:6px;
            background:#25262b; color:#ccc; font-size:14px; cursor:pointer;
            text-align:center; transition:all 0.15s; font-family:inherit; }
        .g-btn:hover { background:#2e2f35; }
        .g-btn.go { background:#064e3b; border-color:#065f46; color:#34d399; }
        .g-btn.go:hover { background:#065f46; }
        .g-btn.stop { background:#450a0a; border-color:#7f1d1d; color:#f87171; }
        .g-btn.stop:hover { background:#7f1d1d; }

        /* Progress */
        .g-prog { margin:5px 0 6px; }
        .g-track { height:5px; background:#25262b; border-radius:3px; overflow:hidden; }
        .g-fill { height:100%; background:linear-gradient(90deg,#34d399,#818cf8);
            border-radius:3px; transition:width .4s ease; }
        .g-prog-label { display:flex; justify-content:space-between;
            font-size:9px; color:#666; margin-top:3px; }

        /* Status */
        .g-status { text-align:center; font-weight:600; font-size:11px;
            padding:5px 0; border-top:1px solid #25262b; }

        /* Meta row */
        .g-meta { display:flex; justify-content:space-between; font-size:10px;
            color:#555; margin-top:5px; }
        .g-meta input { width:44px; background:#25262b; border:1px solid #3a3b42;
            border-radius:4px; color:#ccc; font-size:10px; padding:2px 4px;
            text-align:center; font-family:inherit; }

        /* Sound toggle */
        .g-setting { display:flex; align-items:center; justify-content:space-between;
            font-size:10px; color:#777; margin-top:7px; padding-top:7px;
            border-top:1px solid #25262b; }
        .g-toggle { width:28px; height:14px; background:#2e2f35; border-radius:7px;
            position:relative; cursor:pointer; transition:background .2s; }
        .g-toggle.on { background:#065f46; }
        .g-toggle::after { content:''; width:10px; height:10px; background:#ccc;
            border-radius:50%; position:absolute; top:2px; left:2px; transition:left .2s; }
        .g-toggle.on::after { left:16px; background:#34d399; }

        /* Payload preview */
        .g-peek-btn { font-size:9px; color:#444; cursor:pointer; text-align:center;
            margin-top:7px; padding-top:5px; border-top:1px solid #25262b; }
        .g-peek-btn:hover { color:#888; }
        .g-peek { display:none; margin-top:6px; padding:7px;
            background:#111; border:1px solid #25262b; border-radius:5px;
            font-size:9px; line-height:1.55; color:#5a6070; white-space:pre-wrap;
            max-height:190px; overflow-y:auto; }
        .g-peek.open { display:block; }

        .g-shortcuts { font-size:9px; color:#444; text-align:center; margin-top:5px; }
        /* Collapse */
        #gitl-panel.collapsed { width:auto; min-width:180px; }
        #gitl-panel.collapsed .g-body { display:none; }
        #gitl-panel.collapsed .g-header { margin-bottom:6px; }
        .g-collapsed-controls { display:none; align-items:center; gap:8px;
            padding:4px 0 2px; }
        #gitl-panel.collapsed .g-collapsed-controls { display:flex; }
        .g-quickbtn { flex:none; width:36px; height:28px; border:none; border-radius:6px;
            font-size:14px; cursor:pointer; transition:all .15s; font-family:inherit; }
        .g-quickbtn.play { background:#064e3b; color:#34d399; }
        .g-quickbtn.play:hover { background:#065f46; }
        .g-quickbtn.pause { background:#422006; color:#fbbf24; border:1px solid #78350f; }
        .g-quickbtn.pause:hover { background:#78350f; }
        .g-quickstatus { font-size:10px; font-weight:600; }
        .g-collapse { background:#25262b; border:1px solid #3a3b42; color:#aaa;
            font-size:10px; cursor:pointer; padding:2px 6px; border-radius:4px;
            line-height:1.4; font-family:inherit; font-weight:700; transition:all .15s; }
        .g-collapse:hover { background:#3a3b42; color:#fff; }
        .g-dot { display:inline-block; width:6px; height:6px; border-radius:50%;
            background:#555; margin-left:6px; vertical-align:middle;
            transition:background .3s; }
        .g-dot.running { background:#34d399; box-shadow:0 0 4px #34d399; }
        .g-dot.paused  { background:#fbbf24; }
        .g-dot.error   { background:#f87171; }
        .g-dot.done    { background:#818cf8; }

    `);

    const panel = document.createElement('div');
    panel.id = 'gitl-panel';
    document.body.appendChild(panel);

    function render(detail) {
        if (detail !== undefined) statusDetail = detail;

        const colors = { IDLE:'#666', RUNNING:'#34d399', PAUSED:'#fbbf24', COMPLETE:'#818cf8', ERROR:'#f87171' };
        const labels = {
            IDLE: 'Ready — type a prompt and press ▶',
            RUNNING: statusDetail || `Round ${STATE.rounds} of ${CONFIG.maxRounds}`,
            PAUSED: statusDetail || 'Paused',
            COMPLETE: statusDetail || 'Complete',
            ERROR: statusDetail || 'Error'
        };

        const p = STATE.lastProgress;
        const pct = p ? Math.round((p.step/p.total)*100) : 0;
        const progHTML = `
            <div class="g-prog">
                <div class="g-track"><div class="g-fill" style="width:${pct}%"></div></div>
                <div class="g-prog-label">
                    <span>${p ? `${STATE.payloadMode==='think'?'Batch':'Step'} ${p.step} / ${p.total}${p.desc?' — '+p.desc.slice(0,28):''}` : 'Waiting…'}</span>
                    <span>${pct}%</span>
                </div>
            </div>`;

        const peekOpen = panel.querySelector('.g-peek')?.classList.contains('open');
        const pm = STATE.payloadMode;
        const hint = PAYLOADS[pm].hint;

        panel.className = STATE.collapsed ? 'collapsed' : '';
        panel.innerHTML = `
            <div class="g-header" id="gitl-drag">
                <span class="g-title">👻 Ghost Loop<span class="g-dot ${STATE.mode==='RUNNING'?'running':STATE.mode==='PAUSED'?'paused':STATE.mode==='COMPLETE'?'done':STATE.mode==='ERROR'?'error':''}" id="gitl-dot"></span></span>
                <span style="display:flex;align-items:center;gap:6px"><span class="g-plat">${PLATFORM.label}</span><button class="g-collapse" id="gitl-collapse" title="${STATE.collapsed?'Expand':'Minimize'}">${STATE.collapsed?'▲':'▼'}</button></span>
            </div>
            <div class="g-collapsed-controls" id="gitl-collapsed-ctrl">
                <button class="g-quickbtn ${STATE.mode==='RUNNING'?'pause':'play'}" id="gitl-quick">${STATE.mode==='RUNNING'?'⏸':'▶'}</button>
                <span class="g-quickstatus" style="color:${STATE.mode==='RUNNING'?'#34d399':STATE.mode==='PAUSED'?'#fbbf24':STATE.mode==='COMPLETE'?'#818cf8':'#555'}">${STATE.mode==='RUNNING'?'Running…':STATE.mode==='PAUSED'?'Paused':STATE.mode==='COMPLETE'?'Done':'Idle'}</span>
            </div>
            <div class="g-body">
            <div class="g-modes">
                <button class="g-mode${pm==='loop'?' active':''}" id="mode-loop">${PAYLOADS.loop.label}</button>
                <button class="g-mode${pm==='think'?' active':''}" id="mode-think">${PAYLOADS.think.label}</button>
            </div>
            <div class="g-mode-hint${pm==='think'?' think':''}">${hint}</div>
            <div class="g-btns">
                <button class="g-btn go" id="gitl-play" title="Start / Resume (Alt+P)">▶</button>
                <button class="g-btn" id="gitl-pause" title="Pause (Alt+P)">⏸</button>
                <button class="g-btn stop" id="gitl-stop" title="Stop & Reset (Alt+S)">■</button>
            </div>
            ${progHTML}
            <div class="g-status" style="color:${colors[STATE.mode]}">${labels[STATE.mode]}</div>
            <div class="g-meta">
                <span>Rounds: <strong>${STATE.rounds}</strong></span>
                <span>Limit: <input id="gitl-limit" type="number" min="1" max="999" value="${CONFIG.maxRounds}"></span>
            </div>
            <div class="g-setting">
                <span>🔔 Sound on complete</span>
                <div class="g-toggle${CONFIG.soundOnComplete?' on':''}" id="gitl-sound"></div>
            </div>
            <div class="g-peek-btn" id="gitl-peek-btn">${peekOpen?'▾ Hide prompt':'▸ What gets injected'}</div>
            <div class="g-peek${peekOpen?' open':''}" id="gitl-peek">${PAYLOADS[pm].preview}</div>
            <div class="g-shortcuts">Alt+P toggle · Alt+S stop</div>
            </div>
        `;

        // ——— Bind events ———
        document.getElementById('gitl-play')?.addEventListener('click', startLoop);
        document.getElementById('gitl-pause')?.addEventListener('click', pauseLoop);
        document.getElementById('gitl-stop')?.addEventListener('click', stopLoop);

        document.getElementById('mode-loop')?.addEventListener('click', () => {
            if (STATE.mode === 'RUNNING') return;
            STATE.payloadMode = 'loop'; STATE.needsPayload = true;
            GM_setValue('payloadMode','loop'); render();
        });
        document.getElementById('mode-think')?.addEventListener('click', () => {
            if (STATE.mode === 'RUNNING') return;
            STATE.payloadMode = 'think'; STATE.needsPayload = true;
            GM_setValue('payloadMode','think'); render();
        });

        document.getElementById('gitl-limit')?.addEventListener('change', e => {
            const v = parseInt(e.target.value,10);
            if (v>0&&v<=999) { CONFIG.maxRounds=v; GM_setValue('maxRounds',v); }
        });

        document.getElementById('gitl-sound')?.addEventListener('click', function() {
            this.classList.toggle('on');
            CONFIG.soundOnComplete = this.classList.contains('on');
            GM_setValue('soundOnComplete', CONFIG.soundOnComplete);
        });

        document.getElementById('gitl-quick')?.addEventListener('click', () => {
            STATE.mode === 'RUNNING' ? pauseLoop() : startLoop();
        });

        document.getElementById('gitl-collapse')?.addEventListener('click', () => {
            STATE.collapsed = !STATE.collapsed;
            GM_setValue('panelCollapsed', STATE.collapsed);
            render();
        });

        document.getElementById('gitl-peek-btn')?.addEventListener('click', () => {
            const box = document.getElementById('gitl-peek');
            const btn = document.getElementById('gitl-peek-btn');
            if (box && btn) {
                box.classList.toggle('open');
                btn.textContent = box.classList.contains('open') ? '▾ Hide prompt' : '▸ What gets injected';
            }
        });

        bindDrag();
    }

    render();

    // ═══════════════════════════════════════════════════════════════
    // 11. DRAGGABLE
    // ═══════════════════════════════════════════════════════════════
    let dragging=false, offX=0, offY=0;
    function bindDrag() {
        const handle = document.getElementById('gitl-drag');
        if (!handle) return;
        if (STATE.panelPos) { panel.style.right='auto'; panel.style.left=STATE.panelPos.x+'px'; panel.style.top=STATE.panelPos.y+'px'; }
        handle.addEventListener('mousedown', e => { dragging=true; const r=panel.getBoundingClientRect(); offX=e.clientX-r.left; offY=e.clientY-r.top; e.preventDefault(); });
    }
    document.addEventListener('mousemove', e => { if(!dragging) return; panel.style.right='auto'; panel.style.left=(e.clientX-offX)+'px'; panel.style.top=(e.clientY-offY)+'px'; });
    document.addEventListener('mouseup', () => { if(!dragging) return; dragging=false; const r=panel.getBoundingClientRect(); STATE.panelPos={x:r.left,y:r.top}; GM_setValue('panelPos',STATE.panelPos); });

    // ═══════════════════════════════════════════════════════════════
    // 12. KEYBOARD SHORTCUTS
    // ═══════════════════════════════════════════════════════════════
    document.addEventListener('keydown', e => {
        if (e.altKey && e.key.toLowerCase()==='p') { e.preventDefault(); STATE.mode==='RUNNING' ? pauseLoop() : startLoop(); }
        if (e.altKey && e.key.toLowerCase()==='s') { e.preventDefault(); stopLoop(); }
    });

    // ═══════════════════════════════════════════════════════════════
    // 13. MUTATION OBSERVER — instant "Continue generating" detection
    // ═══════════════════════════════════════════════════════════════
    new MutationObserver(() => { if (STATE.mode==='RUNNING') clickContinueIfPresent(); })
        .observe(document.body, { childList:true, subtree:true });

    console.log(`[Ghost in the Loop v4.2] ${PLATFORM.label}`);
})();
