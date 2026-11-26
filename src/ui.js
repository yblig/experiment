import { audio } from './lib/audio.js';
import { settings } from './settings.js';
import { native } from './lib/native.js';
import { icon } from './art.js';

export const ui = {};
export const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const sfx = (k, o = {}) => audio.play(k, { ...o, volume: settings.get('uiVol') * (o.volume || 1) });

let toastTimer;
export function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = el('<div class="toast"></div>'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
native.toast = toast;

// Bottom sheet. handler(key, bodyEl) returns true to close.
let cur = null;
export const sheet = {
  open(html, handler, { dismiss } = {}) {
    sheet.close(true);
    const wrap = el(`<div class="sheet-wrap"><div class="scrim"></div><div class="sheet"><div class="grab"></div><button class="ib x" data-close>${icon('close', 20)}</button><div class="body">${html}</div></div></div>`);
    document.body.appendChild(wrap);
    const body = wrap.querySelector('.body');
    const close = () => { if (cur?.wrap !== wrap) return; cur = null; wrap.classList.remove('in'); setTimeout(() => wrap.remove(), 250); };
    cur = { wrap, close, dismiss };
    wrap.addEventListener('click', e => {
      if (e.target.classList.contains('scrim') || e.target.closest('[data-close]')) { sfx('ui_back'); close(); dismiss?.(); return; }
      const b = e.target.closest('[data-s]'); if (!b) return;
      if (handler(b.dataset.s, body, b)) close();
    });
    wrap.addEventListener('input', e => { const i = e.target.closest('[data-in]'); if (i) handler('in:' + i.dataset.in, body, i); });
    requestAnimationFrame(() => wrap.classList.add('in'));
    return body;
  },
  close(silent) { if (!cur) return false; const c = cur; c.close(); if (!silent) c.dismiss?.(); return true; }
};
