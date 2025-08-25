// components/FooterLegal.tsx
import Link from 'next/link'

export default function FooterLegal() {
  return (
    <footer className="max-w-xl mx-auto px-4 py-6 text-xs text-muted">
      <nav className="flex flex-wrap gap-3">
        <Link href="/legal/terms" className="underline">利用規約</Link>
        <Link href="/legal/privacy" className="underline">プライバシーポリシー</Link>
        <Link href="/legal/tokushoho" className="underline">特定商取引法に基づく表記</Link>
      </nav>
    </footer>
  )
}
