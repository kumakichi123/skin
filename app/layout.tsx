import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'スキンケアAI - 簡易肌診断',
  description: '自宅でできるAI肌診断（美容用途）。写真から5指標をスコア化し、商品をおすすめします。'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
      </head>
      <body className="app-body">{children}</body>
    </html>
  )
}
