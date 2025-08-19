import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'スキンケアAI - 簡易肌診断',
  description: '自宅でできるAI肌診断（美容用途）。写真から5指標をスコア化し、商品をおすすめします。'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />

        {/* GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GLYT9K56MZ"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'G-GLYT9K56MZ');
          `}
        </Script>
      </head>
      <body className="app-body">{children}</body>
    </html>
  )
}
