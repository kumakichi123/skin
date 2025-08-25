// mdx-components.tsx（プロジェクト直下）
import type { MDXComponents } from 'mdx/types'
import Ingredients from './components/recipes/mdx/Ingredients'
import { Steps, Step } from './components/recipes/mdx/Steps'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // 既定の <img> を中央寄せ＆枠付き
    img: (props) => <img loading="lazy" className="mx-auto max-w-full h-auto rounded-xl ring-1 ring-gray-200 shadow-sm" {...props} />,
    // 追加コンポーネント（Cookpad風UI）
    Ingredients,
    Steps,
    Step,
    ...components,
  }
}
