import {known} from './scoring.mjs';

export const ISSUES=[
 {id:'CRE',name:'Creative work'}, {id:'JOB',name:'Jobs'},
 {id:'INF',name:'Information & truth'}, {id:'MED',name:'Healthcare'},
 {id:'EDU',name:'Learning & teaching'}, {id:'DIS',name:'Who benefits?'},
 {id:'ENV',name:'Environment'}
];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const norm=v=>{const length=Math.hypot(...v)||1;return v.map(x=>x/length);};
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const green=[.39,.79,.48],amber=[.91,.77,.37],red=[.89,.36,.37];
export function signalColor(balance){
 const a=balance>=0?amber:red,b=balance>=0?green:amber,t=balance>=0?balance:balance+1;
 return a.map((x,i)=>x+(b[i]-x)*t);
}
export function issueSignal(pair){
 const complete=known(pair?.benefit)&&known(pair?.harm);
 if(!complete)return {complete:false,benefit:pair?.benefit,harm:pair?.harm,stretch:null,lean:null,strength:null,color:[.40,.45,.50]};
 const b=Math.max(0,(pair.benefit-2)/2),h=Math.max(0,(pair.harm-2)/2);
 const lean=(pair.benefit-pair.harm)/4;
 return {complete:true,benefit:pair.benefit,harm:pair.harm,stretch:Math.min(b,h),lean,strength:Math.max(b,h),color:signalColor(lean)};
}
export function snowflakeSignals(result){return ISSUES.map(issue=>({...issue,...issueSignal(result.pairs.find(p=>p.id===issue.id))}));}

// Mesh units are a visual convention. The original ratings remain the data.
// No global feeling response is used to make an issue rough or smooth.
export function buildSnowflake(result,{segments=48,sides=16,stem=true}={}){
 const signals=snowflakeSignals(result),packed=[],tips=[];
 function appendMesh(vertices,faces,color,issue,faceting){
   const smooth=vertices.map(()=>[0,0,0]),flat=[];
   for(const face of faces){
     const n=norm(cross(sub(vertices[face[1]],vertices[face[0]]),sub(vertices[face[2]],vertices[face[0]])));
     flat.push(n);for(const index of face)for(let j=0;j<3;j++)smooth[index][j]+=n[j];
   }
   for(let f=0;f<faces.length;f++)for(const index of faces[f]){
     const smoothNormal=norm(smooth[index]),n=norm(smoothNormal.map((x,j)=>x*(1-faceting)+flat[f][j]*faceting));
     packed.push(...vertices[index],...n,...color,issue);
   }
 }
 signals.forEach((signal,arm)=>{
   const angle=Math.PI/2-arm*Math.PI*2/7,ca=Math.cos(angle),sa=Math.sin(angle);
   const stretch=signal.stretch??0,strength=signal.strength??0;
   const reach=signal.complete?1.32+1.28*strength:1.06;
   const width=signal.complete ? .40+.13*strength : .16;
   const posture=signal.complete ? signal.lean*.667 : 0;
   const vertices=[],faces=[];
   for(let i=0;i<=segments;i++){
     const u=i/segments,envelope=Math.sin(Math.PI*u)**.88;
     const tooth=1-Math.abs(((u*9)%1)*2-1);
     const barb=stretch*.72*(tooth**2.7)*envelope;
     const halfWidth=(width*envelope+barb*.21)*1.3455;
     for(let j=0;j<sides;j++){
       const v=j/sides*Math.PI*2;
       const sideOffset=Math.cos(v)*halfWidth;
       const radius=.20+(.5-.5*Math.cos(Math.PI*u))*reach;
       const spike=stretch*.38*(tooth**3)*Math.sin(v*3+arm*.7)*envelope;
       const z=Math.sin(v)*(.075+.08*strength+stretch*.23)*envelope+spike+posture*u*u;
       vertices.push([radius*ca-sideOffset*sa,radius*sa+sideOffset*ca,z]);
     }
   }
   for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){
     const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;
     faces.push([a,c,b],[b,c,d]);
   }
   appendMesh(vertices,faces,signal.color,arm+1,stretch*.9);
   tips.push({id:signal.id,index:arm,point:[(.20+reach)*ca,(.20+reach)*sa,posture]});
 });
 // A small neutral hub joins the arms; its colour does not encode an answer.
 const hub=[],faces=[],rings=10,sidesHub=24;
 for(let i=0;i<=rings;i++)for(let j=0;j<sidesHub;j++){
   const theta=i/rings*Math.PI,phi=j/sidesHub*Math.PI*2;
   hub.push([Math.sin(theta)*Math.cos(phi)*.35,Math.sin(theta)*Math.sin(phi)*.35,Math.cos(theta)*.12]);
 }
 for(let i=0;i<rings;i++)for(let j=0;j<sidesHub;j++){
   const a=i*sidesHub+j,b=i*sidesHub+(j+1)%sidesHub,c=(i+1)*sidesHub+j,d=(i+1)*sidesHub+(j+1)%sidesHub;
   faces.push([a,b,c],[b,d,c]);
 }
 appendMesh(hub,faces,[.61,.59,.49],0,.15);
 if(stem){
   // The stem is a decorative support, not another issue or score.
   const vertices=[],faces=[],rings=40,around=12;
   for(let i=0;i<=rings;i++){
    const t=i/rings,r=.059-.018*t;
    for(let j=0;j<around;j++){
     const v=j/around*Math.PI*2;
     vertices.push([.23*Math.sin(t*Math.PI)-.10*t+Math.cos(v)*r,-4.75*t,-.16-.15*t+Math.sin(v)*r]);
    }
   }
   for(let i=0;i<rings;i++)for(let j=0;j<around;j++){
    const a=i*around+j,b=i*around+(j+1)%around,c=(i+1)*around+j,d=(i+1)*around+(j+1)%around;
    faces.push([a,c,b],[b,c,d]);
   }
   const end=vertices.length;vertices.push([-.1,-4.75,-.31]);
   for(let j=0;j<around;j++)faces.push([end,rings*around+j,rings*around+(j+1)%around]);
   appendMesh(vertices,faces,[.28,.48,.31],0,0);
 }
 const data=new Float32Array(packed);
 return {data,vertexCount:data.length/10,signals,tips};
}

export function projectPoint(point,view,width,height){
 const cy=Math.cos(view.yaw),sy=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch);
 const x=point[0]*cy-point[1]*sy,y0=point[0]*sy+point[1]*cy;
 const y=y0*cp-point[2]*view.relief*sp+(view.offsetY??0),z=y0*sp+point[2]*view.relief*cp;
 const depth=8/view.zoom-z,f=1/Math.tan(Math.PI/8),scale=height*f/2/depth;
 return {x:width/2+x*scale,y:height/2-y*scale,z,depth};
}

// Botanical-style annotations sit in non-overlapping columns. Their leader
// lines retain the connection to the projected petal as the flower turns.
export function labelGutters(width){return {x:width<420?20:32,top:8,bottom:12};}
export function layoutPetalLabels(points,width,height){
 const narrow=width<292;
 const labelWidth=narrow ? Math.min(88,(width-32)/2) : Math.min(104,(width-40)/3);
 const labelHeight=width<420 ? 42 : 34,gutter=labelGutters(width),gap=7;
 const minY=-gutter.top+labelHeight/2,maxY=height+gutter.bottom-labelHeight/2;
 const groups={left:[],right:[],centre:[]};
 for(const p of points){
   const dx=p.x-width/2,dy=p.y-height/2;
   const central=!narrow&&Math.abs(dx)<Math.hypot(dx,dy)*.36;
   const side=central?'centre':dx<0?'left':'right';
   const x=side==='left'?-gutter.x+labelWidth/2:side==='right'?width+gutter.x-labelWidth/2:width/2;
   const y=side==='centre'?(dy<0?minY:maxY):clamp(p.y,minY,maxY);
   groups[side].push({...p,tipX:p.x,tipY:p.y,x,y,width:labelWidth,height:labelHeight,side,name:ISSUES.find(i=>i.id===p.id)?.name??p.id});
 }
 for(const group of Object.values(groups)){
   group.sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id));
   for(let i=1;i<group.length;i++)group[i].y=Math.max(group[i].y,group[i-1].y+labelHeight+gap);
   if(group.length&&group.at(-1).y>maxY){
     group.at(-1).y=maxY;
     for(let i=group.length-2;i>=0;i--)group[i].y=Math.min(group[i].y,group[i+1].y-labelHeight-gap);
   }
 }
 return Object.values(groups).flat();
}

const vertexShader=`
attribute vec3 a_position; attribute vec3 a_normal; attribute vec3 a_color; attribute float a_issue;
uniform float u_yaw; uniform float u_pitch; uniform float u_zoom; uniform float u_aspect; uniform float u_relief; uniform float u_offsetY;
varying mediump vec3 v_normal; varying mediump vec3 v_color; varying mediump float v_issue;
vec3 turn(vec3 p){float cy=cos(u_yaw),sy=sin(u_yaw),cp=cos(u_pitch),sp=sin(u_pitch);vec3 q=vec3(p.x*cy-p.y*sy,p.x*sy+p.y*cy,p.z);return vec3(q.x,q.y*cp-q.z*sp,q.y*sp+q.z*cp);}
void main(){vec3 p=turn(vec3(a_position.xy,a_position.z*u_relief));p.y+=u_offsetY;p.z-=8.0/u_zoom;float f=2.41421356;gl_Position=vec4(p.x*f/u_aspect,p.y*f,-1.002002*p.z-.2002002,-p.z);v_normal=turn(normalize(vec3(a_normal.xy,a_normal.z/u_relief)));v_color=a_color;v_issue=a_issue;}`;
const fragmentShader=`
precision mediump float; varying mediump vec3 v_normal; varying mediump vec3 v_color; varying mediump float v_issue; uniform float u_selected;
void main(){vec3 n=normalize(v_normal);if(!gl_FrontFacing)n=-n;vec3 light=normalize(vec3(-.4,.65,1.0));float diffuse=max(0.0,dot(n,light));float spec=pow(max(0.0,dot(reflect(-light,n),vec3(0.,0.,1.))),28.0);float rim=pow(1.0-abs(n.z),2.0);float emphasis=(u_selected<.5||v_issue<.5||abs(v_issue-u_selected)<.4)?1.0:.72;vec3 color=v_color*(.33+.68*diffuse)*emphasis+vec3(.17*spec+.045*rim);gl_FragColor=vec4(color,1.0);}`;
export const SHADERS={vertex:vertexShader,fragment:fragmentShader};

export class SnowflakeRenderer{
 constructor(canvas,result,{view={},selected='EDU',stem=true,viewport=null,pixelRatio=null,onSelect=()=>{},onProject=()=>{},onPause=()=>{}}={}){
  this.canvas=canvas;this.hasStem=stem;this.viewport=viewport;this.pixelRatio=pixelRatio;this.mesh=buildSnowflake(result,{stem});
  this.defaultView=stem?{yaw:-.12,pitch:-.5,zoom:.72,relief:1,offsetY:.65}:{yaw:-.22,pitch:-.62,zoom:.92,relief:1,offsetY:0};
  this.view={...this.defaultView,...view};
  this.selected=ISSUES.findIndex(i=>i.id===selected)+1;this.onSelect=onSelect;this.onProject=onProject;this.onPause=onPause;this.active=true;this.spin=false;this.frame=null;
  this.events=new AbortController();
  try{this.gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:true});if(this.gl)this.setupGL();}catch{this.gl=null;}
  if(!this.gl)this.ctx=canvas.getContext('2d');
  if(!this.gl&&!this.ctx)throw Error('This browser cannot create a canvas renderer.');
  canvas.dataset.renderer=this.gl?'webgl':'software';
  this.resizeObserver=!viewport&&typeof ResizeObserver==='function'?new ResizeObserver(()=>this.draw()):null;this.resizeObserver?.observe(canvas);
  const listen=(target,event,fn,extra={})=>target.addEventListener(event,fn,{signal:this.events.signal,...extra});
  let dragging=null;
  listen(canvas,'pointerdown',e=>{if(e.button!==0)return;this.setSpin(false);this.onPause();dragging={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId);});
  listen(canvas,'pointermove',e=>{if(!dragging)return;this.view.yaw+=(e.clientX-dragging.x)*.009;this.view.pitch=clamp(this.view.pitch+(e.clientY-dragging.y)*.007,-1.25,1.25);dragging.x=e.clientX;dragging.y=e.clientY;this.draw();});
  listen(canvas,'pointerup',e=>{if(!dragging)return;const moved=Math.hypot(e.clientX-dragging.startX,e.clientY-dragging.startY);dragging=null;if(moved<6)this.pick(e);});
  listen(canvas,'pointercancel',()=>dragging=null);
  listen(canvas,'wheel',e=>{e.preventDefault();this.view.zoom=clamp(this.view.zoom*Math.exp(-e.deltaY*.001),.65,1.65);this.draw();},{passive:false});
  listen(canvas,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')this.reset();else{if(e.key==='ArrowLeft')this.view.yaw-=.12;if(e.key==='ArrowRight')this.view.yaw+=.12;if(e.key==='ArrowUp')this.view.pitch=clamp(this.view.pitch-.10,-1.25,1.25);if(e.key==='ArrowDown')this.view.pitch=clamp(this.view.pitch+.10,-1.25,1.25);if(e.key==='+')this.view.zoom=clamp(this.view.zoom+.1,.65,1.65);if(e.key==='-')this.view.zoom=clamp(this.view.zoom-.1,.65,1.65);this.draw();}});
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();this.active=false;canvas.setAttribute('aria-label','The 3D canvas was interrupted. Your answer review below is still available.');});
  listen(canvas,'webglcontextrestored',()=>{this.active=true;this.setupGL();this.draw();});
  this.draw();
 }
 setupGL(){
  const gl=this.gl;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexShader));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentShader));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  this.program=program;gl.useProgram(program);this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.mesh.data,gl.STATIC_DRAW);
  for(const [name,size,offset] of [['a_position',3,0],['a_normal',3,12],['a_color',3,24],['a_issue',1,36]]){const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,40,offset);}
  this.uniforms=Object.fromEntries(['yaw','pitch','zoom','aspect','relief','offsetY','selected'].map(name=>[name,gl.getUniformLocation(program,'u_'+name)]));gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
 }
 draw(){
  if(!this.active)return;
  const rect=this.viewport??this.canvas.getBoundingClientRect(),ratio=this.pixelRatio??Math.min(globalThis.devicePixelRatio||1,2);
  const width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
  if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
  if(this.gl){
    const gl=this.gl;gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
    for(const name of ['yaw','pitch','zoom','relief','offsetY'])gl.uniform1f(this.uniforms[name],this.view[name]);gl.uniform1f(this.uniforms.aspect,width/height);gl.uniform1f(this.uniforms.selected,this.selected);gl.drawArrays(gl.TRIANGLES,0,this.mesh.vertexCount);
  }else this.drawSoftware(width,height);
  const tips=this.mesh.tips.map(t=>({id:t.id,...projectPoint(t.point,this.view,rect.width,rect.height)}));
  this.labels=layoutPetalLabels(tips,rect.width,rect.height*(this.hasStem?.78:1));
  this.onProject(this.labels,this.getView(),{width:rect.width,height:rect.height});
 }
 drawSoftware(width,height){
  const ctx=this.ctx,data=this.mesh.data,triangles=[];ctx.clearRect(0,0,width,height);
  const cy=Math.cos(this.view.yaw),sy=Math.sin(this.view.yaw),cp=Math.cos(this.view.pitch),sp=Math.sin(this.view.pitch);
  for(let offset=0;offset<data.length;offset+=30){
    const points=[0,10,20].map(o=>projectPoint([data[offset+o],data[offset+o+1],data[offset+o+2]],this.view,width,height));
    const n0=[data[offset+3],data[offset+4],data[offset+5]/this.view.relief];const nx=n0[0]*cy-n0[1]*sy,ny=n0[0]*sy+n0[1]*cy,n=norm([nx,ny*cp-n0[2]*sp,ny*sp+n0[2]*cp]);
    const light=.34+.66*Math.abs(n[0]*-.32+n[1]*.52+n[2]*.79),selected=this.selected===0||data[offset+9]===0||data[offset+9]===this.selected?1:.72;
    const rgb=[6,7,8].map(i=>Math.round(clamp(data[offset+i]*light*selected,0,1)*255));
    triangles.push({points,z:points.reduce((s,p)=>s+p.z,0)/3,color:`rgb(${rgb.join(',')})`});
  }
  triangles.sort((a,b)=>a.z-b.z);
  for(const {points,color} of triangles){ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);ctx.lineTo(points[1].x,points[1].y);ctx.lineTo(points[2].x,points[2].y);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
 }
 pick(event){
  const rect=this.canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
  let best=null,distance=Infinity;
  for(const tip of this.mesh.tips){
    // Select the nearest arm direction, including its midpoint, not only its tip.
    for(const fraction of [.45,.7,1]){
     const p=projectPoint(tip.point.map(v=>v*fraction),this.view,rect.width,rect.height),d=Math.hypot(p.x-x,p.y-y);
     if(d<distance){distance=d;best=tip;}
    }
  }
  if(best&&distance<rect.width*.23)this.onSelect(best.id);
 }
 setRelief(value){this.view.relief=clamp(value,.35,2.2);this.draw();}
 reset(){this.view={...this.defaultView};this.draw();}
 setSpin(enabled){this.spin=enabled;if(this.frame)cancelAnimationFrame(this.frame);this.frame=null;if(enabled){const tick=()=>{if(!this.active||!this.spin)return;this.view.yaw+=.003;this.draw();this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);}}
 getView(){return {...this.view};}
 toImageCanvas(){
  const out=document.createElement('canvas'),rect=this.viewport??this.canvas.getBoundingClientRect(),scale=this.canvas.width/rect.width,gutter=labelGutters(rect.width);
  const insetX=Math.ceil(gutter.x*scale),insetY=Math.ceil(gutter.top*scale);
  out.width=this.canvas.width+insetX*2;out.height=this.canvas.height+insetY+Math.ceil(gutter.bottom*scale);
  const ctx=out.getContext('2d');
  ctx.fillStyle='#151b29';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(this.canvas,insetX,insetY);ctx.save();ctx.translate(insetX,insetY);ctx.scale(scale,scale);
  for(const label of this.labels??[]){
    const x=label.x-label.width/2,y=label.y-label.height/2;
    ctx.strokeStyle='#87998b99';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(label.tipX,label.tipY);ctx.lineTo(label.x,label.y);ctx.stroke();
    ctx.fillStyle='#17232ff5';ctx.strokeStyle='#62745f';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,label.width,label.height,5);else ctx.rect(x,y,label.width,label.height);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e5eada';ctx.font=`${rect.width<420?11:12}px system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    const words=label.name.split(' '),lines=[];let line='';
    for(const word of words){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>label.width-12){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
    lines.forEach((text,i)=>ctx.fillText(text,label.x,label.y+(i-(lines.length-1)/2)*14));
  }
  ctx.restore();return out;
 }
 savePNG(){
  const out=this.toImageCanvas(),a=document.createElement('a');a.download='my-ai-flower.png';a.href=out.toDataURL('image/png');a.click();
 }
 destroy(){this.active=false;this.spin=false;if(this.frame)cancelAnimationFrame(this.frame);this.events.abort();this.resizeObserver?.disconnect();if(this.gl){this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);this.gl.getExtension('WEBGL_lose_context')?.loseContext();}}
}
