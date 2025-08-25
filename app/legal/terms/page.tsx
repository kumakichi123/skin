// app/(legal)/terms/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '利用規約 | スキンケアAI' }

export default function Page() {
  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">利用規約</h1>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">はじめに</h2>
        <p>
          本規約は「スキンケアAI」（以下「本サービス」）の利用条件を定めます。本サービスは美容・ライフスタイルの助言を提供するものであり、医療行為や医療機器ではありません。
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">アカウント</h2>
        <p>登録時は正確な情報を提供し、認証情報の管理は利用者の責任とします。</p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">禁止事項</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>法令・公序良俗に反する行為</li>
          <li>リバースエンジニアリングその他の不正行為</li>
          <li>第三者の権利（著作権・肖像権等）を侵害する行為</li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">有料プランと決済</h2>
        <p>
          有料プランはサブスクリプション方式です。決済は外部決済事業者（Stripe）を介して行われます。更新前に解約した場合、次回以降は課金されません。課金済み期間の返金は原則行いません。
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">免責</h2>
        <p>
          解析結果は参考情報であり、医学的判断・治療の代替ではありません。利用者の端末・通信環境等に起因する不具合について、当社は責任を負いません。
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">知的財産</h2>
        <p>本サービスに関する著作権等の知的財産権は、当社または正当な権利者に帰属します。</p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">規約変更</h2>
        <p>必要に応じて本規約を改定できます。重要な変更は本サービス上で周知します。</p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">準拠法・管轄</h2>
        <p>準拠法は日本法、専属的合意管轄は<strong>&lt;札幌地方裁判所又は札幌簡易裁判所&gt;</strong>とします。</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xl font-semibold">連絡先</h2>
        <p>
          <strong>事業者:</strong> &lt;スキンケアAI&gt;<br />
          <strong>メール:</strong> &lt;support@ai-secretary.site&gt;
        </p>
      </section>
    </main>
  )
}
