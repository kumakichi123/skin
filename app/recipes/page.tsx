// app/recipes/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePlan } from '../../hooks/usePlan'
import type { RecipeMeta } from '../../data/recipes'

export default function RecipesPage() {
  const { plan } = usePlan()
  const [items, setItems] = useState<(RecipeMeta & { locked?: boolean })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)

      let last: any | undefined
      try {
        const raw = localStorage.getItem('lastScores')
        if (raw) last = JSON.parse(raw)
      } catch {}

      const qs = new URLSearchParams()
      if (plan === 'pro') qs.set('pro', '1')
      if (last) qs.set('scores', JSON.stringify(last))

      const r = await fetch(`/api/recipes?${qs.toString()}`)
      const j = await r.json()
      setItems(j.items || [])
      setLoading(false)
    })()
  }, [plan])

  return (
    <main className="mx-auto max-w-xl p-4 space-y-4">
      <header className="sticky top-0 z-10 -mx-4 mb-1 bg-white/70 backdrop-blur border-b px-4 py-3">
        <h1 className="text-xl font-bold">レシピ集</h1>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_10px_30px_rgba(167,139,250,0.18)]">
              <div className="h-16 w-16 rounded-xl skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded skeleton" />
                <div className="h-3 w-1/3 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const href = r.locked && plan !== 'pro' ? '/my' : `/recipes/${encodeURIComponent(r.id)}`
            return (
              <Link
                key={r.id}
                href={href}
                className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 hover:bg-violet-50/40 transition-colors shadow-[0_10px_30px_rgba(167,139,250,0.18)]"
              >
                {/* サムネ（coverUrlがあれば） */}
                {r.coverUrl ? (
                  <img
                    src={r.coverUrl}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gray-100 flex-shrink-0" />
                )}

                {/* タイトル + 効果タグ */}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{r.title}</div>
                  {!!r.effects?.length && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.effects.slice(0, 3).map((e, i) => (
                        <span key={i} className="badge">{e}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Proロック表示（必要なら） */}
                {r.locked && plan !== 'pro' && (
                  <span className="self-start rounded-full bg-violet-600 px-2 py-1 text-xs text-white">Pro</span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      <div className="h-16" />
    </main>
  )
}
