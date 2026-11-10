import {known} from './scoring.mjs';
import {SnowflakeRenderer} from './snowflake.mjs';

// These are descriptions of this response pattern, not personality categories.
export function flowerPortrait(result,{example=false,responseCount=null}={}){
 const b=result.benefits.score,h=result.harms.score,complete=result.stretch.complete,both=result.stretch.both;
 let title,opening;
 if(b===null||h===null){title='Still taking shape';opening='There are a few views here, but too few scored answers for an overall portrait.';}
 else if(b>=75&&h>=75){title='Promise, with thorns';opening='The promise looks real to you. So do the harms: you agree with both sets of statements on average.';}
 else if(b>=75&&h<50){title='Room to bloom';opening='The promise has you more convinced: strong agreement with the benefit statements, less agreement with the warnings on average.';}
 else if(h>=75&&b<50){title='Mind the thorns';opening='The warnings have you more convinced: strong agreement with the harm statements, less agreement with the promises on average.';}
 else if(b<=25&&h<=25){title='Neither story sells it';opening='Neither forecast has you convinced. On average, you disagree with both the benefit and harm statements.';}
 else if(b===50&&h===50){title='The middle has layers';opening='Both averages land at neutral. The petals show whether that comes from neutral answers or stronger views that differ by issue.';}
 else {title='More than one shade';opening='No single verdict tells the whole story. Your petals show how far each benefit and harm statement convinced you.';}
 const sentences=[opening];
 const pairs=result.pairs.filter(p=>p.kind!=='incomplete'),names={CRE:'creative work',JOB:'jobs',INF:'information and truth',MED:'healthcare',EDU:'learning and teaching',DIS:'who benefits',ENV:'the environment'};
 const positive=[...pairs].sort((a,b)=>(b.benefit-b.harm)-(a.benefit-a.harm))[0],negative=[...pairs].sort((a,b)=>(b.harm-b.benefit)-(a.harm-a.benefit))[0];
 if(positive?.benefit>=3&&positive.benefit>positive.harm&&negative?.harm>=3&&negative.harm>negative.benefit){
  const contrast=`More promise in ${names[positive.id]}; more concern about ${names[negative.id]}.`;
  if(title==='More than one shade'||title==='The middle has layers')sentences[0]=contrast;else sentences.push(contrast);
 }
 if(complete>=4){
  if(both)sentences.push(`You see both benefit and harm in ${both} of ${complete} completed topics.`);
  else sentences.push('None of your completed topics has agreement with both statements.');
 }
 if(result.changeScore!==null){
  sentences.push(result.changeScore>=75?'You expect major change overall.':result.changeScore<=25?'You expect relatively little change overall.':result.changeScore>=63?'You expect substantial change overall.':result.changeScore>=38?'You expect moderate change overall.':'You expect a small amount of change overall.');
 }
 const conflict=result.feelings.find(f=>f.id==='FEEL-C')?.value;
 // Only the direct reflection can support a statement about felt conflict.
 if(known(conflict))sentences.push(conflict===0?'You report no inner conflict.':conflict===1?'You report a little inner conflict.':conflict===2?'You report some inner conflict.':'You report a strong sense of inner conflict.');
 const partial=complete<7||(responseCount!==null&&responseCount<34);
 return {title,summary:sentences.join(' '),example,partial,
  badge:example?'EXAMPLE FLOWER':partial?'FLOWER IN PROGRESS':'YOUR AI FLOWER',
  coverage:`${complete} of 7 issue pairs complete${responseCount===null?'':` · ${responseCount} of 34 substantive responses`}`,
  note:'A snapshot of your answers.'};
}

const xml=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function wrapCardText(ctx,text,maxWidth){
 const lines=[];let line='';
 for(const word of text.split(/\s+/)){const next=line?`${line} ${word}`:word;if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);return lines;
}

export function renderFlowerCard(result,options={}){
 const portrait=flowerPortrait(result,options),canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1560;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('A canvas is needed to make the card.');
 const flowerCanvas=document.createElement('canvas');let renderer,plant;
 try{
  renderer=new SnowflakeRenderer(flowerCanvas,result,{selected:null,stem:true,viewport:{width:480,height:430},pixelRatio:2});
  renderer.draw();renderer.gl?.finish();plant=renderer.toImageCanvas();
 }finally{renderer?.destroy();}
 const plantURL=plant.toDataURL('image/png'),elements=[];
 ctx.fillStyle='#151b29';ctx.fillRect(0,0,1080,1560);
 elements.push('<rect width="1080" height="1560" fill="#151b29"/>');
 function text(value,x,y,{size=28,color='#d9e1db',font='sans-serif',weight='normal'}={}){
  ctx.font=`${weight} ${size}px ${font}`;ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(value,x,y);
  elements.push(`<text x="${x}" y="${y}" fill="${color}" font-family="${font}" font-size="${size}" font-weight="${weight}">${xml(value)}</text>`);
 }
 text(portrait.badge,64,71,{size:20,color:'#daca98',weight:'bold'});
 text(portrait.title,60,145,{size:60,font:'Georgia, serif',color:'#f2eddf'});
 text('Every petal has a point of view.',64,194,{size:25,color:'#9baba8'});
 const art={x:28,y:223,width:1024,height:847};
 // The SVG is self-contained: vector type surrounds a raster of the 3D flower.
 ctx.drawImage(plant,art.x,art.y,art.width,art.height);
 elements.push(`<image x="${art.x}" y="${art.y}" width="${art.width}" height="${art.height}" preserveAspectRatio="none" href="${plantURL}"/>`);
 ctx.strokeStyle='#445248';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(64,1097);ctx.lineTo(1016,1097);ctx.stroke();elements.push('<path d="M64 1097H1016" stroke="#445248"/>');
 ctx.font='30px sans-serif';let lines=wrapCardText(ctx,portrait.summary,952),size=30;
 while(lines.length>7&&size>24){size-=1;ctx.font=`${size}px sans-serif`;lines=wrapCardText(ctx,portrait.summary,952);}
 lines.forEach((line,i)=>text(line,64,1152+i*40,{size}));
 text(portrait.coverage,64,1460,{size:19,color:'#b0beb4'});
 text(portrait.note,64,1493,{size:18,color:'#8e9f9d'});
 text('AI FLOWER',64,1531,{size:17,color:'#daca98',weight:'bold'});
 text('Green: benefits · Red: harms · Jagged: both/and',290,1531,{size:17,color:'#8e9f9d'});
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1560" viewBox="0 0 1080 1560" role="img"><title>${xml(portrait.title)}</title><desc>${xml(portrait.summary+' '+portrait.coverage)}</desc>${elements.join('')}</svg>`;
 return {portrait,png:canvas.toDataURL('image/png'),svg};
}

export function downloadFlowerCard(card,format='png'){
 const link=document.createElement('a');link.download=`my-ai-flower-card.${format}`;
 if(format==='svg'){
  const url=URL.createObjectURL(new Blob([card.svg],{type:'image/svg+xml'}));link.href=url;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }else{link.href=card.png;link.click();}
}
