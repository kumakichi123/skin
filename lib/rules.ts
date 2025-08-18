// lib/rules.ts
export type RuleScores = {
  dryness:number; oiliness:number; redness:number; brightness:number; puffiness:number
};

const OPS = ['>=','<=','>','<','=='] as const;

function evalAtom(expr:string, s:RuleScores){
  const op = OPS.find(o => expr.includes(o));
  if(!op) return false;
  const [key, raw] = expr.split(op).map(t=>t.trim());
  const val = Number(raw);
  const v = (s as any)[key];
  if(typeof v !== 'number' || !Number.isFinite(val)) return false;
  switch(op){
    case '>=': return v >= val;
    case '<=': return v <= val;
    case '>':  return v >  val;
    case '<':  return v <  val;
    case '==': return v === val;
  }
}

export function evaluateRule(rule:string, s:RuleScores):boolean{
  return rule
    .split('||')
    .some(orExpr => orExpr.trim().split('&&').every(andExpr => evalAtom(andExpr.trim(), s)));
}
