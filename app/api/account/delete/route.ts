export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // サーバ専用
)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  try {
    // クライアントから送ってもらうアクセストークンで本人確認（なりすまし防止）
    const auth = req.headers.get('authorization') // "Bearer <access_token>"
    const token = auth?.split(' ')[1]
    if (!token) return new Response('no token', { status: 401 })

    const { data: { user }, error } = await admin.auth.getUser(token)
    if (error || !user) return new Response('unauthorized', { status: 401 })

    // 1) Stripeサブスク停止（あれば）
    const { data: rows } = await admin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .limit(1)
    const customerId = rows?.[0]?.stripe_customer_id as string | undefined

    if (customerId) {
      // 現在のサブスクを全てキャンセル（即時解約）
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
      for (const s of subs.data) {
        if (s.status !== 'canceled') {
          await stripe.subscriptions.cancel(s.id) // or update({ cancel_at_period_end: true })
        }
      }
    }

    // 2 & 3) auth.usersごと削除（ON DELETE CASCADE で public.users も消える設計を推奨）
    const del = await admin.auth.admin.deleteUser(user.id)
    if (del.error) return new Response('delete failed', { status: 500 })

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error(e)
    return new Response('error', { status: 500 })
  }
}
