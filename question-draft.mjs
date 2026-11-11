const adoptedCorrections={"item:CON-1": {"submitted": "Some of today's AIs may have an inner experience; being an AI could feel like something", "published": "Some of today's AIs may have an inner experience; being an AI could feel like something."}, "item:REG-2": {"submitted": "If AI is going to help decide a student's future, someone human and independent should check what's is being decided and how", "published": "If AI is going to help decide a student's future, someone human and independent should check what is being decided and how."}};
export function wordingFields(cards){
 return cards.flatMap(card=>[
  ...['title','prompt'].map(name=>({key:`topic:${card.id}:${name}`,text:card[name],label:({title:'Topic title',prompt:'Question heading'})[name],cardId:card.id})),
  ...card.items.map((item,i)=>({key:`item:${item.id}`,text:item.text,label:`${item.kind==='reflection'?'Reflection':'Statement'} ${i+1}`,cardId:card.id}))
 ]);
}
export function reviseWording(cards,key,text){
 if(typeof text!=='string'||!text.trim())throw Error('Add some wording before saving.');
 if(!wordingFields(cards).some(f=>f.key===key))throw Error('Unknown question.');
 return cards.map(card=>({...card,
  ...Object.fromEntries(['title','prompt'].filter(name=>key===`topic:${card.id}:${name}`).map(name=>[name,text.trim()])),
  items:card.items.map(item=>({...item,text:key===`item:${item.id}`?text.trim():item.text}))
 }));
}
export function questionChanges(original,draft){
 const before=new Map(wordingFields(original).map(f=>[f.key,f]));
 return wordingFields(draft).filter(f=>before.has(f.key)&&before.get(f.key).text!==f.text).map(f=>({key:f.key,label:f.label,original:before.get(f.key).text,revised:f.text}));
}
export function restoreQuestionDraft(original,saved){
 let draft=original;
 if(saved?.format!=='ai-flower-question-draft'||saved?.schema!==1||!saved.wording||typeof saved.wording!=='object')return draft;
 for(const field of wordingFields(original)){
  const text=saved.wording[field.key];
  const adopted=adoptedCorrections[field.key];
  if(adopted&&text===adopted.submitted&&field.text===adopted.published)continue;
  if(typeof text==='string'&&text.trim())draft=reviseWording(draft,field.key,text);
 }
 return draft;
}
export function exportQuestionDraft(original,draft){
 const changes=questionChanges(original,draft);
 return {format:'ai-flower-question-draft',schema:1,wording:Object.fromEntries(changes.map(c=>[c.key,c.revised])),changes,questions:draft};
}
