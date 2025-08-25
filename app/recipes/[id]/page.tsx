// app/recipes/[id]/page.tsx
import { notFound } from 'next/navigation'
import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'

// SSRは切らなくてOK（RSCでそのまま動く）
const MDX_MAP: Record<string, ComponentType<any>> = {
  'asparagus-grapefruit-salad': dynamic(
    () => import('../../../content/recipes/asparagus-grapefruit-salad.mdx'),
    { loading: () => <div className="p-4 text-sm opacity-70">読み込み中…</div> }
  ),
  'simple-hydration-toner': dynamic(
    () => import('../../../content/recipes/simple-hydration-toner.mdx'),
    { loading: () => <div className="p-4 text-sm opacity-70">読み込み中…</div> }
  ),
}

export default function RecipeEntryPage({ params }: { params: { id: string } }) {
  const Mdx = MDX_MAP[params.id]
  if (!Mdx) return notFound()
  return <Mdx />
}
