// next.config.mjs
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [remarkGfm] },
})

export default withMDX({
  pageExtensions: ['ts','tsx','js','jsx','md','mdx'],
  images: {
    // ← ここに Supabase のホストを追加（必要に応じて増やす）
    domains: ['uotkswxcohvlcmuhqnmq.supabase.co'],
    // remotePatterns で細かく切るなら:
    // remotePatterns: [{ protocol: 'https', hostname: 'uotkswxcohvlcmuhqnmq.supabase.co', pathname: '/storage/v1/object/public/**' }]
  },
})
