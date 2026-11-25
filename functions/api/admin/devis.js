// GET liste · PUT {id, status, note, montant} · DELETE ?id=
import { listDevis, getDevis, putDevis, deleteDevis } from '../../_lib/store.js';

const STATUTS = ['nouveau', 'en-cours', 'devis-envoye', 'gagne', 'perdu'];

export async function onRequestGet({ env }) {
  return Response.json({ ok: true, items: await listDevis(env) });
}

export async function onRequestPut({ request, env }) {
  const b = await request.json();
  const d = await getDevis(env, String(b.id || ''));
  if (!d) return Response.json({ ok: false, message: 'Demande introuvable.' }, { status: 404 });
  if (b.status && STATUTS.includes(b.status)) d.status = b.status;
  if (b.note !== undefined) d.note = String(b.note).slice(0, 4000);
  if (b.montant !== undefined) d.montant = String(b.montant).slice(0, 40);
  d.updated_at = new Date().toISOString();
  await putDevis(env, d);
  return Response.json({ ok: true, item: d });
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');
  if (id) await deleteDevis(env, id);
  return Response.json({ ok: true });
}
