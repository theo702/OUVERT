// Stockage dans Cloudflare KV (binding : OUVERT_KV).
import { DEFAULT_PRICING } from './defaults.js';

const K_PRICING = 'pricing';
const K_CONTENT = 'content';
const K_INDEX = 'devis:index';

export const hasKV = env => !!(env && env.OUVERT_KV);

export async function getPricing(env, { fallback = true } = {}) {
  if (hasKV(env)) {
    const v = await env.OUVERT_KV.get(K_PRICING, 'json');
    if (v) return v;
  }
  return fallback ? DEFAULT_PRICING : null;
}
export const savePricing = (env, p) => env.OUVERT_KV.put(K_PRICING, JSON.stringify(p));
export const resetPricing = env => env.OUVERT_KV.delete(K_PRICING);

export async function getContent(env) {
  if (!hasKV(env)) return {};
  return (await env.OUVERT_KV.get(K_CONTENT, 'json')) || {};
}
export const saveContent = (env, c) => env.OUVERT_KV.put(K_CONTENT, JSON.stringify(c));

/* ---------- Devis ---------- */
export async function listDevis(env) {
  const ids = (await env.OUVERT_KV.get(K_INDEX, 'json')) || [];
  const items = await Promise.all(ids.map(id => env.OUVERT_KV.get('devis:' + id, 'json')));
  return items.filter(Boolean);
}
export async function addDevis(env, d) {
  await env.OUVERT_KV.put('devis:' + d.id, JSON.stringify(d));
  const ids = (await env.OUVERT_KV.get(K_INDEX, 'json')) || [];
  ids.unshift(d.id);
  await env.OUVERT_KV.put(K_INDEX, JSON.stringify(ids.slice(0, 1000)));
}
export async function getDevis(env, id) { return env.OUVERT_KV.get('devis:' + id, 'json'); }
export async function putDevis(env, d) { await env.OUVERT_KV.put('devis:' + d.id, JSON.stringify(d)); }
export async function deleteDevis(env, id) {
  await env.OUVERT_KV.delete('devis:' + id);
  const ids = (await env.OUVERT_KV.get(K_INDEX, 'json')) || [];
  await env.OUVERT_KV.put(K_INDEX, JSON.stringify(ids.filter(x => x !== id)));
}
