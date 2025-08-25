// lib/affiliate.ts
export function withAffiliate(url: string): string {
  try {
    const tag = process.env.AFFILIATE_TAG
    if (!tag) return url
    const u = new URL(url)
    // 既に付いていたら上書きしない（必要なら上書きに変更）
    if (!u.searchParams.has('tag')) u.searchParams.set('tag', tag)
    return u.toString()
  } catch {
    return url
  }
}