// lib/rules.ts
import type { Scores } from '../types'

export type Op = '>=' | '<=' | '>' | '<' | '==' | '!='
export type Cond = { key: keyof Scores; op: Op; value: number; weight?: number }
export type Rule = string | Cond | Cond[]

function evalCond(c: Cond, s: Scores) {
  const a = s[c.key] ?? 0
  const b = c.value
  switch (c.op) {
    case '>=': return a >= b
    case '<=': return a <= b
    case '>':  return a >  b
    case '<':  return a <  b
    case '==': return a === b
    case '!=': return a !== b
    default:   return false
  }
}

function parseUnit(expr: string): Cond | null {
  // 例: "dryness>=65" / "brightness<=45"
  const m = expr.trim().match(/^(dryness|oiliness|redness|brightness|puffiness)\s*(>=|<=|==|!=|>|<)\s*(\d{1,3})$/)
  if (!m) return null
  return { key: m[1] as keyof Scores, op: m[2] as Op, value: Number(m[3]) }
}

function parseRule(rule: string): Cond[] {
  // 簡易パーサ: 'A && B' と 'A || B' を両対応。優先度は同等で左から。
  // 実際の評価は OR を分割し、どれかの AND 条件群がすべて満たされれば matched。
  return rule
    .split(/&&|\|\|/)
    .map(s => parseUnit(s))
    .filter((x): x is Cond => !!x)
}

export function evalRule(rule: Rule, scores: Scores) {
  let condSets: Cond[][] = []

  if (typeof rule === 'string') {
    // 'A && B' or 'A || B' を簡易的にサポート
    if (rule.includes('||')) {
      const parts = rule.split('||').map(s => s.trim())
      condSets = parts.map(p => p.split('&&').map(q => q.trim()).map(parseUnit).filter(Boolean) as Cond[])
    } else {
      condSets = [parseRule(rule)]
    }
  } else if (Array.isArray(rule)) {
    condSets = [rule]
  } else if (rule && typeof rule === 'object') {
    condSets = [[rule]]
  }

  let matched = false
  let matchCount = 0
  let strength = 0

  for (const set of condSets) {
    const res = set.map(c => evalCond(c, scores))
    const ok = res.every(Boolean)
    if (ok) matched = true
    // マッチ数と粗い強度（距離）
    matchCount = Math.max(matchCount, res.filter(Boolean).length)
    const setStrength = set.reduce((acc, c) => {
      const delta = Math.abs((scores[c.key] ?? 0) - c.value)
      const w = c.weight ?? 1
      return acc + Math.max(0, 100 - delta) * w
    }, 0)
    strength = Math.max(strength, setStrength)
  }

  return { matched, matchCount, strength }
}