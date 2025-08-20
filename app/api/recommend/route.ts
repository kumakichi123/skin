// app/api/recommend/route.ts
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import products from '../../../data/products.json'
import { evaluateRule, scoreRuleFit } from '../../../lib/rules' // ← ②で使う（今は未使用でもOK）
import { withAffiliate } from '../../../lib/affiliate'

const MIN_FUZZY_SCORE = Number(process.env.RECOMMEND_MIN_SCORE ?? 0.6)
const USE_FUZZY_FALLBACK = process.env.RECOMMEND_FUZZY === '1'

export async function GET(req:NextRequest){
  try{
    const { searchParams } = new URL(req.url)
    const scores = {
      dryness: Number(searchParams.get('dryness')||0),
      oiliness: Number(searchParams.get('oiliness')||0),
      redness: Number(searchParams.get('redness')||0),
      brightness: Number(searchParams.get('brightness')||0),
      puffiness: Number(searchParams.get('puffiness')||0)
    }

    // 1) ルール一致のみ
    const strict = (products as any[])
      .filter(p => !p.rule || evaluateRule(p.rule, scores))
      .map(p => ({ ...p, url: withAffiliate(p.url) }))
      .slice(0,3)

    // 一致があればそのまま返す（0〜3件）
    if (strict.length > 0 || !USE_FUZZY_FALLBACK) {
      console.log('recommend(strict)=', strict.map(p=>p.id))
      return new Response(JSON.stringify({ products: strict }), { status:200 })
    }

    // 2) ここから先は“任意”の近似マッチ（環境変数でON）
    const fuzzy = (products as any[])
      .map(p => ({
        ...p,
        url: withAffiliate(p.url),
        relevance: p.rule ? scoreRuleFit(p.rule, scores) : 0
      }))
      .filter(p => p.relevance >= MIN_FUZZY_SCORE)
      .sort((a,b)=> b.relevance - a.relevance)
      .slice(0,3)

    console.log('recommend(fuzzy)=', fuzzy.map(p=>`${p.id}:${p.relevance.toFixed(2)}`))
    return new Response(JSON.stringify({ products: fuzzy }), { status:200 })
  }catch(e:any){
    console.error('recommend error', e)
    return new Response(JSON.stringify({ error:'recommend failed' }),{ status:500 })
  }
}
