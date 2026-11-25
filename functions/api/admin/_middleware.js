// Toutes les routes /api/admin/* demandent une session, sauf la connexion.
import { isAdmin } from '../../_lib/auth.js';
import { hasKV } from '../../_lib/store.js';

export async function onRequest({ request, env, next }) {
  const path = new URL(request.url).pathname;
  if (path.endsWith('/login')) return next();
  if (!(await isAdmin(request, env))) return Response.json({ ok: false, message: 'Non connecté.' }, { status: 401 });
  if (!hasKV(env)) return Response.json({ ok: false, message: 'La base KV « OUVERT_KV » n\'est pas reliée au projet.' }, { status: 503 });
  // Protection CSRF simple : les écritures doivent venir du même site
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return Response.json({ ok: false }, { status: 403 });
  }
  try { return await next(); }
  catch (e) { return Response.json({ ok: false, message: e.message || 'Erreur.' }, { status: 400 }); }
}
