// Nettoyage des données envoyées par l'admin.
const str = (v, max = 300) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const num = v => {
  const s = String(v == null ? '' : v).replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};
const slug = (v, i) => (str(v, 40).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item-' + i);

export function cleanPricing(b) {
  if (!b || !Array.isArray(b.plans) || !Array.isArray(b.hosting) || !Array.isArray(b.options)) throw new Error('Format invalide.');
  const plans = b.plans.slice(0, 6).map((p, i) => ({
    id: slug(p.id || p.name, i),
    name: str(p.name, 60) || 'Offre',
    tagline: str(p.tagline, 160),
    prefix: str(p.prefix, 20),
    price: num(p.price),
    note: str(p.note, 60),
    features: (Array.isArray(p.features) ? p.features : String(p.features || '').split('\n')).map(f => str(f, 160)).filter(Boolean).slice(0, 15),
    featured: !!p.featured,
    badge: str(p.badge, 40),
    cta: str(p.cta, 60)
  }));
  if (!plans.length) throw new Error('Il faut au moins une offre.');
  const hosting = b.hosting.slice(0, 4).map((h, i) => ({ id: slug(h.id || h.name, i), name: str(h.name, 60), desc: str(h.desc, 240), month: num(h.month), year: num(h.year) }));
  const options = b.options.slice(0, 30).map((o, i) => ({ id: slug(o.id || o.name, i), name: str(o.name, 80), price: num(o.price), unit: str(o.unit, 20) || '€' })).filter(o => o.name);
  return { plans, hosting, options, updated_at: new Date().toISOString() };
}

export function cleanText(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 2000); }
