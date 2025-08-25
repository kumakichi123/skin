// components/recipes/mdx/Ingredients.tsx
import React from 'react'

export default function Ingredients({
  title = '材料',
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <section className="card p-5 sm:p-6 space-y-3">
      <h2 className="text-xl font-extrabold tracking-tight text-violet-700">
        {title}
      </h2>
      <div className="mdx text-[15px] leading-7">{children}</div>
    </section>
  )
}
