// Textes modifiés dans l'éditeur. GET → { key: texte } · PUT { changes: { key: texte | null } }
import { getContent, saveContent } from '../../_lib/store.js';
import { cleanText } from '../../_lib/validate.js';

export async function onRequestGet({ env }) {
  return Response.json({ ok: true, content: await getContent(env) });
}
export async function onRequestPut({ request, env }) {
  const b = await request.json();
  const c = await getContent(env);
  for (const [k, v] of Object.entries(b.changes || {})) {
    if (!/^[\w-]+:[a-f0-9]{8}$/.test(k)) continue;
    if (v === null) delete c[k]; else c[k] = cleanText(v);
  }
  await saveContent(env, c);
  return Response.json({ ok: true, content: c });
}
