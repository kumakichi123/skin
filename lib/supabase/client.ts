// 既存の lib/supabaseClient.ts を再エクスポート
// Canvas内の `@/lib/supabase/client` を壊さないための互換レイヤ
export { supabase } from '../supabaseClient'
