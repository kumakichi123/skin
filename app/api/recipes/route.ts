// app/api/recipes/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { RECIPES } from '../../../data/recipes'  // ← メタ配列（id/title/effects/focuses/coverUrl）

// ユーザーの直近スコア（localStorageから渡ってくるJSON）
// 例: { dryness: 70, oiliness: 20, ... }
type Scores = Record<string, number>

// 並び替え用：レシピがフォーカスする指標のスコア合計（任意で weights に対応）
function scoreRecipe(rec: any, s?: Scores) {
  if (!s) return 0
  const w = (rec as any).weights || {}
  return (rec.focuses as string[]).reduce((acc, k) => {
    const weight = Number(w[k]) || 1
    return acc + (s[k] ?? 0) * weight
  }, 0)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const pro = url.searchParams.get('pro') === '1'

  // scores は JSON 文字列で来る想定（来なければ undefined のまま）
  let scores: Scores | undefined
  const raw = url.searchParams.get('scores')
  if (raw) {
    try { scores = JSON.parse(raw) as Scores } catch { /* 無視してOK */ }
  }

  // 並び替え（スコアの高い順）
  const items = [...RECIPES].sort((a, b) => scoreRecipe(b, scores) - scoreRecipe(a, scores))

  // 一覧では「メタ情報のみ」を返す（本文は /api/recipes/[id] で取得）
  // Free/Pro は詳細API側でティザー/全文を出し分けるので、ここでは locked を付けません。
  // もし「一部をPro限定にしたい」場合は、data/recipes.ts の各項目に proOnly フラグ等を足して
  // ここで { locked: !pro && rec.proOnly } を付ける運用にしてください。
  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      effects: r.effects,
      focuses: r.focuses,
      coverUrl: (r as any).coverUrl,
      // locked: (!pro && (r as any).proOnly) || false, // ←必要になったら利用
    })),
  })
}
