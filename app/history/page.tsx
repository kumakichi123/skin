'use client'
import { useEffect, useMemo, useState } from 'react'
import { usePlan } from '../../hooks/usePlan'
import { useAuth } from '../../components/AuthProvider'
import type { Measurement } from '../../types'
import { ScoreRadar } from '../../components/ScoreRadar'

// メモリキャッシュ（セッション内で有効）
const cache: Record<string, { ts: number; items: Measurement[] }> = {}
const TTL = 5 * 60 * 1000 // 5分

function TrustBadge({ level }:{ level: 'low'|'med'|'high' }){
  const color = level === 'high' ? 'text-green-700 bg-green-100 ring-green-200' : level === 'med' ? 'text-amber-700 bg-amber-100 ring-amber-200' : 'text-red-700 bg-red-100 ring-red-200'
  const label = level === 'high' ? 'High' : level === 'med' ? 'Med' : 'Low'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${color}`}>信頼度: {label}</span>
}

export default function HistoryPage() {
  const { plan } = usePlan()
  const { user } = useAuth()
  const [range, setRange] = useState<'7' | '30' | '90'>('30')
  const [items, setItems] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setItems([]); return }
    const key = `${user.id}:${range}`
    const now = Date.now()
    if (cache[key] && now - cache[key].ts < TTL) {
      setItems(cache[key].items)
      return
    }
    const ac = new AbortController()
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await fetch(`/api/measurements?userId=${encodeURIComponent(user.id)}&range=${range}`, { signal: ac.signal })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const j = await r.json()
        const arr = Array.isArray(j.items) ? j.items : []
        setItems(arr)
        cache[key] = { ts: now, items: arr }
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message ?? 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [user, range])

  if (plan !== 'pro') {
    return (
      <main className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-bold">履歴</h1>
        <div className="p-4 rounded-xl border">
          <p className="text-sm">推移グラフと詳細レポートはProで利用できます。</p>
          <div className="mt-3 text-center">
            <a href="/my" className="inline-block px-4 py-2 rounded-xl bg-violet-600 text-white">Proで利用する</a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">履歴</h1>

      <div className="flex gap-2">
        {(['7', '30', '90'] as const).map((r) => {
          const active = range === r
          return (
            <button key={r} onClick={() => setRange(r)} aria-pressed={active} className={`px-3 py-1 rounded-full border ${active ? 'bg-violet-600 text-white' : 'bg-white'}`}>
              {r}日
            </button>
          )
        })}
      </div>

      {loading && <p className="text-sm opacity-70">読み込み中…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !loading ? (
        <p className="text-sm opacity-70">データがありません。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((m) => (
            <div key={m.id} className="p-3 rounded-xl border">
              <div className="flex items-center justify-between">
                <div className="text-xs opacity-60">{new Date(m.created_at).toLocaleString('ja-JP')}</div>
                {m.quality?.level && <TrustBadge level={m.quality.level} />}
              </div>
              <ScoreRadar scores={m.scores as any} />
              <a href={`/report/${m.id}`} className="block mt-2 text-center text-violet-600">詳細レポート</a>
            </div>
          ))}
        </div>
      )}
      <div className="h-16" />
    </main>
  )
}