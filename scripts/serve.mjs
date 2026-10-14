import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};
const site = process.env.WASL_SITE_DIR;
const roots = {
  customer: path.join(root, site ? `${site}/customer` : 'apps/customer/dist'),
  support: path.join(root, site ? `${site}/support` : 'apps/support/dist/browser'),
};
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'",
  );
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/') {
      response.writeHead(302, { Location: '/customer/' });
      response.end();
      return;
    }
    if (pathname === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"status":"ok"}');
      return;
    }
    const [, app, ...segments] = pathname.split('/');
    const base = roots[app];
    if (!base) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    let target = path.resolve(base, segments.join('/') || 'index.html');
    if (!target.startsWith(base + path.sep) && target !== base) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }
    if (target === base) target = path.join(base, 'index.html');
    try {
      const info = await stat(target);
      if (info.isDirectory()) target = path.join(target, 'index.html');
    } catch {
      if (!path.extname(target)) target = path.join(base, 'index.html');
      else throw new Error('Not found');
    }
    const content = await readFile(target);
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.setHeader(
      'Cache-Control',
      target.endsWith('.html') || target.endsWith('theme-init.js')
        ? 'no-store'
        : 'public, max-age=31536000, immutable',
    );
    response.writeHead(200);
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found. Run npm run build before npm run preview.');
  }
});
server.listen(port, '0.0.0.0', () =>
  console.log(
    `Wasl is running on http://0.0.0.0:${port}\nCustomer: /customer/\nSupport: /support/`,
  ),
);
