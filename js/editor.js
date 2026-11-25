/* Ouvert · mode édition (chargé seulement dans l'aperçu de l'admin) */
(function () {
  const origin = location.origin;
  const els = Array.from(document.querySelectorAll('[data-edit]'));
  const css = document.createElement('style');
  css.textContent = `
    [data-edit]{outline:1.5px dashed transparent;outline-offset:4px;border-radius:2px;cursor:text;transition:outline-color .2s,background-color .2s}
    [data-edit]:hover{outline-color:rgba(11,122,79,.7)}
    [data-edit]:focus{outline:2px solid #0B7A4F;background:rgba(11,122,79,.07)}
    .closing [data-edit]:focus,.hosts [data-edit]:focus,.plan-featured [data-edit]:focus{background:rgba(43,211,138,.12)}
    [data-edit].oe-changed{outline:1.5px solid #2BD38A}
    a,button,summary{cursor:default}
  `;
  document.head.appendChild(css);

  const clean = t => t.replace(/\s+/g, ' ').trim();
  els.forEach(el => {
    try { el.contentEditable = 'plaintext-only'; } catch (e) { el.contentEditable = 'true'; }
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.dataset.orig = clean(el.textContent);
    el.addEventListener('input', () => send(el));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') { el.textContent = el.dataset.orig; send(el); el.blur(); }
    });
    el.addEventListener('paste', e => {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, clean(t));
    });
  });

  function send(el) {
    const key = el.dataset.edit;
    const value = clean(el.textContent);
    document.querySelectorAll('[data-edit="' + key + '"]').forEach(o => {
      if (o !== el) o.textContent = value;
      o.classList.toggle('oe-changed', value !== o.dataset.orig);
    });
    parent.postMessage({ type: 'ouvert-edit', key, value, orig: el.dataset.orig }, origin);
  }

  // Les liens ne naviguent pas en mode édition
  document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }, true);
  document.addEventListener('submit', e => e.preventDefault(), true);

  document.addEventListener('focusin', e => {
    const el = e.target.closest && e.target.closest('[data-edit]');
    if (el) parent.postMessage({ type: 'ouvert-focus', key: el.dataset.edit, text: clean(el.textContent) }, origin);
  });

  // Ordres de l'admin
  window.addEventListener('message', e => {
    if (e.origin !== origin || !e.data) return;
    if (e.data.type === 'ouvert-revert') {
      document.querySelectorAll('[data-edit]').forEach(el => {
        el.textContent = el.dataset.orig; el.classList.remove('oe-changed');
      });
    }
  });

  parent.postMessage({ type: 'ouvert-ready', count: els.length, title: document.title }, origin);
})();
