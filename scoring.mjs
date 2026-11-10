export const PAIRS = ['CRE','JOB','INF','MED','EDU','DIS','ENV'];
export const known = value => Number.isInteger(value) && value >= 0 && value <= 4;
const mean = values => values.reduce((sum,value)=>sum+value,0)/values.length;
const summary = values => ({count:values.length,score:values.length>=4?Math.round(25*mean(values)):null});
export function calculate(answers) {
  const benefits=PAIRS.map(p=>answers[p+'-B']).filter(known);
  const harms=PAIRS.map(p=>answers[p+'-H']).filter(known);
  const pairs=PAIRS.map(id=>{
    const b=answers[id+'-B'],h=answers[id+'-H'];
    if(!known(b)||!known(h)) return {id,kind:'incomplete',benefit:b,harm:h};
    return {id,kind:b>=3?(h>=3?'both':'benefit'):(h>=3?'harm':'neither'),benefit:b,harm:h};
  });
  const complete=pairs.filter(p=>p.kind!=='incomplete');
  const both=complete.filter(p=>p.kind==='both');
  const changes=['CHG-P','CHG-E','CHG-S'].map(id=>({id,value:answers[id],score:known(answers[id])?25*answers[id]:null}));
  return {
    benefits:summary(benefits), harms:summary(harms), pairs,
    stretch:{complete:complete.length,both:both.length,score:complete.length>=4?Math.round(100*both.length/complete.length):null},
    changes, changeScore:changes.every(c=>known(c.value))?Math.round(25*mean(changes.map(c=>c.value))):null,
    feelings:['FEEL-M','FEEL-C','FEEL-I'].map(id=>({id,value:answers[id]})),
    unsure:Object.values(answers).filter(v=>v==='unsure').length,
    skipped:Object.values(answers).filter(v=>v==='skip').length
  };
}
