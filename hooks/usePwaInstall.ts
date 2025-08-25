'use client'
import { useEffect, useState } from 'react'


export function usePwaInstall(){
const [deferred, setDeferred] = useState<any>(null)
useEffect(()=>{
const onBeforeInstall = (e: any) => { e.preventDefault(); setDeferred(e) }
window.addEventListener('beforeinstallprompt', onBeforeInstall)
return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
},[])
const prompt = async ()=>{ await deferred?.prompt?.(); setDeferred(null) }
return { deferred, prompt }
}