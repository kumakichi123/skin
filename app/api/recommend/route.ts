// app/api/recommend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildReasonFromScores } from '../../../lib/reason'
import { evalRule, Rule } from '../../../lib/rules'

type Scores = {
  dryness:number; oiliness:number; redness:number; brightness:number; puffiness:number
}
type Product = {
  id: string
  name: string
  url: string
  price?: number    // 円（任意）
  image?: string    // 公式画像URL（任意）
  rule: Rule        // 文字列 or Cond[]
  tags?: string[]   // 表示用ミニタグ（任意）
}

import DB from '../../../data/products.json' assert { type: 'json' } // 例

export async function GET(req: NextRequest){
  try{
    const sp = req.nextUrl.searchParams
    const scores: Scores = {
      dryness: Number(sp.get('dryness')||0),
      oiliness: Number(sp.get('oiliness')||0),
      redness: Number(sp.get('redness')||0),
      brightness: Number(sp.get('brightness')||0),
      puffiness: Number(sp.get('puffiness')||0),
    }

    const ranked = (DB as Product[])
      .map(p => {
        const r = evalRule(p.rule, scores)
        return { p, ...r }
      })
      .filter(x => x.matched)
      .sort((a,b)=>{
        if(b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
        if(b.strength   !== a.strength)   return b.strength   - a.strength
        const pa = a.p.price ?? Infinity, pb = b.p.price ?? Infinity
        return pa - pb
      })
      .slice(0,3)
      .map(x => ({
        id: x.p.id,
        name: x.p.name,
        url: x.p.url,
        image: x.p.image ?? null,
        price: x.p.price ?? null,
        tags: x.p.tags ?? [],
        reason: buildReasonFromScores(scores) // ← テンプレで個別化
      }))

    return NextResponse.json({ products: ranked })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'recommend error' }, { status: 400 })
  }
}
