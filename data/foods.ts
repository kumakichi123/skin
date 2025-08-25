import { Scores } from '../types'

type FoodSet = {
  metric: keyof Scores
  good: string[]
  avoid: string[]
}

export const FOOD_SETS: FoodSet[] = [
  { metric: 'dryness', good: ['サーモン','サバ','アーモンド','くるみ','アボカド','オリーブオイル'], avoid: ['極端な低脂質食','過度なカフェイン'] },
  { metric: 'oiliness', good: ['全粒穀物','豆類','葉物野菜','鶏むね'], avoid: ['高GI菓子','揚げ物','甘い飲料'] },
  { metric: 'redness', good: ['ベリー類','緑茶','ターメリック','サーモン'], avoid: ['アルコール過多','香辛料の過剰'] },
  { metric: 'brightness', good: ['柑橘','キウイ','赤身肉/レバー','ほうれん草'], avoid: ['野菜不足','極端な糖質制限'] },
  { metric: 'puffiness', good: ['バナナ','海藻','きのこ','きゅうり'], avoid: ['高塩分惣菜','即席麺'] },
]