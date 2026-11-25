// Injecte dans chaque page HTML les prix et les textes modifiés depuis l'admin.
import { getPricing, getContent, hasKV } from './_lib/store.js';
import { renderPlans, renderHosting, renderOptions, priceToken, planLabel, renderJsonLd } from './_lib/render.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const res = await next();
  const url = new URL(request.url);
  const type = res.headers.get('content-type') || '';
  if (request.method !== 'GET' || !type.includes('text/html') || url.pathname.startsWith('/admin') || !hasKV(env)) return res;

  let pricing, content;
  try {
    [pricing, content] = await Promise.all([getPricing(env, { fallback: false }), getContent(env)]);
  } catch (e) { return res; }
  if (!pricing && !Object.keys(content).length) return res;   // rien de modifié : page telle quelle

  let rw = new HTMLRewriter();
  if (Object.keys(content).length) {
    rw = rw.on('[data-edit]', {
      element(el) {
        const k = el.getAttribute('data-edit');
        if (Object.prototype.hasOwnProperty.call(content, k)) el.setInnerContent(content[k]);
      }
    });
  }
  if (pricing) {
    rw = rw
      .on('[data-block="plans"]', { element(el) { el.setInnerContent(renderPlans(pricing), { html: true }); } })
      .on('[data-block="hosting"]', { element(el) { el.setInnerContent(renderHosting(pricing), { html: true }); } })
      .on('[data-block="options"]', { element(el) { el.setInnerContent(renderOptions(pricing), { html: true }); } })
      .on('[data-price]', { element(el) { el.setInnerContent(priceToken(pricing, el.getAttribute('data-price'))); } })
      .on('[data-plan-label]', { element(el) { el.setInnerContent(planLabel(pricing, el.getAttribute('data-plan-label'))); } })
      .on('script[type="application/ld+json"]', { element(el) { el.setInnerContent(renderJsonLd(pricing), { html: true }); } });
  }
  const out = rw.transform(res);
  const h = new Headers(out.headers);
  h.set('Cache-Control', 'no-cache');
  return new Response(out.body, { status: out.status, headers: h });
}
