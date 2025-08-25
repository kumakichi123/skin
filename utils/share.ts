import type { Scores, Product } from '../types'
import { SHARE_ENDPOINT } from '../constants/messages'


export function getShareUrl(scores: Scores, products: Product[]){
const qs = new URLSearchParams({
dryness:String(scores.dryness),
oiliness:String(scores.oiliness),
redness:String(scores.redness),
brightness:String(scores.brightness),
puffiness:String(scores.puffiness),
p1: products[0]?.name || '',
p2: products[1]?.name || '',
p3: products[2]?.name || '',
})
return `${location.origin}${SHARE_ENDPOINT}?${qs.toString()}`
}


export async function svgToPngBlob(absUrl: string, w=1080, h=1920): Promise<Blob> {
const res = await fetch(absUrl, { cache: 'no-store' })
const type = res.headers.get('content-type') || ''
if (type.startsWith('image/png')) return await res.blob()
const svgText = await res.text()
const img = new Image()
img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
await new Promise<void>((ok, ng)=>{ img.onload = ()=>ok(); img.onerror = ng })
const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
const ctx = canvas.getContext('2d')!
ctx.drawImage(img, 0, 0, w, h)
return await new Promise<Blob>((ok)=> canvas.toBlob(b=>ok(b!), 'image/png'))
}