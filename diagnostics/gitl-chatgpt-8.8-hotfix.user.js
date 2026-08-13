// ==UserScript==
// @name         Ghost in the Loop 8.8 ChatGPT Live Hotfix
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      8.8.0-hotfix.1
// @description  Temporary ChatGPT field hotfix for Ghost 8.8.0: semantic Send substitution and Ghost-button default-action guard.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-start
// @noframes
// @grant        none
// @license      AGPL-3.0
// ==/UserScript==

(() => {
  'use strict';

  const SEND_SELECTORS = [
    'button[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Send"]',
    'button[aria-label="Send message"]',
    'button[aria-label^="Send "]',
    'button[data-testid*="send"]',
    'button[data-testid*="submit"]'
  ];

  const VETO = /stop|voice|mic|microphone|attach|upload|tool|model|picker|dropdown|emoji|format|cancel/i;

  function visible(el) {
    if (!(el instanceof Element)) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  function safeSend(el) {
    if (!(el instanceof HTMLButtonElement)) return false;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
    if (el.hasAttribute('aria-haspopup') || el.getAttribute('aria-expanded') === 'true') return false;
    const surface = [el.id, el.getAttribute('aria-label'), el.getAttribute('data-testid'), el.textContent]
      .filter(Boolean).join(' ');
    return !VETO.test(surface) && visible(el);
  }

  function isChatComposer(el) {
    if (!(el instanceof Element)) return false;
    return el.matches('#prompt-textarea, div[contenteditable="true"][id="prompt-textarea"], textarea[data-id="root"], textarea');
  }

  function findUniqueSend(composer) {
    const roots = [];
    const form = composer.closest('form');
    if (form) roots.push(form);
    const composerRoot = composer.closest('[data-testid="composer"], [class*="composer"], main');
    if (composerRoot && !roots.includes(composerRoot)) roots.push(composerRoot);
    roots.push(document);

    for (const root of roots) {
      const found = [];
      for (const sel of SEND_SELECTORS) {
        for (const el of root.querySelectorAll(sel)) {
          if (safeSend(el) && !found.includes(el)) found.push(el);
        }
      }
      if (found.length === 1) return found[0];
      if (found.length > 1) return null;
    }
    return null;
  }

  // Ghost 8.8 emits exactly one synthetic Enter when its reviewed ChatGPT
  // button selectors do not resolve. On current ChatGPT builds the real Send
  // control may be semantically labelled "Send message" instead. Intercept the
  // synthetic Enter in capture phase before ChatGPT sees it, and substitute one
  // exact button click only when a unique safe semantic Send exists.
  document.addEventListener('keydown', (event) => {
    if (event.isTrusted || event.key !== 'Enter' || !document.getElementById('gitl')) return;
    const composer = event.target;
    if (!isChatComposer(composer)) return;
    const send = findUniqueSend(composer);
    if (!send) return; // fail closed: leave Ghost's original reviewed Enter path untouched
    event.preventDefault();
    event.stopImmediatePropagation();
    send.click();
  }, true);

  // Ghost controls are transport/configuration controls, never host-form
  // submitters. Cancel any host default action while preserving Ghost's own
  // bubbling handlers. This guards the reported jump-to-page-top behavior.
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('#gitl button') : null;
    if (button) event.preventDefault();
  }, true);
})();
