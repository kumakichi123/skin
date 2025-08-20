'use client'

import { useMemo } from 'react'

export type Scores = {
  dryness: number
  oiliness: number
  redness: number
  brightness: number
  puffiness: number
}

type Props = {
  scores: Scores
  products: string[]        // 最大3件の「商品名」
  endpoint?: '/api/share' | '/api/og'  // 既定は /api/share にしておく
}

const SHARE_ENDPOINT_DEFAULT: Props['endpoint'] = '/api/share'

function buildQS(scores: Scores, products: string[]) {
  const qs = new URLSearchParams()
  qs.set('dryness', String(scores.dryness ?? 0))
  qs.set('oiliness', String(scores.oiliness ?? 0))
  qs.set('redness', String(scores.redness ?? 0))
  qs.set('brightness', String(scores.brightness ?? 0))
  qs.set('puffiness', String(scores.puffiness ?? 0))
  products.slice(0, 3).forEach((p, i) => qs.set(`p${i + 1}`, p))
  return qs
}

async function copyShareLink(absUrl: string) {
  await navigator.clipboard.writeText(absUrl)
  alert('リンクをコピーしました')
}

async function downloadSVG(absUrl: string) {
  const res = await fetch(absUrl, { cache: 'no-store' })
  const svg = await res.text()
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `skincare-${Date.now()}.svg`
  document.body.appendChild(a)
  a.click()
  URL.revokeObjectURL(a.href)
  a.remove()
}

async function downloadPNG(absUrl: string, w = 1080, h = 1920) {
  const svgText = await (await fetch(absUrl, { cache: 'no-store' })).text()
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
  })
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `skincare-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function tweetShare(absUrl: string) {
  const url = new URL('https://twitter.com/intent/tweet')
  url.searchParams.set('text', 'AI肌診断の結果をシェアします')
  url.searchParams.set('url', absUrl)
  window.open(url.toString(), '_blank', 'noopener,noreferrer')
}

export default function ShareActions({ scores, products, endpoint }: Props) {
  const shareUrl = useMemo(() => {
    const qs = buildQS(scores, products)
    const ep = endpoint ?? SHARE_ENDPOINT_DEFAULT
    return `${location.origin}${ep}?${qs.toString()}`
  }, [scores, products, endpoint])

  const canWebShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button
        className="rounded-xl border px-3 py-2 text-sm shadow hover:bg-gray-50"
        onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
      >
        画像を開く
      </button>

      <button
        className="rounded-xl border px-3 py-2 text-sm shadow hover:bg-gray-50"
        onClick={() => copyShareLink(shareUrl)}
      >
        リンクをコピー
      </button>

      <button
        className="rounded-xl border px-3 py-2 text-sm shadow hover:bg-gray-50"
        onClick={() => downloadSVG(shareUrl)}
      >
        SVGで保存
      </button>

      <button
        className="rounded-xl border px-3 py-2 text-sm shadow hover:bg-gray-50"
        onClick={() => downloadPNG(shareUrl)}
      >
        PNGで保存
      </button>

      <button
        className="rounded-xl border px-3 py-2 text-sm shadow hover:bg-gray-50"
        onClick={() => tweetShare(shareUrl)}
      >
        Xでシェア
      </button>

      {canWebShare && (
        <button
          className="rounded-xl border px-3 py-2 text-sm shadow hover:bg-gray-50"
          onClick={() =>
            (navigator as any).share({
              title: 'AI肌診断',
              text: 'AI肌診断の結果をシェアします',
              url: shareUrl,
            }).catch(() => {})
          }
        >
          端末の共有…
        </button>
      )}
    </div>
  )
}
