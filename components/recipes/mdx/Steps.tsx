// components/recipes/mdx/Steps.tsx
import React from 'react'

export function Steps({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children)
  return (
    // 重要：! を付けてグローバルの .mdx ol を上書き
    <ol className="!list-none !m-0 !p-0 space-y-3">
      {items.map((ch, i) => (
        <li key={i} className="card p-5 sm:p-6 relative">
          {React.isValidElement(ch)
            ? React.cloneElement(ch as any, { idx: i + 1 })
            : ch}
        </li>
      ))}
    </ol>
  )
}

export function Step({
  idx,
  title,
  img,
  time,
  note,
  children,
}: {
  idx?: number
  title?: string
  img?: string
  time?: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      {/* 紫の丸番号（カード左上） */}
      {typeof idx === 'number' && (
        <span className="absolute -left-2 -top-2 inline-grid h-8 w-8 place-items-center rounded-full bg-white text-violet-700 ring-2 ring-violet-300 font-bold">
          {idx}
        </span>
      )}

      {/* 画像があれば左、本文は右（メモ通り） */}
      <div className="flex gap-4 items-start">
        {img && (
          <img
            src={img}
            alt=""
            className="w-28 h-28 rounded-xl ring-1 ring-gray-200 object-cover"
            loading="lazy"
          />
        )}
        <div className="flex-1 space-y-2">
          {title && (
            <h3 className="text-lg font-extrabold text-violet-700">{title}</h3>
          )}
          <div className="text-[15px] leading-7">{children}</div>
          {(time || note) && (
            <div className="flex flex-wrap gap-2 text-sm">
              {time && <span className="badge">目安 {time}</span>}
              {note && <span className="badge">{note}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
