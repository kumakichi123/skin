// app/api/recommend/route.ts
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import products from '../../../data/products.json';
import { evaluateRule } from '../../../lib/rules';
import { withAffiliate } from '../../../lib/affiliate';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scores = {
      dryness: Number(searchParams.get('dryness') ?? 0),
      oiliness: Number(searchParams.get('oiliness') ?? 0),
      redness: Number(searchParams.get('redness') ?? 0),
      brightness: Number(searchParams.get('brightness') ?? 0),
      puffiness: Number(searchParams.get('puffiness') ?? 0),
    };

    const matched = (products as any[])
      .filter(p => !p.rule || evaluateRule(p.rule, scores))
      .map(p => ({ ...p, url: withAffiliate(p.url) }));

    // ★ここ：必ず何か出す（先頭から最大3件の保険）
    const result = (matched.length ? matched : (products as any[])).slice(0, 3);

    console.log('recommend scores=', scores, 'matched=', matched.map(m => m.id), 'result=', result.map(r => r.id));
    return new Response(JSON.stringify({ products: result }), { status: 200 });
  } catch (e: any) {
    console.error('recommend error', e);
    return new Response(JSON.stringify({ error: 'recommend failed' }), { status: 500 });
  }
}
