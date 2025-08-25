'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../components/AuthProvider'

type Plan = 'free' | 'pro'

export default function MyPage() {
  const router = useRouter()
  const qs = useSearchParams()
  const { user, email, plan, refreshPlan, ready } = useAuth()

  // ---- ローカル状態（フォーム用） ----
  const [formEmail, setFormEmail] = useState('')
  const [password, setPassword] = useState('')
  const [waited, setWaited] = useState(false)
  const [busy, setBusy] = useState(false)

  // AuthProviderが立ち上がったらフォームへメール反映
  useEffect(() => { if (email) setFormEmail(email) }, [email])
  // ローディングに猶予（“真っ白”回避）
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 1200)
    return () => clearTimeout(t)
  }, [])

  // ---- 初回：ユーザーが居れば最新プランを一度取得しておく ----
  useEffect(() => {
    if (!ready || !user) return
    ;(async () => { await refreshPlan() })()
  }, [ready, user, refreshPlan])

  // ---- 課金完了戻り（?status=success）で強制リフレッシュ ----
  useEffect(() => {
    if (!user) return
    if (qs.get('status') !== 'success') return
    let stop = false
    ;(async () => {
      for (let i = 0; i < 7 && !stop; i++) {
        await refreshPlan()
        const { data, error } = await supabase
          .from('profiles')
          .select('plan_status')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!error && String(data?.plan_status ?? '').trim().toLowerCase() === 'pro') break
        await new Promise(r => setTimeout(r, 1200))
      }
    })()
    return () => { stop = true }
  }, [qs, user, refreshPlan])

  // ---- 未ログインならログインへ ----
  useEffect(() => {
    if (ready && !user) router.replace('/login?next=/my')
  }, [ready, user, router])

  // ---- 認証ハンドラ ----
  async function signUp() {
    const { error } = await supabase.auth.signUp({ email: formEmail, password })
    if (error) alert(error.message)
    else await refreshPlan()
  }
  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email: formEmail, password })
    if (error) alert(error.message)
    else await refreshPlan()
  }
  async function signOut() {
    try {
      setBusy(true)
      await supabase.auth.signOut()
    } finally {
      await refreshPlan() // 状態の即時更新
      router.push('/login') // SPA遷移
      router.refresh() // 画面ツリーの再評価
      setBusy(false)
    }
  }

  // ---- 課金開始 ----
  async function buyPro() {
    if (!user) { router.replace('/login?next=/my'); return }
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email ?? formEmail, userId: user.id }),
    })
    const j = await r.json().catch(() => null)
    if (j?.url) location.href = j.url
    else alert('購入ページへの遷移に失敗しました')
  }

  // ---- 表示用の現在プラン ----
  const currentPlan: Plan = useMemo(() => (plan === 'pro' ? 'pro' : 'free'), [plan])

  // ---- ローディング表示 ----
  if (!ready && !user && !waited) {
    return <main className="max-w-xl mx-auto p-6"><p className="text-sm opacity-70">読み込み中…</p></main>
  }
  if (!ready && !user && waited) {
    return (
      <main className="max-w-xl mx-auto p-6 space-y-2">
        <p className="text-sm opacity-70">認証の初期化に時間がかかっています…</p>
        <a href="/login?next=/my" className="underline text-violet-600">ログイン画面を開く</a>
      </main>
    )
  }

  // ---- 通常表示 ----
  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">Myページ</h1>

      {/* プラン表示 */}
      <section className="p-4 rounded-xl border space-y-2">
        <div>プラン: <b>{currentPlan === 'pro' ? 'Pro（¥980/月）' : 'Free'}</b></div>
        {currentPlan !== 'pro' && (
          <button onClick={buyPro} className="px-4 py-2 rounded-xl bg-violet-600 text-white">
            Proプラン（月¥980）に登録
          </button>
        )}
      </section>

      {/* アカウント */}
      <section className="p-4 rounded-xl border space-y-3">
        <div className="space-y-2">
          <div>ログイン中: <b>{email ?? formEmail}</b></div>
          <button onClick={signOut} disabled={busy} className="px-3 py-2 rounded-lg border">
            {busy ? '処理中…' : 'ログアウト'}
          </button>
        </div>
      </section>

      <div className="h-16" />
    </main>
  )
}