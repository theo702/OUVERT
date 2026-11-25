// GET prix actuels · PUT nouveaux prix · DELETE = revenir aux prix par défaut
import { getPricing, savePricing, resetPricing } from '../../_lib/store.js';
import { cleanPricing } from '../../_lib/validate.js';
import { DEFAULT_PRICING } from '../../_lib/defaults.js';

export async function onRequestGet({ env }) {
  const saved = await getPricing(env, { fallback: false });
  return Response.json({ ok: true, pricing: saved || DEFAULT_PRICING, custom: !!saved });
}
export async function onRequestPut({ request, env }) {
  const p = cleanPricing(await request.json());
  await savePricing(env, p);
  return Response.json({ ok: true, pricing: p });
}
export async function onRequestDelete({ env }) {
  await resetPricing(env);
  return Response.json({ ok: true, pricing: DEFAULT_PRICING });
}
