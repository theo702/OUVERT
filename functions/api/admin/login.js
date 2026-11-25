import { makeSession, safeEqual } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SECRET) {
    return Response.json({ ok: false, message: 'ADMIN_PASSWORD et ADMIN_SECRET ne sont pas configurés sur Cloudflare.' }, { status: 503 });
  }
  let b = {};
  try { b = await request.json(); } catch (e) {}
  await new Promise(r => setTimeout(r, 400));   // ralentit les essais en série
  if (!safeEqual(b.password || '', env.ADMIN_PASSWORD)) return Response.json({ ok: false, message: 'Mot de passe incorrect.' }, { status: 401 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Set-Cookie': await makeSession(env) } });
}
