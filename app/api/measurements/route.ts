// app/api/measurements/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerAdmin } from '../../../lib/supabase/server';

type Scores = { dryness:number; oiliness:number; redness:number; brightness:number; puffiness:number };
type Product = { id:string; name:string; reason:string; url:string };

function clampNum(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const range = url.searchParams.get('range'); // '7' | '30' | '90' | 'custom'
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'NO_USER' }, { status: 401 });

  const supa = createServerAdmin();
  let q = supa
    .from('measurements')
    // quality をセレクトからも外す
    .select('id,user_id,scores,products,analysis_version,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (range === '7')  q = q.gte('created_at', new Date(Date.now()- 7*864e5).toISOString());
  if (range === '30') q = q.gte('created_at', new Date(Date.now()-30*864e5).toISOString());
  if (range === '90') q = q.gte('created_at', new Date(Date.now()-90*864e5).toISOString());
  if (range === 'custom' && from && to) q = q.gte('created_at', from).lte('created_at', to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const supa = createServerAdmin();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
    }

    const { userId, scores, products, analysis_version } = body as {
      userId?: string;
      scores?: Partial<Scores>;
      products?: Product[];
      analysis_version?: string;
      // quality は受け取らない／挿入しない
    };

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'BAD_REQUEST: userId required' }, { status: 400 });
    }
    if (!scores || typeof scores !== 'object') {
      return NextResponse.json({ error: 'BAD_REQUEST: scores required' }, { status: 400 });
    }

    const s: Scores = {
      dryness:    clampNum(scores.dryness),
      oiliness:   clampNum(scores.oiliness),
      redness:    clampNum(scores.redness),
      brightness: clampNum(scores.brightness),
      puffiness:  clampNum(scores.puffiness),
    };

    const p = Array.isArray(products)
      ? products.map((x) => ({
          id: String(x.id ?? ''),
          name: String(x.name ?? ''),
          reason: String(x.reason ?? ''),
          url: String(x.url ?? ''),
        }))
      : null;

    const { data, error } = await supa
      .from('measurements')
      .insert({
        user_id: userId,
        scores: s,
        products: p,                    // ← products列が無ければここも外す
        analysis_version: analysis_version ?? null,
        // quality は入れない
      })
      .select('id,user_id,scores,products,analysis_version,created_at') // ← quality なし
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'INSERT_FAILED', message: error.message, code: (error as any).code ?? null, details: (error as any).details ?? null },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (e:any) {
    console.error('[measurements POST] unexpected error', e);
    return NextResponse.json({ error: 'UNEXPECTED', message: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const userId = url.searchParams.get('userId');
  if (!id || !userId) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });

  const supa = createServerAdmin();
  const { error } = await supa.from('measurements').delete().eq('id', id).eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
