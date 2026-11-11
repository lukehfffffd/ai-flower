import cards from './data.mjs';
import {wordingFields,reviseWording,questionChanges,restoreQuestionDraft,exportQuestionDraft} from './question-draft.mjs';

const editor=document.getElementById('question-editor');
const storageKey='ai-flower-question-draft';
const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let draft=cards,storageAvailable=true;
try{const saved=localStorage.getItem(storageKey);if(saved)draft=restoreQuestionDraft(cards,JSON.parse(saved));}catch{storageAvailable=false;}
const fieldFor=key=>wordingFields(draft).find(f=>f.key===key);
function readRow(field){return `<div class="wording-copy"><span class="wording-label">${field.label}</span><p class="wording-text">${escapeText(field.text)}</p></div><button class="button-secondary edit-wording" data-edit="${field.key}" aria-label="Edit ${escapeText(field.label.toLowerCase())}: ${escapeText(field.text)}">Edit</button>`;}
function render(){
 const fields=wordingFields(draft);
 editor.innerHTML=`<a class="text-link" href="./">← Back to the questionnaire</a><h1>All questions</h1><p class="editor-intro">Edit any heading or statement below. Your wording is saved as a draft in this browser. Download the draft when you're ready to review it.</p><div class="editor-toolbar"><div><strong>34 statements · 15 topics + final reflection</strong><p id="draft-status" role="status" aria-live="polite"></p></div><button class="button-primary" id="download-question-draft">Download draft ↓</button></div>${draft.map((card,index)=>`<section class="edit-topic" aria-labelledby="editor-topic-${card.id}"><h2 id="editor-topic-${card.id}">${index===15?'Final reflection':`Topic ${String(index+1).padStart(2,'0')}`}</h2>${fields.filter(f=>f.cardId===card.id).map(f=>`<div class="wording-row ${f.key.startsWith('item:')?'wording-statement':''}" data-field="${f.key}">${readRow(f)}</div>`).join('')}</section>`).join('')}<p class="editor-note">Saving edits here changes your local draft. The published questionnaire keeps its current wording until the draft is applied.</p>`;
 updateStatus();
}
function updateStatus(){
 const count=questionChanges(cards,draft).length;
 editor.querySelector('#draft-status').textContent=storageAvailable?`${count} ${count===1?'edit':'edits'} saved in this browser.`:`${count} ${count===1?'edit':'edits'} in this tab. Browser storage is unavailable; download your draft to keep it.`;
}
function persist(){
 try{localStorage.setItem(storageKey,JSON.stringify(exportQuestionDraft(cards,draft)));storageAvailable=true;}catch{storageAvailable=false;}
 updateStatus();
}
function rowFor(key){return [...editor.querySelectorAll('[data-field]')].find(row=>row.dataset.field===key);}
function saveForm(form){
 const input=form.querySelector('textarea'),key=form.dataset.editing;
 try{draft=reviseWording(draft,key,input.value);}catch(error){form.querySelector('.wording-error').textContent=error.message;input.focus();return false;}
 persist();const row=rowFor(key);row.innerHTML=readRow(fieldFor(key));row.querySelector('button').focus({preventScroll:true});return true;
}
function downloadDraft(){
 for(const form of [...editor.querySelectorAll('[data-editing]')])if(!saveForm(form))return;
 const blob=new Blob([JSON.stringify(exportQuestionDraft(cards,draft),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='ai-flower-edited-questions.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
editor.addEventListener('click',event=>{
 const edit=event.target.closest('[data-edit]');
 if(edit){
  const key=edit.dataset.edit,field=fieldFor(key),row=rowFor(key),id='wording-'+key.replaceAll(':','-');
  row.innerHTML=`<form class="wording-form" data-editing="${key}"><label for="${id}">${field.label}</label><textarea id="${id}" rows="${field.text.length>150?5:3}" required>${escapeText(field.text)}</textarea><p class="wording-error" role="alert"></p><div class="wording-actions"><button class="button-primary" type="submit">Save wording</button><button class="button-secondary" type="button" data-cancel="${key}">Cancel</button></div></form>`;
  row.querySelector('textarea').focus();return;
 }
 const cancel=event.target.closest('[data-cancel]');
 if(cancel){const row=rowFor(cancel.dataset.cancel);row.innerHTML=readRow(fieldFor(cancel.dataset.cancel));row.querySelector('button').focus({preventScroll:true});return;}
 if(event.target.closest('#download-question-draft'))downloadDraft();
});
editor.addEventListener('submit',event=>{if(!event.target.matches('[data-editing]'))return;event.preventDefault();saveForm(event.target);});
window.addEventListener('beforeunload',event=>{
 const unsaved=[...editor.querySelectorAll('[data-editing]')].some(form=>form.querySelector('textarea').value!==fieldFor(form.dataset.editing).text);
 if(unsaved){event.preventDefault();event.returnValue='';}
});
render();
