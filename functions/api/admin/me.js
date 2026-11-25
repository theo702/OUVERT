export async function onRequestGet({ env }) {
  return Response.json({ ok: true, notify: !!(env.RESEND_API_KEY && env.NOTIFY_EMAIL) });
}
