import { createServerAdmin } from '../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import { ScoreRadar } from '../../../components/ScoreRadar'
import type { Measurement, Scores } from '../../../types'

export default async function ReportPage({ params }: { params: { id: string } }){
  const supa = createServerAdmin()
  const { data, error } = await supa.from('measurements').select('*').eq('id', params.id).single()
  if (error || !data) return notFound()
  const m = data as Measurement
  const s = m.scores as Scores

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">詳細レポート</h1>
      <div className="p-4 rounded-xl border">
        <div className="text-xs opacity-60">{new Date(m.created_at).toLocaleString('ja-JP')}</div>
        <ScoreRadar scores={s} />
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">トレンドと仮説</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>撮影条件（照明/距離/角度）を一定にすると比較の精度が上がります。</li>
          <li>乾燥・皮脂・赤みのいずれかが高い場合は、まずその1つを下げる行動を優先。</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">今日の食の一手</h2>
        <p className="text-sm">スコアの高い指標に対応する栄養素を意識。レシピ集から選ぶと楽です。</p>
        <a href="/recipes" className="inline-block px-3 py-2 rounded-lg bg-violet-600 text-white text-sm">レシピを見る</a>
      </section>

      <p className="text-xs opacity-60">※ 本機能は美容用途であり、医学的診断ではありません。</p>
      <div className="h-16" />
    </main>
  )
}