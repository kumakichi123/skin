import React, { Fragment, isValidElement } from 'react'

type Meta = {
  title: string
  servings?: string | number
  time?: string
  tags?: string[]
  images?: string[]            // ['image1.png','image2.png',...]
  storagePrefix: string        // 画像バケットのベースURL
}

export default function RecipeLayout({
  meta,
  children,
}: {
  meta: Meta
  children: React.ReactNode
}) {
  const { title, servings, time, tags = [], images = [], storagePrefix } = meta

  // --- MDXの子要素を h2 見出しごとに分割して「カード化」する ---
  const nodes = React.Children.toArray(children)
  const sections: React.ReactNode[][] = []
  let buf: React.ReactNode[] = []

  const flush = () => { if (buf.length) { sections.push(buf); buf = [] } }

  for (const n of nodes) {
    const isH2 =
      isValidElement(n) &&
      typeof n.type === 'string' &&
      n.type.toLowerCase() === 'h2'
    if (isH2) {
      flush()
      buf.push(n) // 見出しをセクションの先頭に含める
    } else {
      buf.push(n)
    }
  }
  flush()

  return (
    <article className="mx-auto max-w-screen-md px-4 pt-6 sm:pt-8 pb-16">
      {/* ヘッダーをカード化 */}
      <header className="card mb-4 p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-brand-primary">
          {title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
          {servings && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">
              🍽️ 人数: {servings}
            </span>
          )}
          {time && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1">
              ⏱️ 所要: {time}
            </span>
          )}
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200 px-2.5 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* ヒーロー画像もカード化（小さくても中央に） */}
      {images[0] && (
        <div className="card mb-4">
          <div className="flex justify-center">
            <img
              src={`${storagePrefix}/${images[0]}`}
              alt="仕上がりイメージ"
              className="h-auto w-full max-w-3xl object-contain mx-auto"
              loading="eager"
            />
          </div>
        </div>
      )}

      {/* 本文（MDX）: h2単位でカードを自動生成。h2前の前書きも1枚にまとめる */}
      <div className="space-y-4 mdx">
        {sections.map((sec, i) => (
          <section key={i} className="card p-5 sm:p-6">
            {sec.map((node, j) => (
              <Fragment key={j}>{node}</Fragment>
            ))}
          </section>
        ))}
      </div>
    </article>
  )
}
