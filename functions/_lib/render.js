// Rendu HTML des offres, partagé par le serveur (middleware) et le générateur de pages.
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function fmt(n) {
  const x = Number(n);
  if (!isFinite(x) || String(n).trim() === '') return esc(n);
  return x.toLocaleString('fr-FR', { maximumFractionDigits: 2 }).replace(/ /g, ' ');
}
const euro = n => fmt(n) + ' €';

export function renderPlans(p) {
  return p.plans.map(pl => `
      <article class="plan${pl.featured ? ' plan-featured' : ''}" id="${esc(pl.id)}">
        ${pl.featured && pl.badge ? `<p class="badge"><span class="voyant" aria-hidden="true"></span>${esc(pl.badge)}</p>` : ''}
        <h3 class="plan-name">${esc(pl.name)}</h3>
        <p class="plan-for">${esc(pl.tagline)}</p>
        <p class="price">${pl.prefix ? `<span class="from">${esc(pl.prefix)}</span>` : ''}<span class="amount">${euro(pl.price)}</span><span class="per">${esc(pl.note)}</span></p>
        <ul class="ticks">
          ${(pl.features || []).map(f => `<li>${esc(f)}</li>`).join('\n          ')}
        </ul>
        <a class="btn ${pl.featured ? 'btn-green' : 'btn-grey'} btn-block" href="contact.html?offre=${encodeURIComponent(pl.id)}">${esc(pl.cta || 'Choisir ' + pl.name)}</a>
      </article>`).join('') + '\n    ';
}

export function renderHosting(p) {
  return p.hosting.map(h => `
          <div class="host-row">
            <div><b>${esc(h.name)}</b><p>${esc(h.desc)}</p></div>
            <p class="host-price"><b>${euro(h.month)}</b>/mois<br><span>ou ${euro(h.year)}/an</span></p>
          </div>`).join('') + '\n        ';
}

export function renderOptions(p) {
  return p.options.map(o => `
          <div><dt>${esc(o.name)}</dt><dd>${fmt(o.price)} ${esc(o.unit || '€')}</dd></div>`).join('') + '\n        ';
}

/** Libellé court d'une offre : "Vitrine · 390 €" */
export function planLabel(p, id) {
  const pl = p.plans.find(x => x.id === id);
  if (!pl) return '';
  return `${pl.name} · ${pl.prefix ? pl.prefix + ' ' : ''}${euro(pl.price)}`;
}

/** Jetons de prix utilisés dans les textes : plan:ID, host:ID:month|year, opt:ID */
export function priceToken(p, token) {
  const [kind, id, field] = String(token).split(':');
  if (kind === 'plan') { const x = p.plans.find(y => y.id === id); return x ? euro(x.price) : ''; }
  if (kind === 'host') { const x = p.hosting.find(y => y.id === id); return x ? euro(x[field] || x.month) : ''; }
  if (kind === 'opt') { const x = p.options.find(y => y.id === id); return x ? `${fmt(x.price)} ${x.unit || '€'}` : ''; }
  return '';
}

export function renderJsonLd(p) {
  const prices = p.plans.map(x => Number(x.price)).filter(isFinite);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Ouvert',
    url: 'https://studio-ouvert.fr/',
    email: 'contact@studio-ouvert.fr',
    slogan: 'Ouvert même quand vous êtes fermé.',
    description: "Création de sites web simples, rapides et beaux pour artisans, commerçants, indépendants et loueurs en courte durée autour d'Annecy.",
    founder: { '@type': 'Person', name: 'Théo Bonaventure' },
    address: { '@type': 'PostalAddress', addressLocality: 'Annecy', addressRegion: 'Haute-Savoie', addressCountry: 'FR' },
    areaServed: [{ '@type': 'AdministrativeArea', name: 'Haute-Savoie' }, { '@type': 'Country', name: 'France' }],
    priceRange: prices.length ? `${Math.min(...prices)} € – ${Math.max(...prices)} €+` : undefined,
    makesOffer: p.plans.map(x => ({ '@type': 'Offer', name: x.name, price: String(x.price), priceCurrency: 'EUR' }))
  };
  return '\n' + JSON.stringify(data, null, 2).replace(/</g, '\\u003c') + '\n';
}

/** Tout ce dont le générateur a besoin, d'un coup. */
export function renderAll(p, tokens = [], labels = []) {
  const t = {}; tokens.forEach(k => { t[k] = priceToken(p, k); });
  const l = {}; labels.forEach(k => { l[k] = planLabel(p, k); });
  return { plans: renderPlans(p), hosting: renderHosting(p), options: renderOptions(p), jsonld: renderJsonLd(p), tokens: t, labels: l };
}
