// app/api/recommend/route.ts
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import products from '../../../data/products.json';
import { evaluateRule } from '../../../lib/rules';
import { withAffiliate } from '../../../lib/affiliate';

export async function GET(req: NextRequest) {
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
    .slice(0, 3)
    .map(p => ({ ...p, url: withAffiliate(p.url) }));

  return new Response(JSON.stringify({ products: matched }), { status: 200 });
}
