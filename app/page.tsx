'use client'

import { useMemo, useState, useEffect } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

declare global {
  interface Window { gtag?: (...args: any[]) => void }
}

export type Scores = {
  dryness: number
  oiliness: number
  redness: number
  brightness: number
  puffiness: number
}

type Product = { id:string; name:string; reason:string; url:string }

// 共有画像のエンドポイント（/api/share のまま。/api/ogに切替えたい時はここだけ '/api/og' に）
const SHARE_ENDPOINT: '/api/share' | '/api/og' = '/api/share'

export default function Page(){
  // SW登録
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(err => console.error('SW registration failed', err))
    }
  }, [])

  // 「インストール」プロンプト（Android向け）
  const [deferred, setDeferred] = useState<any>(null)
  useEffect(()=>{
    const onBeforeInstall = (e: any) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  },[])

  // GA4 helper
  const ga = (name: string, params?: Record<string, any>) => {
    try { window.gtag?.('event', name, params) } catch {}
  }

  const [file, setFile] = useState<File|null>(null)
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<Scores|null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string>('')

  const chartData = useMemo(()=> !scores ? [] : [
    { metric: '乾燥', value: scores.dryness },
    { metric: '皮脂', value: scores.oiliness },
    { metric: '赤み', value: scores.redness },
    { metric: '明るさ', value: scores.brightness },
    { metric: 'むくみ', value: scores.puffiness }
  ],[scores])

  const onAnalyze = async()=> {
    setError('')
    if(!file){ setError('画像を選択してください'); return }
    setLoading(true)
    const t0 = performance.now()
    ga('analyze_start')

    try{
      const b64 = await fileToBase64(file)
      const res = await fetch('/api/analyze',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ imageBase64: b64 })
      })
      const json = await res.json()
      if(!res.ok){ throw new Error(json?.error || '解析に失敗しました') }
      setScores(json.scores)
      ga('analyze_success', { latency_ms: Math.round(performance.now() - t0) })

      const qs = new URLSearchParams({
        dryness: String(json.scores.dryness),
        oiliness: String(json.scores.oiliness),
        redness: String(json.scores.redness),
        brightness: String(json.scores.brightness),
        puffiness: String(json.scores.puffiness)
      })
      const rec = await fetch(`/api/recommend?${qs.toString()}`)
      if(!rec.ok){ throw new Error('レコメンド取得に失敗しました') }
      const recJson = await rec.json()
      setProducts(recJson.products || [])
      ga('recommend_list_loaded', { count: (recJson.products||[]).length })
    }catch(e:any){
      setError(e.message || '解析でエラーが発生しました')
      ga('analyze_error', { message: String(e?.message||e) })
    }finally{
      setLoading(false)
    }
  }

  // ▼▼ 共有：X/Instagram/コピー（チャートの下に表示） ▼▼
  const shareUrl = scores ? getShareUrl(scores, products) : ''

  const onShareX = () => {
    if(!scores) return
    const url = new URL('https://twitter.com/intent/tweet')
    url.searchParams.set('text', 'AI肌診断の結果をシェアします')
    url.searchParams.set('url', shareUrl)
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
    ga('share_tweet')
  }

  const onShareInstagram = async () => {
    if(!scores) return
    try{
      // Web Share API (files) が使える端末ではPNGを直接共有 → Instagram選択可能
      const blob = await svgToPngBlob(shareUrl, 1080, 1920)
      const file = new File([blob], 'skincare.png', { type: 'image/png' })
      // @ts-ignore
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        // @ts-ignore
        await navigator.share({
          title: 'AI肌診断',
          text: 'AI肌診断の結果をシェアします',
          files: [file]
        })
        ga('share_instagram')
        return
      }
      // デスクトップ等：画像を別タブで開いて手動アップの案内
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
      alert('Instagramはブラウザからの直接投稿に制限があります。画像を保存してアプリから投稿してください。')
    }catch{
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
      alert('画像を保存してInstagramアプリから投稿してください。')
    }
  }

  const onCopyLink = async () => {
    if(!scores) return
    await navigator.clipboard.writeText(shareUrl)
    ga('share_copy_link')
    alert('リンクをコピーしました')
  }
  // ▲▲ ここまで ▲▲

  return (
    <main>
      <div className="container grid" style={{gap:24}}>
        <header className="grid" style={{textAlign:'center', gap:8}}>
          <h1 style={{fontSize:32,fontWeight:800,letterSpacing:'-0.02em'}}>スキンケアAI</h1>
          <p className="small">AIが肌を5つの指標でスコア化し、あなたに合ったコスメを提案します</p>
          <p className="small" style={{opacity:.7}}>※ 医療診断ではありません</p>
        </header>

        {/* Android用インストールボタン（出せる環境のみ表示） */}
        {deferred && (
          <div className="card" style={{padding:12}}>
            <button className="button" onClick={async()=>{
              ga('pwa_install_prompt')
              await deferred.prompt()
              setDeferred(null)
            }}>ホームに追加（インストール）</button>
          </div>
        )}

        <section className="card" style={{padding:16}}>
          <div className="grid-2" style={{gap:16}}>
            <div>
              <div className="label">顔写真（正面・明るい場所・ノーメイク推奨）</div>
              <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
              <p className="small" style={{marginTop:6}}>推奨: 正面・明るい均一光・カメラから30–50cm・髪で顔を隠さない</p>
              <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
                <button className="button" onClick={onAnalyze} disabled={loading}>
                  {loading?'解析中…':'解析する'}
                </button>
              </div>
              {error && <p className="small" style={{color:'#dc2626',marginTop:8}}>{error}</p>}
            </div>

            <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',minHeight:260}}>
              {/* レーダーチャート */}
              {scores ? (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="80%">
                    <PolarGrid/>
                    <PolarAngleAxis dataKey="metric"/>
                    <PolarRadiusAxis domain={[0,100]}/>
                    <Radar name="スコア" dataKey="value" />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="small" style={{opacity:.7}}>解析するとレーダーチャートを表示します（0–100）</div>
              )}

              {/* ▼ チャートの下に3ボタン ▼ */}
              {scores && (
                <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center'}}>
                  <button className="button" onClick={onShareX}>Xでシェア</button>
                  <button className="button" onClick={onShareInstagram}>インスタでシェア</button>
                  <button className="button" onClick={onCopyLink}>リンクをコピー</button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="card" style={{padding:16}}>
          <h2 style={{fontSize:20, margin:'4px 0 12px'}}>おすすめ商品</h2>
          {products.length===0 && <p className="small">スコアに合致する商品が0–3件まで表示されます。</p>}
          <div className="grid" style={{gridTemplateColumns:'1fr',gap:12}}>
            {products.map(p=> (
              <article key={p.id} className="card" style={{padding:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <div>
                    <div style={{fontWeight:700}}>{p.name}</div>
                    <div className="small" style={{marginTop:4}}>{p.reason}</div>
                  </div>
                  <a
                    className="link"
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={()=>ga('recommend_click', { id: p.id })}
                  >詳細を見る →</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="small" style={{opacity:.8}}>
          <p>※ 本サービスは美容用途の簡易評価です。医療診断は行いません。気になる症状がある場合は医療機関にご相談ください。</p>
        </footer>
      </div>
    </main>
  )
}

async function fileToBase64(file:File){
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for(let i=0;i<bytes.byteLength;i++){ binary += String.fromCharCode(bytes[i]) }
  return `data:${file.type};base64,` + btoa(binary)
}

// ===== 共有ユーティリティ =====

function getShareUrl(scores: Scores, products: Product[]){
  const qs = new URLSearchParams({
    dryness:String(scores.dryness),
    oiliness:String(scores.oiliness),
    redness:String(scores.redness),
    brightness:String(scores.brightness),
    puffiness:String(scores.puffiness),
    p1: products[0]?.name || '',
    p2: products[1]?.name || '',
    p3: products[2]?.name || '',
  })
  return `${location.origin}${SHARE_ENDPOINT}?${qs.toString()}`
}

async function svgToPngBlob(absUrl: string, w=1080, h=1920): Promise<Blob> {
  const svgText = await (await fetch(absUrl, { cache: 'no-store' })).text()
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
  await new Promise<void>((resolve, reject)=>{
    img.onload = ()=>resolve()
    img.onerror = reject
  })
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return await new Promise<Blob>((resolve)=> canvas.toBlob(b=>resolve(b!), 'image/png'))
}
