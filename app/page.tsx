'use client'

import { useMemo, useState } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

export type Scores = {
  dryness: number
  oiliness: number
  redness: number
  brightness: number
  puffiness: number
}

type Product = { id:string; name:string; reason:string; url:string }

export default function Page(){
  const [file, setFile] = useState<File|null>(null)
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<Scores|null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string>('')

  const chartData = useMemo(()=>{
    if(!scores) return []
    return [
      { metric: '乾燥', value: scores.dryness },
      { metric: '皮脂', value: scores.oiliness },
      { metric: '赤み', value: scores.redness },
      { metric: '明るさ', value: scores.brightness },
      { metric: 'むくみ', value: scores.puffiness }
    ]
  },[scores])

  const onAnalyze = async()=>{
    setError('')
    if(!file){ setError('画像を選択してください'); return }
    setLoading(true)
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

      const qs = new URLSearchParams({
        dryness: String(json.scores.dryness),
        oiliness: String(json.scores.oiliness),
        redness: String(json.scores.redness),
        brightness: String(json.scores.brightness),
        puffiness: String(json.scores.puffiness)
      })
      const rec = await fetch(`/api/recommend?${qs.toString()}`)
      const recJson = await rec.json()
      setProducts(recJson.products || [])
    }catch(e:any){
      setError(e.message || '解析でエラーが発生しました')
    }finally{
      setLoading(false)
    }
  }

  return (
    <main>
      <div className="container grid" style={{gap:24}}>
        <header className="grid">
          <h1 style={{fontSize:28,fontWeight:800}}>スキンケアAI（MVP）</h1>
          <p className="small">美容用途の簡易肌診断。医療診断ではありません。画像は保存せず、解析後に破棄します。</p>
        </header>

        <section className="card" style={{padding:16}}>
          <div className="grid-2" style={{gap:16}}>
            <div>
              <div className="label">顔写真（正面・明るい場所・ノーメイク推奨）</div>
              <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
              <p className="small" style={{marginTop:6}}>推奨: 正面・明るい均一光・カメラから30–50cm・髪で顔を隠さない</p>
              <div style={{marginTop:12}}>
                <button className="button" onClick={onAnalyze} disabled={loading}>{loading?'解析中…':'解析する'}</button>
              </div>
              {error && <p className="small" style={{color:'#dc2626',marginTop:8}}>{error}</p>}
            </div>
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:220}}>
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
                  <a className="link" href={p.url} target="_blank" rel="noreferrer">詳細を見る →</a>
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
