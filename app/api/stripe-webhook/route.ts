export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

// Service Role（サーバ専用）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// 補助: サブスクリプションの有効性→plan_status と更新期限
function planFieldsFromSub(sub: Stripe.Subscription){
  const isActive = sub.status === 'active' || sub.status === 'trialing'
  const renewIso = new Date((sub.current_period_end ?? 0) * 1000).toISOString()
  return {
    plan_status: isActive ? 'pro' as const : 'free' as const,
    plan_renews_at: renewIso,
    stripe_subscription_id: sub.id,
  }
}

export async function POST(req: NextRequest){
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('missing signature', { status: 400 })

  const raw = await req.text()
  let event: Stripe.Event
  try{
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  }catch(e){
    console.error('[stripe-webhook] signature verify failed', e)
    return new Response('invalid signature', { status: 400 })
  }

  try{
    switch(event.type){
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const userId = (s.client_reference_id as string | null) || null
        const customerId = (s.customer as string | null) || null
        const subscriptionId = (s.subscription as string | null) || null

        let patch: Record<string, any> = {}
        if (customerId) patch.stripe_customer_id = customerId

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          Object.assign(patch, planFieldsFromSub(sub))
        } else {
          // サブスクでないチェックアウト（単発など）→とりあえず PRO 付与はしない
          patch.plan_status = 'free'
        }

        if (userId){
          await supabase
            .from('profiles')
            .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const patch = planFieldsFromSub(sub)
        // deleted の場合、status は 'canceled' になる → free へ落とす
        await supabase
          .from('profiles')
          .update({
            stripe_subscription_id: patch.stripe_subscription_id,
            plan_status: patch.plan_status,
            plan_renews_at: patch.plan_renews_at,
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      // 参考: 顧客削除時は Free 化（存在すれば）
      case 'customer.deleted': {
        const c = event.data.object as Stripe.Customer
        await supabase
          .from('profiles')
          .update({ plan_status: 'free', plan_renews_at: null, stripe_subscription_id: null })
          .eq('stripe_customer_id', c.id)
        break
      }

      default:
        // no-op（必要に応じてログ）
        break
    }

    return new Response('ok', { status: 200 })
  }catch(e){
    console.error('[stripe-webhook] handler error', e)
    return new Response('handler error', { status: 500 })
  }
}