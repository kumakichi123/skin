'use client'
import { createContext, useContext } from 'react'
type Dict = Record<string, string>
type Ctx = { t: (k: string) => string; locale: 'ja'|'en' }
const C = createContext<Ctx>({ t: (k)=>k, locale:'en' })

export default function I18nProvider({
  locale, dict, children,
}: { locale:'ja'|'en'; dict:Dict; children:React.ReactNode }){
  const t = (k:string)=> dict[k] ?? k
  return <C.Provider value={{ t, locale }}>{children}</C.Provider>
}
export const useI18n = ()=> useContext(C)
