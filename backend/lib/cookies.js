function parseCookies(req) {
  const header = req.headers && req.headers.cookie;
  const out = {};
  if (!header) return out;

  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });

  return out;
}

function serializeCookie(name, value, options = {}) {
  const { maxAgeSeconds, path = '/', sameSite = 'Strict', httpOnly = true } = options;
  // Cookies marked Secure are dropped by the browser over plain http://localhost,
  // so only mark them Secure once we're actually served over https (Vercel prod).
  const secure = options.secure ?? process.env.NODE_ENV === 'production';

  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (typeof maxAgeSeconds === 'number') parts.push(`Max-Age=${Math.floor(maxAgeSeconds)}`);
  parts.push(`Path=${path}`);
  if (httpOnly) parts.push('HttpOnly');
  parts.push(`SameSite=${sameSite}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

module.exports = { parseCookies, serializeCookie };
