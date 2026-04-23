import type { NextRequest } from 'next/server';

const UPSTREAM = 'https://api.apimart.ai/v1';

async function proxy(req: NextRequest, segments: string[]) {
  const target = `${UPSTREAM}/${segments.join('/')}`;
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return Response.json(
      { error: { code: 401, message: '缺少 Authorization 头', type: 'authentication_error' } },
      { status: 401 },
    );
  }

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    cache: 'no-store',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const bodyText = await req.text();
    if (bodyText) init.body = bodyText;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    return Response.json(
      {
        error: {
          code: 502,
          message: `代理转发失败: ${err instanceof Error ? err.message : String(err)}`,
          type: 'bad_gateway',
        },
      },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
