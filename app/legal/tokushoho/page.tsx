// app/(legal)/tokushoho/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '特定商取引法に基づく表記 | スキンケアAI' }

export default function Page() {
  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">特定商取引法に基づく表記</h1>

      <section className="card p-5 space-y-2">
        <p><strong>販売事業者</strong>：&lt;スキンケアAI&gt;</p>
        <p><strong>運営責任者</strong>：&lt;朝部耀平&gt;</p>
        <p><strong>所在地</strong>：&lt;札幌市北区北18条西6-1-7-201&gt;</p>
        <p><strong>連絡先</strong>：&lt;support@ai-secretary.site&gt;（<small>受付時間：&lt;9:00~18:00&gt;</small>）</p>
        <p><strong>ウェブサイト</strong>：&lt;https://skin-swart.vercel.app/&gt;</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xl font-semibold">販売価格</h2>
        <p>各商品・プランの購入画面に表示（消費税込）。</p>
        <p><strong>商品代金以外の必要料金</strong>：通信料等（お客様負担）。</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xl font-semibold">支払方法・支払時期</h2>
        <p>クレジットカード決済（Stripe）。申込確定時に課金、以降は各サイクルで自動更新。</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xl font-semibold">提供時期</h2>
        <p>決済完了後、直ちに利用可能。</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xl font-semibold">返品・キャンセル</h2>
        <p>デジタルコンテンツ／役務の性質上、提供後の返品・返金はお受けできません。次回更新日前の解約により、以後の請求は停止されます。</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xl font-semibold">動作環境</h2>
        <p>最新の主要ブラウザ、安定したネットワーク接続、（画像解析利用時は）カメラ機能。</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="text-xl font-semibold">特記事項</h2>
        <p>クーリング・オフは適用外です。未成年の方は保護者の同意の上でお申し込みください。</p>
      </section>
    </main>
  )
}
