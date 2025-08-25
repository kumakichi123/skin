'use client'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Plan = 'free' | 'pro'

type AuthCtxType = {
  user: any | null
  email: string | null
  plan: Plan
  ready: boolean
  refreshPlan: () => Promise<void>
}

const AuthCtx = createContext<AuthCtxType>({
  user: null, email: null, plan: 'free', ready: false, refreshPlan: async () => {}
})

// 小文字/空白を吸収して 'pro' | 'free' に正規化
const asPlan = (s?: string | null): Plan => (String(s ?? '').trim().toLowerCase() === 'pro' ? 'pro' : 'free')

// 複数のデータ源を見て "pro" を逃さない堅牢版（元コード踏襲）
async function fetchPlanRobust(u: any | null): Promise<Plan> {
  try {
    if (!u) return 'free'

    // 1) profiles.plan_status（正規ルート）
    const { data: prof } = await supabase
      .from('profiles')
      .select('plan_status')
      .eq('user_id', u.id)
      .maybeSingle()
    if (prof?.plan_status) return asPlan(prof.plan_status)

    // 2) 互換: public.users テーブル
    try {
      const { data: usr } = await supabase
        .from('users')
        .select('plan_status, is_pro')
        .eq('id', u.id)
        .maybeSingle()
      if (usr) {
        if (usr.is_pro === true) return 'pro'
        const s = String(usr.plan_status || '').toLowerCase()
        if (s === 'pro' || s === 'active') return 'pro'
      }
    } catch {}

    // 3) 最後のフォールバック: ユーザメタ
    const meta = (u.user_metadata || u.app_metadata || {}) as any
    if (meta?.plan === 'pro' || meta?.is_pro === true) return 'pro'

    return 'free'
  } catch (e) {
    console.warn('[AuthProvider] fetchPlanRobust error:', e)
    return 'free'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<Plan>('free')
  const [ready, setReady] = useState(false)

  // ✅ 変更点: getUser → getSession で初期化
  // ハードリロード直後でも session を先に掴んでから plan 判定するため、
  // 「一瞬 free → pro」にブレるのを最小化します。
  async function init() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const u = session?.user ?? null
      setUser(u)
      setEmail(u?.email ?? null)
      setPlan(await fetchPlanRobust(u))
    } catch (e) {
      console.warn('[AuthProvider] init exception:', e)
      setUser(null); setEmail(null); setPlan('free')
    } finally {
      setReady(true) // 失敗でもreadyにする（元設計踏襲）
    }
  }

  // 初期化＋認証イベントでの更新（元実装の踏襲）
  useEffect(() => {
    let mounted = true
    ;(async () => { await init() })()
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      if (!mounted) return
      const u = sess?.user ?? null
      setUser(u)
      setEmail(u?.email ?? null)
      setPlan(await fetchPlanRobust(u))
      setReady(true)
    })
    return () => { sub.subscription.unsubscribe(); mounted = false }
  }, [])

  // Realtime: profiles 自分の行の変更を監視 → planを即更新（元実装の踏襲）
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`profiles:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        async () => { setPlan(await fetchPlanRobust(user)) }
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user])

  // 画面復帰時に軽く再取得（外部決済→戻る対策）（元実装の踏襲）
  useEffect(() => {
    const onFocus = () => { fetchPlanRobust(user).then(setPlan).catch(() => {}) }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [user])

  const value = useMemo(() => ({
    user, email, plan, ready,
    refreshPlan: async () => { setPlan(await fetchPlanRobust(user)) },
  }), [user, email, plan, ready])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
