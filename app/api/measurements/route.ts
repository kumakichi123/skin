export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerAdmin } from '../../../lib/supabase/server'

// 返却型の最小定義（フロントの型と揃える）
type Scores = { dryness:number; oiliness:number; redness:number; brightness:number; puffiness:number }

type Product = { id:string; name:string; reason:string; url:string }

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const range = url.searchParams.get('range') // '7' | '30' | '90' | 'custom'
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const userId = url.searchParams.get('userId') // クライアントから明示送信
  if (!userId) return NextResponse.json({ error: 'NO_USER' }, { status: 401 })

  const supa = createServerAdmin()
  let q = supa
    .from('measurements')
    .select('id,user_id,scores,products,analysis_version,quality,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (range === '7') q = q.gte('created_at', new Date(Date.now()-7*864e5).toISOString())
  if (range === '30') q = q.gte('created_at', new Date(Date.now()-30*864e5).toISOString())
  if (range === '90') q = q.gte('created_at', new Date(Date.now()-90*864e5).toISOString())
  if (range === 'custom' && from && to) q = q.gte('created_at', from).lte('created_at', to)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(req: NextRequest) {
  const supa = createServerAdmin()
  try{
    const body = await req.json()
    const { userId, scores, products, analysis_version, quality } = body as {
      userId?: string
      scores?: Scores
      products?: Product[]
      analysis_version?: string
      quality?: { level: 'low'|'med'|'high'; exposure:number; sharpness:number }
    }

    if (!userId || !scores) {
      return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
    }

    const { data, error } = await supa
      .from('measurements')
      .insert({ user_id: userId, scores, products, analysis_version, quality })
      .select('id,user_id,scores,products,analysis_version,quality,created_at')
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'insert error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const userId = url.searchParams.get('userId')
  if (!id || !userId) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
  const supa = createServerAdmin()
  const { error } = await supa.from('measurements').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
