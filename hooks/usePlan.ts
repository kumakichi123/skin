// hooks/usePlan.ts
'use client'
import { useAuth } from '../components/AuthProvider'

export function usePlan() {
  // 以降は AuthProvider の値を読むだけ。DBアクセスはナシ
  const { plan, ready } = useAuth()
  return { plan, ready }
}
