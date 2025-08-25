// app/settings/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function SettingsPage(){
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('')

  const deleteMyAccount = async () => {
    if (!confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) return
    setLoading(true); setMsg(''); setErr('')
    const { data: { session } } = await supabase.auth.getSession()
    if(!session){ setErr('ログインしてください'); setLoading(false); return }

    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if(res.ok){
      setMsg('アカウントを削除しました')
      // 念のためサインアウト
      await supabase.auth.signOut()
      // 必要ならリダイレクト
      window.location.href = '/goodbye'
    }else{
      const t = await res.text()
      setErr('削除に失敗しました: ' + t)
    }
    setLoading(false)
  }

  return (
    <main className="container" style={{ padding: 24 }}>
      <h1>設定</h1>
      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <h2 style={{ marginBottom: 8 }}>アカウント</h2>
        <button className="button" onClick={deleteMyAccount} disabled={loading}>
          {loading ? '削除中…' : 'アカウントを削除'}
        </button>
        {err && <p className="small" style={{color:'#dc2626', marginTop:8}}>{err}</p>}
        {msg && <p className="small" style={{color:'#16a34a', marginTop:8}}>{msg}</p>}
      </section>
    </main>
  )
}
