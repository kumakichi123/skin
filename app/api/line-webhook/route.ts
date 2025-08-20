// app/api/line-webhook/route.ts
export const runtime = 'nodejs'

import crypto from 'crypto'

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || ''
const LINE_API = 'https://api.line.me'

async function verifySignature(req: Request, body: string) {
  const signature = req.headers.get('x-line-signature') || ''
  const hmac = crypto.createHmac('sha256', CHANNEL_SECRET)
  hmac.update(body)
  const digest = hmac.digest('base64')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

async function lineReply(replyToken: string, messages: any[]) {
  const res = await fetch(`${LINE_API}/v2/bot/message/reply`, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages })
  })
  if(!res.ok){
    const t = await res.text()
    console.error('LINE reply error', res.status, t)
  }
}

async function fetchLineContent(messageId: string) {
  const res = await fetch(`${LINE_API}/v2/bot/message/${messageId}/content`, {
    headers:{ 'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}` }
  })
  if(!res.ok) throw new Error(`content ${res.status}`)
  const buf = await res.arrayBuffer()
  const ct = res.headers.get('content-type') || 'image/jpeg'
  const b64 = Buffer.from(buf).toString('base64')
  return `data:${ct};base64,${b64}`
}

export async function POST(req: Request) {
  try{
    const origin = new URL(req.url).origin
    const bodyText = await req.text()

    if (!CHANNEL_ACCESS_TOKEN || !CHANNEL_SECRET) {
      return new Response('LINE env missing', { status:500 })
    }
    if (!await verifySignature(req, bodyText)) {
      return new Response('invalid signature', { status:403 })
    }

    const json = JSON.parse(bodyText)
    const events = json.events || []

    for (const ev of events) {
      if (ev.type !== 'message') continue

      const replyToken = ev.replyToken
      const userId = ev.source?.userId

      if (ev.message?.type === 'image') {
        try{
          // 1) 画像取得
          const dataUrl = await fetchLineContent(ev.message.id)

          // 2) 解析 → スコア
          const analyzeRes = await fetch(`${origin}/api/analyze`, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ imageBase64: dataUrl })
          })
          const analyzeJson = await analyzeRes.json()
          if(!analyzeRes.ok) throw new Error(analyzeJson?.error || 'analyze failed')
          const s = analyzeJson.scores

          // 3) レコメンド
          const qs = new URLSearchParams({
            dryness:String(s.dryness),
            oiliness:String(s.oiliness),
            redness:String(s.redness),
            brightness:String(s.brightness),
            puffiness:String(s.puffiness)
          })
          const recRes = await fetch(`${origin}/api/recommend?${qs.toString()}`)
          const recJson = await recRes.json()
          const products = (recJson.products||[]) as Array<{name:string}>

          // 4) シェア画像URL生成（その場描画）
          const shareUrl = `${origin}/api/share?${new URLSearchParams({
            ...qs,
            p1: products[0]?.name || '',
            p2: products[1]?.name || '',
            p3: products[2]?.name || '',
          }).toString()}`

          // 5) 返信（画像 + テキスト）
          await lineReply(replyToken, [
            {
              type: 'image',
              originalContentUrl: shareUrl,
              previewImageUrl: shareUrl
            },
            {
              type: 'text',
              text:
                `AI肌診断の結果だよ！\n` +
                `乾燥:${s.dryness} 皮脂:${s.oiliness} 赤み:${s.redness} 明るさ:${s.brightness} むくみ:${s.puffiness}\n` +
                (products.length ? `おすすめ: ${products.map(p=>p.name).join(' / ')}` : 'おすすめは見つかりませんでした')
            }
          ])
        }catch(e:any){
          console.error('LINE flow error', e)
          await lineReply(replyToken, [{ type:'text', text:'画像の解析に失敗しました。明るい場所で正面の写真で再度お試しください。'}])
        }
        continue
      }

      // テキストなどはヘルプ応答
      if (ev.message?.type === 'text') {
        await lineReply(replyToken, [{ type:'text', text:'顔写真を送ってね。AIが5つの指標でスコア化して、結果画像を返すよ！'}])
      }
    }

    return new Response('OK', { status:200 })
  }catch(e:any){
    console.error('webhook error', e)
    return new Response('ERR', { status:500 })
  }
}
