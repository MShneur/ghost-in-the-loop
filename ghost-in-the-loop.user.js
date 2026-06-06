// ==UserScript==
// @name         Ghost in the Loop
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      4.1.0
// @description  👻 Your AI never shuts up (on purpose). Universal auto-proceed for ChatGPT, Perplexity, Gemini, DeepSeek, Copilot, Grok.
// @author       Michael (CTRL-AI)
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
// @run-at       document-idle
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
            inputSelectors: [
                '#prompt-textarea',
                'textarea[data-id="root"]',
                'div[contenteditable="true"][id="prompt-textarea"]',
                'textarea'
            ],
            sendSelectors: [
                'button[data-testid="send-button"]',
                'button[aria-label="Send prompt"]',
                'form button[class*="bottom"]'
            ],
            generatingSelectors: [
                'button[aria-label="Stop generating"]',
                'button[data-testid="stop-button"]'
            ],
            continueSelectors: [
                'button.btn-neutral:has(svg)',
                'button:has(> div > svg.icon-sm)',
            ],
            continueText: ['Continue generating', 'Continue'],
            assistantSelector: 'div[data-message-author-role="assistant"]',
            useNativeSetter: true
        },
        perplexity: {
            hostMatch: /perplexity\.ai/,
            label: 'Perplexity',
            inputSelectors: [
                'textarea[placeholder*="Ask"]',
                'textarea[placeholder*="Search"]',
                'textarea[placeholder*="Follow"]',
                'div[contenteditable="true"][role="textbox"]',
                'div[class*="ProseMirror"]',
                '[data-testid="composer"]',
                'textarea:not([disabled]):not([readonly])'
            ],
            sendSelectors: [
                'button[aria-label="Submit"]',
                'button[aria-label="Send"]',
                'button[type="submit"]',
            ],
            generatingSelectors: [
                'button[aria-label="Stop"]',
                '[data-testid="stop-button"]',
                'button:has(svg[data-icon="stop"])'
            ],
            continueSelectors: [],
            continueText: [],
            assistantSelector: [
                'div[class*="prose"]',
                'div[dir="auto"][class*="break-words"]',
                '.pb-md > div'
            ],
            useNativeSetter: false,
            useContentEditable: true
        },
        gemini: {
            hostMatch: /gemini\.google\.com/,
            label: 'Gemini',
            inputSelectors: [
                'div.ql-editor[contenteditable="true"]',
                'rich-textarea div[contenteditable="true"]',
                '.input-area textarea',
                'div[contenteditable="true"]'
            ],
            sendSelectors: [
                'button[aria-label="Send message"]',
                'button.send-button',
                'button[mat-icon-button][aria-label*="Send"]'
            ],
            generatingSelectors: [
                'button[aria-label="Stop response"]',
                'mat-icon[data-mat-icon-name="stop_circle"]'
            ],
            continueSelectors: [],
            continueText: [],
            assistantSelector: 'model-response message-content',
            useNativeSetter: false,
            useContentEditable: true
        },
        deepseek: {
            hostMatch: /chat\.deepseek\.com/,
            label: 'DeepSeek',
            inputSelectors: ['textarea[placeholder]', '#chat-input', 'textarea'],
            sendSelectors: ['div[class*="send"]', 'button[class*="send"]', 'button[aria-label*="Send"]'],
            generatingSelectors: ['div[class*="stop"]', 'button[class*="stop"]'],
            continueSelectors: [],
            continueText: [],
            assistantSelector: 'div[class*="markdown"]',
            useNativeSetter: false
        },
        copilot: {
            hostMatch: /copilot\.microsoft\.com/,
            label: 'Copilot',
            inputSelectors: ['textarea#userInput', '#searchbox', 'textarea[placeholder*="message"]', 'textarea'],
            sendSelectors: ['button[aria-label="Submit"]', 'button[title="Submit"]'],
            generatingSelectors: ['button[aria-label="Stop Responding"]', 'cib-typing-indicator'],
            continueSelectors: [],
            continueText: [],
            assistantSelector: 'cib-message-group[source="bot"]',
            useNativeSetter: false
        },
        grok: {
            hostMatch: /grok\.com/,
            label: 'Grok',
            inputSelectors: ['textarea[placeholder*="Ask"]', 'textarea', 'div[contenteditable="true"]'],
            sendSelectors: ['button[aria-label="Send"]', 'button[type="submit"]'],
            generatingSelectors: ['button[aria-label="Stop"]'],
            continueSelectors: [],
            continueText: [],
            assistantSelector: 'div[class*="message"][class*="bot"], div[data-role="assistant"]',
            useNativeSetter: false
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // 2. DETECT PLATFORM
    // ═══════════════════════════════════════════════════════════════

    const hostname = location.hostname;
    let PLATFORM = null;
    for (const [key, profile] of Object.entries(PLATFORMS)) {
        if (profile.hostMatch.test(hostname)) {
            PLATFORM = { id: key, ...profile };
            break;
        }
    }
    if (!PLATFORM) return;

    // ═══════════════════════════════════════════════════════════════
    // 3. CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    // The payload the AI sees. Human-readable version shown in the panel.
    const PAYLOAD_DISPLAY = [
        '📋 Injected instructions:',
        '─────────────────────────',
        '• Execute the task step by step.',
        '• End each response with a progress line:',
        '  ████░░░░ [Step X/Y] — description',
        '• After the progress line:',
        '  → More steps remain → last word: PROCEED',
        '  → Task fully done   → last word: SYSTEM_HALT',
        '─────────────────────────',
    ].join('\n');

    const PAYLOAD_INJECT = `

---
[LOOP PROTOCOL — follow exactly]
1. Execute this task step by step. One logical chunk per response.
2. At the END of every response, print a progress bar in this exact format:
   ████░░░░ [Step X/Y] — short description of what you just completed
   where X = current step, Y = your best estimate of total steps.
   Use █ for completed proportion and ░ for remaining.
3. After the progress bar, on a new line:
   - If MORE steps remain, your absolute last word must be: PROCEED
   - If the ENTIRE task is COMPLETE, your absolute last word must be: SYSTEM_HALT
4. Do NOT ask clarifying questions. Make reasonable assumptions and execute.
5. Do NOT skip the progress bar or the final keyword. The automation depends on it.
---`;

    const STOP_KEYWORD = 'SYSTEM_HALT';
    const PROCEED_KEYWORD = 'PROCEED';
    const PROCEED_TEXT = 'Continue';

    const CONFIG = {
        checkInterval: 2500,
        maxRounds: GM_getValue('maxRounds', 50),
        soundOnComplete: GM_getValue('soundOnComplete', true),
    };

    // ═══════════════════════════════════════════════════════════════
    // 4. STATE
    // ═══════════════════════════════════════════════════════════════

    const STATE = {
        mode: 'IDLE',       // IDLE | RUNNING | PAUSED | COMPLETE | ERROR
        rounds: 0,
        needsPayload: true, // true = next Play press injects the payload
        loopTimer: null,
        panelPos: GM_getValue('panelPos', null),
        lastProgress: null  // { step, total, desc }
    };

    // ═══════════════════════════════════════════════════════════════
    // 5. DOM HELPERS
    // ═══════════════════════════════════════════════════════════════

    function qFirst(selectors) {
        const sels = Array.isArray(selectors) ? selectors : [selectors];
        for (const sel of sels) {
            try { const el = document.querySelector(sel); if (el) return el; }
            catch (_) {}
        }
        return null;
    }

    function qAll(selectors) {
        const sels = Array.isArray(selectors) ? selectors : [selectors];
        for (const sel of sels) {
            try { const els = document.querySelectorAll(sel); if (els.length) return els; }
            catch (_) {}
        }
        return [];
    }

    function getInput()    { return qFirst(PLATFORM.inputSelectors); }
    function getSendBtn()  { return qFirst(PLATFORM.sendSelectors); }
    function isGenerating(){ return !!qFirst(PLATFORM.generatingSelectors); }

    function getLastAssistantText() {
        const els = qAll(PLATFORM.assistantSelector);
        if (!els.length) return '';
        return els[els.length - 1].innerText.trim();
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. TEXT INJECTION
    // ═══════════════════════════════════════════════════════════════

    function injectText(el, text) {
        if (!el) return false;
        if (el.getAttribute('contenteditable') === 'true') {
            el.focus();
            el.innerHTML = '';
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
        if (!input) { setMode('ERROR', 'Input not found'); return false; }
        if (!injectText(input, text)) { setMode('ERROR', 'Inject failed'); return false; }
        setTimeout(() => {
            if (STATE.mode !== 'RUNNING') return;
            const tryClick = () => {
                const btn = getSendBtn();
                if (btn && !btn.disabled) { btn.click(); STATE.rounds++; renderPanel(); return true; }
                return false;
            };
            if (!tryClick()) setTimeout(tryClick, 800);
        }, 600);
        return true;
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. CONTINUE-GENERATING AUTO-CLICK
    // ═══════════════════════════════════════════════════════════════

    function clickContinueIfPresent() {
        const btn = qFirst(PLATFORM.continueSelectors || []);
        if (btn) { btn.click(); return true; }
        if (PLATFORM.continueText?.length) {
            for (const b of document.querySelectorAll('button')) {
                const txt = b.textContent.trim();
                if (PLATFORM.continueText.some(ct => txt.includes(ct))) { b.click(); return true; }
            }
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. PROGRESS BAR PARSER
    //    Reads the AI's "[Step X/Y]" output and returns structured data
    // ═══════════════════════════════════════════════════════════════

    function parseProgress(text) {
        // Match patterns like: [Step 3/10], [3/10], ████░░ [Step 3/10] — desc
        const match = text.match(/\[(?:Step\s*)?(\d+)\s*\/\s*(\d+)\](?:\s*[—–-]\s*(.+))?/i);
        if (!match) return null;
        return {
            step: parseInt(match[1], 10),
            total: parseInt(match[2], 10),
            desc: match[3]?.trim() || ''
        };
    }

    function buildProgressBar(p) {
        if (!p) return '';
        const pct = Math.round((p.step / p.total) * 100);
        const filled = Math.round((p.step / p.total) * 12);
        const bar = '█'.repeat(filled) + '░'.repeat(12 - filled);
        return `${bar} ${p.step}/${p.total} (${pct}%)`;
    }

    // ═══════════════════════════════════════════════════════════════
    // 9. STATE MACHINE
    // ═══════════════════════════════════════════════════════════════

    function setMode(mode, detail = '') {
        STATE.mode = mode;
        renderPanel();
    }

    function tick() {
        if (STATE.mode !== 'RUNNING') return;
        if (STATE.rounds >= CONFIG.maxRounds) { halt('Round limit hit'); return; }
        if (isGenerating()) return;
        if (clickContinueIfPresent()) return;

        const sendBtn = getSendBtn();
        if (!sendBtn || sendBtn.disabled) return;

        const lastText = getLastAssistantText();
        if (!lastText) return;

        // Parse progress from the AI's response
        const progress = parseProgress(lastText);
        if (progress) STATE.lastProgress = progress;

        // Check keywords in tail
        const tail = lastText.slice(-300);

        if (tail.includes(STOP_KEYWORD)) {
            halt('✅ Job Complete!');
            return;
        }

        if (tail.includes(PROCEED_KEYWORD)) {
            renderPanel(); // update progress bar before sending
            injectAndSend(PROCEED_TEXT);
            return;
        }

        // Neither keyword → AI deviated → pause
        STATE.mode = 'PAUSED';
        clearInterval(STATE.loopTimer);
        renderPanel('AI deviated — review output');
    }

    function halt(reason) {
        STATE.mode = 'COMPLETE';
        STATE.needsPayload = true; // next Play = new cycle with fresh injection
        clearInterval(STATE.loopTimer);
        renderPanel(reason);
        if (CONFIG.soundOnComplete) playBeep();
    }

    // ═══════════════════════════════════════════════════════════════
    // 10. CONTROLS
    // ═══════════════════════════════════════════════════════════════

    function startLoop() {
        if (STATE.mode === 'RUNNING') return;

        // FRESH CYCLE: inject payload into whatever's in the text box
        if (STATE.needsPayload) {
            const input = getInput();
            if (!input) { setMode('ERROR', 'No input element'); return; }
            const currentText = (input.value || input.textContent || '').trim();
            if (!currentText) { setMode('ERROR', 'Type a prompt first'); return; }

            STATE.needsPayload = false;
            STATE.rounds = 0;
            STATE.lastProgress = null;
            STATE.mode = 'RUNNING';
            injectAndSend(currentText + PAYLOAD_INJECT);
            STATE.loopTimer = setInterval(tick, CONFIG.checkInterval);
            renderPanel();
            return;
        }

        // RESUME from pause
        STATE.mode = 'RUNNING';
        STATE.loopTimer = setInterval(tick, CONFIG.checkInterval);
        renderPanel();
        tick();
    }

    function pauseLoop() {
        STATE.mode = 'PAUSED';
        clearInterval(STATE.loopTimer);
        renderPanel('Paused');
    }

    function stopLoop() {
        STATE.mode = 'IDLE';
        STATE.rounds = 0;
        STATE.lastProgress = null;
        STATE.needsPayload = true;
        clearInterval(STATE.loopTimer);
        renderPanel();
    }

    // ═══════════════════════════════════════════════════════════════
    // 11. AUDIO
    // ═══════════════════════════════════════════════════════════════

    function playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [520, 680].forEach((freq, i) => {
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.type = 'sine'; osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.18);
                osc.stop(ctx.currentTime + 0.6 + i * 0.18);
            });
        } catch (_) {}
    }

    // ═══════════════════════════════════════════════════════════════
    // 12. UI
    // ═══════════════════════════════════════════════════════════════

    GM_addStyle(`
        #aap-panel {
            position: fixed; top: 16px; right: 16px; width: 240px;
            background: #1a1b1e; border: 1px solid #333; border-radius: 10px;
            padding: 10px 12px; z-index: 99999;
            font-family: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', monospace;
            font-size: 12px; color: #ccc;
            box-shadow: 0 6px 24px rgba(0,0,0,0.5); user-select: none;
        }
        #aap-panel * { box-sizing: border-box; }
        .aap-header { display:flex; justify-content:space-between; align-items:center;
            margin-bottom:8px; cursor:grab; padding:2px 0; }
        .aap-header:active { cursor: grabbing; }
        .aap-title { font-weight:700; font-size:11px; letter-spacing:0.5px;
            text-transform:uppercase; color:#999; }
        .aap-platform { font-size:10px; background:#2a2b30; padding:2px 6px;
            border-radius:4px; color:#6366f1; font-weight:600; }
        .aap-btns { display:flex; gap:4px; margin-bottom:8px; }
        .aap-btn { flex:1; padding:6px 0; border:1px solid #333; border-radius:6px;
            background:#2a2b30; color:#ccc; font-size:14px; cursor:pointer;
            text-align:center; transition:all 0.15s; font-family:inherit; }
        .aap-btn:hover { background:#3a3b40; }
        .aap-btn.play { background:#064e3b; border-color:#065f46; color:#34d399; }
        .aap-btn.play:hover { background:#065f46; }
        .aap-btn.stop { background:#450a0a; border-color:#7f1d1d; color:#f87171; }
        .aap-btn.stop:hover { background:#7f1d1d; }

        .aap-progress-bar { margin: 6px 0; }
        .aap-progress-track { height:6px; background:#2a2b30; border-radius:3px; overflow:hidden; }
        .aap-progress-fill { height:100%; background:linear-gradient(90deg,#34d399,#6366f1);
            border-radius:3px; transition:width 0.4s ease; }
        .aap-progress-label { display:flex; justify-content:space-between;
            font-size:10px; color:#888; margin-top:3px; }

        .aap-status { text-align:center; font-weight:600; font-size:11px;
            padding:4px 0; border-top:1px solid #2a2b2f; margin-top:2px; }
        .aap-meta { display:flex; justify-content:space-between; font-size:10px;
            color:#666; margin-top:4px; }
        .aap-meta input { width:44px; background:#2a2b30; border:1px solid #444;
            border-radius:4px; color:#ccc; font-size:10px; padding:2px 4px;
            text-align:center; font-family:inherit; }
        .aap-settings-row { display:flex; align-items:center; justify-content:space-between;
            font-size:10px; color:#888; margin-top:6px; padding-top:6px;
            border-top:1px solid #2a2b2f; }
        .aap-toggle { width:28px; height:14px; background:#333; border-radius:7px;
            position:relative; cursor:pointer; transition:background 0.2s; }
        .aap-toggle.on { background:#065f46; }
        .aap-toggle::after { content:''; width:10px; height:10px; background:#ccc;
            border-radius:50%; position:absolute; top:2px; left:2px; transition:left 0.2s; }
        .aap-toggle.on::after { left:16px; background:#34d399; }

        .aap-payload-toggle { font-size:9px; color:#555; cursor:pointer;
            text-align:center; margin-top:6px; padding-top:4px;
            border-top:1px solid #2a2b2f; }
        .aap-payload-toggle:hover { color:#999; }
        .aap-payload-box { display:none; margin-top:6px; padding:6px;
            background:#111; border:1px solid #2a2b30; border-radius:4px;
            font-size:9px; line-height:1.5; color:#6b7280; white-space:pre-wrap;
            max-height:200px; overflow-y:auto; }
        .aap-payload-box.open { display:block; }

        .aap-shortcuts { font-size:9px; color:#555; text-align:center; margin-top:4px; }
    `);

    const panel = document.createElement('div');
    panel.id = 'aap-panel';
    document.body.appendChild(panel);

    let statusDetail = '';

    function renderPanel(detail) {
        if (detail !== undefined) statusDetail = detail;

        const colors = {
            IDLE:'#888', RUNNING:'#19c37d', PAUSED:'#f59e0b',
            COMPLETE:'#6366f1', ERROR:'#ef4444'
        };
        const statusLabels = {
            IDLE: 'Idle — type a prompt & press ▶',
            RUNNING: `Running — round ${STATE.rounds}`,
            PAUSED: statusDetail || 'Paused',
            COMPLETE: statusDetail || 'Complete',
            ERROR: statusDetail || 'Error'
        };

        const p = STATE.lastProgress;
        const pct = p ? Math.round((p.step / p.total) * 100) : 0;
        const progressHTML = p ? `
            <div class="aap-progress-bar">
                <div class="aap-progress-track">
                    <div class="aap-progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="aap-progress-label">
                    <span>Step ${p.step} / ${p.total}</span>
                    <span>${pct}%${p.desc ? ' — ' + p.desc : ''}</span>
                </div>
            </div>` : `
            <div class="aap-progress-bar">
                <div class="aap-progress-track">
                    <div class="aap-progress-fill" style="width:0%"></div>
                </div>
                <div class="aap-progress-label">
                    <span>Waiting for AI…</span><span>0%</span>
                </div>
            </div>`;

        const payloadOpen = panel.querySelector('.aap-payload-box')?.classList.contains('open');

        panel.innerHTML = `
            <div class="aap-header" id="aap-drag-handle">
                <span class="aap-title">👻 Ghost Loop</span>
                <span class="aap-platform">${PLATFORM.label}</span>
            </div>
            <div class="aap-btns">
                <button class="aap-btn play" id="aap-play" title="Start new cycle / Resume (Alt+P)">▶</button>
                <button class="aap-btn" id="aap-pause" title="Pause (Alt+P)">⏸</button>
                <button class="aap-btn stop" id="aap-stop" title="Stop & Reset (Alt+S)">■</button>
            </div>
            ${progressHTML}
            <div class="aap-status" id="aap-status"
                 style="color:${colors[STATE.mode] || '#888'}">
                ${statusLabels[STATE.mode] || STATE.mode}
            </div>
            <div class="aap-meta">
                <span>Rounds: <strong>${STATE.rounds}</strong></span>
                <span>Limit: <input id="aap-limit" type="number" min="1" max="999" value="${CONFIG.maxRounds}"></span>
            </div>
            <div class="aap-settings-row">
                <span>🔔 Sound on complete</span>
                <div class="aap-toggle ${CONFIG.soundOnComplete ? 'on' : ''}" id="aap-sound-toggle"></div>
            </div>
            <div class="aap-payload-toggle" id="aap-payload-toggle">
                ${payloadOpen ? '▾ Hide injected prompt' : '▸ Show injected prompt'}
            </div>
            <div class="aap-payload-box ${payloadOpen ? 'open' : ''}" id="aap-payload-box">${PAYLOAD_DISPLAY}</div>
            <div class="aap-shortcuts">Alt+P toggle ・ Alt+S stop</div>
        `;

        // Re-bind listeners after innerHTML rebuild
        document.getElementById('aap-play')?.addEventListener('click', startLoop);
        document.getElementById('aap-pause')?.addEventListener('click', pauseLoop);
        document.getElementById('aap-stop')?.addEventListener('click', stopLoop);
        document.getElementById('aap-limit')?.addEventListener('change', (e) => {
            const v = parseInt(e.target.value, 10);
            if (v > 0 && v <= 999) { CONFIG.maxRounds = v; GM_setValue('maxRounds', v); }
        });
        document.getElementById('aap-sound-toggle')?.addEventListener('click', function () {
            this.classList.toggle('on');
            CONFIG.soundOnComplete = this.classList.contains('on');
            GM_setValue('soundOnComplete', CONFIG.soundOnComplete);
        });
        document.getElementById('aap-payload-toggle')?.addEventListener('click', () => {
            const box = document.getElementById('aap-payload-box');
            const toggle = document.getElementById('aap-payload-toggle');
            if (box && toggle) {
                box.classList.toggle('open');
                toggle.textContent = box.classList.contains('open')
                    ? '▾ Hide injected prompt' : '▸ Show injected prompt';
            }
        });
        bindDrag();
    }

    // Initial render
    renderPanel();

    // ═══════════════════════════════════════════════════════════════
    // 13. DRAGGABLE
    // ═══════════════════════════════════════════════════════════════

    let dragging = false, offsetX = 0, offsetY = 0;

    function bindDrag() {
        const handle = document.getElementById('aap-drag-handle');
        if (!handle) return;
        // Restore saved position
        if (STATE.panelPos) {
            panel.style.right = 'auto';
            panel.style.left = STATE.panelPos.x + 'px';
            panel.style.top = STATE.panelPos.y + 'px';
        }
        handle.addEventListener('mousedown', (e) => {
            dragging = true;
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            e.preventDefault();
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        panel.style.right = 'auto';
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        const rect = panel.getBoundingClientRect();
        STATE.panelPos = { x: rect.left, y: rect.top };
        GM_setValue('panelPos', STATE.panelPos);
    });

    // ═══════════════════════════════════════════════════════════════
    // 14. KEYBOARD SHORTCUTS
    // ═══════════════════════════════════════════════════════════════

    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            STATE.mode === 'RUNNING' ? pauseLoop() : startLoop();
        }
        if (e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            stopLoop();
        }
    });

    // ═══════════════════════════════════════════════════════════════
    // 15. MUTATION OBSERVER
    // ═══════════════════════════════════════════════════════════════

    const observer = new MutationObserver(() => {
        if (STATE.mode !== 'RUNNING') return;
        clickContinueIfPresent();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log(`[Auto-Proceed V4.1] Loaded for ${PLATFORM.label}`);
})();
