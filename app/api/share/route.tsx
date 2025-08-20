// app/api/share/route.tsx
export const runtime = 'edge'

type Scores = {
  dryness:number; oiliness:number; redness:number; brightness:number; puffiness:number
}

const W = 1080, H = 1920
const CX = W/2, CY = 720
const R = 380
const METRICS = [
  {key:'dryness',   label:'乾燥'},
  {key:'oiliness',  label:'皮脂'},
  {key:'redness',   label:'赤み'},
  {key:'brightness',label:'明るさ'},
  {key:'puffiness', label:'むくみ'},
] as const

const clamp01 = (v:number)=> Math.max(0, Math.min(100, v))

function pt(i:number, val:number){
  const angle = (-90 + i * 360/METRICS.length) * Math.PI/180
  const r = (clamp01(val)/100) * R
  const x = CX + r * Math.cos(angle)
  const y = CY + r * Math.sin(angle)
  return `${x.toFixed(1)},${y.toFixed(1)}`
}

function esc(s:string){
  return s.replace(/[&<>"']/g, (c)=>(
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]!
  ))
}

export async function GET(req: Request) {
  try{
    const { searchParams } = new URL(req.url)
    const s: Scores = {
      dryness:   Number(searchParams.get('dryness')   ?? 0),
      oiliness:  Number(searchParams.get('oiliness')  ?? 0),
      redness:   Number(searchParams.get('redness')   ?? 0),
      brightness:Number(searchParams.get('brightness')?? 0),
      puffiness: Number(searchParams.get('puffiness') ?? 0),
    }
    const pNames = [
      searchParams.get('p1') || '',
      searchParams.get('p2') || '',
      searchParams.get('p3') || '',
    ].filter(Boolean)

    const vals = METRICS.map(m => (s as any)[m.key] as number)
    const poly = vals.map((v,i)=>pt(i,v)).join(' ')
    const rings = [20,40,60,80,100].map(t => METRICS.map((_m,i)=>pt(i,t)).join(' '))

    // 軸ラベル座標（テキストはSVGでOK）
    const labelPos = METRICS.map((_m,i)=>{
      const angle = (-90 + i*360/METRICS.length)*Math.PI/180
      return {
        x: CX + (R+60)*Math.cos(angle),
        y: CY + (R+60)*Math.sin(angle),
      }
    })

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7f5ff"/>
      <stop offset="40%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- ヘッダー -->
  <text x="56" y="88" fill="#1f2937" font-size="44" font-weight="800">スキンケアAI 解析結果</text>
  <text x="${W-56}" y="88" fill="#6b7280" font-size="24" text-anchor="end">powered by AI</text>

  <!-- レーダーチャート -->
  ${rings.map(pts => `<polyline points="${pts}" fill="none" stroke="#c7d2fe" stroke-width="1"/>`).join('\n')}
  ${METRICS.map((_m, i) => {
    const angle = (-90 + i*360/METRICS.length)*Math.PI/180
    const x = CX + R*Math.cos(angle)
    const y = CY + R*Math.sin(angle)
    return `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="#d1d5db"/>`
  }).join('\n')}
  <polygon points="${poly}" stroke="#7c3aed" stroke-width="3" fill="#7c3aed" fill-opacity="0.18"/>
  <circle cx="${CX}" cy="${CY}" r="4" fill="#7c3aed"/>

  <!-- 軸ラベル -->
  ${METRICS.map((m,i)=>`<text x="${labelPos[i].x}" y="${labelPos[i].y}" font-size="28" fill="#334155" text-anchor="middle" dominant-baseline="middle">${m.label}</text>`).join('\n')}

  <!-- スコア数値 -->
  ${METRICS.map((m,i)=>`<text x="${W/2}" y="${1100 + i*36}" font-size="26" fill="#111827" text-anchor="middle">${m.label}: ${clamp01((s as any)[m.key])}</text>`).join('\n')}

  <!-- おすすめ -->
  <text x="40" y="1350" font-size="30" font-weight="800" fill="#1f2937">あなたへのおすすめ</text>
  ${
    pNames.length
      ? pNames.map((name, idx)=>`
        <g transform="translate(40 ${1388 + idx*64})">
          <rect x="0" y="-34" width="${W-80}" height="56" rx="14" fill="#ffffff" stroke="#ede9fe"/>
          <circle cx="28" cy="-6" r="18" fill="#ede9fe"/>
          <text x="28" y="-1" font-size="20" fill="#7c3aed" font-weight="800" text-anchor="middle">${idx+1}</text>
          <text x="64" y="-6" font-size="26" fill="#111827">${esc(name)}</text>
        </g>
      `).join('\n')
      : `<text x="40" y="1418" font-size="22" fill="#6b7280">スコアに合致する商品が見つかったらここに最大3件表示されます</text>`
  }

  <!-- フッター -->
  <text x="40" y="${H-48}" font-size="22" fill="#6b7280">※ 美容用途の簡易評価です（医療診断ではありません）。#AI肌診断</text>
</svg>`

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60'
      }
    })
  }catch(e:any){
    const errSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${W/2}" y="${H/2 - 10}" text-anchor="middle" font-size="42" fill="#111827">画像生成でエラー</text>
      <text x="${W/2}" y="${H/2 + 36}" text-anchor="middle" font-size="20" fill="#6b7280">${esc(String(e?.message || e))}</text>
    </svg>`
    return new Response(errSvg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } })
  }
}
