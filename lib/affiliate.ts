// lib/affiliate.ts
export function withAffiliate(rawUrl:string){
  const tag = process.env.AFFILIATE_TAG; // 例: yourid-22（Amazon アソシエイト）
  try{
    const u = new URL(rawUrl);

    // Amazon系は tag=xxx を優先
    if (u.hostname.includes('amazon.')) {
      if (tag) u.searchParams.set('tag', tag);
      return u.toString();
    }

    // それ以外は汎用UTMを付けて計測（EC側が許可している範囲で使用）
    if (!u.searchParams.has('utm_source')) {
      u.searchParams.set('utm_source', 'skincare-ai');
      u.searchParams.set('utm_medium', 'recommend');
      u.searchParams.set('utm_campaign', 'mvp');
    }
    return u.toString();
  }catch{
    return rawUrl;
  }
}
