// lib/reason.ts
import type { Scores } from '../app/page' // 既存型を流用

// 各指標に対して出す“短い根拠”のテンプレ
const TEMPLATES = {
  dryness: (v:number)=> v>=75
    ? '強い乾燥傾向。セラミドやワセリンなど閉塞性の高い保湿で水分を逃がさない処方が合います。'
    : '乾燥が気味。ヒアルロン酸やグリセリン中心の保水＋軽い油分でバランスを取りましょう。',

  oiliness: (v:number)=> v>=70
    ? '皮脂分泌が多め。ノンコメドジェニック・アルコール控えめで軽い使用感の処方がおすすめ。'
    : '皮脂はやや多め。みずみずしい化粧水＋軽いジェル/ミルクでテカりを抑えます。',

  redness: (v:number)=> v>=65
    ? '赤みが出やすい状態。低刺激&香料少なめ、洗顔は摩擦と洗浄力を控えめに。'
    : 'やや敏感傾向。刺激源を減らし、保護系成分で肌を落ち着かせましょう。',

  brightness: (v:number)=> v<=45
    ? 'トーンがやや暗め。ビタミンC誘導体やナイアシンアミドでくすみケアが向いています。'
    : '明るさは良好。保湿とUVケアを継続してキープ。',

  puffiness: (v:number)=> v>=60
    ? 'むくみ傾向。塩分/睡眠リズムの影響も大きいので、スキンケアは軽め＋冷感アプローチが有効。'
    : 'むくみは軽度。マッサージは優しく短時間で。'
} as const

// 上位ドライバー2つだけ拾って、最短2文で返す
export function buildReasonFromScores(scores: Scores){
  const entries: Array<[keyof Scores, number]> = Object.entries(scores) as any
  // “高さ”と“低さ”の両極をドライバーにするため、明るさは低いほど強いとみなす
  const strength = (k:keyof Scores, v:number)=> k==='brightness' ? (100 - v) : v
  const top = entries.sort((a,b)=> strength(b[0] as any,b[1]) - strength(a[0] as any,a[1])).slice(0,2)

  const sentences = top.map(([k,v]) => {
    const tmpl = (TEMPLATES as any)[k]
    return typeof tmpl==='function' ? tmpl(v) : ''
  }).filter(Boolean)

  // 文末に“個別化”っぽさを1行だけ足す（情報過多を避ける）
  const tail = `（あなたの主な傾向: ${top.map(([k])=>labelOf(k)).join('・')}）`
  return sentences.slice(0,2).join(' ') + ' ' + tail
}

function labelOf(k: keyof Scores){
  return ({dryness:'乾燥', oiliness:'皮脂', redness:'赤み', brightness:'明るさ↓', puffiness:'むくみ'} as const)[k]
}
