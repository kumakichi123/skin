// types/index.ts

export type Quality = {
level: 'low' | 'med' | 'high'
exposure: number
sharpness: number
}

export type Scores = {
  dryness: number
  oiliness: number
  redness: number
  brightness: number
  puffiness: number
}

export type Product = {
  id: string
  name: string
  reason: string
  url: string
  image?: string
}

export type UserLite = { id: string; email: string }

// 追加（Canvasの型を統合）
export type Measurement = {
  id: string
  user_id: string
  scores: Scores
  products?: Product[] | null // 将来のため any はやめて Product[] 推奨
  analysis_version?: string
  quality?: Quality | null
  created_at: string
}

export type Recipe = {
  id: string
  title: string
  description: string
  time: number      // minutes
  cost: number      // 円（目安）
  tags: string[]
  ingredients: string[]
  steps: string[]
  focuses: (keyof Scores)[] // どの指標に効かせるか
}

// あると便利
export type PlanStatus = 'free' | 'pro'
