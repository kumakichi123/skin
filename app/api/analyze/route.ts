// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const maxDuration = 30

// ★ 公式IDを既定に（envで上書き可）
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })

    const API_KEY = process.env.OPENAI_API_KEY
    if (!API_KEY) return NextResponse.json({ error: 'NO_OPENAI_API_KEY' }, { status: 500 })

    const prompt =
      'あなたは美容アドバイザーAI。入力画像は1名の顔。乾燥・皮脂・赤み・明るさ・むくみを0–100で返す。医学的診断はしない。'

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: '画像を分析し、{dryness,oiliness,redness,brightness,puffiness}のJSONのみを返す。' },
              // ★ data URL をそのまま渡す
              { type: 'input_image', image_url: imageBase64 }
            ]
          }
        ],
        // ★ ここが v4 仕様：text.format に移動
        text: {
          format: {
            type: 'json_schema',
            name: 'scores',            // ★ これが必須
            strict: true,
            schema: {
              type: 'object',
              properties: {
                dryness: { type: 'number' },
                oiliness: { type: 'number' },
                redness: { type: 'number' },
                brightness: { type: 'number' },
                puffiness: { type: 'number' }
              },
              required: ['dryness','oiliness','redness','brightness','puffiness'],
              additionalProperties: false
            }
          }
        }
      })
    })

    if (!r.ok) {
      const detail = await r.text().catch(()=>'')
      console.error('OpenAI error', r.status, detail)
      return NextResponse.json({ error: 'OPENAI_ERROR', status: r.status, detail }, { status: 500 })
    }

    const data = await r.json()
    // Structured Outputsのパース済みが来る実装もあるが環境差があるため両対応
    const scores =
      data?.output_parsed ??
      (() => {
        const txt =
          data?.output_text ??
          data?.output?.[0]?.content?.find?.((p: any) => p?.type === 'output_text' || p?.type === 'text')?.text
        return txt ? JSON.parse(txt) : null
      })()

    if (!scores) return NextResponse.json({ error: 'PARSE_FAILED' }, { status: 500 })
    return NextResponse.json({ scores })
  } catch (e: any) {
    console.error('Analyze error', e)
    return NextResponse.json({ error: 'ANALYZE_FAILED', message: e?.message ?? 'unknown' }, { status: 500 })
  }
}
