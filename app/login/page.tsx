'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage(){
  const router = useRouter()
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [showPw, setShowPw] = useState(false)

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setErr(''); setMsg(''); setLoading(true)
    try{
      if (mode === 'signin'){
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // ✅ ログイン成功→SPAでホームに遷移
        router.push('/')
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data?.user && Array.isArray((data.user as any).identities) && (data.user as any).identities.length === 0) {
          setErr('このメールアドレスは登録済みです。ログインしてください。')
        } else {
          setMsg('確認メールを送信しました。メール内のリンクを開いて登録を完了してください。')
        }
      }
    }catch(e:any){
      const m = String(e?.message || '')
      if (m.toLowerCase().includes('rate limit')) setErr('短時間に複数回送信されました。数分おいて再試行してください。')
      else setErr(m || 'エラーが発生しました')
    }finally{
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">スキンケアAI</h1>
          <p className="text-sm text-muted mt-1">メールとパスワードで{mode==='signin'?'ログイン':'新規登録'}</p>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-5">
          <div className="grid grid-cols-2 gap-1 mb-4 bg-surface p-1 rounded-full">
            <button type="button" onClick={()=>setMode('signin')} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${mode==='signin'?'bg-white shadow':''}`}>ログイン</button>
            <button type="button" onClick={()=>setMode('signup')} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${mode==='signup'?'bg-white shadow':''}`}>新規登録</button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            <label className="text-sm font-medium">メールアドレス</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-4 ring-brand-ring"
            />

            <label className="text-sm font-medium mt-1">パスワード</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="8文字以上を推奨"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 pr-12 focus:outline-none focus:ring-4 ring-brand-ring"
              />
              <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded-md bg-surface">{showPw?'隠す':'表示'}</button>
            </div>

            <button type="submit" disabled={!email || !password || loading} className="inline-flex items-center justify-center rounded-xl bg-violet-600 text-white px-4 py-2.5 hover:bg-violet-700 focus:outline-none focus:ring-4 ring-violet-300 mt-2">
              {loading ? '処理中…' : (mode==='signin'?'ログイン':'新規登録')}
            </button>

            <button type="button" onClick={async()=>{
              if(!email) return setErr('メールアドレスを入力してください')
              setErr(''); setMsg('')
              const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` })
              if (error) setErr(error.message); else setMsg('パスワード再設定用のメールを送信しました。')
            }} className="text-xs text-violet-700 underline mt-1 text-left">パスワードを忘れた</button>

            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
          </form>
        </div>
      </div>
    </main>
  )
}
