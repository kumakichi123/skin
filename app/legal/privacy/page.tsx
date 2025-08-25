// app/(legal)/privacy/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'プライバシーポリシー | スキンケアAI' }

export default function Page() {
  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">収集する情報</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>アカウント情報（メールアドレス等）</li>
          <li>解析用の顔画像・結果スコア（乾燥/皮脂/赤み/明るさ/むくみ）</li>
          <li>購入・サブスク情報（決済事業者による処理）</li>
          <li>端末・ログ情報、Cookie等</li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">利用目的</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>本サービスの提供・運用・認証</li>
          <li>画像解析と結果表示（AI解析）</li>
          <li>レシピ・商品提案等のパーソナライズ</li>
          <li>課金・請求・不正防止</li>
          <li>問い合わせ対応・品質改善・統計分析</li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">外部送信・第三者提供</h2>
        <p>以下の外部サービスを利用します（各社のポリシーに従います）。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>OpenAI（画像解析のためのAPI）</li>
          <li>Supabase（データベース/認証・計測データ保存）</li>
          <li>Stripe（サブスク決済）</li>
          <li>LINE（ボット経由の画像送受信・通知）</li>
          <li>アクセス解析（Google Analytics 等）</li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">保存期間</h2>
        <p>法令又は業務上必要な期間を超えて保有しません。不要となった情報は合理的な方法で削除します。</p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">安全管理</h2>
        <p>アクセス制御、通信の暗号化、ログ監査など、適切な安全管理措置を講じます。</p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">Cookie等</h2>
        <p>利便性向上や利用状況の把握のためCookie等を利用する場合があります。ブラウザ設定で無効化できます。</p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold">開示・訂正・削除等の請求</h2>
        <p>
          ご本人確認の上、合理的な範囲で対応します。アカウント削除はアプリ内の手続または所定の申請で行えます。
        </p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xl font-semibold">お問い合わせ</h2>
        <p>
          <strong>メール:</strong> &lt;support@ai-secretary.site&gt;
        </p>
      </section>
    </main>
  )
}
