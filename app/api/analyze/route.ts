export const runtime = 'nodejs';
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

const ScoreSchema = z.object({
  dryness: z.number().min(0).max(100),
  oiliness: z.number().min(0).max(100),
  redness: z.number().min(0).max(100),
  brightness: z.number().min(0).max(100),
  puffiness: z.number().min(0).max(100)
})

export async function POST(req:NextRequest){
  try{
    const { imageBase64 } = await req.json()
    if(!imageBase64 || typeof imageBase64 !== 'string'){
      return new Response(JSON.stringify({ error:'imageBase64 が必要です'}),{ status:400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // 画像＋指示 → JSONスコア（構造化出力）
    const jsonSchema = {
      name: 'SkinScores',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          dryness: { type:'number' },
          oiliness: { type:'number' },
          redness: { type:'number' },
          brightness: { type:'number' },
          puffiness: { type:'number' }
        },
        required: ['dryness','oiliness','redness','brightness','puffiness']
      },
      strict: true
    } as const

    const sys = 'あなたは美容アドバイザーAI。入力画像は1名の顔。乾燥・皮脂・赤み・明るさ・むくみを0–100で出力。JSONのみを返す。医学的診断はしない。'
    const user = 'この顔写真を分析し、{dryness, oiliness, redness, brightness, puffiness} を返す。根拠テキストは不要。JSONのみ。'

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        {
          role: 'user',
          content: [
            { type: 'text', text: user },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ],
      // JSON文字列で返すようモデルに指示 → 後段でZodで厳格チェック
      response_format: { type: 'json_object' },
      max_tokens: 200
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    const scores = ScoreSchema.parse(parsed);
    return new Response(JSON.stringify({ scores }),{ status:200 })
  }catch(err:any){
    console.error('analyze error', err)
    return new Response(JSON.stringify({ error:'画像解析に失敗しました。写真条件（明るさ・正面）を確認して再試行してください。'}),{ status:500 })
  }
}