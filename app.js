const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='cuaderno-congreso-cuidado-v2', OWNER_KEY='cuaderno-congreso-propietario';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{page:0,pages:[{date:new Date().toISOString().slice(0,10),text:'',strokes:[],stickers:[]}]};
state.pages.forEach(p=>{p.strokes ||= []; p.stickers ||= []; p.text ||= ''; p.date ||= new Date().toISOString().slice(0,10)});
let tool='text',color='#2c2140',hcolor='#fff25a',drawing=false,current=null,history=[],selectedStickerId=null,recognition=null;
const canvas=$('#canvas'),ctx=canvas.getContext('2d'),paper=$('#paper'),text=$('#text'),date=$('#date');
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);

function save(){const p=state.pages[state.page];p.html=text.innerHTML;p.text=text.innerText;p.date=date.value;localStorage.setItem(KEY,JSON.stringify(state));$('#pageNo').textContent=`Página ${state.page+1}`}
function resize(){const r=paper.getBoundingClientRect(),d=devicePixelRatio||1;canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);redraw()}
function redraw(){const r=paper.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);for(const s of state.pages[state.page].strokes){ctx.save();ctx.globalCompositeOperation=s.tool==='eraser'?'destination-out':'source-over';ctx.globalAlpha=s.tool==='highlight'?.35:1;ctx.strokeStyle=s.color||'#000';ctx.lineWidth=s.size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();s.points.forEach((p,i)=>i?ctx.lineTo(p.x*r.width,p.y*r.height):ctx.moveTo(p.x*r.width,p.y*r.height));ctx.stroke();ctx.restore()}}

// Biblioteca de stickers internos do caderno.
// Os stickers são arquivos individuais; o navegador não lista pastas automaticamente,
// então esta biblioteca registra explicitamente os arquivos que vêm com o caderno.
const STICKER_LIBRARY={
  "Português": [
    "stickers/pt/01-muito-bom.png",
    "stickers/pt/02-importante.png",
    "stickers/pt/03-atencao.png",
    "stickers/pt/04-boa-ideia.png",
    "stickers/pt/05-anotar-isto.png",
    "stickers/pt/06-para-lembrar.png",
    "stickers/pt/07-para-refletir.png",
    "stickers/pt/08-me-fez-pensar.png",
    "stickers/pt/09-isso-falou-comigo.png",
    "stickers/pt/10-que-bom.png",
    "stickers/pt/11-excelente.png",
    "stickers/pt/12-gratidao.png",
    "stickers/pt/14-respira.png",
    "stickers/pt/15-voce-consegue.png",
    "stickers/pt/16-disciplina-tambem-e-cuidado.png",
    "stickers/pt/17-cuidar-importa.png",
    "stickers/pt/18-hoje-tambem-conta.png",
    "stickers/pt/21-presenca.png",
    "stickers/pt/22-valorize-o-processo.png",
    "stickers/pt/23-um-dia-de-cada-vez.png",
    "stickers/pt/25-equilibrio.png",
    "stickers/pt/26-proposito.png",
    "stickers/pt/27-orar-cuidar-acompanhar-servir.png",
    "stickers/pt/28-familia-proposito-missao.png",
    "stickers/pt/29-um-mundo-mais-cuidado.png",
    "stickers/pt/30-hogar-en-cualquier-lugar.png",
    "stickers/pt/31-diferentes-lugares-una-misma-familia.png",
    "stickers/pt/35-cuidar-hoy-para-el-manana.png",
    "stickers/pt/38-familias-que-sirven-al-mundo.png",
    "stickers/pt/54-ideias.png",
    "stickers/pt/55-notas.png"
  ],
  "Español": [
    "stickers/es/13-um-passo-a-la-vez.png",
    "stickers/es/19-pequenos-passos-grandes-cambios.png",
    "stickers/es/20-tu-puedes.png",
    "stickers/es/24-esto-me-llevo.png",
    "stickers/es/32-las-familias-misioneras-tambien-importan.png",
    "stickers/es/33-pausa-tambien-es-productiva.png",
    "stickers/es/34-pequenos-pasos-grandes-cambios-sol.png",
    "stickers/es/36-juntos-por-el-cuidado.png",
    "stickers/es/37-un-encuentro-sobre-el-cuidado.png",
    "stickers/es/39-esperanza-en-cada-etapa.png",
    "stickers/es/40-nuevos-caminos-grandes-historias.png",
    "stickers/es/41-aqui-y-ahora.png",
    "stickers/es/56-muy-bien.png",
    "stickers/es/57-importante.png",
    "stickers/es/58-atencion.png",
    "stickers/es/59-buena-idea.png",
    "stickers/es/60-anota-esto.png",
    "stickers/es/61-para-recordar.png",
    "stickers/es/62-para-reflexionar.png",
    "stickers/es/63-me-hizo-pensar.png",
    "stickers/es/64-esto-me-hablo.png",
    "stickers/es/65-que-bueno.png",
    "stickers/es/66-excelente.png",
    "stickers/es/67-gratitud.png",
    "stickers/es/68-respira.png",
    "stickers/es/69-tu-puedes.png",
    "stickers/es/70-cuidar-importa.png",
    "stickers/es/71-presencia.png",
    "stickers/es/72-valora-el-proceso.png",
    "stickers/es/73-un-dia-a-la-vez.png",
    "stickers/es/74-equilibrio.png"
  ],
  "English": [
    "stickers/en/01-important.png",
    "stickers/en/02-thank-you.png",
    "stickers/en/03-well-done.png",
    "stickers/en/04-great-idea.png",
    "stickers/en/05-keep-going.png",
    "stickers/en/06-you-can-do-it.png",
    "stickers/en/07-take-note.png",
    "stickers/en/08-remember.png",
    "stickers/en/09-focus.png",
    "stickers/en/10-be-kind.png"
  ],
  'Símbolos':['stickers/symbols/01-coracao-rosa.png','stickers/symbols/02-coracao-verde.png','stickers/symbols/03-estrela.png','stickers/symbols/04-lampada.png','stickers/symbols/05-tres-coracoes.png','stickers/symbols/06-folhas.png','stickers/symbols/07-globo.png','stickers/symbols/08-aviao.png','stickers/symbols/09-casa-coracao.png','stickers/symbols/10-mochila.png','stickers/symbols/11-livro.png','stickers/symbols/12-balao-coracao.png','stickers/symbols/13-brilhos.png','stickers/symbols/14-sol.png','stickers/symbols/15-arvore-coracao.png']
};


function stickerTitleFromPath(src){
  const base=decodeURIComponent(src.split('/').pop()||'Sticker').replace(/\.png$/i,'').replace(/^\d+-/,'');
  return base.replace(/-/g,' ');
}
function renderStickerLibrary(lang=null){
  const box=$('#stickerCollections'); if(!box)return;
  box.innerHTML='';
  if(!lang){ box.classList.add('hidden'); return; }

  const map={pt:'Português',es:'Español',en:'English',symbols:'Símbolos'};
  const name=map[lang];
  const items=STICKER_LIBRARY[name]||[];
  box.classList.remove('hidden');

  const section=document.createElement('section');
  section.className='sticker-language-column sticker-single-collection';
  const grid=document.createElement('div');
  grid.className='sticker-column-grid';

  items.forEach(src=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='sticker-choice art-choice builtin-choice';
    b.title=stickerTitleFromPath(src);
    const im=document.createElement('img');
    im.src=src; im.alt=stickerTitleFromPath(src); im.loading='lazy';
    b.append(im);
    b.onclick=()=>insertBuiltinSticker(src);
    grid.append(b);
  });
  section.append(grid);
  box.append(section);
}
function insertBuiltinSticker(src){
  const im=new Image();
  im.onload=()=>{const ratio=(im.naturalHeight||1)/(im.naturalWidth||1);const width=7;const height=Math.max(2.5,Math.min(7,width*ratio));insertSticker({kind:'image',value:src,width,height,builtin:true})};
  im.onerror=()=>alert('No se pudo abrir este sticker.');
  im.src=src;
}
function insertSticker(data){const p=state.pages[state.page];const count=p.stickers.length;p.stickers.push({id:uid(),...data,x:8+(count%5)*7,y:22+(count%6)*6,width:data.width??(data.kind==='text'?20:11),height:data.height??(data.kind==='text'?7.5:11)});selectedStickerId=null;save();renderStickers();try{v39Home()}catch(e){}}
function renderStickers(){const layer=$('#stickerLayer');layer.innerHTML='';const p=state.pages[state.page];p.stickers.forEach(s=>{s.id ||= uid();s.width ||= s.kind==='text'?20:14;s.height ||= s.kind==='text'?7.5:14;const el=document.createElement('div');el.className=`placed-sticker ${s.id===selectedStickerId?'selected':''}`;el.style.left=s.x+'%';el.style.top=s.y+'%';el.style.width=s.width+'%';el.style.height=s.height+'%';if(s.kind==='image'){const im=new Image();im.src=s.value;el.append(im)}else{const label=s.text||s.value||'';const art=s.model?buildStickerArt(label,s.theme||'note',s.variant||1,s.icon||stickerIconFor(label,0)):(()=>{const a=document.createElement('span');a.className=`text-sticker-art theme-${s.theme||'note'} variant-${s.variant||1}`;a.textContent=label;return a})();el.append(art)}const del=document.createElement('span');del.className='sticker-remove';del.textContent='×';const handle=document.createElement('span');handle.className='resize-handle';el.append(del,handle);el.onpointerdown=e=>beginStickerMove(e,s,el);del.onpointerdown=e=>{e.preventDefault();e.stopPropagation();p.stickers=p.stickers.filter(x=>x.id!==s.id);selectedStickerId=null;save();renderStickers()};handle.onpointerdown=e=>beginStickerResize(e,s,el);layer.append(el)})}
function beginStickerMove(e,s,el){
 if(e.target.closest('.resize-handle,.sticker-remove'))return;
 e.preventDefault();e.stopPropagation();
 selectedStickerId=s.id;
 const start={x:e.clientX,y:e.clientY,left:+s.x||0,top:+s.y||0,id:e.pointerId};
 const r=paper.getBoundingClientRect();
 const move=ev=>{
   if(ev.pointerId!==start.id)return;
   ev.preventDefault();
   s.x=clamp(start.left+(ev.clientX-start.x)/r.width*100,0,100-s.width);
   s.y=clamp(start.top +(ev.clientY-start.y)/r.height*100,0,100-s.height);
   el.style.left=s.x+'%';el.style.top=s.y+'%';
 };
 const end=ev=>{
   if(ev.pointerId!==start.id)return;
   document.removeEventListener('pointermove',move,true);
   document.removeEventListener('pointerup',end,true);
   document.removeEventListener('pointercancel',end,true);
   save();renderStickers();
 };
 document.addEventListener('pointermove',move,{capture:true,passive:false});
 document.addEventListener('pointerup',end,true);
 document.addEventListener('pointercancel',end,true);
}
function beginStickerResize(e,s,el){e.preventDefault();e.stopPropagation();selectedStickerId=s.id;const r=paper.getBoundingClientRect(),start={x:e.clientX,w:s.width,h:s.height};const ratio=s.height/s.width;el.setPointerCapture?.(e.pointerId);const move=ev=>{const delta=(ev.clientX-start.x)/r.width*100;s.width=clamp(start.w+delta,8,42);s.height=clamp(s.width*ratio,7,35);el.style.width=s.width+'%';el.style.height=s.height+'%'};const end=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end);save()};el.addEventListener('pointermove',move);el.addEventListener('pointerup',end)}
function activateTextMode(){tool='text';canvas.style.pointerEvents='none';$$('[data-tool]').forEach(x=>x.classList.remove('active'));$('#textBtn').classList.add('active');$('#highColors').classList.add('hidden');$('#eraserControls').classList.add('hidden');$('#strokeSizeControl').classList.add('hidden');setTimeout(()=>text.focus(),0)}
function load(){const p=state.pages[state.page];if(p.html!=null){text.innerHTML=p.html}else{text.textContent=p.text||''}date.value=p.date||'';save();redraw();renderStickers();activateTextMode()}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
canvas.onpointerdown=e=>{drawing=true;canvas.setPointerCapture(e.pointerId);history=JSON.parse(JSON.stringify(state.pages[state.page].strokes));const drawSize=tool==='eraser'?+$('#eraserSize').value:+$('#size').value*(tool==='highlight'?2.8:1);current={tool,color:tool==='highlight'?hcolor:color,size:drawSize,points:[point(e)]};state.pages[state.page].strokes.push(current);redraw()};canvas.onpointermove=e=>{if(!drawing)return;current.points.push(point(e));redraw()};canvas.onpointerup=()=>{drawing=false;current=null;save()};canvas.onpointercancel=canvas.onpointerup;
$$('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;$('#textBtn').classList.remove('active');$$('[data-tool]').forEach(x=>x.classList.toggle('active',x===b));$('#highColors').classList.toggle('hidden',tool!=='highlight');$('#eraserControls').classList.toggle('hidden',tool!=='eraser');$('#strokeSizeControl').classList.toggle('hidden',tool==='eraser');canvas.style.pointerEvents='auto'});$$('[data-color]').forEach(b=>b.onclick=()=>color=b.dataset.color);$$('[data-hcolor]').forEach(b=>b.onclick=()=>hcolor=b.dataset.hcolor);
$$('[data-eraser-size]').forEach(b=>b.onclick=()=>{$('#eraserSize').value=b.dataset.eraserSize;$$('[data-eraser-size]').forEach(x=>x.classList.toggle('active',x===b))});$('#eraserSize').oninput=()=>$$('[data-eraser-size]').forEach(x=>x.classList.remove('active'));
$('#textBtn').onclick=activateTextMode;
let textSavedRange=null;
function rememberTextRange(){const s=window.getSelection();if(s&&s.rangeCount&&text.contains(s.anchorNode))textSavedRange=s.getRangeAt(0).cloneRange()}
function restoreTextRange(){if(!textSavedRange)return;const s=window.getSelection();s.removeAllRanges();s.addRange(textSavedRange)}
text.addEventListener('keyup',rememberTextRange);
text.addEventListener('mouseup',rememberTextRange);
text.addEventListener('touchend',()=>setTimeout(rememberTextRange,0));
text.addEventListener('input',()=>{rememberTextRange();save()});
$$('[data-text-color]').forEach(b=>{
  b.addEventListener('pointerdown',e=>e.preventDefault());
  b.onclick=()=>{
    text.focus();restoreTextRange();
    try{document.execCommand('styleWithCSS',false,true)}catch(_){}
    document.execCommand('foreColor',false,b.dataset.textColor);
    rememberTextRange();save();
  };
});
$('#boldBtn').addEventListener('pointerdown',e=>e.preventDefault());
$('#boldBtn').onclick=()=>{
  text.focus();restoreTextRange();
  document.execCommand('bold',false,null);
  rememberTextRange();save();
};
date.onchange=save;$('#undo').onclick=()=>{text.focus();try{document.execCommand('undo')}catch(e){} save();};
$('#prev').onclick=()=>{if(state.page>0){state.page--;load()}};$('#next').onclick=()=>{if(state.page<state.pages.length-1){state.page++;load()}};$('#newPage').onclick=()=>{save();state.pages.push({date:new Date().toISOString().slice(0,10),text:'',strokes:[],stickers:[]});state.page=state.pages.length-1;load()};
function enterNotebook(){$('#second').classList.add('hidden');$('#app').classList.remove('hidden');setTimeout(()=>{resize();activateTextMode()},50)}
function showOwner(){const n=localStorage.getItem(OWNER_KEY);if(n){$('#ownerBox').classList.add('hidden');$('#ownerFixed').classList.remove('hidden');$('#ownerDisplay').textContent=n}else{$('#ownerBox').classList.remove('hidden');$('#ownerFixed').classList.add('hidden')}}
$('#openSecond').onclick=()=>{$('#cover').classList.add('hidden');$('#second').classList.remove('hidden');showOwner()};$('#saveOwner').onclick=()=>{const n=$('#ownerName').value.trim();if(!n){alert('Escribe tu nombre para continuar.');return}localStorage.setItem(OWNER_KEY,n);$('#ownerDisplay').textContent=n;enterNotebook()};$('#ownerName').addEventListener('keydown',e=>{if(e.key==='Enter')$('#saveOwner').click()});$('#enterOwned').onclick=enterNotebook;
$('#stickersBtn').onclick=()=>{
  const p=$('#stickerPanel');
  const opening=p.classList.contains('hidden');
  p.classList.toggle('hidden');
  if(opening){v39Home();}
};
paper.addEventListener('pointerdown',e=>{if(!e.target.closest('.placed-sticker')){selectedStickerId=null;renderStickers()}});
$('#stickerUpload').onchange=async e=>{for(const f of e.target.files){const value=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(f)});insertSticker({kind:'image',value})}e.target.value='';try{v39Home()}catch(e){}};
function stopDictation(){if(recognition){try{recognition.stop()}catch{} recognition=null}$('#voiceBtn').classList.remove('dictating');$('#voiceBtn').textContent='🎙 Dictar';$('#voiceStatus').classList.add('hidden')}
$('#voiceBtn').onclick=()=>{if(recognition){stopDictation();return}canvas.style.pointerEvents='none';text.focus();const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert('Este navegador no ofrece dictado directo aquí. En Windows puedes colocar el cursor en la página y presionar Windows + H para dictar. En celular, usa el micrófono del teclado.');return}try{recognition=new SR();recognition.lang=(navigator.languages&&navigator.languages[0])||navigator.language||'pt-BR';recognition.continuous=true;recognition.interimResults=false;recognition.onstart=()=>{$('#voiceBtn').classList.add('dictating');$('#voiceBtn').textContent='■ Parar';$('#voiceStatus').classList.remove('hidden')};recognition.onresult=e=>{let spoken='';for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)spoken+=e.results[i][0].transcript+' ';if(spoken){const pos=text.selectionStart??text.value.length;const before=text.value.slice(0,pos),after=text.value.slice(pos);const prefix=before&& !/\s$/.test(before)?' ':'';text.value=before+prefix+spoken.trim()+after;text.selectionStart=text.selectionEnd=(before+prefix+spoken.trim()).length;save()}};recognition.onerror=e=>{stopDictation();const msg=e.error==='not-allowed'?'El micrófono está bloqueado. Permite el acceso al micrófono en el navegador.':e.error==='network'?'El dictado del navegador necesita conexión a internet.':'No fue posible iniciar el dictado. Revisa el permiso del micrófono.';alert(msg)};recognition.onend=()=>stopDictation();recognition.start()}catch{stopDictation();alert('No fue posible iniciar el dictado en este navegador. En Windows puedes usar Windows + H.')}};
$('#exportBtn').onclick=()=>{save();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state)],{type:'application/json'}));a.download='mi-cuaderno-congreso-backup.json';a.click()};$('#importFile').onchange=e=>{const fr=new FileReader();fr.onload=()=>{try{state=JSON.parse(fr.result);state.page=0;state.pages.forEach(p=>{p.strokes||=[];p.stickers||=[]});save();load();alert('Copia importada correctamente.')}catch{alert('No se pudo importar este archivo.')}};fr.readAsText(e.target.files[0])};
window.addEventListener('resize',()=>{if(!$('#app').classList.contains('hidden'))resize()});if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});renderStickerLibrary();load();

// V37: abrir sempre pronto para digitar.
setTimeout(()=>{try{activateTextMode()}catch(e){}},0);

// V38: guardar el cuaderno en PDF usando la impresión del navegador.
const v38Pdf=document.getElementById('pdfBtn');
if(v38Pdf)v38Pdf.onclick=()=>{
  save();
  const w=window.open('','_blank');
  if(!w){alert('Permite ventanas emergentes para guardar el PDF.');return;}
  const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pages=(state.pages||[]).map(p=>`<section><div class="date">${esc(p.date||'')}</div><div>${p.html!=null?p.html:esc(p.text||'').replace(/\n/g,'<br>')}</div></section>`).join('');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Mi Cuaderno del Congreso</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif}section{min-height:250mm;page-break-after:always;font-size:12pt;line-height:1.55}.date{text-align:right;color:#666;margin-bottom:18px}</style>${pages}<script>onload=()=>setTimeout(()=>print(),250)<\/script>`);
  w.document.close();
};

// V56 — o Ressaltador é uma caneta marca-texto sobre a página (dedo/caneta/mouse).
const oldTextHighlightBtn=document.getElementById('textHighlightBtn');
if(oldTextHighlightBtn) oldTextHighlightBtn.closest('.text-highlight-tool')?.classList.add('hidden');

// V44 — faixa de stickers: primeiro só a faixa; depois apenas a categoria escolhida.
const langHome=document.getElementById('stickerLanguageHome');
const chosen=document.getElementById('stickerChosenHeader');
const langTitle=document.getElementById('stickerLangTitle');
function v39Home(){
  langHome?.classList.remove('hidden');
  chosen?.classList.add('hidden');
  renderStickerLibrary(null);
}
function v39Show(lang){
  langHome?.classList.remove('hidden');
  chosen?.classList.add('hidden');
  renderStickerLibrary(lang);
}
document.querySelectorAll('#stickerLanguageHome [data-lang]').forEach(b=>{
  b.onclick=()=>v39Show(b.dataset.lang);
});
// V40: "+ Añadir stickers" usa o seletor de imagem já existente.
const addRibbon=document.getElementById('addStickerRibbonBtn');
if(addRibbon)addRibbon.onclick=()=>{
 const input=document.querySelector('#stickerUpload,input[type="file"][accept*="image"]');
 if(input)input.click();
};



// V43 — navegación de capas/caderno.
function v43ShowCover(){
  try{save()}catch(e){}
  document.getElementById('stickerPanel')?.classList.add('hidden');
  document.getElementById('app')?.classList.add('hidden');
  document.getElementById('second')?.classList.add('hidden');
  document.getElementById('cover')?.classList.remove('hidden');
  window.scrollTo(0,0);
}
const v43Close=document.getElementById('closeNotebook');
if(v43Close){
  v43Close.onclick=null;
  v43Close.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();v43ShowCover()});
}
const v43Exit=document.getElementById('exitNotebook');
if(v43Exit){
  v43Exit.onclick=null;
  v43Exit.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    try{save()}catch(_){}
    // Navegadores/PWA nem sempre permitem window.close(); primeiro retorna à capa
    // e então tenta fechar a janela quando permitido.
    v43ShowCover();
    try{window.open('','_self');window.close()}catch(_){}
  });
}
// Remove visualmente qualquer controle antigo duplicado que tenha sobrevivido no HTML.
document.querySelectorAll('#stickerPanel button,#stickerPanel label').forEach(el=>{
  if((el.textContent||'').includes('Añadir mis propios stickers')) el.remove();
});

// V46 — fecha a biblioteca de stickers ao tocar/clicar fora dela.
document.addEventListener('pointerdown',function(e){
  const panel=document.getElementById('stickerPanel');
  const trigger=document.getElementById('stickersBtn');
  if(!panel || panel.classList.contains('hidden')) return;
  if(panel.contains(e.target) || trigger?.contains(e.target)) return;
  panel.classList.add('hidden');
  try{v39Home()}catch(_){}
},true);

// V54 — navegação confiável também em toque.
(function(){
 const close=document.getElementById('closeNotebook');
 const exit=document.getElementById('exitNotebook');
 function backToCover(){
   try{save()}catch(_){}
   document.getElementById('stickerPanel')?.classList.add('hidden');
   document.getElementById('app')?.classList.add('hidden');
   document.getElementById('second')?.classList.add('hidden');
   document.getElementById('cover')?.classList.remove('hidden');
   window.scrollTo(0,0);
 }
 if(close){ close.onclick=function(e){e.preventDefault();e.stopPropagation();backToCover()}; }
 if(exit){ exit.onclick=function(e){e.preventDefault();e.stopPropagation();backToCover();try{window.close()}catch(_){}}; }
})();
