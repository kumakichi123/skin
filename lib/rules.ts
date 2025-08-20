// lib/rules.ts
import type { Scores } from '../app/page'

type Op = '>='|'<='|'>'|'<'|'='|'=='
type Cond = { key: keyof Scores, op: Op, value: number }
export type Rule = string | Cond[]   // "dryness>=65 & brightness<=45" でも、配列でもOK

export function evalRule(rule: Rule, s: Scores){
  const groups = typeof rule==='string' ? parseRule(rule) : (rule as Cond[])

  // ORグループに対応（"A|B"）: 1つでも全ANDが満たされれば一致
  const orGroups: Cond[][] = Array.isArray(groups[0]) ? (groups as any) : [groups as Cond[]]

  let matched = false
  let matchCount = 0
  let strength = 0

  for(const andGroup of orGroups){
    let ok = true
    let tmpCount = 0
    let tmpStrength = 0

    for(const c of andGroup){
      const v = s[c.key]
      const yes =
        (c.op==='>=' && v>=c.value) || (c.op==='>' && v>c.value) ||
        (c.op==='<='&& v<=c.value) || (c.op==='<' && v<c.value) ||
        (c.op==='='  && v===c.value) || (c.op==='==' && v===c.value) ||
        (c.op==='<='&& v<=c.value)

      if(!yes){ ok=false; break }

      tmpCount++
      const d = (c.op==='>='||c.op==='>') ? (v - c.value)
             : (c.op==='<' ||c.op==='<=') ? (c.value - v)
             : 0
      if(d>0) tmpStrength += d
    }

    if(ok){
      matched = true
      matchCount = Math.max(matchCount, tmpCount)
      strength   = Math.max(strength, tmpStrength)
    }
  }

  return { matched, matchCount, strength }
}

// "dryness>=65 & brightness<=45 | redness>=60" → [[...AND...],[...AND...]]
function parseRule(str: string): Cond[][]{
  const orParts = str.split(/\s*\|\||\s*\|\s*/g)
  return orParts.map(andStr=>{
    const andParts = andStr.split(/\s*&\s*|\s*&&\s*/g).filter(Boolean)
    return andParts.map(p=>{
      const m = p.match(/^(dryness|oiliness|redness|brightness|puffiness)\s*(>=|<=|>|<|==|=)\s*(\d{1,3})$/i)
      if(!m) throw new Error('invalid rule: '+p)
      return { key: m[1] as keyof Scores, op: m[2] as Op, value: Number(m[3]) }
    })
  })
}
