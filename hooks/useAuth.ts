'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { UserLite } from '../types'


export function useAuth(){
const [user, setUser] = useState<UserLite|null>(null)


useEffect(()=>{
supabase.auth.getUser().then(({ data })=>{
const u = data.user
setUser(u ? { id:u.id, email:u.email! } : null)
})
const { data: sub } = supabase.auth.onAuthStateChange((_e, sess)=>{
const u = sess?.user
setUser(u ? { id:u.id, email:u.email! } : null)
})
return ()=>{ sub.subscription.unsubscribe() }
},[])


const signOut = async ()=>{ await supabase.auth.signOut() }
return { user, signOut }
}