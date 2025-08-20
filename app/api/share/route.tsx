// app/api/share/route.ts
export const runtime = 'edge'

import { ImageResponse } from 'next/og'

type Scores = { dryness:number; oiliness:number; redness:number; brightness:number; puffiness:number }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scores: Scores = {
    dryness: Number(searchParams.get('dryness')||0),
    oiliness: Number(searchParams.get('oiliness')||0),
    redness: Number(searchParams.get('redness')||0),
    brightness: Number(searchParams.get('brightness')||0),
    puffiness: Number(searchParams.get('puffiness')||0),
  }

  // 商品名（任意）
  const p1 = searchParams.get('p1') || ''
  const p2 = searchParams.get('p2') || ''
  const p3 = searchParams.get('p3') || ''

  // フォント
  const fontRegular = await fetch(new URL('/fonts/NotoSansJP-Regular.ttf', req.url))
    .then(r => r.arrayBuffer())
    .catch(()=>undefined)

  // レーダー用座標計算
  const W = 1080, H = 1920
  const cx = W/2, cy = 720
  const R = 380
  const metrics = [
    {key:'dryness', label:'乾燥'},
    {key:'oiliness', label:'皮脂'},
    {key:'redness', label:'赤み'},
    {key:'brightness', label:'明るさ'},
    {key:'puffiness', label:'むくみ'},
  ] as const

  const toPt = (i:number, val:number) => {
    const angle = (-90 + i * 360/metrics.length) * Math.PI/180
    const r = (val/100) * R
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }

  const vals = metrics.map(m => (scores as any)[m.key] as number)
  const poly = vals.map((v,i)=>toPt(i,v)).join(' ')
  const rings = [20,40,60,80,100].map(t => vals.map((_v,i)=>toPt(i,t)).join(' '))

  return new ImageResponse(
    (
      <div
        style={{
          width: W, height: H, display:'flex', flexDirection:'column',
          background: 'linear-gradient(180deg,#f7f5ff,#ffffff 40%,#f8fafc)'
        }}
      >
        {/* ヘッダー */}
        <div style={{padding:'40px 56px 0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontSize:44, fontWeight:800, color:'#1f2937', letterSpacing:-0.5}}>スキンケアAI 解析結果</div>
          <div style={{fontSize:24, color:'#6b7280'}}>powered by AI</div>
        </div>

        {/* レーダーチャート領域 */}
        <div style={{position:'relative', width:'100%', height:900}}>
          <svg width={W} height={900}>
            {/* 軸ラベル */}
            {metrics.map((m,i)=>{
              const angle = (-90 + i*360/metrics.length)*Math.PI/180
              const lx = cx + (R+60)*Math.cos(angle)
              const ly = cy + (R+60)*Math.sin(angle)
              return (
                <text key={m.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="28" fill="#334155">
                  {m.label}
                </text>
              )
            })}
            {/* 輪郭 */}
            {rings.map((pts,idx)=>(
              <polygon key={idx} points={pts} fill="none" stroke="#c7d2fe" strokeWidth={1}/>
            ))}
            {/* 軸線 */}
            {metrics.map((_m,i)=>{
              const angle = (-90 + i*360/metrics.length)*Math.PI/180
              const x = cx + R * Math.cos(angle)
              const y = cy + R * Math.sin(angle)
              return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d1d5db"/>
            })}
            {/* 実スコア */}
            <polygon points={poly} fill="rgba(124,58,237,0.18)" stroke="#7c3aed" strokeWidth={3}/>
            {/* 中心点 */}
            <circle cx={cx} cy={cy} r="4" fill="#7c3aed" />
          </svg>

          {/* スコア数値 */}
          <div style={{position:'absolute', left:0, right:0, bottom:60, display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap'}}>
            {metrics.map(m=>(
              <div key={m.key} style={{background:'#ffffff', borderRadius:14, padding:'10px 16px', boxShadow:'0 6px 18px rgba(0,0,0,0.06)'}}>
                <span style={{fontSize:22, color:'#475569', marginRight:8}}>{m.label}</span>
                <strong style={{fontSize:26, color:'#111827'}}>{(scores as any)[m.key]}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* おすすめ商品 */}
        <div style={{padding:'0 40px', display:'flex', flexDirection:'column', gap:18}}>
          <div style={{fontSize:30, fontWeight:800, color:'#1f2937'}}>あなたへのおすすめ</div>
          {[p1,p2,p3].filter(Boolean).map((name,idx)=>(
            <div key={idx} style={{display:'flex',alignItems:'center',gap:16, background:'#fff', borderRadius:20, padding:'18px 20px', boxShadow:'0 10px 24px rgba(0,0,0,0.08)'}}>
              <div style={{width:36, height:36, borderRadius:999, background:'#ede9fe', color:'#7c3aed', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center'}}>{idx+1}</div>
              <div style={{fontSize:26, color:'#111827', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{name}</div>
            </div>
          ))}
          {[p1,p2,p3].every(n => !n) && (
            <div style={{fontSize:22, color:'#6b7280'}}>スコアに合致する商品が見つかったらここに最大3件表示されます</div>
          )}
        </div>

        {/* フッター／免責 */}
        <div style={{marginTop:'auto', padding:'24px 40px 36px', color:'#6b7280', fontSize:22}}>
          ※ 美容用途の簡易評価です（医療診断ではありません）。#AI肌診断
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: fontRegular ? [{ name:'NotoSansJP', data: fontRegular, style:'normal', weight: 400 }] : [],
    }
  )
}
