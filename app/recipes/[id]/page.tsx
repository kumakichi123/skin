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
  'salmon-mushroom-butter-rice': dynamic(
    () => import('../../../content/recipes/salmon-mushroom-butter-rice.mdx'),
    { loading: () => <div className="p-4 text-sm opacity-70">読み込み中…</div> }
  ),
  'winter-melon-herbal-soup': dynamic(
    () => import('../../../content/recipes/winter-melon-herbal-soup.mdx'),
    { loading: () => <div className="p-4 text-sm opacity-70">読み込み中…</div> }
  ),
  'beef-lettuce-korean-salad': dynamic(
    () => import('../../../content/recipes/beef-lettuce-korean-salad.mdx'),
    { loading: () => <div className="p-4 text-sm opacity-70">読み込み中…</div> }
  ),
  'ginger-pork-meatball-teriyaki': dynamic(
    () => import('../../../content/recipes/ginger-pork-meatball-teriyaki.mdx'),
    { loading: () => <div className="p-4 text-sm opacity-70">読み込み中…</div> }
  ),
}


export default function RecipeEntryPage({ params }: { params: { id: string } }) {
  const Mdx = MDX_MAP[params.id]
  if (!Mdx) return notFound()
  return <Mdx />
}
