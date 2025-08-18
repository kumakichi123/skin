import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'スキンケアAI - 簡易肌診断',
  description: '自宅でできるAI肌診断（美容用途）。写真から5指標をスコア化し、商品をおすすめします。'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      {/* Tailwindを使わない想定のため、独自CSSクラスに変更 */}
      <body className="app-body">
        {children}
      </body>
    </html>
  )
}