'use client'
import type { Scores, Product } from '../types'
import { getShareUrl, svgToPngBlob } from '../utils/share'
import { ga } from '../lib/ga'
import { isJa } from '../constants/messages'


export function useShare(scores: Scores|null, products: Product[]){
const shareUrl = (scores ? getShareUrl(scores, products) : '')


const shareX = () => {
if(!scores) return
const url = new URL('https://twitter.com/intent/tweet')
url.searchParams.set('text', isJa ? 'AI肌診断の結果をシェアします' : 'Sharing my AI skin analysis result')
url.searchParams.set('url', shareUrl)
window.open(url.toString(), '_blank', 'noopener,noreferrer')
ga('share_tweet')
}


const shareInstagram = async () => {
if(!scores) return
try{
const blob = await svgToPngBlob(shareUrl, 1080, 1920)
const file = new File([blob], 'skincare.png', { type: 'image/png' })
// @ts-ignore
if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
// @ts-ignore
await navigator.share({ title: 'AI肌診断', text: isJa ? 'AI肌診断の結果をシェアします' : 'Sharing my AI skin analysis result', files: [file] })
ga('share_instagram'); return
}
window.open(shareUrl, '_blank', 'noopener,noreferrer')
alert(isJa ? 'Instagramはブラウザからの直接投稿に制限があります。画像を保存してアプリから投稿してください。' : 'Instagram does not allow direct posting from browsers. Save the image and upload via the app.')
}catch{
window.open(shareUrl, '_blank', 'noopener,noreferrer')
alert(isJa ? '画像を保存してInstagramアプリから投稿してください。' : 'Save the image and upload it via Instagram app.')
}
}


const copyLink = async () => {
if(!scores) return
await navigator.clipboard.writeText(shareUrl)
ga('share_copy_link')
alert(isJa ? 'リンクをコピーしました' : 'Link copied to clipboard')
}


return { shareUrl, shareX, shareInstagram, copyLink }
}