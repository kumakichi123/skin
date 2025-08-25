'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function ResetPasswordPage(){
  const search = useSearchParams()
  const router = useRouter()
  const [canReset, setCanReset] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('')

  // リンクの code をセッションに交換（v2）
  useEffect(()=> {
    (async () => {
      try{
        const code = search.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }
        setCanReset(true) // ここまで来たらフォーム表示OK
      }catch(e:any){
        setErr(e.message || 'リンクの検証に失敗しました。もう一度お試しください。')
      }
    })()
  }, [search])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (newPw.length < 8) return setErr('8文字以上のパスワードを入力してください')
    if (newPw !== newPw2) return setErr('確認用パスワードが一致しません')

    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) setErr(error.message)
    else {
      setMsg('パスワードを更新しました。ログインし直してください。')
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  if (!canReset) {
    return <main className="container" style={{padding:24}}>
      <p>リンクを検証中…</p>
      {err && <p className="small" style={{color:'#dc2626', marginTop:8}}>{err}</p>}
    </main>
  }

  return (
    <main className="container" style={{maxWidth:560, padding:24}}>
      <h1 style={{fontSize:28, fontWeight:800}}>パスワード再設定</h1>
      <form className="card" style={{padding:16, marginTop:16}} onSubmit={onSubmit}>
        <label className="label">新しいパスワード</label>
        <input type="password" value={newPw}
          onChange={(e)=>setNewPw(e.target.value)}
          style={{width:'100%', padding:10, borderRadius:8, border:'1px solid #e5e7eb'}}/>
        <label className="label" style={{marginTop:8}}>新しいパスワード（確認）</label>
        <input type="password" value={newPw2}
          onChange={(e)=>setNewPw2(e.target.value)}
          style={{width:'100%', padding:10, borderRadius:8, border:'1px solid #e5e7eb'}}/>
        <div style={{marginTop:12}}>
          <button className="button" type="submit">更新する</button>
        </div>
        {err && <p className="small" style={{color:'#dc2626', marginTop:8}}>{err}</p>}
        {msg && <p className="small" style={{color:'#16a34a', marginTop:8}}>{msg}</p>}
      </form>
    </main>
  )
}
