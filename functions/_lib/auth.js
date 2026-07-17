const enc = new TextEncoder();
const dec = new TextDecoder();

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(str) {
  str = str.replaceAll('-', '+').replaceAll('_', '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return base64UrlEncode(new Uint8Array(sig));
}

export function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = cookieHeader.split(';').map(part => part.trim()).filter(Boolean);
  for (const cookie of cookies) {
    const idx = cookie.indexOf('=');
    if (idx === -1) continue;
    const key = cookie.slice(0, idx).trim();
    const value = cookie.slice(idx + 1).trim();
    if (key === name) return value;
  }
  return null;
}

export async function issueSession(username, secret, ttlSeconds = 60 * 60 * 8) {
  const payload = JSON.stringify({ u: username, exp: Date.now() + ttlSeconds * 1000 });
  const payloadEncoded = base64UrlEncode(enc.encode(payload));
  const signature = await hmac(secret, payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export async function verifySession(token, secret) {
  if (!token || !secret) return null;
  const [payloadEncoded, signature] = token.split('.');
  if (!payloadEncoded || !signature) return null;
  const expectedSignature = await hmac(secret, payloadEncoded);
  if (signature !== expectedSignature) return null;
  try {
    const payload = JSON.parse(dec.decode(base64UrlDecode(payloadEncoded)));
    if (!payload?.u || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload.u;
  } catch {
    return null;
  }
}

export function cookieOptions(request, token, maxAgeSeconds = 60 * 60 * 8) {
  const url = new URL(request.url);
  const secure = url.protocol === 'https:';
  return [
    `cfn_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${maxAgeSeconds}`
  ].filter(Boolean).join('; ');
}

export function clearCookie(request) {
  const url = new URL(request.url);
  const secure = url.protocol === 'https:';
  return [
    'cfn_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    'Max-Age=0'
  ].filter(Boolean).join('; ');
}
