// lib/rules.ts
export type RuleScores = { dryness:number; oiliness:number; redness:number; brightness:number; puffiness:number }

const CMP = ['>=','<=','>','<','=='] as const

function evalAtom(expr:string, s:RuleScores){
  expr = expr.trim()
  const op = CMP.find(o => expr.includes(o))
  if(!op) return false
  const [key, raw] = expr.split(op).map(t=>t.trim())
  const val = Number(raw)
  if(!Number.isFinite(val)) return false
  const v = (s as any)[key]
  if(typeof v !== 'number') return false
  switch(op){
    case '>=': return v >= val
    case '<=': return v <= val
    case '>': return v > val
    case '<': return v < val
    case '==': return v === val
    default: return false
  }
}

export function evaluateRule(rule:string, s:RuleScores):boolean{
  const orParts = rule.split('||')
  return orParts.some(orExpr => orExpr.trim().split('&&').every(andExpr => evalAtom(andExpr, s)))
}

/** 0〜1で「どれだけ条件に近いか」を返す（ORはmax/ANDは平均） */
export function scoreRuleFit(rule:string, s:RuleScores):number{
  if(!rule) return 0
  const orParts = rule.split('||').map(p=>p.trim()).filter(Boolean)
  const atomScore = (expr:string)=>{
    const op = CMP.find(o => expr.includes(o))
    if(!op) return 0
    const [key, raw] = expr.split(op).map(t=>t.trim())
    const t = Number(raw)
    const v = (s as any)[key]
    if(typeof v !== 'number' || !Number.isFinite(t)) return 0
    // 0〜100スケールを想定した素朴な正規化スコア（満たせば1、外れるほど減点）
    const clamp01 = (x:number)=> Math.max(0, Math.min(1, x))
    switch(op){
      case '>=': return clamp01(1 - Math.max(0, (t - v))/100)
      case '<=': return clamp01(1 - Math.max(0, (v - t))/100)
      case '>':  return clamp01(1 - Math.max(0, (t + 1 - v))/100)
      case '<':  return clamp01(1 - Math.max(0, (v - (t - 1)))/100)
      case '==': return clamp01(1 - Math.abs(v - t)/100)
      default: return 0
    }
  }
  let best = 0
  for(const orExpr of orParts){
    const andParts = orExpr.split('&&').map(a=>a.trim()).filter(Boolean)
    const scores = andParts.map(atomScore)
    const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0
    if(avg > best) best = avg
  }
  return best
}
