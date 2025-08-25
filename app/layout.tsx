// app/layout.tsx
import './globals.css'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import I18nProvider from '../components/I18nProvider'
import { detectLocaleFromHeader, getDictionary } from '../lib/i18n'
import BottomNav from '../components/BottomNav'
import { AuthProvider } from '../components/AuthProvider'
import FooterLegal from '../components/FooterLegal'

export const metadata: Metadata = {
  title: 'スキンケアAI',
  description: 'AIで簡易肌診断（美容用途）',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const accept = headers().get('accept-language') ?? ''
  const locale = detectLocaleFromHeader(accept)
  const dict = await getDictionary(locale)

  return (
    <html lang={locale}>
      <body className="bg-bg text-text pb-20">
        <I18nProvider locale={locale} dict={dict}>
          {/* 全ページをAuthProviderでラップ */}
          <AuthProvider>
            {children}
            <FooterLegal />     {/* ← ここで法務リンクを描画 */}
            <BottomNav />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
