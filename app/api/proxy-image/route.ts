import type { NextRequest } from 'next/server';

function isAllowedHost(hostname: string): boolean {
  return (
    hostname === 'apimart.ai' ||
    hostname.endsWith('.apimart.ai') ||
    hostname === 'googleusercontent.com' ||
    hostname.endsWith('.googleusercontent.com') ||
    hostname === 'storage.googleapis.com'
  );
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('url');
  if (!src) return new Response('missing url', { status: 400 });

  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return new Response('invalid url', { status: 400 });
  }
  if (u.protocol !== 'https:' || !isAllowedHost(u.hostname)) {
    return new Response('host not allowed', { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(u.toString(), { cache: 'no-store' });
  } catch (err) {
    return new Response(`fetch failed: ${err instanceof Error ? err.message : String(err)}`, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(`upstream ${upstream.status}`, { status: upstream.status });
  }

  const headers = new Headers();
  const ct = upstream.headers.get('Content-Type');
  if (ct) headers.set('Content-Type', ct);
  const cl = upstream.headers.get('Content-Length');
  if (cl) headers.set('Content-Length', cl);
  headers.set('Cache-Control', 'private, max-age=3600');

  return new Response(upstream.body, { status: 200, headers });
}
