// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

type CheckoutBody = { email?: string; userId?: string }

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CheckoutBody
  const { email, userId } = body
  if (!email || !userId) {
    return NextResponse.json({ error: 'EMAIL_AND_USERID_REQUIRED' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: email.trim(),
    client_reference_id: userId,         // ← これが肝
    metadata: { userId },                // ← 念のため
    allow_promotion_codes: true,
    success_url: `${origin}/my?status=success`,
    cancel_url: `${origin}/my?status=cancel`,
  })

  return NextResponse.json({ url: session.url })
}

