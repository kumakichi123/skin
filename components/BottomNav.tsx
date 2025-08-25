'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from './I18nProvider'

const items = (t: (k: string)=>string) => ([
  { href: '/',        label: t('navHome'),    icon: '🏠' },
  { href: '/recipes', label: t('navRecipes'), icon: '🍳' },
  { href: '/history', label: t('navHistory'), icon: '📈' },
  { href: '/my',      label: t('navMy'),      icon: '👤' },
])

export default function BottomNav(){
  const path = usePathname()
  const { t } = useI18n()
  const tabs = items(t)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur">
      <ul className="mx-auto max-w-xl grid grid-cols-4">
        {tabs.map(tab => {
          const active = path === tab.href
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center py-2.5 text-sm ${active ? 'font-semibold text-violet-600' : 'text-gray-700'}`}
              >
                <span aria-hidden className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
