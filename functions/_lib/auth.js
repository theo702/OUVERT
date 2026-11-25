// Session admin : cookie signé (HMAC-SHA256) avec ADMIN_SECRET.
const COOKIE = 'ouvert_admin';
const MAX_AGE = 7 * 24 * 3600;
const enc = new TextEncoder();

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function safeEqual(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function makeSession(env) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const sig = await hmac(env.ADMIN_SECRET, 'admin.' + exp);
  return `${COOKIE}=${exp}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearSession() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAdmin(request, env) {
  if (!env.ADMIN_SECRET) return false;
  const m = (request.headers.get('cookie') || '').match(new RegExp(COOKIE + '=(\\d+)\\.([\\w-]+)'));
  if (!m) return false;
  if (Number(m[1]) < Date.now() / 1000) return false;
  return safeEqual(await hmac(env.ADMIN_SECRET, 'admin.' + m[1]), m[2]);
}
