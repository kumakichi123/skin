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
    id: 'asparagus-grapefruit-salad',
    title: 'きれいをチャージ！アスパラガスとグレープフルーツのグリーンサラダ',
    description: 'β-カロテン＆ビタミンC・Eでくすみ予防。オメガ3で血行もサポート。',
    effects: ['くすみケア', '赤み・肌荒れ'],
    focuses: ['brightness', 'redness'],
    coverUrl: 'https://uotkswxcohvlcmuhqnmq.supabase.co/storage/v1/object/public/recipes/asparagus-grapefruit-salad/image1.png'
  },
  {
  id: 'salmon-mushroom-butter-rice',
  title: 'バター香る鮭とシメジの炊き込みご飯',
  description: '鮭とシメジを炊飯器で炊き込んだご飯。ビタミンDやタンパク質が肌のバリアを助け、乾燥対策に適した一品。',
  effects: ['乾燥ケア'],
  focuses: ['dryness'],
  coverUrl: 'https://uotkswxcohvlcmuhqnmq.supabase.co/storage/v1/object/public/recipes/salmon-mushroom-butter-rice/image4.png'
  },
  {
  id: 'winter-melon-herbal-soup',
  title: '冬瓜と鶏肉の薬膳スープでむくみをケア',
  description: '冬瓜の利尿作用と鶏肉・卵のたんぱく質が体内の水分バランスを整え、むくみ対策と乾燥ケアに役立つ薬膳スープ。',
  effects: ['むくみ対策', '乾燥ケア'],
  focuses: ['puffiness', 'dryness'],
  coverUrl: 'https://uotkswxcohvlcmuhqnmq.supabase.co/storage/v1/object/public/recipes/winter-melon-herbal-soup/image1.png'
 },
 {
  id: 'beef-lettuce-korean-salad',
  title: '牛肉とレタスの韓国風サラダ',
  description: 'レタスに香ばしい牛肉やキムチを合わせた韓国風サラダ。タンパク質・食物繊維・発酵食品が乾燥肌やむくみのケアに役立つ。',
  effects: ['乾燥ケア','むくみ対策'],
  focuses: ['dryness','puffiness'],
  coverUrl: 'https://uotkswxcohvlcmuhqnmq.supabase.co/storage/v1/object/public/recipes/beef-lettuce-korean-salad/image1.png'
},
{
  id: 'ginger-pork-meatball-teriyaki',
  title: '生姜香る豚こま団子の照り焼き',
  description: '生姜とねぎを練り込んだ豚こま肉の団子を甘辛ダレで照り焼きに。豚肉のビタミンB1が乾燥肌を補い、ハリをサポートする。',
  effects: ['乾燥ケア','ハリ・弾力'],
  focuses: ['dryness'],
  coverUrl: 'https://uotkswxcohvlcmuhqnmq.supabase.co/storage/v1/object/public/recipes/ginger-pork-meatball-teriyaki/image1.png'
},
]
