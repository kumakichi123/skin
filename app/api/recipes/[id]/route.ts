// app/api/recipes/[id]/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { RECIPES } from '../../../../data/recipes'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const pro = url.searchParams.get('pro') === '1'

  const meta = RECIPES.find(r => r.id === params.id)
  if (!meta) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const file = path.join(process.cwd(), 'content', 'recipes', `${params.id}.mdx`)
  let body = ''
  try { body = await fs.readFile(file, 'utf8') } catch {}

  const teaser = body.split('<!--more-->')[0] || body.split('\n').slice(0, 20).join('\n')

  return NextResponse.json({ item: { ...meta, body: pro ? body : teaser, locked: !pro } })
}