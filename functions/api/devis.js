// POST /api/devis — enregistre une demande de devis venant du formulaire de contact.
import { addDevis, hasKV } from '../_lib/store.js';

const s = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

export async function onRequestPost({ request, env, waitUntil }) {
  if (!hasKV(env)) return Response.json({ ok: false, message: 'Stockage non configuré.' }, { status: 503 });
  let b = {};
  try { b = await request.json(); } catch (e) { return Response.json({ ok: false }, { status: 400 }); }
  if (b.botcheck) return Response.json({ ok: true });            // robot : on ignore sans le dire

  const d = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    status: 'nouveau',
    nom: s(b.nom, 120),
    email: s(b.email, 160),
    telephone: s(b.telephone, 40),
    activite: s(b.activite, 60),
    offre: s(b.offre, 60),
    message: s(b.message, 4000),
    note: '',
    montant: ''
  };
  if (!d.nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || !d.message) {
    return Response.json({ ok: false, message: 'Merci de remplir le nom, un email valide et votre message.' }, { status: 400 });
  }
  await addDevis(env, d);

  // Notification par mail (facultative) via Resend
  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    const text = `Nouvelle demande de devis\n\nNom : ${d.nom}\nEmail : ${d.email}\nTéléphone : ${d.telephone || '—'}\nActivité : ${d.activite}\nOffre : ${d.offre}\n\n${d.message}\n\nVoir dans l'admin : ${new URL(request.url).origin}/admin/`;
    waitUntil(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.FROM_EMAIL || 'Ouvert <onboarding@resend.dev>', to: [env.NOTIFY_EMAIL], reply_to: d.email, subject: 'Demande de devis · ' + d.nom, text })
    }).catch(() => {}));
  }
  return Response.json({ ok: true });
}
