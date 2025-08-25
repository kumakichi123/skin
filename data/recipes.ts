export type FocusKey = 'dryness' | 'oiliness' | 'redness' | 'brightness' | 'puffiness'

export type RecipeMeta = {
  id: string
  title: string
  description?: string
  effects?: string[]
  focuses: FocusKey[]
  coverUrl?: string
}

export const RECIPES: RecipeMeta[] = [
  {
    id: 'simple-hydration-toner',
    title: 'シンプル保湿トナー',
    description: '乾燥が気になる方向けの基本保湿レシピ',
    effects: ['乾燥肌向け'],
    focuses: ['dryness'],
    coverUrl: 'https://…/storage/v1/object/public/recipes/toner.jpg'
  },
  {
    id: 'asparagus-grapefruit-salad',
    title: 'きれいをチャージ！アスパラガスとグレープフルーツのグリーンサラダ',
    description: 'β-カロテン＆ビタミンC・Eでくすみ予防。オメガ3で血行もサポート。',
    effects: ['くすみケア', 'ハリ・シミ対策', '肌荒れケア'],
    focuses: ['brightness', 'redness'],
    coverUrl: 'https://uotkswxcohvlcmuhqnmq.supabase.co/storage/v1/object/public/recipes/asparagus-grapefruit-salad/image1.png'
  }
]
