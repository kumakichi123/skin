// app/page.tsx（省略なし・完成版）
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '../components/I18nProvider'
import { useAuth } from '../components/AuthProvider'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { Scores, Product, Measurement } from '../types'

// ========== helpers: API / utils ==========
function asProducts(x: any): Product[] {
  if (Array.isArray(x)) return x
  if (Array.isArray(x?.products)) return x.products
  if (Array.isArray(x?.items)) return x.items
  if (x && typeof x === 'object' && 'id' in x) return [x as Product]
  return []
}

async function fetchRecommendations(scores: Scores): Promise<Product[]> {
  // 1) scores 全体を1クエリ
  const qs1 = new URLSearchParams({ scores: JSON.stringify(scores) })
  let res = await fetch(`/api/recommend?${qs1}`)
  if (res.ok) {
    const raw = await res.json().catch(() => null)
    const arr = asProducts(raw)
    if (arr.length) return arr.slice(0, 3)
  }
  // 2) 個別クエリ
  const qs2 = new URLSearchParams({
    dryness: String(scores.dryness),
    oiliness: String(scores.oiliness),
    redness: String(scores.redness),
    brightness: String(scores.brightness),
    puffiness: String(scores.puffiness),
  })
  res = await fetch(`/api/recommend?${qs2}`)
  if (res.ok) {
    const raw = await res.json().catch(() => null)
    const arr = asProducts(raw)
    if (arr.length) return arr.slice(0, 3)
  }
  // 3) POST
  res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scores }),
  })
  if (res.ok) {
    const raw = await res.json().catch(() => null)
    const arr = asProducts(raw)
    if (arr.length) return arr.slice(0, 3)
  }
  return []
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

// 画像品質をざっくり推定（明るさ＆エッジ量）
async function estimateQualityFromImage(file: File): Promise<{ level: 'low'|'med'|'high'; exposure: number; sharpness: number }>{
  const imgUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((ok, ng) => {
      const im = new Image()
      im.onload = () => ok(im)
      im.onerror = ng
      im.src = imgUrl
    })
    const W = 96, H = 96
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, W, H)
    const { data } = ctx.getImageData(0, 0, W, H)
    let sum = 0
    for (let i=0;i<data.length;i+=4){ sum += (0.2126*data[i] + 0.7152*data[i+1] + 0.0722*data[i+2]) }
    const exposure = sum / (W*H)

    // 単純Sobelでシャープネス近似
    const sobel = (x:number,y:number,c:number)=>{
      const idx=(y*W+x)*4+c; return data[idx]||0
    }
    let edgeSum = 0
    for(let y=1;y<H-1;y++){
      for(let x=1;x<W-1;x++){
        const gx = -sobel(x-1,y-1,0) -2*sobel(x-1,y,0) -sobel(x-1,y+1,0)
                  + sobel(x+1,y-1,0) +2*sobel(x+1,y,0) + sobel(x+1,y+1,0)
        const gy = -sobel(x-1,y-1,0) -2*sobel(x,y-1,0) -sobel(x+1,y-1,0)
                  + sobel(x-1,y+1,0) +2*sobel(x,y+1,0) + sobel(x+1,y+1,0)
        edgeSum += Math.hypot(gx, gy)
      }
    }
    const sharpness = edgeSum / ((W-2)*(H-2))

    let level: 'low'|'med'|'high' = 'med'
    if (exposure < 35 || exposure > 230 || sharpness < 6) level = 'low'
    else if (sharpness > 18 && exposure > 60 && exposure < 210) level = 'high'

    return { level, exposure, sharpness }
  } finally {
    URL.revokeObjectURL(imgUrl)
  }
}

// EMA（指数移動平均）
function ema(values: number[], alpha = 0.5): number[] {
  let prev = values[0] ?? 0
  return values.map((v, i) => {
    if (i === 0) return v
    const e = alpha * v + (1 - alpha) * prev
    prev = e
    return e
  })
}

// ========== small UI parts ==========
function PlanBadge({ plan }:{ plan:'free'|'pro' }){
  const isPro = plan === 'pro'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPro ? 'bg-violet-100 text-violet-800 ring-1 ring-violet-200' : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'}`}>{isPro ? 'PRO' : 'FREE'}</span>
  )
}

type WeekDay = { label: string; date: Date; isToday: boolean }
function getThisWeek(startOnSunday = true): WeekDay[] {
  const today = new Date()
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const w = d.getDay()
  const delta = startOnSunday ? -w : (w === 0 ? -6 : 1 - w)
  const start = new Date(d); start.setDate(d.getDate() + delta)
  const labels = startOnSunday ? ['日','月','火','水','木','金','土'] : ['月','火','水','木','金','土','日']
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(start); dt.setDate(start.getDate() + i)
    return { label: labels[i], date: dt, isToday: dt.toDateString() === d.toDateString() }
  })
}

function WeekStrip({ onPick }:{ onPick?:(d:Date)=>void }){
  const days = useMemo(()=>getThisWeek(true),[])
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d)=> (
        <button
          key={d.date.toISOString()}
          type="button"
          onClick={()=> onPick?.(d.date)}
          className={`flex flex-col items-center rounded-xl p-2 text-sm ${d.isToday ? 'bg-violet-50 ring-2 ring-violet-300' : 'bg-white ring-1 ring-gray-200'} hover:bg-surface`}
          aria-pressed={d.isToday}
        >
          <span className="text-muted">{d.label}</span>
          <span className="mt-1 text-base font-semibold">{d.date.getDate()}</span>
        </button>
      ))}
    </div>
  )
}

function TrustBadge({ level, exposure, sharpness }:{ level:'low'|'med'|'high'; exposure:number; sharpness:number }){
  const color = level === 'high' ? 'text-green-700 bg-green-100 ring-green-200' : level === 'med' ? 'text-amber-700 bg-amber-100 ring-amber-200' : 'text-red-700 bg-red-100 ring-red-200'
  const label = level === 'high' ? '信頼度: High' : level === 'med' ? '信頼度: Med' : '信頼度: Low'
  const tip = `露出${Math.round(exposure)} / 鮮鋭度${Math.round(sharpness)}`
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${color}`} title={tip}>{label}</span>
}

function AlertsList({ items }:{ items: Measurement[] }){
  const msgs = useMemo(()=>{
    const alerts: string[] = []
    if (items.length < 2) return alerts
    // 直近2件
    const a = items[0].scores
    const b = items[1].scores
    if (a.redness - b.redness >= 15) alerts.push('🔔 赤みが直近で+15以上の上昇。刺激要因を見直しましょう。')

    // 朝（8-11時）の2連続むくみ上昇（擬似判定：created_atの時刻）
    const morning = (iso:string)=>{ const h = new Date(iso).getHours(); return h>=8 && h<=11 }
    if (morning(items[0].created_at) && morning(items[1].created_at)){
      if (items[0].scores.puffiness - items[1].scores.puffiness >= 12){
        alerts.push('🔔 朝のむくみが+12以上×2回。塩分/就寝直前の飲食を控えてみましょう。')
      }
    }
    return alerts
  }, [items])

  if (msgs.length === 0) return null
  return (
    <section className="card p-4 sm:p-5">
      <h4 className="font-semibold mb-2">アラート</h4>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {msgs.map((m,i)=>(<li key={i}>{m}</li>))}
      </ul>
    </section>
  )
}

function WeeklyReportCard({ items }:{ items: Measurement[] }){
  const text = useMemo(()=>{
    if (items.length < 3) return '今週はデータが不足しています。来週は3回以上の撮影で週次レポートが生成されます。'
    // 最新→過去
    const arr = items.slice(0,7)
    const keys: (keyof Scores)[] = ['dryness','oiliness','redness','brightness','puffiness']
    const avg = (k: keyof Scores)=> arr.reduce((s,m)=>s + (m.scores[k]||0),0) / arr.length
    const means = Object.fromEntries(keys.map(k=>[k, avg(k)])) as Scores

    // スパークライン用にEMA
    const series: Record<string, number[]> = {}
    keys.forEach(k=>{ series[k] = ema(arr.map(m=>m.scores[k])) })

    // 上下動（単純に最新−平均）
    const diffs = keys.map(k=>({ k, d: (arr[0].scores[k]||0) - (means[k]||0) }))
    const up = diffs.slice().sort((a,b)=>b.d-a.d)[0]
    const down = diffs.slice().sort((a,b)=>a.d-b.d)[0]

    const mapJ: Record<keyof Scores, string> = {
      dryness:'乾燥', oiliness:'皮脂', redness:'赤み', brightness:'明るさ', puffiness:'むくみ'
    }

    const base = `総合：明るさ${Math.round(means.brightness)} / 乾燥${Math.round(means.dryness)} / 皮脂${Math.round(means.oiliness)} / 赤み${Math.round(means.redness)} / むくみ${Math.round(means.puffiness)}。`
    const change = `今週は「${mapJ[up.k]}」がやや高め、「${mapJ[down.k]}」は落ち着き気味。`

    return `${base}${change}撮影条件を一定化し、入浴後の保湿＋朝の撮影時刻固定を試しましょう。`
  }, [items])

  const tips = useMemo(()=>{
    if (items.length < 3) return ['撮影は朝か夜の一定時刻で','入浴後の保湿を+1回','就寝前の飲食・塩分を控えめに']
    return ['朝の撮影時刻を固定','入浴後に保湿を+1回','屋外活動日はUV対策を意識']
  }, [items])

  return (
    <section className="card p-4 sm:p-5">
      <h4 className="font-semibold mb-2">週次レポート（β）</h4>
      <p className="text-sm leading-6">{text}</p>
      <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
        {tips.map((t,i)=>(<li key={i}>{t}</li>))}
      </ul>
      <p className="text-xs opacity-60 mt-3">※本機能は一般的な生活アドバイスであり、医療助言ではありません。</p>
    </section>
  )
}

// ========== page ==========
export default function Page(){
  const router = useRouter()
  const { t } = useI18n()
  const { email: userEmail, plan, user } = useAuth()

  // 画像選択モーダル
  const [pickerOpen, setPickerOpen] = useState(false)
  const libInputRef = useRef<HTMLInputElement>(null)
  const camInputRef = useRef<HTMLInputElement>(null)

  const scanSectionRef = useRef<HTMLDivElement>(null)
  const statsSectionRef = useRef<HTMLDivElement>(null)
  const productsSectionRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<Scores | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  // 信頼度
  const [trust, setTrust] = useState<{ level:'low'|'med'|'high'; exposure:number; sharpness:number } | null>(null)

  // 履歴（直近7日）
  const [weekItems, setWeekItems] = useState<Measurement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // 履歴取得（ユーザーがいるときだけ）
  useEffect(() => {
    if (!user) { setWeekItems([]); return }
    const ac = new AbortController()
    ;(async () => {
      setHistoryLoading(true)
      try {
        const r = await fetch(`/api/measurements?userId=${encodeURIComponent(user.id)}&range=7`, { signal: ac.signal })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const j = await r.json()
        const arr: Measurement[] = Array.isArray(j.items) ? j.items : []
        setWeekItems(arr)
      } catch (e) {
        // noop
      } finally {
        setHistoryLoading(false)
      }
    })()
    return () => ac.abort()
  }, [user])

  // 汎用：チェックアウト（Pro遷移）
  async function handleCheckout(){
    const email = userEmail?.trim()
    if (!email) { router.push('/login'); return }
    const res = await fetch('/api/checkout', {
      method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email })
    })
    const j = await res.json().catch(()=>null)
    if (j?.url) location.href = j.url
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.currentTarget.value = ''
    if (!file) return
    runAnalyze(file)
  }

  async function runAnalyze(file: File){
    setError(null)
    setLoading(true)
    try{
      // 先に簡易品質評価
      estimateQualityFromImage(file).then(setTrust).catch(()=>{})

      const base64 = await fileToBase64(file)
      const resA = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64 }),
      })
      if (!resA.ok) throw new Error(`analyze failed (${resA.status})`)
      const { scores } = (await resA.json()) as { scores: Scores }
      setScores(scores)

      try { localStorage.setItem('lastScores', JSON.stringify(scores)) } catch {}

      const recs = await fetchRecommendations(scores)
      setProducts(recs)

      scrollTo(statsSectionRef.current)
    }catch(e:any){
      setError(e?.message ?? 'Failed')
    }finally{
      setLoading(false)
    }
  }

  // レーダー用のデータ
  const radarData = useMemo(() => (
    scores ? [
      { metric: t('metric_dryness') || '乾燥', value: scores.dryness },
      { metric: t('metric_oiliness') || '皮脂', value: scores.oiliness },
      { metric: t('metric_redness') || '赤み', value: scores.redness },
      { metric: t('metric_brightness') || '明るさ', value: scores.brightness },
      { metric: t('metric_puffiness') || 'むくみ', value: scores.puffiness },
    ] : []
  ), [scores, t])

  return (
    <main className="mx-auto max-w-xl py-6 sm:py-8">
      {/* Header */}
      <header className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{t('appTitle') || 'スキンケアAI'}</h1>
            <p className="text-sm text-muted">{new Date().toLocaleDateString(undefined,{ year:'numeric', month:'long', day:'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <PlanBadge plan={plan} />
            {userEmail ? (
              <button
              type="button"
              className="btn-outline px-3 py-1.5 rounded-full border"
              onClick={() => router.push('/my')}
              >
              {t('myTitle') ?? 'My'}
              </button>
            ) : (
              <button type="button" className="btn-outline px-3 py-1.5 rounded-full border" onClick={()=>router.push('/login')}>
                {t('login') || 'ログイン'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Week strip */}
      <section className="card p-4 sm:p-5 mb-4">
        <WeekStrip onPick={()=>{ /* クリック時の挙動は後日 */ }} />
      </section>

      {/* Scan card */}
      <section ref={scanSectionRef} className="card p-5 sm:p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{t('aiFaceAnalysis') || 'AI肌解析'}</h2>
            <p className="text-sm text-muted">{t('aiFaceAnalysisDesc') || '写真から5指標をスコア化します'}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 font-semibold text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-4 ring-violet-300 shadow-md shadow-violet-200"
            disabled={loading}
            onClick={() => setPickerOpen(true)}
          >
            {loading ? '…' : (t('scanNow') || '今すぐ測定')}
          </button>
        </div>

        <input ref={libInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={camInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />

        {error && (
          <p className="mt-3 text-sm text-red-600" aria-live="polite">{error}</p>
        )}
      </section>

      {/* 画像ソース選択モーダル */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setPickerOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-violet-200" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('chooseSource') || '画像の選択'}>
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-4">{t('chooseSource') || '画像の選択'}</h3>
              <div className="space-y-3">
                <button type="button" className="inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 font-semibold text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-4 ring-violet-300" onClick={() => { setPickerOpen(false); camInputRef.current?.click() }}>📷 {t('chooseCamera') || 'カメラで撮る'}</button>
                <button type="button" className="inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 font-semibold border-2 border-violet-400 text-violet-700 bg-white hover:bg-violet-50 focus:outline-none focus:ring-4 ring-violet-300" onClick={() => { setPickerOpen(false); libInputRef.current?.click() }}>🖼 {t('chooseLibrary') || 'ライブラリから選ぶ'}</button>
                <button type="button" className="mt-1 w-full text-sm text-muted hover:text-violet-700" onClick={() => setPickerOpen(false)}>{t('cancel') || 'キャンセル'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scores + Radar */}
      <section ref={statsSectionRef} className="card p-5 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold">{t('scoresTitle') || 'スコア'}</h4>
          {trust && <TrustBadge level={trust.level} exposure={trust.exposure} sharpness={trust.sharpness} />}
        </div>
        {scores ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(167,139,250,0.35)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgb(107,114,128)' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} tickLine={false} />
                <Radar dataKey="value" stroke="rgb(124,58,237)" fill="rgb(167,139,250)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-muted">測定するとレーダーチャートが表示されます。</div>
        )}
      </section>

      {/* Alerts（履歴ベース） */}
      {weekItems.length > 0 && <div className="mb-5"><AlertsList items={weekItems} /></div>}

      {/* Proの週次レポート（β） */}
      <section className="mb-5">
        {plan === 'pro' ? (
          <WeeklyReportCard items={weekItems} />
        ) : (
          <section className="card p-4 sm:p-5">
            <h4 className="font-semibold mb-1">週次レポート</h4>
            <p className="text-sm text-muted">週に3回以上の撮影で、要約と提案が自動生成されます（Pro）。</p>
            <div className="mt-3">
              <button onClick={handleCheckout} className="inline-flex items-center justify-center rounded-full px-4 py-2.5 bg-violet-600 text-white text-sm">Proにアップグレード</button>
            </div>
          </section>
        )}
      </section>

      {/* おすすめ */}
      <section ref={productsSectionRef} className="card p-5 sm:p-6 mb-24">
        <h4 className="text-lg font-semibold mb-1">{t('recommended') || 'おすすめ'}</h4>
        <p className="text-sm text-muted mb-3">{t('recommendedDesc') || 'あなたに合いそうな商品・レシピ'}</p>
        <div className="space-y-3">
          {products.length > 0 ? (
            products.map((p) => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-gray-200 p-4 hover:bg-surface">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-muted">{p.reason}</div>
              </a>
            ))
          ) : (
            <div className="text-sm text-muted">—</div>
          )}
        </div>
      </section>

      <div className="h-16" />
    </main>
  )
}
