/* ============================================================================
Components - small, framework-free UI primitives shared across views.
============================================================================ */
(function () {
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(message, type = 'success') {
const region = document.getElementById('toast-region');
const el = document.createElement('div');
el.className = `toast toast--${type}`;
el.setAttribute('role', 'status');
el.innerHTML = `${icon(type === 'success' ? 'checkCircle' : 'bell')}<span>${esc(message)}</span>`;
region.appendChild(el);
requestAnimationFrame(() => el.classList.add('toast--in'));
setTimeout(() => { el.classList.remove('toast--in'); setTimeout(() => el.remove(), 250); }, 3200);
}

function ring(percent, { size = 116, stroke = 9, label = '', sub = '' } = {}) {
const r = (size - stroke) / 2;
const c = 2 * Math.PI * r;
const offset = c - (Math.max(0, Math.min(100, percent)) / 100) * c;
return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="ring__track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none"/><circle class="ring__bar" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none" stroke-dasharray="${c}" stroke-dashoffset="${offset}" transform="rotate(-90 ${size/2} ${size/2})" stroke-linecap="round"/></svg><div class="ring__label"><strong>${label || percent + '%'}</strong>${sub ? `<span>${esc(sub)}</span>` : ''}</div></div>`;
}

let lastFocus = null;
function modal({ title, body, actions = [], onMount }) {
const root = document.getElementById('modal-root');
lastFocus = document.activeElement;
root.innerHTML = `<div class="modal-overlay" data-close><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal__head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Close dialog">${icon('close')}</button></div><div class="modal__body">${body}</div><div class="modal__foot">${actions.map((a, i) => `<button class="btn ${a.variant ? 'btn--' + a.variant : 'btn--ghost'}" data-action="${i}">${esc(a.label)}</button>`).join('')}</div></div></div>`;
const overlay = root.querySelector('.modal-overlay');
const dialog = root.querySelector('.modal');
requestAnimationFrame(() => overlay.classList.add('modal-overlay--in'));
function close() { overlay.classList.remove('modal-overlay--in'); setTimeout(() => { root.innerHTML = ''; if (lastFocus) lastFocus.focus(); }, 200); document.removeEventListener('keydown', onKey); }
function onKey(e) {
if (e.key === 'Escape') close();
if (e.key === 'Tab') { const f = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
}
document.addEventListener('keydown', onKey);
root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', (e) => { if (e.target.closest('[data-close]') === b) close(); }));
overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
actions.forEach((a, i) => { const btn = dialog.querySelector(`[data-action="${i}"]`); btn.addEventListener('click', () => { const result = a.onClick ? a.onClick({ dialog, close }) : true; if (result !== false && !a.keepOpen) close(); }); });
if (onMount) onMount({ dialog, close });
const firstInput = dialog.querySelector('input, textarea, select');
(firstInput || dialog.querySelector('button')).focus();
return { close };
}

function confirmDialog({ title, message, confirmLabel = 'Delete', onConfirm }) {
modal({ title, body: `<p class="muted" style="margin:0">${esc(message)}</p>`, actions: [ { label: 'Cancel' }, { label: confirmLabel, variant: 'danger', onClick: () => { onConfirm(); } } ] });
}

function field({ id, label, type = 'text', value = '', placeholder = '', required = false, options, hint, rows }) {
const req = required ? '<span class="req" aria-hidden="true">*</span>' : '';
let control;
if (type === 'select') { control = `<select id="${id}" name="${id}" ${required ? 'required' : ''}>${options.map((o) => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`; }
else if (type === 'textarea') { control = `<textarea id="${id}" name="${id}" rows="${rows || 3}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}>${esc(value)}</textarea>`; }
else if (type === 'range') { control = `<div class="range-row"><input id="${id}" name="${id}" type="range" min="0" max="100" value="${esc(value || 0)}" /><output for="${id}">${esc(value || 0)}%</output></div>`; }
else { control = `<input id="${id}" name="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} />`; }
return `<div class="form-field"><label for="${id}">${esc(label)} ${req}</label>${control}${hint ? `<small class="form-hint">${esc(hint)}</small>` : ''}</div>`;
}

window.UI = { toast, ring, modal, confirmDialog, field, esc };
})();
