/* Ouvert · admin */
(function () {
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const euro = n => (Number(n) || 0).toLocaleString('fr-FR') + ' €';

  const STATUTS = {
    'nouveau': 'Nouveau',
    'en-cours': 'En cours',
    'devis-envoye': 'Devis envoyé',
    'gagne': 'Gagné',
    'perdu': 'Perdu'
  };
  const OPEN = ['nouveau', 'en-cours', 'devis-envoye'];
  const PAGES = { '/': 'Accueil', '/a-propos': 'À propos', '/services': 'Services', '/realisations': 'Réalisations', '/contact': 'Contact', '/mentions-legales': 'Mentions légales' };

  const state = { devis: [], pricing: null, filter: 'open', q: '', content: {}, pending: {}, view: 'dash' };

  /* ---------- API ---------- */
  async function api(path, opts = {}) {
    const res = await fetch('/api/admin/' + path, Object.assign({ headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' }, opts));
    let j = {};
    try { j = await res.json(); } catch (e) {}
    if (res.status === 401 && path !== 'login') { showLogin(); throw new Error('Session expirée.'); }
    if (!res.ok || j.ok === false) throw new Error(j.message || 'Erreur ' + res.status);
    return j;
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2800);
  }

  /* ---------- Connexion ---------- */
  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#pw').focus(); }
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const st = $('#login-status'); st.textContent = 'Connexion…'; st.className = 'form-status';
    try {
      await api('login', { method: 'POST', body: JSON.stringify({ password: $('#pw').value }) });
      $('#pw').value = ''; st.textContent = '';
      start();
    } catch (err) { st.textContent = err.message; st.className = 'form-status err'; }
  });
  $('#logout').addEventListener('click', async () => {
    if (!confirmLeave()) return;
    await api('logout', { method: 'POST' }).catch(() => {});
    location.reload();
  });

  /* ---------- Navigation ---------- */
  function go(view) {
    if (state.view === 'editeur' && view !== 'editeur' && !confirmLeave()) return;
    state.view = view;
    $$('.side-nav button').forEach(b => { if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $$('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
    if (view === 'editeur' && !$('#ed-iframe').src) loadFrame();
    history.replaceState(null, '', '#' + view);
    window.scrollTo(0, 0);
  }
  $$('.side-nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
  document.addEventListener('click', e => { const g = e.target.closest('[data-goto]'); if (g) go(g.dataset.goto); });

  /* ---------- Devis ---------- */
  const fmtDate = iso => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const ago = iso => {
    const d = (Date.now() - new Date(iso)) / 86400000;
    if (d < 1) return "aujourd'hui"; if (d < 2) return 'hier'; return 'il y a ' + Math.floor(d) + ' j';
  };
  const statusPill = s => `<span class="status s-${esc(s)}">${esc(STATUTS[s] || s)}</span>`;
  const offreLabel = id => {
    const p = state.pricing && state.pricing.plans.find(x => x.id === id);
    return p ? p.name : (id === 'je-ne-sais-pas' ? 'Pas encore choisi' : id || '—');
  };

  async function loadDevis() {
    const j = await api('devis');
    state.devis = j.items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    renderDash(); renderDevis();
  }

  function renderDash() {
    const d = state.devis;
    const n = d.filter(x => x.status === 'nouveau').length;
    $('#st-new').textContent = n;
    $('#st-open').textContent = d.filter(x => OPEN.includes(x.status)).length;
    $('#st-won').textContent = d.filter(x => x.status === 'gagne').length;
    $('#st-amount').textContent = euro(d.filter(x => x.status === 'gagne').reduce((s, x) => s + (parseFloat(String(x.montant).replace(',', '.').replace(/[^\d.]/g, '')) || 0), 0));
    const c = $('#count-new'); c.textContent = n; c.hidden = !n;
    const list = $('#dash-list');
    list.innerHTML = d.length ? d.slice(0, 6).map(x => `<li><div><b>${esc(x.nom)}</b><span>${esc(x.activite)} · ${esc(offreLabel(x.offre))} · ${ago(x.created_at)}</span></div>${statusPill(x.status)}</li>`).join('')
      : '<li class="empty">Aucune demande pour l\'instant. Elles arriveront ici dès que quelqu\'un remplit le formulaire de contact.</li>';
  }

  function renderDevis() {
    const q = state.q.toLowerCase();
    const items = state.devis.filter(x => {
      if (state.filter === 'open' && !OPEN.includes(x.status)) return false;
      if (!['open', 'all'].includes(state.filter) && x.status !== state.filter) return false;
      if (q && ![x.nom, x.email, x.telephone, x.message, x.activite].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
    const box = $('#devis-list');
    if (!items.length) { box.innerHTML = '<p class="empty">Aucune demande dans cette liste.</p>'; return; }
    box.innerHTML = items.map(x => `
      <details class="dv" data-id="${esc(x.id)}">
        <summary>
          <div><b>${esc(x.nom)}</b><span class="sub-line">${esc(x.activite || '—')}</span></div>
          <span class="dv-offre">${esc(offreLabel(x.offre))}</span>
          <span class="dv-date">${fmtDate(x.created_at)}</span>
          ${statusPill(x.status)}
        </summary>
        <div class="dv-body">
          <div>
            <div class="dv-contact">
              <a href="mailto:${esc(x.email)}?subject=${encodeURIComponent('Votre projet de site · Ouvert')}">${esc(x.email)}</a>
              ${x.telephone ? `<a href="tel:${esc(x.telephone.replace(/\s/g, ''))}">${esc(x.telephone)}</a>` : ''}
            </div>
            <div class="dv-msg">${esc(x.message)}</div>
          </div>
          <form class="dv-form">
            <div class="field"><label>Statut
              <select name="status">${Object.entries(STATUTS).map(([k, v]) => `<option value="${k}"${k === x.status ? ' selected' : ''}>${v}</option>`).join('')}</select></label></div>
            <div class="field"><label>Montant du devis (€)<input name="montant" inputmode="decimal" value="${esc(x.montant)}"></label></div>
            <div class="field"><label>Notes<textarea name="note" rows="3">${esc(x.note)}</textarea></label></div>
            <div class="dv-actions">
              <button class="btn btn-green btn-sm" type="submit">Enregistrer</button>
              <a class="btn btn-grey btn-sm" href="mailto:${esc(x.email)}?subject=${encodeURIComponent('Votre projet de site · Ouvert')}">Répondre</a>
              <button class="btn btn-danger btn-sm" type="button" data-del>Supprimer</button>
            </div>
          </form>
        </div>
      </details>`).join('');
  }

  $('#devis-list').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, id = f.closest('.dv').dataset.id;
    const body = Object.fromEntries(new FormData(f).entries());
    body.id = id;
    try {
      const j = await api('devis', { method: 'PUT', body: JSON.stringify(body) });
      const i = state.devis.findIndex(x => x.id === id); state.devis[i] = j.item;
      renderDash(); renderDevis(); toast('Demande mise à jour.');
      const el = $(`.dv[data-id="${CSS.escape(id)}"]`); if (el) el.open = true;
    } catch (err) { toast(err.message); }
  });
  $('#devis-list').addEventListener('click', async e => {
    if (!e.target.matches('[data-del]')) return;
    const id = e.target.closest('.dv').dataset.id;
    if (!confirm('Supprimer cette demande ? C\'est définitif.')) return;
    try {
      await api('devis?id=' + encodeURIComponent(id), { method: 'DELETE' });
      state.devis = state.devis.filter(x => x.id !== id); renderDash(); renderDevis(); toast('Demande supprimée.');
    } catch (err) { toast(err.message); }
  });
  $$('#devis-filters button').forEach(b => b.addEventListener('click', () => {
    state.filter = b.dataset.f;
    $$('#devis-filters button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    renderDevis();
  }));
  $('#devis-q').addEventListener('input', e => { state.q = e.target.value; renderDevis(); });

  /* ---------- Offres & prix ---------- */
  async function loadPricing() {
    const j = await api('pricing');
    state.pricing = j.pricing;
    $('#prix-state').textContent = j.custom ? 'Prix modifiés · affichés sur le site' : 'Prix par défaut · affichés sur le site';
    renderPricing();
  }
  const fld = (label, name, val, attrs = '') => `<div class="field"><label>${label}<input name="${name}" value="${esc(val)}" ${attrs}></label></div>`;

  function renderPricing() {
    const p = state.pricing;
    $('#plan-forms').innerHTML = p.plans.map((pl, i) => `
      <fieldset class="pf${pl.featured ? ' is-feat' : ''}" data-i="${i}">
        <legend class="sr-only">Offre ${i + 1}</legend>
        ${fld('Nom de l\'offre', 'name', pl.name)}
        <div class="row3">
          ${fld('Avant le prix', 'prefix', pl.prefix, 'placeholder="ex. dès"')}
          ${fld('Prix (€)', 'price', pl.price, 'inputmode="decimal"')}
          ${fld('Sous le prix', 'note', pl.note)}
        </div>
        ${fld('Phrase', 'tagline', pl.tagline)}
        <div class="field"><label>Ce qui est compris <span class="opt">(une ligne par point)</span><textarea name="features">${esc((pl.features || []).join('\n'))}</textarea></label></div>
        ${fld('Texte du bouton', 'cta', pl.cta)}
        <label class="check-line"><input type="radio" name="featured" value="${i}"${pl.featured ? ' checked' : ''}> Mettre en avant (fond noir)</label>
        ${fld('Étiquette si mise en avant', 'badge', pl.badge)}
        <input type="hidden" name="id" value="${esc(pl.id)}">
      </fieldset>`).join('');
    $('#host-forms').innerHTML = p.hosting.map((h, i) => `
      <fieldset class="pf" data-h="${i}">
        <legend class="sr-only">Formule ${i + 1}</legend>
        ${fld('Nom', 'name', h.name)}
        ${fld('Ce qui est compris', 'desc', h.desc)}
        <div class="row2">${fld('Prix par mois (€)', 'month', h.month, 'inputmode="decimal"')}${fld('Prix par an (€)', 'year', h.year, 'inputmode="decimal"')}</div>
        <input type="hidden" name="id" value="${esc(h.id)}">
      </fieldset>`).join('');
    renderOptions();
  }
  function renderOptions() {
    $('#opt-forms').innerHTML = state.pricing.options.map((o, i) => `
      <div class="opt-row" data-o="${i}">
        ${fld('Option', 'name', o.name)}
        ${fld('Prix', 'price', o.price, 'inputmode="decimal"')}
        ${fld('Unité', 'unit', o.unit, 'placeholder="€, €/h, €/page"')}
        <input type="hidden" name="id" value="${esc(o.id)}">
        <div class="opt-btns">
          <button type="button" class="icon-btn" data-up aria-label="Monter">↑</button>
          <button type="button" class="icon-btn" data-rm aria-label="Supprimer">✕</button>
        </div>
      </div>`).join('');
  }
  function readPricing() {
    const val = (box, n) => { const el = box.querySelector(`[name="${n}"]`); return el ? el.value : ''; };
    const featured = ($('#plan-forms input[name="featured"]:checked') || {}).value;
    return {
      plans: $$('#plan-forms .pf').map((b, i) => ({
        id: val(b, 'id'), name: val(b, 'name'), prefix: val(b, 'prefix'), price: val(b, 'price'), note: val(b, 'note'),
        tagline: val(b, 'tagline'), features: val(b, 'features').split('\n'), cta: val(b, 'cta'), badge: val(b, 'badge'), featured: String(i) === featured
      })),
      hosting: $$('#host-forms .pf').map(b => ({ id: val(b, 'id'), name: val(b, 'name'), desc: val(b, 'desc'), month: val(b, 'month'), year: val(b, 'year') })),
      options: $$('#opt-forms .opt-row').map(b => ({ id: val(b, 'id'), name: val(b, 'name'), price: val(b, 'price'), unit: val(b, 'unit') }))
    };
  }
  $('#plan-forms').addEventListener('change', e => {
    if (e.target.name === 'featured') $$('#plan-forms .pf').forEach(f => f.classList.toggle('is-feat', f.contains(e.target)));
  });
  $('#opt-add').addEventListener('click', () => {
    state.pricing = readPricing();
    state.pricing.options.push({ id: '', name: '', price: '', unit: '€' });
    renderOptions(); $$('#opt-forms .opt-row input[name="name"]').pop().focus();
  });
  $('#opt-forms').addEventListener('click', e => {
    const row = e.target.closest('.opt-row'); if (!row) return;
    const i = +row.dataset.o;
    if (e.target.matches('[data-rm]') || e.target.matches('[data-up]')) {
      state.pricing = readPricing();
      const o = state.pricing.options;
      if (e.target.matches('[data-rm]')) o.splice(i, 1);
      else if (i > 0) [o[i - 1], o[i]] = [o[i], o[i - 1]];
      renderOptions();
    }
  });
  $('#prix-save').addEventListener('click', async () => {
    const st = $('#prix-status'); st.textContent = 'Enregistrement…'; st.className = 'form-status';
    try {
      const j = await api('pricing', { method: 'PUT', body: JSON.stringify(readPricing()) });
      state.pricing = j.pricing; renderPricing();
      $('#prix-state').textContent = 'Prix modifiés · affichés sur le site';
      st.textContent = 'C\'est en ligne. Les nouveaux prix sont affichés sur tout le site.'; st.className = 'form-status ok';
      toast('Prix enregistrés.');
      reloadFrame();
    } catch (err) { st.textContent = err.message; st.className = 'form-status err'; }
  });
  $('#prix-reset').addEventListener('click', async () => {
    if (!confirm('Revenir aux prix par défaut ? Vos prix modifiés seront effacés.')) return;
    try {
      const j = await api('pricing', { method: 'DELETE' });
      state.pricing = j.pricing; renderPricing();
      $('#prix-state').textContent = 'Prix par défaut · affichés sur le site';
      toast('Prix par défaut remis.'); reloadFrame();
    } catch (err) { toast(err.message); }
  });

  /* ---------- Éditeur visuel ---------- */
  const frame = $('#ed-iframe');
  let selKey = null;
  const pendingCount = () => Object.keys(state.pending).length;

  function loadFrame() { frame.src = $('#ed-page').value + '?edit=1'; }
  function reloadFrame() { if (frame.src) frame.src = $('#ed-page').value + '?edit=1&t=' + Date.now(); }
  function confirmLeave() {
    return !pendingCount() || confirm('Vous avez des modifications non enregistrées. Les abandonner ?');
  }
  function updateBar() {
    const n = pendingCount();
    const info = $('#ed-info');
    info.textContent = n ? `${n} modification${n > 1 ? 's' : ''} non enregistrée${n > 1 ? 's' : ''}` : 'Cliquez sur un texte pour le modifier.';
    info.classList.toggle('has-changes', !!n);
    $('#ed-save').disabled = !n; $('#ed-cancel').disabled = !n;
  }
  function renderEdList() {
    const keys = Object.keys(state.content);
    $('#ed-list').innerHTML = keys.length ? keys.map(k => {
      const page = k.split(':')[0];
      const label = { index: 'Accueil', 'a-propos': 'À propos', services: 'Services', realisations: 'Réalisations', contact: 'Contact', 'mentions-legales': 'Mentions légales', global: 'Toutes les pages', '404': 'Page 404' }[page] || page;
      return `<li><div>${esc(state.content[k].slice(0, 90))}<span>${esc(label)}</span></div><button type="button" data-reset="${esc(k)}">Annuler</button></li>`;
    }).join('') : '<li class="hint">Aucun texte modifié pour l\'instant.</li>';
  }
  async function saveContent(changes) {
    const j = await api('content', { method: 'PUT', body: JSON.stringify({ changes }) });
    state.content = j.content; renderEdList();
  }

  window.addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data || e.source !== frame.contentWindow) return;
    const d = e.data;
    if (d.type === 'ouvert-ready') updateBar();
    if (d.type === 'ouvert-edit') {
      if (d.value === d.orig) delete state.pending[d.key]; else state.pending[d.key] = d.value;
      updateBar();
      if (d.key === selKey) $('#ed-sel').textContent = d.value;
    }
    if (d.type === 'ouvert-focus') {
      selKey = d.key; $('#ed-sel').textContent = d.text;
      $('#ed-restore').disabled = !(d.key in state.content) && !(d.key in state.pending);
    }
  });
  $('#ed-save').addEventListener('click', async () => {
    try {
      await saveContent(state.pending);
      state.pending = {}; updateBar(); toast('Textes enregistrés. C\'est en ligne.');
      reloadFrame();
    } catch (err) { toast(err.message); }
  });
  $('#ed-cancel').addEventListener('click', () => {
    state.pending = {}; updateBar();
    frame.contentWindow.postMessage({ type: 'ouvert-revert' }, location.origin);
  });
  $('#ed-restore').addEventListener('click', async () => {
    if (!selKey) return;
    delete state.pending[selKey];
    try { if (selKey in state.content) await saveContent({ [selKey]: null }); toast('Texte d\'origine remis.'); reloadFrame(); updateBar(); }
    catch (err) { toast(err.message); }
  });
  $('#ed-list').addEventListener('click', async e => {
    const k = e.target.dataset.reset; if (!k) return;
    try { await saveContent({ [k]: null }); toast('Texte d\'origine remis.'); reloadFrame(); }
    catch (err) { toast(err.message); }
  });
  $('#ed-page').addEventListener('change', e => {
    if (!confirmLeave()) { e.target.value = new URL(frame.src).pathname; return; }
    state.pending = {}; updateBar(); loadFrame();
  });
  $$('[data-device]').forEach(b => b.addEventListener('click', () => {
    $$('[data-device]').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    $('#ed-frame').classList.toggle('is-mob', b.dataset.device === 'mob');
  }));
  window.addEventListener('beforeunload', e => { if (pendingCount()) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Démarrage ---------- */
  async function start() {
    try {
      const me = await api('me');
      $('#login').hidden = true; $('#app').hidden = false;
      $('#today').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      $('#notify-hint').textContent = me.notify ? 'Vous recevez un mail à chaque nouvelle demande.' : 'Astuce : ajoutez RESEND_API_KEY et NOTIFY_EMAIL sur Cloudflare pour recevoir un mail à chaque demande.';
      await loadPricing();
      await loadDevis();
      const c = await api('content'); state.content = c.content; renderEdList();
      const v = location.hash.slice(1);
      if (['dash', 'devis', 'prix', 'editeur'].includes(v)) go(v);
    } catch (err) {
      if (!$('#app').hidden) toast(err.message);
      else { $('#login').hidden = false; const st = $('#login-status'); st.textContent = err.message; st.className = 'form-status err'; }
    }
  }
  fetch('/api/admin/me', { credentials: 'same-origin' }).then(r => r.ok ? start() : showLogin()).catch(showLogin);
})();
