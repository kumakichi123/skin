// lib/reason.ts
import type { Scores } from '../types'

const label: Record<keyof Scores, string> = {
  dryness: '乾燥',
  oiliness: '皮脂',
  redness: '赤み',
  brightness: '明るさ',
  puffiness: 'むくみ',
}

export function buildReasonFromScores(s: Scores): string {
  // もっとも高い指標と、必要に応じて2番手も拾って簡易文を生成
  const pairs = Object.entries(s) as [keyof Scores, number][]
  const sorted = pairs.sort((a, b) => b[1] - a[1])
  const [topK, topV] = sorted[0]
  const sec = sorted[1]

  const parts: string[] = []
  if (topV >= 65) parts.push(`${label[topK]}傾向がやや強め（${Math.round(topV)}）`)
  else parts.push(`全体は中庸でバランス良好`)
  if (sec && sec[1] >= 60) parts.push(`次点で${label[sec[0]]}（${Math.round(sec[1])}）もケア対象`)
  if (s.brightness <= 45) parts.push(`くすみ傾向（明るさ${Math.round(s.brightness)}）が見られます`)

  return parts.join('。') + '。'
}