// ═══════════════════════════════════════════════════════════
// QUADROAI PRO — APP.JS v6
// ═══════════════════════════════════════════════════════════

var _tipoKit = '3pecas'; // '3pecas' | 'continua'
var PROMPT_RAW_RULE = 'CRITICAL: Generate ONLY the raw image itself. NO picture frame, NO frame border, NO wooden or metal frame, NO canvas stretcher bars, NO room background, NO wall, NO interior scene, NO white margins, NO mockup. Image fills 100% edge to edge — pure scene only.';

var selCat = 'religioso';
var selOpts = {};
var panelMode = 'idle';
var validationApprovalKey = '';
var _mockupSelecionadoId = '';   // mantido por retrocompat (single)
var _mockupSelecionados  = new Set(); // multi-select
var _mockupFiltro = 'todos';
var _kitB64 = '';
var _kitNome = '';
var _galeriaItems = [];
var _listingNome = '';
var _listingPrompt = '';
var _moverImgId = '';
var _moverPastaId = '';

// 3 pecas separadas — usadas tanto na aba 1 quanto na aba 2
var _pecas = [null, null, null]; // cada item: {b64, nome, dataUrl}

// ── SLOTS DE PECAS (Aba 1) ───────────────────────────────
function handleSlotUpload(idx, input) {
  var file = input.files && input.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var dataUrl = ev.target.result;
    _pecas[idx] = { b64: dataUrl.split(',')[1], nome: file.name, dataUrl: dataUrl };
    renderSlot(idx);
    input.value = '';
  };
  reader.readAsDataURL(file);
}

function renderSlot(idx) {
  var p = _pecas[idx];
  var drop = document.querySelector('#slot'+idx+' .peca-slot-drop');
  var prev = document.getElementById('slotPreview'+idx);
  var img  = document.getElementById('slotImg'+idx);
  if (!p) {
    if (drop) drop.style.display = '';
    if (prev) prev.style.display = 'none';
    return;
  }
  if (drop) drop.style.display = 'none';
  if (img)  img.src = p.dataUrl;
  if (prev) prev.style.display = '';
}

function removerPeca(idx) {
  _pecas[idx] = null; renderSlot(idx);
}

function limparPecas() {
  _pecas = [null,null,null];
  [0,1,2].forEach(renderSlot);
}

function usarPecaNoAnuncio(idx) {
  var p = _pecas[idx]; if (!p) return;
  // Copia para o slot correspondente na aba 2
  _pecasAnuncio[idx] = p;
  renderSlotAnuncio(idx);
  openAppTab('anuncio');
  setAnuncioStatus('Peca '+(idx+1)+' adicionada ao slot '+(idx===0?'Esquerda':idx===1?'Centro':'Direita')+'.','ok');
}

function usarTodasPecasNoAnuncio() {
  var count = _pecas.filter(Boolean).length;
  if (!count) { alert('Nenhuma peca importada ainda.'); return; }
  _pecas.forEach(function(p,i){ if(p) { _pecasAnuncio[i]=p; renderSlotAnuncio(i); } });
  openAppTab('anuncio');
  setAnuncioStatus(count+' peca(s) transferida(s) para o anuncio.','ok');
}

// ── KIT PANORÂMICO — reservado para versão futura ────────
// (funcionalidade desativada temporariamente)
var _kitFullB64 = null;
function handleKitFullUpload(input){}
function limparKitFull(){ _kitFullB64=null; }
function dividirKitEmPecas(){}

// ── SLOTS DE PEÇAS INDIVIDUAIS (Aba 2) ───────────────────
var _pecasAnuncio = [null, null, null];

function handleAnuncioSlot(idx, input) {
  var file = input.files && input.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var dataUrl = ev.target.result;
    _pecasAnuncio[idx] = { b64: dataUrl.split(',')[1], nome: file.name, dataUrl: dataUrl };
    renderSlotAnuncio(idx);
    input.value = '';
  };
  reader.readAsDataURL(file);
}

function renderSlotAnuncio(idx) {
  var p = _pecasAnuncio[idx];
  var drop = document.querySelector('#aslot'+idx+' .peca-slot-drop');
  var prev = document.getElementById('aSlotPreview'+idx);
  var img  = document.getElementById('aSlotImg'+idx);
  if (!p) {
    if (drop) drop.style.display = '';
    if (prev) prev.style.display = 'none';
    return;
  }
  if (drop) drop.style.display = 'none';
  if (img)  img.src = p.dataUrl;
  if (prev) prev.style.display = '';
}

function removerPecaAnuncio(idx) {
  _pecasAnuncio[idx] = null; renderSlotAnuncio(idx);
}

function limparPecasAnuncio() {
  _pecasAnuncio = [null,null,null];
  [0,1,2].forEach(renderSlotAnuncio);
}

// ── EXTENSAO CHROME: recebe imagem via postMessage ───────
window.addEventListener('message', function(ev) {
  var d = ev.data;
  if (!d || d.type !== 'quadroai_import') return;
  var idx = (d.slot !== undefined) ? parseInt(d.slot) : -1;
  if (idx < 0 || idx > 2) {
    // Se nao especificou slot, coloca no proximo vazio
    idx = _pecas.findIndex(function(p){ return !p; });
    if (idx === -1) idx = 0;
  }
  _pecas[idx] = { b64: d.b64, nome: d.nome || ('peca_'+(idx+1)+'.jpg'), dataUrl: 'data:image/jpeg;base64,'+d.b64 };
  renderSlot(idx);
  // Notificacao visual
  var lbl = ['Esquerda','Centro','Direita'][idx];
  alert('Peca '+(idx+1)+' ('+lbl+') importada com sucesso!');
});

// Endpoint para extensao enviar via fetch (CORS)
// A extensao pode chamar POST /api/import-peca com {slot, b64, nome}

// ── API KEYS (localStorage) ───────────────────────────────
function getKeys(){
  try{
    return {
      anthropic: localStorage.getItem('qai_anthropic_key')||'',
      openai:    localStorage.getItem('qai_openai_key')||''
    };
  }catch(e){return{anthropic:'',openai:''};}
}
function saveKeys(ak,ok){
  try{
    if(ak!==null)localStorage.setItem('qai_anthropic_key',ak.trim());
    if(ok!==null)localStorage.setItem('qai_openai_key',ok.trim());
  }catch(e){}
}
function apiHeaders(){
  var k=getKeys();
  var h={'Content-Type':'application/json'};
  if(k.anthropic)h['X-Anthropic-Key']=k.anthropic;
  if(k.openai)   h['X-OpenAI-Key']=k.openai;
  return h;
}
function renderKeyStatus(){
  var k=getKeys();
  var akEl=document.getElementById('keyStatusAnthropic');
  var okEl=document.getElementById('keyStatusOpenAI');
  var dot=document.getElementById('keyStatusDot');
  if(akEl)akEl.textContent=k.anthropic?'Configurada':'Nao configurada';
  if(akEl)akEl.style.color=k.anthropic?'#4caf50':'var(--t3,#888)';
  if(okEl)okEl.textContent=k.openai?'Configurada':'Nao configurada';
  if(okEl)okEl.style.color=k.openai?'#4caf50':'var(--t3,#888)';
  if(dot){
    var both=k.anthropic&&k.openai;var one=k.anthropic||k.openai;
    dot.style.background=both?'#4caf50':(one?'#e6a817':'var(--t3,#888)');
  }
}
function openKeysModal(){
  var k=getKeys();
  var modal=document.getElementById('keysModal');
  document.getElementById('inputAnthropic').value=k.anthropic;
  document.getElementById('inputOpenAI').value=k.openai;
  // toggle visibility off on open
  ['inputAnthropic','inputOpenAI'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.type='password';
  });
  modal.style.display='flex';
}
function closeKeysModal(){document.getElementById('keysModal').style.display='none';}
function saveKeysFromModal(){
  var ak=document.getElementById('inputAnthropic').value;
  var ok=document.getElementById('inputOpenAI').value;
  saveKeys(ak,ok);
  renderKeyStatus();
  closeKeysModal();
}
function toggleKeyVis(inputId,btn){
  var el=document.getElementById(inputId);
  if(!el)return;
  el.type=el.type==='password'?'text':'password';
  btn.textContent=el.type==='password'?'Mostrar':'Ocultar';
}


function toggleTheme(){
  var html=document.documentElement;
  var next=html.getAttribute('data-theme')==='dark'?'light':'dark';
  html.setAttribute('data-theme',next);
  document.getElementById('themeIcon').textContent=next==='dark'?'\u2600':'\uD83C\uDF19';
  try{localStorage.setItem('qai_theme',next);}catch(e){}
}

// ── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  try{
    var t=localStorage.getItem('qai_theme');
    if(t){document.documentElement.setAttribute('data-theme',t);var ic=document.getElementById('themeIcon');if(ic)ic.textContent=t==='dark'?'\u2600':'\uD83C\uDF19';}
  }catch(e){}
  document.getElementById('ideiaInp').addEventListener('input',function(){resetValidationApproval();});
  // Canvas moldura
  var canvas=document.getElementById('molduraCanvas');
  if(canvas){canvas.addEventListener('click',function(e){
    if(_molduraState.pontos.length>=12)return;
    var rect=canvas.getBoundingClientRect();
    var escala=_molduraState.escala;
    _molduraState.pontos.push({x:Math.round((e.clientX-rect.left)/escala),y:Math.round((e.clientY-rect.top)/escala)});
    redrawMolduraCanvas();atualizarInstrucao();
  });}
  renderCats();renderOpts();renderIdleState();
  loadHistory();loadMockupsLibrary();loadPastas();
  renderKeyStatus();
  // user info
  fetch('/api/me').then(function(r){return r.json();}).then(function(d){
    var el=document.getElementById('headUser');
    if(el&&d.user)el.textContent=d.user;
  }).catch(function(){});
});

async function fazerLogout(){
  await fetch('/api/logout',{method:'POST'});
  window.location.href='/login';
}

// ── TABS ─────────────────────────────────────────────────
function openAppTab(tab){
  ['quadro','anuncio','pastas'].forEach(function(t){
    var v=document.getElementById('viewCreate'+t.charAt(0).toUpperCase()+t.slice(1));
    var b=document.getElementById('tabBtn'+t.charAt(0).toUpperCase()+t.slice(1));
    if(v)v.classList.toggle('active',t===tab);
    if(b)b.classList.toggle('active',t===tab);
  });
  // fix: aba pastas tem id diferente
  var vp=document.getElementById('viewPastas');
  var bp=document.getElementById('tabBtnPastas');
  if(vp)vp.classList.toggle('active',tab==='pastas');
  if(bp)bp.classList.toggle('active',tab==='pastas');
  var vq=document.getElementById('viewCreateQuadro');
  var bq=document.getElementById('tabBtnQuadro');
  if(vq)vq.classList.toggle('active',tab==='quadro');
  if(bq)bq.classList.toggle('active',tab==='quadro');
  var va=document.getElementById('viewCreateAnuncio');
  var ba=document.getElementById('tabBtnAnuncio');
  if(va)va.classList.toggle('active',tab==='anuncio');
  if(ba)ba.classList.toggle('active',tab==='anuncio');
  window.scrollTo({top:0,behavior:'smooth'});
  if(tab==='pastas')loadPastas();
}

// ── RENDER CATS ───────────────────────────────────────────
function renderCats(){
  var g=document.getElementById('catGrid');if(!g)return;g.innerHTML='';
  Object.keys(CONFIG).forEach(function(k){
    var c=CONFIG[k];var meta=CAT_META[k]||{badge:'Cat',blurb:c.sub};
    var b=document.createElement('div');b.className='cat-card'+(k===selCat?' on':'');
    b.style.setProperty('--cat-color',c.color||'#c9923c');
    b.onclick=(function(key){return function(){selCat=key;selOpts={};validationApprovalKey='';renderCats();renderOpts();renderIdleState();};})(k);
    b.innerHTML='<div class="cat-ico">'+c.icon+'</div><div class="cat-nm">'+esc(c.name)+'</div><div class="cat-sb">'+esc(meta.blurb)+'</div><div class="cat-badge-pill">'+esc(meta.badge)+'</div>';
    g.appendChild(b);
  });
}


function getOptSectionKey(opt){
  var raw = ((opt.label||'') + (opt.id||'')).toLowerCase();
  if (/^tema$/.test(opt.id))                                         return 'personagens'; // tema vem primeiro
  if (/^personagens$/.test(opt.id))                                  return 'personagens';
  if (/personagem/.test(raw) && !/gamer/.test(raw))                 return 'personagens';
  if (/estilo/.test(raw))                                            return 'estilo';
  if (/atmosfera|expressao|enquadramento/.test(raw))                 return 'atmosfera';
  if (/cenario|fundo|objeto|flor|planta|cidade|composicao_/.test(raw)) return 'conteudo';
  if (/detalhe/.test(raw))                                           return 'detalhes';
  if (/efeito/.test(raw))                                            return 'efeitos';
  if (/paleta|cor|acabamento|veias|iluminacao|textura|intensidade/.test(raw)) return 'cores';
  if (opt.id === 'composicao')                                       return 'layout';
  if (/frase|texto|nome/.test(raw) && opt.type === 'text')           return 'frase';
  if (opt.type === 'font' || /fonte/.test(raw))                      return 'fonte';
  if (/moldura/.test(raw))                                           return 'moldura';
  return 'outros';
}

function getOptSectionMeta(k){ return ({
  personagens: {title:'Personagens',          tip:'O que aparece no quadro.'},
  estilo:      {title:'Estilo artistico',     tip:'Como a arte é renderizada.'},
  atmosfera:   {title:'Atmosfera',            tip:'Clima e mood da cena.'},
  conteudo:    {title:'Conteudo e cenario',   tip:'Tema, fundo e composicao.'},
  detalhes:    {title:'Detalhes decorativos', tip:'Elementos extras na cena.'},
  efeitos:     {title:'Efeitos visuais',      tip:'Particulas, brilhos e luz.'},
  cores:       {title:'Cores e acabamento',   tip:'Paleta e clima de cores.'},
  layout:      {title:'Layout do kit',        tip:'Como as 3 pecas se relacionam.'},
  frase:       {title:'Frases',               tip:'Texto que aparece no quadro.'},
  fonte:       {title:'Fonte da frase',       tip:'Escolha a tipografia.'},
  moldura:     {title:'Moldura',              tip:'Acabamento final.'},
  outros:      {title:'Opcoes extras',        tip:''}
})[k] || {title:'Opcoes', tip:''}; }

function renderOpts(){
  resetValidationApproval();
  var area = document.getElementById('optsArea');
  var dyn  = document.getElementById('optsDyn');
  var cat  = CONFIG[selCat];
  if (!cat || !cat.opts || !cat.opts.length) { area.style.display='none'; return; }
  area.style.display = 'block'; dyn.innerHTML = '';
  var sectionOrder = ['personagens','estilo','atmosfera','conteudo','detalhes','efeitos','cores','layout','frase','fonte','moldura','outros'];
  var sw = document.createElement('div'); sw.className = 'opt-sections';
  sectionOrder.forEach(function(sk) {
    var opts = cat.opts.filter(function(o){ return getOptSectionKey(o) === sk; });
    if (!opts.length) return;
    var startOpen = (sk === 'personagens' || sk === 'estilo');
    var meta = getOptSectionMeta(sk);
    var sec  = createSection(meta.title, meta.tip, startOpen);
    var body = document.createElement('div'); body.className = 'opt-block-body';
    opts.forEach(function(opt){ body.appendChild(buildOptRow(opt)); });
    sec.appendChild(body); sw.appendChild(sec);
  });
  dyn.appendChild(sw); updateAllBlockCounts();
}

function createSection(title,tip,startOpen){
  var block=document.createElement('div');block.className='opt-block'+(startOpen?' open':'');
  var header=document.createElement('div');header.className='opt-block-header';
  header.innerHTML='<div class="opt-block-left"><span class="opt-block-title">'+esc(title)+'</span>'+(tip?'<span class="opt-block-tip">'+esc(tip)+'</span>':'')+'</div><span class="opt-block-arrow">&#9660;</span>';
  // Só abre/fecha se clicou no header ou filhos diretos dele (título, seta) — nunca em chips/inputs dentro do body
  header.addEventListener('click', function(e){
    var t = e.target;
    // Sobe na árvore até encontrar o header ou sair dele
    while (t && t !== header) {
      // Se passou por algum chip, input, ou opt-block-body → ignora
      if (t.classList && (
        t.classList.contains('chip') ||
        t.classList.contains('font-chip') ||
        t.classList.contains('opt-text') ||
        t.classList.contains('opt-block-body') ||
        t.classList.contains('opt-row') ||
        t.classList.contains('chips') ||
        t.classList.contains('font-chips') ||
        t.classList.contains('font-group') ||
        t.classList.contains('font-group-list')
      )) return;
      t = t.parentElement;
    }
    block.classList.toggle('open');
    updateBlockCount(block);
  });
  block.appendChild(header);return block;
}
function updateBlockCount(block){
  var chips=block.querySelectorAll('.chip.on,.font-chip.on');var texts=block.querySelectorAll('.opt-text');
  var count=chips.length;texts.forEach(function(t){if(t.value.trim())count++;});
  var ex=block.querySelector('.opt-block-count');
  if(count>0){if(!ex){ex=document.createElement('span');ex.className='opt-block-count';block.querySelector('.opt-block-left').appendChild(ex);}ex.textContent=count;}
  else if(ex)ex.remove();
}
function updateAllBlockCounts(){document.querySelectorAll('.opt-block').forEach(function(b){updateBlockCount(b);});}

function buildOptRow(opt){
  var row=document.createElement('div');row.className='opt-row';
  var lbl=document.createElement('div');lbl.className='opt-label';lbl.textContent=opt.label;row.appendChild(lbl);
  if(opt.type==='text'){var inp=document.createElement('input');inp.className='opt-text';inp.type='text';inp.placeholder=opt.placeholder||'';inp.value=selOpts[opt.id]||'';inp.oninput=(function(id){return function(){selOpts[id]=this.value;resetValidationApproval();};})(opt.id);row.appendChild(inp);}
  else if(opt.type==='font'){row.appendChild(buildFontChipsEl(opt));}
  else{row.appendChild(buildChipsEl(opt));}
  return row;
}
function buildFontChipsEl(opt){
  var wrap=document.createElement('div');wrap.className='font-chips';var cur=selOpts[opt.id]||null;var groups={};
  (opt.items||[]).forEach(function(item){var g=item.group||'Fontes';if(!groups[g])groups[g]=[];groups[g].push(item);});
  Object.keys(groups).forEach(function(gn){
    var grp=document.createElement('div');grp.className='font-group';var gt=document.createElement('div');gt.className='font-group-title';gt.textContent=gn;var gl=document.createElement('div');gl.className='font-group-list';
    groups[gn].forEach(function(item){var c=document.createElement('div');c.className='font-chip'+(cur===item.name?' on':'');c.innerHTML='<span class="font-chip-name">'+esc(item.name)+'</span><span class="font-chip-sample" style="font-family:'+item.css+'">'+esc(item.sample)+'</span>';c.onclick=(function(id,val){return function(){selOpts[id]=(selOpts[id]===val)?null:val;resetValidationApproval();renderOpts();};})(opt.id,item.name);gl.appendChild(c);});
    grp.appendChild(gt);grp.appendChild(gl);wrap.appendChild(grp);
  });
  return wrap;
}
function getChipGridClass(opt){var items=(opt.items||[]).filter(Boolean);if(!items.length)return'';var maxLen=items.reduce(function(m,i){return Math.max(m,String(i).length);},0);if(maxLen>34)return'';if(items.length>=12&&maxLen<=16)return' grid-4';if(items.length>=8&&maxLen<=22)return' grid-3';if(items.length>=4&&maxLen<=30)return' grid-2';return'';}
function buildChipsEl(opt){
  var chips=document.createElement('div');chips.className='chips'+getChipGridClass(opt);
  if(opt.type==='multi'){var cur=selOpts[opt.id]||[];opt.items.forEach(function(item){var c=document.createElement('div');c.className='chip'+(cur.indexOf(item)>=0?' on':'');c.textContent=item;c.onclick=(function(id,val){return function(){var arr=selOpts[id]?selOpts[id].slice():[];var idx=arr.indexOf(val);if(idx>=0)arr.splice(idx,1);else arr.push(val);selOpts[id]=arr;resetValidationApproval();renderOpts();};})(opt.id,item);chips.appendChild(c);});}
  else{var cur=selOpts[opt.id]||null;opt.items.forEach(function(item){var c=document.createElement('div');c.className='chip'+(cur===item?' on':'');c.textContent=item;c.onclick=(function(id,val){return function(){selOpts[id]=(selOpts[id]===val)?null:val;resetValidationApproval();renderOpts();};})(opt.id,item);chips.appendChild(c);});}
  return chips;
}
function clearOpts(){selOpts={};resetValidationApproval();renderOpts();}

// ── SMART RANDOM ─────────────────────────────────────────
function pickOne(arr){return arr&&arr.length?arr[Math.floor(Math.random()*arr.length)]:null;}

// ── PRESETS CURADOS — kits que fazem sentido visual ───────
var CURATED_PRESETS = {
  religioso: [
    // Jesus central + frases nas laterais
    {personagens:['Jesus Cristo — close rosto com coroa de espinhos'], estilo:'Ultra-realismo fotográfico 8K', atmosfera:'Gloria dourada — raios de luz divina explosivos', cenario:'Fundo preto puro com partículas de ouro', detalhes:['Halo de luz divina dourado','Manchas de tinta dourada (gold splash)'], efeitos:['Partículas de ouro flutuando','Brilho divino dourado ao redor'], paleta:'Branco e ouro — limpo e divino', composicao:'Central em destaque + laterais', frase_esq:'Nunca foi sorte', frase_dir:'Sempre foi Deus', fonte:'Great Vibes', moldura:'Preta fosca'},
    // Leão central + frases
    {personagens:['Leão de Judá — majestoso de frente com crina dourada'], estilo:'Ultra-realismo fotográfico 8K', atmosfera:'Épico e tempestuoso — relâmpagos e nuvens', cenario:'Fundo preto puro com partículas de ouro', detalhes:['Manchas de tinta dourada (gold splash)'], efeitos:['Partículas de ouro flutuando'], paleta:'Preto e ouro — clássico premium', composicao:'Central em destaque + laterais', frase_esq:'Antes de tudo fé', frase_dir:'Depois de tudo gratidão', fonte:'Great Vibes', moldura:'Preta fosca'},
    // Jesus e Leão juntos
    {personagens:['Jesus Cristo e leão de Judá lado a lado'], estilo:'Ultra-realismo fotográfico 8K', atmosfera:'Dark e cinematográfico — sombras dramáticas', cenario:'Fundo preto puro com partículas de ouro', detalhes:['Raios de luz celeste'], efeitos:['Brilho divino dourado ao redor','Névoa mística dourada'], paleta:'Preto e ouro — clássico premium', composicao:'Panorama continuo nas 3 pecas', frase_esq:'Nunca foi sorte', frase_dir:'Sempre foi Deus', fonte:'Dancing Script', moldura:'Preta fosca'},
    // Leão olhos azuis + frases
    {personagens:['Leão de Judá com olhos azuis penetrantes'], estilo:'Ultra-realismo fotográfico 8K', atmosfera:'Épico e tempestuoso — relâmpagos e nuvens', cenario:'Parede de pedra texturizada antiga', detalhes:['Manchas de tinta dourada (gold splash)'], efeitos:['Partículas de ouro flutuando'], paleta:'Preto e ouro — clássico premium', composicao:'Central em destaque + laterais', frase_esq:'O Senhor é meu refúgio', frase_dir:'É minha fortaleza', fonte:'Great Vibes', moldura:'Preta fosca'},
    // Maria central
    {personagens:['Maria — Nossa Senhora orando com manto azul'], estilo:'Pintura a óleo barroca estilo Caravaggio', atmosfera:'Gloria dourada — raios de luz divina explosivos', cenario:'Interior de catedral gótica com vitrais', detalhes:['Halo de luz divina dourado','Rosas vermelhas ao redor'], efeitos:['Partículas de ouro flutuando','Luz vazando entre nuvens'], paleta:'Azul escuro e ouro — noturno majestoso', composicao:'Central em destaque + laterais', frase_esq:'Ave Maria', frase_dir:'Cheia de graça', fonte:'Cinzel', moldura:'Ouro escovado'},
    // Arcanjo Miguel
    {personagens:['Arcanjo Miguel derrotando o demônio'], estilo:'CGI cinematográfico 3D hiper-realista', atmosfera:'Guerreiro e poderoso — batalha espiritual', cenario:'Campo de batalha espiritual épico', detalhes:['Asas de anjo brancas abertas','Espada de luz flamejante','Chamas ao redor'], efeitos:['Labaredas de fogo ao fundo','Brilho divino dourado ao redor'], paleta:'Vinho e ouro — dramático e rico', composicao:'Cada quadro independente', moldura:'Preta fosca'},
    // Jesus mãos com chagas
    {personagens:['Jesus Cristo — mãos abertas com chagas'], estilo:'Escultura 3D em mármore branco e ouro', atmosfera:'Celestial suave — luz do paraíso', cenario:'Fundo abstrato com manchas de tinta dourada', detalhes:['Halo de luz divina dourado','Folhas de ouro flutuando'], efeitos:['Partículas de ouro flutuando','Brilho divino dourado ao redor'], paleta:'Branco e ouro — limpo e divino', composicao:'Central em destaque + laterais', frase_esq:'Nunca foi sorte', frase_dir:'Sempre foi Deus', fonte:'Dancing Script', moldura:'Ouro polido'},
    // 3 Cruzes
    {personagens:['3 Cruzes do Calvário ao entardecer'], estilo:'Aquarela dramática com respingos de tinta', atmosfera:'Melancólico e tocante — sofrimento sagrado', cenario:'Deserto com amanhecer dourado', detalhes:['Raios de luz celeste','Manto vermelho heróico'], efeitos:['Respingos de tinta dourada (paint splash)','Luz vazando entre nuvens'], paleta:'Vinho e ouro — dramático e rico', composicao:'Panorama continuo nas 3 pecas', moldura:'Preta fosca'},
  ],
  floral: [
    {flor:'Peônia rosa blush', estilo:'Fine art dark floral — fundo preto dramatico', atmosfera_floral:'Dramática e dark luxo', fundo:'Preto absoluto dramatico', composicao_floral:'Flor única herói — close macro dominante', extras:['Gotas de água cristalinas','Bokeh dourado ao fundo'], paleta:'Dramático escuro — alto contraste', composicao:'Central em destaque + laterais', moldura:'Preta fosca'},
    {flor:'Rosa vermelha — close macro com gotas', estilo:'Fotografia macro ultra-realista — fundo dark', atmosfera_floral:'Dramática e dark luxo', fundo:'Preto absoluto dramatico', composicao_floral:'Flor única herói — close macro dominante', extras:['Gotas de água cristalinas','Folha de ouro (gold leaf)'], paleta:'Dramático escuro — alto contraste', composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {flor:'Orquídea branca elegante', estilo:'Gold foil sobre fundo escuro', atmosfera_floral:'Luxuosa e premium', fundo:'Preto absoluto dramatico', composicao_floral:'Ramo com folhas e caule — vertical elegante', extras:['Folha de ouro (gold leaf)','Bokeh dourado ao fundo'], paleta:'Gold e escuro luxuoso', composicao:'Cada quadro independente', moldura:'Ouro escovado'},
    {flor:'Cerejeira sakura rosa', estilo:'Aquarela romântica suave', atmosfera_floral:'Romântica e sonhadora', fundo:'Branco puro clean', composicao_floral:'Ramo com folhas e caule — vertical elegante', extras:['Pétalas caindo em movimento','Borboleta pousada na flor'], paleta:'Suave e romântico pastel', composicao:'Panorama continuo nas 3 pecas', moldura:'Madeira clara'},
  ],
  gold: [
    {tema:'Flores 3D douradas em relevo — fundo preto', estilo_gold:'Gold foil sobre fundo escuro premium', fundo:'Preto absoluto', acabamento:'Ouro 24k brilhante', efeitos:['Partículas douradas flutuando','Brilho metálico intenso'], composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {tema:'Tulipas douradas 3D esculturais', estilo_gold:'3D escultura volumétrica realista', fundo:'Preto absoluto', acabamento:'Ouro 24k brilhante', efeitos:['Brilho metálico intenso','Bokeh dourado ao fundo'], composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {tema:'Árvore dourada panorâmica com folhas caindo', estilo_gold:'Gold foil sobre fundo escuro premium', fundo:'Preto absoluto', acabamento:'Ouro 24k brilhante', efeitos:['Partículas douradas flutuando','Bokeh dourado ao fundo'], composicao:'Panorama continuo nas 3 pecas', moldura:'Preta fosca'},
    {tema:'Penas de ouro elegantes', estilo_gold:'Gold foil sobre fundo escuro premium', fundo:'Carvão escuro texturizado', acabamento:'Champagne metálico', efeitos:['Brilho metálico intenso','Luz lateral dramática'], composicao:'Cada quadro independente', moldura:'Preta fosca'},
  ],
  abstrato: [
    {estilo:'Folhas de ginkgo biloba — coloridas sobrepostas', atmosfera_abs:'Alto contraste dramático', paleta:'Teal e laranja — complementar vibrante', objeto_esq:'Nenhum objeto — arte pura', objeto_ctr:'Nenhum objeto — arte pura', objeto_dir:'Nenhum objeto — arte pura', composicao:'Panorama continuo nas 3 pecas', moldura:'Preta fosca'},
    {estilo:'Geométrico 3D com iluminação dramática — círculos e formas', atmosfera_abs:'Metálico e refletivo premium', paleta:'Laranja, cinza e dourado — moderno', objeto_esq:'Nenhum objeto — arte pura', objeto_ctr:'Nenhum objeto — arte pura', objeto_dir:'Nenhum objeto — arte pura', composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {estilo:'Fluid art — tinta fluída orgânica premium', atmosfera_abs:'Explosivo e vibrante', paleta:'Ouro e preto', objeto_esq:'Nenhum objeto — arte pura', objeto_ctr:'Nenhum objeto — arte pura', objeto_dir:'Nenhum objeto — arte pura', composicao:'Panorama continuo nas 3 pecas', moldura:'Preta fosca'},
    {estilo:'Folhas outono — laranja, teal e bronze sobrepostas', atmosfera_abs:'Bold e contemporâneo', paleta:'Teal, dourado e marrom — outonal rico', objeto_esq:'Nenhum objeto — arte pura', objeto_ctr:'Nenhum objeto — arte pura', objeto_dir:'Nenhum objeto — arte pura', composicao:'Panorama continuo nas 3 pecas', moldura:'Preta fosca'},
  ],
  marmore: [
    {tipo:'Calacatta oro italiano — veios dourados', veias:'Ouro 24k brilhante', acabamento:'Polido espelhado alto brilho', iluminacao:'Luz lateral rasante que realça textura', composicao:'Panorama continuo nas 3 pecas', moldura:'Preta fosca'},
    {tipo:'Marquina preto belga — veios brancos', veias:'Platina fria espelhada', acabamento:'Polido espelhado alto brilho', iluminacao:'Luz diagonal dramática', composicao:'Panorama continuo nas 3 pecas', moldura:'Preta fosca'},
    {tipo:'Ônix mel translúcido — retroiluminado', veias:'Rose gold', acabamento:'Backlit translúcido luminoso', iluminacao:'Backlit iluminado de baixo para cima', composicao:'Panorama continuo nas 3 pecas', moldura:'Ouro escovado'},
  ],
  natureza: [
    {planta:'Eucalipto', estilo:'Minimalista escandinavo clean', atmosfera_nat:'Serena e minimalista', paleta:'Verde sage e creme', composicao:'Cada quadro independente', frase_esq:'Respire', frase_ctr:'', frase_dir:'Viva', fonte:'Cormorant Garamond', moldura:'Madeira clara'},
    {planta:'Monstera deliciosa', estilo:'Fotográfico macro realista', atmosfera_nat:'Vibrante e tropical', paleta:'Verde escuro e madeira', composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {planta:'Cerejeira sakura', estilo:'Japonês zen sumi-e ink', atmosfera_nat:'Mística e neblinosa', paleta:'Verde sage e creme', composicao:'Panorama continuo nas 3 pecas', moldura:'Madeira escura'},
  ],
  lavabo: [
    {composicao_lavabo:'Vela, difusor e folhagens', estilo:'Spa clean bege e branco', flores_lavabo:'Eucalipto e ramos verdes', paleta:'Bege branco e dourado', efeitos:['Luz suave lateral quente','Fumaça sutil da vela acesa'], composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {composicao_lavabo:'Perfumes e bandeja elegante', estilo:'Rose chic feminino luxo', flores_lavabo:'Rosas brancas elegantes', paleta:'Rose champagne e branco', efeitos:['Reflexo em superfície brilhante','Bokeh ao fundo'], composicao:'Cada quadro independente', moldura:'Rose gold'},
  ],
  infantil: [
    {tema:'Safari — girafa, elefantinho e leão baby', estilo_render:'Aquarela pastel suave — delicado (estilo das imagens)', expressao:'Sorrindo super feliz', fundo:'Fundo bege neutro limpo — minimalista', paleta:'Tons neutros e pastel — bege, creme, caramelo', extras:['Estrelinhas e luzinhas ao redor'], composicao:'Cada quadro independente', moldura:'Madeira clara'},
    {tema:'Ursinho teddy bear fluffy na lua', estilo_render:'Aquarela pastel suave — delicado (estilo das imagens)', expressao:'Dormindo fofinho pacificamente', fundo:'Céu azul com nuvens fofas e lua', paleta:'Tons neutros e pastel — bege, creme, caramelo', extras:['Estrelinhas e luzinhas ao redor','Nuvens fofas ao redor'], composicao:'Cada quadro independente', moldura:'Madeira clara'},
    {tema:'Dinossauros baby coloridos — T-Rex, braquiossauro, triceratops', estilo_render:'Aquarela pastel suave — delicado (estilo das imagens)', expressao:'Sorrindo super feliz', fundo:'Fundo bege neutro limpo — minimalista', paleta:'Tons neutros e pastel — bege, creme, caramelo', extras:['Estrelinhas e luzinhas ao redor'], composicao:'Cada quadro independente', moldura:'Madeira clara'},
    {tema:'Astronauta baby no espaço com planetas', estilo_render:'Pixar 3D — volume e brilho', expressao:'Olhando curioso com olhos grandes', fundo:'Espaço com planetas e estrelas coloridos', paleta:'Azul bebê e amarelo sol', extras:['Estrelinhas e luzinhas ao redor','Brilhos e glitter'], composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {tema:'Unicórnio mágico arco-íris', estilo_render:'Aquarela pastel suave — delicado (estilo das imagens)', expressao:'Pulando de alegria', fundo:'Fundo bege neutro limpo — minimalista', paleta:'Tons neutros e pastel — bege, creme, caramelo', extras:['Arco-íris decorativo','Brilhos e glitter'], composicao:'Cada quadro independente', moldura:'Madeira clara'},
  ],
  gamer: [
    {objetos_gamer:'Controle | Headset | Teclado', estilo:'Neon verde — Xbox vibes', personagem_gamer:'Nenhum personagem', paleta:'Verde neon e preto', efeitos:['Glow neon intenso','Partículas de luz coloridas'], composicao:'Cada quadro independente', frase_esq:'PLAY HARD', frase_ctr:'PLAYER 1', frase_dir:'GAME ON', fonte:'Oswald', moldura:'Preta fosca'},
    {objetos_gamer:'Setup completo panorâmico', estilo:'RGB roxo e azul — setup premium', personagem_gamer:'Nenhum personagem', paleta:'Roxo e azul neon', efeitos:['Glow neon intenso','Raios elétricos'], composicao:'Panorama continuo nas 3 pecas', moldura:'Preta fosca'},
  ],
  cidades: [
    {cidade:'Paris', estilo:'Aquarela romântica', cena_esq:'Café ou restaurante típico', cena_ctr:'Monumento mais icônico', cena_dir:'Janela com flores e varanda', clima:'Entardecer dourado hora mágica', paleta:'Rosa e dourado romântico', composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {cidade:'Tóquio', estilo:'Neon cyberpunk noturno', cena_esq:'Beco ou ruela charmosa', cena_ctr:'Skyline ao entardecer', cena_dir:'Detalhe típico da cidade', clima:'Noite com luzes da cidade', paleta:'Neon e escuro urbano', composicao:'Cada quadro independente', moldura:'Preta fosca'},
    {cidade:'Nova York', estilo:'Fotografia P&B artístico', cena_esq:'Detalhe arquitetônico típico', cena_ctr:'Vista panorâmica da cidade', cena_dir:'Cena de rua animada', clima:'Noite com luzes da cidade', paleta:'Monocromático elegante', composicao:'Cada quadro independente', moldura:'Preta fosca'},
  ]
};

function applySmartRandom(keepFrases){
  var cat = CONFIG[selCat]; if (!cat) return;
  var frasesSalvas = {};
  if (keepFrases) {
    cat.opts.forEach(function(opt){ if(opt.type==='text'&&selOpts[opt.id]) frasesSalvas[opt.id]=selOpts[opt.id]; });
  }
  selOpts = {};

  // Tenta usar preset curado primeiro
  var presets = CURATED_PRESETS[selCat];
  if (presets && presets.length) {
    var preset = pickOne(presets);
    Object.keys(preset).forEach(function(k){ selOpts[k] = preset[k]; });
  } else {
    // Fallback: sorteia single aleatoriamente
    cat.opts.forEach(function(opt){
      if (opt.type==='single' && opt.items && opt.items.length) selOpts[opt.id] = pickOne(opt.items);
    });
  }

  if (keepFrases) {
    Object.keys(frasesSalvas).forEach(function(id){ selOpts[id] = frasesSalvas[id]; });
  } else if (!presets) {
    cat.opts.forEach(function(opt){ if(opt.type==='text') selOpts[opt.id]=''; });
  }

  resetValidationApproval(); renderOpts();
}

function sortearComOpcoes(){
  // mostra mini modal de opcao de frase
  var cat=CONFIG[selCat];
  var temFrase=cat&&cat.opts.some(function(o){return o.type==='text';});
  if(!temFrase){applySmartRandom(false);return;}
  var modal=document.getElementById('sortearModal');
  if(modal){modal.style.display='flex';return;}
  // cria modal inline
  var m=document.createElement('div');m.id='sortearModal';m.className='moldura-modal';m.style.display='flex';
  m.innerHTML='<div class="moldura-modal-box" style="max-width:380px"><div class="moldura-modal-head"><div class="panel-title">Sortear opcoes</div><button class="mini-btn" onclick="fecharSortearModal()">Fechar</button></div><div style="margin-top:14px;display:flex;flex-direction:column;gap:10px"><button class="btn-gen" onclick="applySmartRandom(false);renderOpts();fecharSortearModal();" style="min-height:42px;font-size:13px">Sortear tudo (sem frase)</button><button class="btn-gen" onclick="applySmartRandom(true);renderOpts();fecharSortearModal();" style="min-height:42px;font-size:13px;background:var(--sf2)">Sortear e manter minhas frases</button><button class="mini-btn" onclick="applySmartRandom(false);renderOpts();fecharSortearModal();generate();" style="font-size:12px">Sortear tudo e ja gerar</button></div></div>';
  document.body.appendChild(m);
}
function fecharSortearModal(){var m=document.getElementById('sortearModal');if(m)m.style.display='none';}

function generateRandomPrompt(){var keys=Object.keys(CONFIG||[]);if(!keys.length)return;selCat=pickOne(keys);selOpts={};validationApprovalKey='';renderCats();applySmartRandom(false);var idea=document.getElementById('ideiaInp');if(idea)idea.value='';generate();}


// ── BUILD PROMPT ─────────────────────────────────────────
function buildContext(){
  var cat=CONFIG[selCat];if(!cat)return'';var lines=['CATEGORY: '+cat.name+' — '+cat.sub];
  cat.opts.forEach(function(opt){var val=selOpts[opt.id];if(!val||(Array.isArray(val)&&val.length===0))return;if(!String(val).trim())return;lines.push(opt.label.toUpperCase()+': '+(Array.isArray(val)?val.join(', '):String(val)));});
  return lines.join('\n');
}
// ── CATEGORY RENDERING PROFILES ──────────────────────────
// Cada categoria define: renderStyle (como a imagem deve parecer),
// lightingSpec (iluminação exata), fillInstruction (garantia de cobertura total),
// e compositionMap (o que vai em cada painel).
var CATEGORY_RENDER_PROFILES = {
  religioso: {
    renderStyle: 'hyper-realistic digital art, cinematic sacred composition, 8K detail, photorealistic skin and fabric textures, HDR color grading, volumetric lighting with god rays, dramatic chiaroscuro — adapts to selected style: oil painting baroque OR 3D marble sculpture OR stained glass OR mosaic OR watercolor with gold splash',
    lightingSpec: 'golden divine light from above casting long warm rays, deep dramatic shadows on opposite side, warm golden atmosphere, ethereal rim glow around the main subject, volumetric dust particles in light beams',
    fillInstruction: 'Subject fills the scene — background atmosphere extends to all corners with deep color, absolutely no white margins',
    compositionMap: {
      left:   'either a text phrase in elegant script overlaid on atmospheric background, OR supporting figure/detail — fills the scene fully',
      center: 'the primary hero subject (Jesus, lion, cross, etc.) — large, dominant, fills 70% of the scene height, divine light from above',
      right:  'either a text phrase in elegant script overlaid on atmospheric background, OR complementary figure/detail — fills the scene fully'
    },
    negativeExtra: 'stiff frontal pose, flat lighting, cartoon style, cheap holy card style, white background, blank space at edges, empty corners, low contrast, faded colors'
  },
  gold: {
    renderStyle: 'ultra-photorealistic luxury gold art, 8K macro detail, physically-based rendering (PBR), metallic surfaces with real specular highlights and reflections, depth of field, rich dark backgrounds that make gold subjects pop dramatically',
    lightingSpec: 'sharp key light from upper-left creating polished metallic specular, soft fill from right, rim light behind creating separation from deep dark background',
    fillInstruction: 'Subject is large and dominant — fills minimum 70% of frame. Background rich dark tone extends fully to all borders. No white space anywhere',
    compositionMap: {
      left:   'secondary gold element or side view — fills the scene, rich dark background to all borders',
      center: 'hero gold subject — front-facing, large and dominant, centered, deep dark background fills all corners',
      right:  'detail or complementary gold element — fills the scene, deep background to all borders'
    },
    negativeExtra: 'white background, plain background, flat lighting, cheap looking metal, no specular highlights, overexposed, pale colors, empty space at edges'
  },
  floral: {
    renderStyle: 'ultra-detailed floral fine art, 8K resolution, macro lens detail on petals, depth of field with sharp foreground flowers and atmospheric background — adapts to selected style: dark fine art OR macro photo OR watercolor OR gold foil',
    lightingSpec: 'soft directional light from upper-left, subtle back-light making petals glow from within, deep complementary dark background making flowers pop dramatically',
    fillInstruction: 'Flowers and foliage extend to and beyond all four image edges — stems from bottom, petals touching side edges, no white space, no margins, no blank corners',
    compositionMap: {
      left:   'flowers and stems filling the scene — bloom off-center, leaves and petals reaching to all borders',
      center: 'hero bloom — largest flower centered and dominant filling 65% of frame, surrounded by supporting elements',
      right:  'complementary flowers — bloom positioned, foliage extending to all borders, petals falling'
    },
    negativeExtra: 'white background, isolated flower on white, blank space at edges, flat illustration, cartoon, clipped flowers'
  },
  abstrato: {
    renderStyle: 'premium contemporary abstract art, ultra-high resolution 8K, gallery-quality finish, rich textural complexity, layered depth — adapts to selected style: geometric 3D with dramatic lighting OR fluid art OR overlapping botanical leaves OR bold brushstrokes',
    lightingSpec: 'internal light sources creating glow, directional highlights creating texture and depth, rich saturated colors with intentional value contrast',
    fillInstruction: 'Abstract forms, colors and textures fill every millimeter — extends to all four edges and corners, no white space, no blank areas',
    compositionMap: {
      left:   'abstract composition flows from left edge — forms and colors extend to all corners',
      center: 'focal abstract element or object — dominant, centered, fills the scene completely',
      right:  'abstract composition completes rightward — elements flow toward right edge, full coverage'
    },
    negativeExtra: 'white background, blank areas, empty space, margins, accidental marble texture when not requested, flat single color fills with no texture'
  },
  marmore: {
    renderStyle: 'ultra-photorealistic luxury stone, 8K macro detail, physically-based rendering of natural stone, photogrammetry-quality texture, natural stone authenticity with mineral crystalline depth',
    lightingSpec: 'raking directional light from one side to emphasize stone texture, specular highlights on polished areas, shadows in natural stone crevices and veining',
    fillInstruction: 'Stone texture fills entire image edge to edge — veins flow from one edge to the other, no white space, no borders',
    compositionMap: {
      left:   'stone slab continues from left edge — veining flows from left corner toward center',
      center: 'hero feature of the stone — most dramatic vein cluster, centered, stone extends to all four edges',
      right:  'stone continues rightward — veining flows toward right edge and corners'
    },
    negativeExtra: 'white background, plain background, isolated stone on white, plastic appearance, artificial pattern, too-regular veining, flat texture'
  },
  natureza: {
    renderStyle: 'premium botanical editorial photography meets fine art illustration, 8K resolution, rich natural color palette, depth of field, painterly photorealism',
    lightingSpec: 'natural soft diffused daylight from above, gentle shadows on leaves, translucency in leaves with backlight glow, deep complementary natural background tones',
    fillInstruction: 'Botanical elements extend to and beyond all four image edges. Background fills completely to all corners. No white space, no margins',
    compositionMap: {
      left:   'branches and leaves entering from left edge and top, foliage cascades down',
      center: 'focal plant or text — centered with breathing room, botanical framing touching all edges',
      right:  'foliage enters from right and top edges, background fills to all corners'
    },
    negativeExtra: 'white background, blank space at edges, sparse minimal composition, isolated plant on white, flat illustration, clipped leaves'
  },
  lavabo: {
    renderStyle: 'luxury spa boutique-hotel product photography, 8K detail, professional still-life, depth of field, physically-based rendering of glass, ceramic, marble, linen and metal materials',
    lightingSpec: 'warm soft key light from upper-left, secondary fill from right, candle glow creating warm amber pools of light, rich dark background making objects stand out elegantly',
    fillInstruction: 'Objects large and occupy significant frame space. Background fills completely to all borders and corners. No white space, no blank corners',
    compositionMap: {
      left:   'left object arrangement — tall elegant objects filling vertical space, rich background to all borders',
      center: 'hero object grouping — dominant items centered, background fills all corners',
      right:  'right complementary objects — balances left panel, rich background fills all edges'
    },
    negativeExtra: 'white background, blank space, empty corners, cheap materials, plastic appearance, flat lighting, isolated product on white'
  },
  infantil: {
    renderStyle: 'premium children\'s wall art illustration, ultra-detailed, 8K — adapts to selected style: delicate watercolor with soft washes and neutral tones OR Pixar 3D CGI with volume and shine OR clay 3D colorful OR cartoon vibrant. Characters are cute, lovable, with large expressive eyes',
    lightingSpec: 'warm cheerful soft light, no harsh shadows, soft glow around characters, bright inviting colors, sparkle highlights on eyes and objects',
    fillInstruction: 'Rich detailed thematic background fills every corner. Characters and scenic elements occupy all areas. No plain single-color backgrounds, no empty edges',
    compositionMap: {
      left:   'one character or animal — centered in panel, expressive face toward viewer, rich thematic background fills all corners',
      center: 'hero character or main animal — centered and larger, most expressive, rich background fills all corners',
      right:  'third character or complementary animal — centered in panel, cheerful expression, rich thematic background fills all corners'
    },
    negativeExtra: 'white background, plain background, blank space at edges, scary expression, adult face, dark horror themes, flat single-color background, isolated character on white'
  },
  gamer: {
    renderStyle: 'ultra-detailed gaming poster art, 8K, vibrant neon colors on deep black background, cinematic key art quality, strong neon glow effects with bloom lighting, professional esports visual design',
    lightingSpec: 'neon glow from main object casting colored light onto surrounding surfaces, complementary colored rim light from opposite side, pure deep black background with subtle neon gradient',
    fillInstruction: 'Gaming objects large and dominant filling the scene. Neon glow and color gradients fill entire fills to all borders. Deep black background extends to all corners — no white space',
    compositionMap: {
      left:   'gaming object or text — fills the scene, intense neon glow, deep black background to all borders',
      center: 'hero gaming item — centered, dominant, brilliant neon, deep dark fills all corners',
      right:  'gaming object or text — fills the scene, complementary neon, deep background to all corners'
    },
    negativeExtra: 'white background, blank space, empty corners, soft pastel colors, dim lighting, flat illustration, no neon glow'
  },
  cidades: {
    renderStyle: 'cinematic architectural travel photography meets fine art print, 8K resolution, professional urban photography color grading, filmic color palette, editorial travel magazine quality',
    lightingSpec: 'golden hour or blue hour light, city lights glowing against sky, dramatic sky with clouds, ambient atmospheric haze giving depth, reflections in wet streets',
    fillInstruction: 'Cityscape fills every part of canvas — sky extends to top corners, buildings and streets extend to bottom and side edges. No white space, no blank corners',
    compositionMap: {
      left:   'left urban scene — street level or architectural detail, city fills all edges',
      center: 'iconic landmark — centered and monumental, sky and city fill all corners',
      right:  'right urban detail — complementary city scene, city fills all edges'
    },
    negativeExtra: 'white background, blank space, empty corners, illustration style, cartoon, flat lighting with no atmosphere, tourist snapshot quality'
  }
};

function getCategoryRenderProfile() {
  return CATEGORY_RENDER_PROFILES[selCat] || CATEGORY_RENDER_PROFILES['religioso'] || Object.values(CATEGORY_RENDER_PROFILES)[0];
}
function getSystemPrompt() {
  var isContinua = _tipoKit === 'continua';
  return `You are an expert image generation prompt writer for Flow AI (Minimax).

` + PROMPT_RAW_RULE + `

CRITICAL PROMPT RULES — NEVER VIOLATE:
- NEVER mention: frame, canvas, panel, triptych, wall art, painting, artwork, print, poster, picture, illustration, tela, quadro, moldura, painel
- Write prompts as if describing a PHOTOGRAPH or SCENE — not an artwork
- Describe the subject, environment, lighting, colors, mood, textures, render quality
- Use cinematic and photographic language only
- Each prompt: 120–160 words of pure visual description
- All 3 share the same style, palette and lighting

` + (isContinua ?
`Generate 1 prompt for a wide landscape scene (3:1 ratio) that can be split into 3 sections.
Return ONLY valid JSON:
{"kits":[{"nome":"Nome do kit em português","pecas":[{"tag":"PANORAMA","prompt":"..."}]}],"negative":""}` :
`Generate 3 prompts. Each is a completely independent scene with the same visual style.
Separate with ONE blank line. No labels like "Image 1:".
Return ONLY valid JSON:
{"kits":[{"nome":"Nome do kit em português","pecas":[{"tag":"PECA 1","prompt":"..."},{"tag":"PECA 2","prompt":"..."},{"tag":"PECA 3","prompt":"..."}]}],"negative":""}`);
}

function getUserPrompt() {
  var cat   = CONFIG[selCat];
  var ctx   = buildContext();
  var ideia = document.getElementById('ideiaInp').value.trim();
  var prof  = getCategoryRenderProfile();

  var lines = [];
  lines.push('Create 3 image prompts with these visual specifications:');
  lines.push('');
  lines.push('Style: ' + ((prof && prof.renderStyle) || ''));
  lines.push('Lighting: ' + ((prof && prof.lightingSpec) || ''));
  lines.push('Fill rule: ' + ((prof && prof.fillInstruction) || ''));
  lines.push('');
  lines.push('Visual theme and details:');
  lines.push(ctx);
  if (ideia) {
    lines.push('');
    lines.push('Additional direction: ' + ideia);
  }
  lines.push('');
  lines.push('Scene composition:');
  var cm = (prof && prof.compositionMap) || {};
  lines.push('- Image 1: ' + (cm.left   || 'atmospheric scene').replace(/left panel[: ]*/i, ''));
  lines.push('- Image 2: ' + (cm.center || 'hero subject centered').replace(/center panel[: ]*/i, ''));
  lines.push('- Image 3: ' + (cm.right  || 'complementary scene').replace(/right panel[: ]*/i, ''));
  lines.push('');
  lines.push('Write 3 pure visual descriptions. Same style and lighting across all 3. No artwork/frame/canvas references. Return JSON now.');

  return lines.join('\n');
}

// ── NEGATIVE ─────────────────────────────────────────────
function dedupeList(items){var seen={};return items.filter(function(i){var k=String(i||'').trim().toLowerCase();if(!k||seen[k])return false;seen[k]=true;return true;});}
function hasAnyPanelText(){return Object.keys(selOpts).some(function(k){return/frase|texto|nome/i.test(k)&&selOpts[k]&&String(selOpts[k]).trim();});}
function getAutomaticNegativePrompt() {
  var neg = [
    'framed picture on wall','picture frame','canvas in room mockup',
    'artwork hanging on wall','wall decor photo','room interior mockup',
    'rounded corners','phone screen','smartphone','device screen','card border','vignette border',
    'white background','white margin','white border','white mat',
    'blank corners','empty edges','vignette fade to white',
    'low quality','blurry','watermark','jpeg artifacts',
    'subject too small','floating subject',
    'cartoon','anime','flat illustration','clipart',
    'distorted anatomy','extra fingers','deformed face'
  ];
  if (selCat === 'religioso') neg.push('stiff frontal pose','flat spiritual lighting','cheap holy card style');
  if (selCat === 'abstrato')  neg.push('accidental marble texture');
  if (selCat === 'infantil')  neg.push('scary expression','adult face on child','dark horror atmosphere');
  if (selCat === 'marmore')   neg.push('plastic look','too regular artificial pattern');
  if (selCat === 'gamer')     neg.push('soft pastel colors','dim lighting');
  if (hasAnyPanelText())      neg.push('text cut off','illegible font');
  return dedupeList(neg).join(', ');
}
function mergeNegativePrompts(){var parts=[];for(var i=0;i<arguments.length;i++){var v=arguments[i];if(!v)continue;String(v).split(',').forEach(function(p){var c=p.trim();if(c)parts.push(c);});}return dedupeList(parts).join(', ');}


// ── VALIDATION ───────────────────────────────────────────
function hasMeaningfulValue(v){if(Array.isArray(v))return v.length>0;if(v===null||v===undefined)return false;return String(v).trim()!=='';}
function getSelectionSignature(){var idea=document.getElementById('ideiaInp');return JSON.stringify({cat:selCat,opts:selOpts,ideia:idea?idea.value.trim():''});}
function getValidationReport(){
  var report={errors:[],warnings:[],ok:[]};var cat=CONFIG[selCat]||{};var opts=cat.opts||[];var filledCount=0;
  opts.forEach(function(opt){var value=selOpts[opt.id];if(hasMeaningfulValue(value))filledCount++;if(opt.type==='text'&&hasMeaningfulValue(value)&&String(value).trim().length>60)report.errors.push(opt.label+': frase muito longa (max 60 caracteres).');});
  if(filledCount===0)report.errors.push('Escolha pelo menos uma opcao antes de gerar.');
  if(report.errors.length===0&&filledCount<2)report.warnings.push('Poucas opcoes selecionadas. O prompt pode ficar generico.');
  if(report.errors.length===0&&report.warnings.length===0)report.ok.push('Tudo certo.');
  return report;
}

// ── GENERATE PROMPT ───────────────────────────────────────
async function generate(){
  var report=getValidationReport();var signature=getSelectionSignature();
  if(report.errors.length){validationApprovalKey='';renderValidationState(report);return;}
  if(report.warnings.length&&validationApprovalKey!==signature){validationApprovalKey=signature;renderValidationState(report);var btn=document.getElementById('btnGen');if(btn){btn.disabled=false;btn.textContent='Gerar mesmo assim';}return;}
  var btn=document.getElementById('btnGen');btn.disabled=true;btn.textContent='Gerando...';showLoad();
  var sysP=getSystemPrompt();var usrP=getUserPrompt();var autoNeg=getAutomaticNegativePrompt();
  try{
    var res=await fetch('/api/generate',{method:'POST',headers:apiHeaders(),body:JSON.stringify({system_prompt:sysP,user_prompt:usrP})});
    var data=await res.json();
    if(data.error){showErr('Erro: '+data.error);return;}
    data.negative_auto=autoNeg;data.negative=mergeNegativePrompts(autoNeg,data.negative||'');
    renderResults(data);
    var kit=(data.kits||[])[0]||{};_listingNome=kit.nome||'';_listingPrompt=(kit.pecas||[{}])[0].prompt||'';
  }catch(e){showErr('Erro: '+e.message);}
  finally{btn.disabled=false;btn.textContent='Gerar Prompt';}
}

// ── RENDER PROMPT ─────────────────────────────────────────
function renderIdleState(){panelMode='idle';document.getElementById('rpanel').innerHTML='<div class="idle-state"><div class="idle-ico">&#x25C8;</div><div class="idle-t">Pronto para gerar</div><div class="idle-s">Configure as opcoes e clique em Gerar Prompt.</div></div>';}
function showLoad(){panelMode='loading';document.getElementById('rpanel').innerHTML='<div class="loading-box"><div class="spin"></div><div class="spin-t">Gerando prompt...</div></div>';scrollToResultSection();}
function showErr(msg){panelMode='error';document.getElementById('rpanel').innerHTML='<div class="err">'+esc(msg)+'</div>';var btn=document.getElementById('btnGen');btn.disabled=false;btn.textContent='Gerar Prompt';scrollToResultSection();}
function scrollToResultSection(){var el=document.getElementById('resultCard');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
function resetValidationApproval(){validationApprovalKey='';var btn=document.getElementById('btnGen');if(btn&&!btn.disabled)btn.textContent='Gerar Prompt';}
function renderValidationState(report){panelMode='validation';var hasErr=report.errors&&report.errors.length;var items=hasErr?report.errors:report.warnings;var p=document.getElementById('rpanel');p.innerHTML='<div class="kit"><div class="kit-top"><div class="kit-nome">'+(hasErr?'Corrija antes de gerar':'Revisao rapida')+'</div></div><div class="kit-body">'+items.map(function(i){return'• '+i;}).join('\n')+'</div></div>';scrollToResultSection();}

function renderResults(data){
  panelMode='results';var p=document.getElementById('rpanel');p.innerHTML='';scrollToResultSection();
  var kit=(data.kits||[])[0];if(!kit){showErr('Nenhum kit retornado.');return;}
  var pecas=kit.pecas||[];

  // Suporte tanto ao formato novo (1 prompt panorâmico) quanto ao legado (3 prompts)
  var isPanorama = pecas.length === 1;
  var kitPrompt  = isPanorama
    ? (pecas[0].prompt||'')
    : pecas.map(function(pc){return pc.prompt||'';}).join('\n\n');

  _pecasPrompts = isPanorama ? [kitPrompt] : pecas.map(function(pc){return pc.prompt||'';});
  _listingNome  = kit.nome||'';
  _listingPrompt= kitPrompt;

  // Nome do kit
  var nomeEl=document.createElement('div');
  nomeEl.style.cssText='font-size:13px;font-weight:600;color:var(--gold-l);margin-bottom:10px';
  nomeEl.textContent=kit.nome||'Kit gerado';p.appendChild(nomeEl);

  // Card do prompt
  var card=document.createElement('div');
  card.style.cssText='background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:12px;margin-bottom:10px';
  var topRow=document.createElement('div');
  topRow.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px';
  var lbl=document.createElement('div');
  lbl.style.cssText='font-size:10px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.06em';
  lbl.textContent = isPanorama ? 'Prompt panorâmico — cole no Flow AI' : '3 prompts separados por linha em branco';
  var btnRow=document.createElement('div');btnRow.style.cssText='display:flex;gap:5px';
  var cpBtn=document.createElement('button');cpBtn.className='btn-cp';cpBtn.style.cssText='font-size:10px;padding:3px 10px';cpBtn.textContent='Copiar';
  cpBtn.onclick=function(){navigator.clipboard.writeText(kitPrompt).then(function(){cpBtn.textContent='✓';setTimeout(function(){cpBtn.textContent='Copiar';},1500);});};
  var extBtn=document.createElement('button');extBtn.className='btn-flow';extBtn.style.cssText='font-size:10px;padding:3px 10px';extBtn.textContent='→ Extensão';
  extBtn.onclick=function(){enviarPromptsExtensao(pecas);};
  btnRow.appendChild(cpBtn);btnRow.appendChild(extBtn);
  topRow.appendChild(lbl);topRow.appendChild(btnRow);
  var body=document.createElement('div');
  body.style.cssText='font-size:11px;color:var(--t2);line-height:1.6;white-space:pre-wrap;max-height:220px;overflow-y:auto';
  body.textContent=kitPrompt;
  card.appendChild(topRow);card.appendChild(body);p.appendChild(card);

  // Negative
  var finalNeg=mergeNegativePrompts(data.negative_auto||'',data.negative||'');
  if(finalNeg){
    var nb=document.createElement('div');nb.className='neg';
    var nlbl=document.createElement('div');nlbl.className='neg-lbl';nlbl.textContent='Negative Prompt';
    var ncpBtn=document.createElement('button');ncpBtn.className='btn-cp';ncpBtn.style.cssText='font-size:10px;padding:2px 8px;margin-left:8px';ncpBtn.textContent='Copiar';
    ncpBtn.onclick=function(){navigator.clipboard.writeText(finalNeg).then(function(){ncpBtn.textContent='✓';setTimeout(function(){ncpBtn.textContent='Copiar';},1500);});};
    nlbl.appendChild(ncpBtn);var ntxt=document.createElement('div');ntxt.className='neg-txt';ntxt.textContent=finalNeg;
    nb.appendChild(nlbl);nb.appendChild(ntxt);p.appendChild(nb);
  }
  if(data.cost_usd!=null){
    var costEl=document.createElement('div');
    costEl.style.cssText='font-size:10px;color:var(--t3);margin-top:6px;text-align:right';
    costEl.textContent='Claude: $'+data.cost_usd.toFixed(5)+' (R$ '+data.cost_brl.toFixed(4)+')';
    p.appendChild(costEl);
  }
  setTimeout(loadHistory,600);
}

function enviarPromptsExtensao(pecas){
  var prompts=pecas.map(function(pc){return pc.prompt||'';});
  window.postMessage({type:'quadroai_set_prompts',prompts:prompts},'*');
  navigator.clipboard.writeText(prompts.join('\n\n')).then(function(){
    alert('Prompts enviados para a extensão e copiados!\nCada prompt separado por 1 linha em branco.');
  });
}

// ── HISTORY ──────────────────────────────────────────────
function loadHistory(){fetch('/api/history').then(function(r){return r.json();}).then(function(d){renderHistory(d);}).catch(function(){});}
function renderHistory(entries){
  var list=document.getElementById('historyList');if(!list)return;
  if(!entries||!entries.length){list.innerHTML='<div class="history-empty">Nenhum prompt ainda.</div>';return;}
  list.innerHTML='';
  entries.forEach(function(entry,idx){
    var item=document.createElement('div');item.className='hist-item';
    var body=document.createElement('div');body.className='hist-item-body';
    body.innerHTML='<div class="hist-nome">'+esc(entry.nome||'Sem nome')+'</div><div class="hist-data">'+esc(entry.data||'')+'</div><div class="hist-preview">'+esc((entry.prompt||'').substring(0,80)+'...')+'</div>';
    body.onclick=(function(e){return function(){loadHistoryItem(e);};})(entry);
    var del=document.createElement('button');del.className='hist-del';del.textContent='x';del.onclick=(function(i){return function(ev){ev.stopPropagation();deleteHistoryItem(i);};})(idx);
    item.appendChild(body);item.appendChild(del);list.appendChild(item);
  });
}
function loadHistoryItem(entry){if(!entry||!entry.prompt)return;renderResults({kits:[{nome:entry.nome,pecas:[{tag:'PROMPT UNICO',prompt:entry.prompt}]}],negative:entry.negative||'',negative_auto:getAutomaticNegativePrompt()});}
function deleteHistoryItem(idx){fetch('/api/history/'+idx,{method:'DELETE'}).then(function(){loadHistory();});}
function clearHistory(){if(!confirm('Limpar historico?'))return;fetch('/api/history',{method:'DELETE'}).then(function(){loadHistory();});}

// ── KIT UPLOAD ────────────────────────────────────────────
function handleKitUpload(input){
  var file=input.files&&input.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var dataUrl=ev.target.result;_kitB64=dataUrl.split(',')[1]||'';_kitNome=file.name;
    var prev=document.getElementById('kitPreviewWrap');var img=document.getElementById('kitPreviewImg');var lbl=document.getElementById('kitNomeLabel');var drop=document.getElementById('kitDropArea');
    img.src=dataUrl;prev.style.display='block';drop.style.display='none';if(lbl)lbl.textContent=file.name;
  };reader.readAsDataURL(file);
}
function limparKit(){_kitB64='';_kitNome='';document.getElementById('kitPreviewWrap').style.display='none';document.getElementById('kitDropArea').style.display='flex';document.getElementById('kitUploadInput').value='';}

// ── MOCKUPS ───────────────────────────────────────────────
function filtrarMockups(filtro){
  _mockupFiltro=filtro;
  document.getElementById('btnTodosMockups').classList.toggle('active',filtro==='todos');
  document.getElementById('btnFavMockups').classList.toggle('active',filtro==='favoritos');
  loadMockupsLibrary();
}
async function loadMockupsLibrary(){
  try{var res=await fetch('/api/mockups');var mockups=await res.json();renderMockupsGrid(mockups);}catch(e){}
}
function updateMockupSelUI() {
  var n = _mockupSelecionados.size;
  var countEl  = document.getElementById('mockupSelCount');
  var deselBtn = document.getElementById('btnDeselectAll');
  var subtitle = document.getElementById('gerarSubtitle');
  var gerarBtn = document.getElementById('btnGerarAnuncios');
  if (countEl)  countEl.textContent = n > 0 ? n + ' selecionado' + (n > 1 ? 's' : '') : '';
  if (deselBtn) deselBtn.style.display = n > 0 ? '' : 'none';
  if (subtitle) {
    if (n === 0) subtitle.textContent = 'Selecione mockup(s) e clique em gerar. Resultado em 2000x2000px.';
    else if (n === 1) subtitle.textContent = '1 mockup selecionado — será gerado 1 anúncio.';
    else subtitle.textContent = n + ' mockups selecionados — serão gerados ' + n + ' anúncios em sequência.';
  }
  if (gerarBtn && !gerarBtn.disabled)
    gerarBtn.textContent = n > 1 ? 'Gerar ' + n + ' Anúncios' : 'Gerar Anúncio';
  _mockupSelecionadoId = _mockupSelecionados.size === 1 ? [..._mockupSelecionados][0] : '';
}

function deselectAllMockups() {
  _mockupSelecionados.clear();
  _mockupSelecionadoId = '';
  updateMockupSelUI();
  loadMockupsLibrary();
}

function renderMockupsGrid(mockups) {
  var grid = document.getElementById('mockupsGrid'); if (!grid) return;
  var filtered = _mockupFiltro === 'favoritos' ? mockups.filter(function(m){ return m.favorito; }) : mockups;
  if (!filtered.length) {
    grid.innerHTML = '<div class="history-empty">' + (_mockupFiltro==='favoritos' ? 'Nenhum favorito.' : 'Nenhum mockup. Clique em + Adicionar.') + '</div>';
    return;
  }
  grid.innerHTML = '';
  filtered.forEach(function(m) {
    var isSel = _mockupSelecionados.has(m.id);
    var card = document.createElement('div');
    card.className = 'mockup-card-v2' + (isSel ? ' selected' : '');
    card.dataset.id = m.id;
    card.innerHTML =
      '<div class="mockup-thumb-wrap">' +
        '<img src="' + m.url + '" alt="' + esc(m.nome) + '" loading="lazy">' +
        (isSel ? '<div class="mockup-sel-badge">&#10003;</div>' : '') +
        '<div class="mockup-card-actions-v2">' +
          '<button class="mockup-fav-btn-v2' + (m.favorito ? ' fav' : '') + '" title="Favorito">' + (m.favorito ? '&#9733;' : '&#9734;') + '</button>' +
          '<button class="mockup-del-btn-v2" title="Remover">&#x2715;</button>' +
        '</div>' +
      '</div>' +
      '<div class="mockup-nome-v2">' + esc(m.nome) + '</div>';
    card.querySelector('.mockup-fav-btn-v2').addEventListener('click', (function(id){ return function(e){ e.stopPropagation(); toggleFavMockup(id, e); }; })(m.id));
    card.querySelector('.mockup-del-btn-v2').addEventListener('click', (function(id){ return function(e){ e.stopPropagation(); deletarMockup(id, e); }; })(m.id));
    card.addEventListener('click', (function(mid, mfilt){ return function() {
      if (_mockupSelecionados.has(mid)) _mockupSelecionados.delete(mid);
      else _mockupSelecionados.add(mid);
      updateMockupSelUI();
      renderMockupsGrid(mfilt);
    }; })(m.id, filtered));
    grid.appendChild(card);
  });
}
async function adicionarMockup(input){
  var file=input.files&&input.files[0];if(!file)return;
  var reader=new FileReader();reader.onload=async function(ev){
    var b64=ev.target.result.split(',')[1]||'';
    var nome=file.name.replace(/\.[^.]+$/,'')||'Mockup';
    try{
      var res=await fetch('/api/mockups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image_b64:b64,nome:nome,mime:file.type})});
      var data=await res.json();if(data.error){alert(data.error);return;}loadMockupsLibrary();
    }catch(e){alert('Erro: '+e.message);}
  };reader.readAsDataURL(file);input.value='';
}
async function toggleFavMockup(id,e){if(e)e.stopPropagation();await fetch('/api/mockups/'+id+'/favorito',{method:'POST'});loadMockupsLibrary();}
async function deletarMockup(id,e){if(e)e.stopPropagation();if(id===_mockupSelecionadoId)_mockupSelecionadoId='';await fetch('/api/mockups/'+id,{method:'DELETE'});loadMockupsLibrary();}

// ── STATUS BAR ────────────────────────────────────────────
function setAnuncioStatus(msg, tipo) {
  var el = document.getElementById('anuncioStatusBar'); if (!el) return;
  el.textContent = msg; el.className = 'anuncio-status-v2 ' + tipo; el.style.display = 'block';
}
function hideAnuncioStatus() {
  var el = document.getElementById('anuncioStatusBar'); if (el) el.style.display = 'none';
}

// ── GERAR ANÚNCIO (single e batch) ───────────────────────
function setBatchProgress(done, total, label) {
  var wrap  = document.getElementById('batchProgressWrap');
  var bar   = document.getElementById('batchProgressBar');
  var lbl   = document.getElementById('batchProgressLabel');
  var count = document.getElementById('batchProgressCount');
  if (!wrap) return;
  wrap.style.display = '';
  if (bar)   bar.style.width = (total > 0 ? Math.round(done / total * 100) : 0) + '%';
  if (lbl)   lbl.textContent = label || 'Gerando...';
  if (count) count.textContent = done + ' / ' + total;
}

function hideBatchProgress() {
  var wrap = document.getElementById('batchProgressWrap');
  if (wrap) wrap.style.display = 'none';
  var log = document.getElementById('batchLogList');
  if (log) log.innerHTML = '';
}

function addBatchLog(text, isErr) {
  var log = document.getElementById('batchLogList'); if (!log) return;
  var row = document.createElement('div');
  row.style.cssText = 'font-size:10px;color:' + (isErr ? '#e88' : 'var(--t2)') + ';padding:2px 0;border-bottom:0.5px solid var(--bd)';
  row.textContent = text;
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

async function gerarAnuncio() {
  var count = _pecasAnuncio.filter(Boolean).length;
  if (count < 3) { setAnuncioStatus('Adicione as 3 peças antes de gerar (' + count + '/3 preenchidas).', 'err'); return; }

  var ids = [..._mockupSelecionados];
  if (!ids.length) { setAnuncioStatus('Selecione pelo menos 1 mockup (passo 2).', 'err'); return; }

  var btn = document.getElementById('btnGerarAnuncios');
  btn.disabled = true;
  hideBatchProgress();

  // ── BATCH (2+ mockups) ────────────────────────────────
  if (ids.length > 1) {
    btn.textContent = 'Gerando 0 / ' + ids.length + '...';
    setAnuncioStatus('Iniciando geração de ' + ids.length + ' anúncios...', 'loading');
    setBatchProgress(0, ids.length, 'Aguardando servidor...');

    var ok = 0; var errs = 0;
    try {
      var res = await fetch('/api/generate-anuncio-batch', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          pecas_b64: _pecasAnuncio.map(function(p){ return p ? p.b64 : null; }),
          mockup_ids: ids,
          detect_color: 'auto'
        })
      });
      if (!res.ok || !res.body) { throw new Error('Erro na resposta do servidor.'); }

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';

      while (true) {
        var _ref = await reader.read();
        var done = _ref.done; var value = _ref.value;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop(); // guarda linha incompleta
        for (var li = 0; li < lines.length; li++) {
          var line = lines[li].trim(); if (!line) continue;
          try {
            var item = JSON.parse(line);
            var done2 = item.idx + 1;
            var total = item.total;
            if (item.ok) {
              ok++;
              adicionarNaGaleria(item.image_b64, item.mockup_nome || 'Anuncio');
              addBatchLog('✓ ' + (item.mockup_nome || item.mockup_id), false);
            } else {
              errs++;
              addBatchLog('✗ ' + (item.mockup_nome || item.mockup_id) + ': ' + (item.error || 'Erro'), true);
            }
            setBatchProgress(done2, total, 'Processando mockup ' + done2 + ' de ' + total + '...');
            btn.textContent = 'Gerando ' + done2 + ' / ' + total + '...';
          } catch(pe) {}
        }
      }

      if (ok === ids.length) {
        setAnuncioStatus(ok + ' anúncio' + (ok > 1 ? 's' : '') + ' gerado' + (ok > 1 ? 's' : '') + ' com sucesso!', 'ok');
        setBatchProgress(ids.length, ids.length, 'Concluído!');
      } else {
        setAnuncioStatus(ok + ' gerado' + (ok !== 1 ? 's' : '') + ', ' + errs + ' erro' + (errs !== 1 ? 's' : '') + '.', errs > 0 ? 'err' : 'ok');
      }
    } catch(e) {
      setAnuncioStatus('Erro: ' + e.message, 'err');
    } finally {
      btn.disabled = false;
      updateMockupSelUI();
    }
    return;
  }

  // ── SINGLE (1 mockup — comportamento original) ────────
  btn.textContent = 'Gerando...';
  setAnuncioStatus('Gerando anúncio... aguarde.', 'loading');
  try {
    var res2 = await fetch('/api/generate-anuncio-single', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        pecas_b64: _pecasAnuncio.map(function(p){ return p ? p.b64 : null; }),
        mockup_id: ids[0],
        detect_color: 'auto'
      })
    });
    var data = await res2.json();
    if (data.error) { setAnuncioStatus(data.error, 'err'); return; }
    if (data.ok && data.image_b64) {
      setAnuncioStatus('Anúncio gerado com sucesso!', 'ok');
      adicionarNaGaleria(data.image_b64, data.mockup_nome || 'Anuncio');
    }
  } catch(e) {
    setAnuncioStatus('Erro: ' + e.message, 'err');
  } finally {
    btn.disabled = false;
    updateMockupSelUI();
  }
}

function adicionarNaGaleria(img_b64,nome){
  var id='gal'+Date.now();
  _galeriaItems.push({id:id,image_b64:img_b64,nome:nome});
  renderGaleria();
}

function limparGaleria(){_galeriaItems=[];renderGaleria();}

function renderGaleria(){
  var grid=document.getElementById('galeriaGrid');if(!grid)return;
  if(!_galeriaItems.length){grid.innerHTML='<div class="idle-state" style="grid-column:1/-1;min-height:140px"><div class="idle-ico">&#x1F3E0;</div><div class="idle-t">Nenhum anuncio ainda</div><div class="idle-s">Gere um anuncio para ele aparecer aqui.</div></div>';return;}
  grid.innerHTML='';
  _galeriaItems.forEach(function(item){
    var imgSrc='data:image/png;base64,'+item.image_b64;
    var card=document.createElement('div');card.className='galeria-card';
    card.innerHTML=
      '<img src="'+imgSrc+'" alt="'+esc(item.nome)+'">'+
      '<div class="galeria-card-nome">'+esc(item.nome)+'</div>'+
      '<div class="galeria-card-actions">'+
        '<a href="'+imgSrc+'" download="'+esc(item.nome)+'.png" class="mini-btn" style="text-decoration:none;display:inline-flex;align-items:center">Baixar</a>'+
        '<button class="mini-btn" onclick="abrirMoverModal(\''+item.id+'\')">Salvar em pasta</button>'+
        '<button class="mini-btn" onclick="removerDaGaleria(\''+item.id+'\')">x</button>'+
      '</div>';
    grid.appendChild(card);
  });
}

function removerDaGaleria(id){_galeriaItems=_galeriaItems.filter(function(i){return i.id!==id;});renderGaleria();}

// ── MOVER PARA PASTA ─────────────────────────────────────
function abrirMoverModal(imgId){
  _moverImgId=imgId;
  var modal=document.getElementById('moverModal');
  var lista=document.getElementById('moverPastaLista');
  modal.style.display='flex';lista.innerHTML='<div style="font-size:12px;color:var(--t3)">Carregando pastas...</div>';
  fetch('/api/pastas').then(function(r){return r.json();}).then(function(pastas){
    if(!pastas.length){lista.innerHTML='<div style="font-size:12px;color:var(--t3)">Nenhuma pasta criada ainda.</div>';return;}
    lista.innerHTML='';
    pastas.forEach(function(p){
      var btn=document.createElement('button');btn.className='mini-btn';btn.style.cssText='width:100%;text-align:left;justify-content:flex-start;padding:8px 12px;font-size:12px';
      btn.textContent=p.nome;btn.onclick=function(){salvarNaPasta(p.id);};lista.appendChild(btn);
    });
  }).catch(function(){lista.innerHTML='<div style="font-size:12px;color:#e88">Erro ao carregar pastas.</div>';});
}
function fecharMoverModal(){document.getElementById('moverModal').style.display='none';_moverImgId='';}

async function salvarNaPasta(pastaId){
  var item=_galeriaItems.find(function(i){return i.id===_moverImgId;});if(!item)return;
  try{
    var res=await fetch('/api/pastas/'+pastaId+'/imagens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image_b64:item.image_b64,nome:item.nome})});
    var data=await res.json();
    if(data.error){alert(data.error);return;}
    fecharMoverModal();
    // Remover da galeria após salvar
    removerDaGaleria(_moverImgId);
    setAnuncioStatus('Imagem salva na pasta com sucesso!','ok');
  }catch(e){alert('Erro: '+e.message);}
}

// ── LISTING ───────────────────────────────────────────────
async function gerarListing(){
  var btn=document.getElementById('btnGerarListing');var panel=document.getElementById('listingPanel');
  btn.disabled=true;panel.innerHTML='<div class="loading-box"><div class="spin"></div><div class="spin-t">Gerando titulos e descricao...</div></div>';
  document.getElementById('listingCard').scrollIntoView({behavior:'smooth',block:'start'});
  try{
    var res=await fetch('/api/generate-listing',{method:'POST',headers:apiHeaders(),body:JSON.stringify({kit_nome:_listingNome||_kitNome||'Kit de quadros',kit_prompt:_listingPrompt})});
    var data=await res.json();
    if(data.error){panel.innerHTML='<div class="img-status-bar err">'+esc(data.error)+'</div>';btn.disabled=false;return;}
    var titulos=data.titulos||[];var desc=data.descricao||'';
    panel.innerHTML='';
    var tLbl=document.createElement('div');tLbl.className='listing-desc-label';tLbl.textContent='Titulos (88-95 chars)';panel.appendChild(tLbl);
    var tWrap=document.createElement('div');tWrap.className='listing-titulos';
    titulos.forEach(function(titulo,i){
      var row=document.createElement('div');row.className='titulo-option';
      var num=document.createElement('div');num.className='titulo-num';num.textContent=(i+1)+'';
      var txt=document.createElement('div');txt.className='titulo-text';txt.textContent=titulo;
      var chars=document.createElement('div');chars.className='titulo-chars';var n=titulo.length;chars.textContent=n+'/95';chars.style.color=n>95?'#ff9090':(n>85?'var(--gold-l)':'var(--t3)');
      var cpBtn=document.createElement('button');cpBtn.className='titulo-cp';cpBtn.textContent='Copiar';
      cpBtn.onclick=(function(t,b){return function(){navigator.clipboard.writeText(t).then(function(){b.textContent='Copiado';b.classList.add('ok');setTimeout(function(){b.textContent='Copiar';b.classList.remove('ok');},2000);});};})(titulo,cpBtn);
      row.appendChild(num);row.appendChild(txt);row.appendChild(chars);row.appendChild(cpBtn);tWrap.appendChild(row);
    });
    panel.appendChild(tWrap);
    var dLbl=document.createElement('div');dLbl.className='listing-desc-label';dLbl.style.marginTop='14px';dLbl.textContent='Descricao completa';panel.appendChild(dLbl);
    var dBox=document.createElement('div');dBox.className='listing-desc-box';dBox.textContent=desc;panel.appendChild(dBox);
    var dActs=document.createElement('div');dActs.className='listing-desc-actions';
    var cpDesc=document.createElement('button');cpDesc.className='img-gen-btn';cpDesc.textContent='Copiar descricao';
    cpDesc.onclick=function(){navigator.clipboard.writeText(desc).then(function(){cpDesc.textContent='Copiado!';setTimeout(function(){cpDesc.textContent='Copiar descricao';},2500);});};
    var reBtn=document.createElement('button');reBtn.className='mini-btn';reBtn.textContent='Gerar novamente';reBtn.onclick=function(){gerarListing();};
    // Salvar em pasta botão
    var spBtn=document.createElement('button');spBtn.className='mini-btn';spBtn.textContent='Salvar em pasta';
    spBtn.onclick=function(){abrirMoverModalTexto(titulos,desc);};
    dActs.appendChild(cpDesc);dActs.appendChild(reBtn);dActs.appendChild(spBtn);panel.appendChild(dActs);
  }catch(e){panel.innerHTML='<div class="img-status-bar err">Erro: '+esc(e.message)+'</div>';}
  finally{btn.disabled=false;}
}

function abrirMoverModalTexto(titulos,desc){
  var modal=document.getElementById('moverModal');var lista=document.getElementById('moverPastaLista');
  _moverImgId='__texto__';modal.style.display='flex';
  lista.innerHTML='<div style="font-size:11px;color:var(--t3);margin-bottom:6px">Escolha a pasta para salvar o titulo e descricao:</div>';
  fetch('/api/pastas').then(function(r){return r.json();}).then(function(pastas){
    if(!pastas.length){lista.innerHTML='<div style="font-size:12px;color:var(--t3)">Nenhuma pasta criada ainda.</div>';return;}
    var frag=document.createDocumentFragment();
    pastas.forEach(function(p){
      var btn=document.createElement('button');btn.className='mini-btn';btn.style.cssText='width:100%;text-align:left;justify-content:flex-start;padding:8px 12px;font-size:12px';
      btn.textContent=p.nome;btn.onclick=function(){salvarTextoNaPasta(p.id,titulos[0]||'',desc);};frag.appendChild(btn);
    });lista.appendChild(frag);
  });
}

async function salvarTextoNaPasta(pastaId,titulo,descricao){
  try{
    await fetch('/api/pastas/'+pastaId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({titulo:titulo,descricao:descricao})});
    fecharMoverModal();setAnuncioStatus('Titulo e descricao salvos na pasta!','ok');
    loadPastas();
  }catch(e){alert('Erro: '+e.message);}
}

// ══════════════════════════════════════════════════════════
// ABA 3 — PASTAS
// ══════════════════════════════════════════════════════════
async function loadPastas(){
  try{var res=await fetch('/api/pastas');var pastas=await res.json();renderPastas(pastas);}catch(e){}
}

async function criarPasta(){
  var nome=prompt('Nome da pasta:','Nova Pasta');if(!nome)return;
  try{var res=await fetch('/api/pastas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:nome.trim()})});await res.json();loadPastas();}catch(e){alert('Erro: '+e.message);}
}

function renderPastas(pastas){
  var lista=document.getElementById('pastasLista');if(!lista)return;
  if(!pastas.length){lista.innerHTML='<div class="history-empty">Nenhuma pasta ainda. Clique em + Nova Pasta.</div>';return;}
  lista.innerHTML='';
  pastas.forEach(function(p){
    var card=document.createElement('div');card.className='pasta-card';
    var header=document.createElement('div');header.className='pasta-header';
    var nomeEl=document.createElement('div');nomeEl.className='pasta-nome';nomeEl.textContent=p.nome;
    var renBtn=document.createElement('button');renBtn.className='mini-btn';renBtn.textContent='Renomear';renBtn.onclick=(function(pid,pnome){return function(){var n=prompt('Novo nome:',pnome);if(n)renomearPasta(pid,n.trim());};})(p.id,p.nome);
    var dlBtn=document.createElement('button');dlBtn.className='mini-btn';dlBtn.textContent='Baixar ZIP';dlBtn.onclick=(function(pid){return function(){window.location.href='/api/pastas/'+pid+'/download';};})(p.id);
    var delBtn=document.createElement('button');delBtn.className='mini-btn';delBtn.style.color='#e88';delBtn.textContent='Deletar';delBtn.onclick=(function(pid){return function(){if(confirm('Deletar pasta?'))deletarPasta(pid);};})(p.id);
    header.appendChild(nomeEl);header.appendChild(renBtn);header.appendChild(dlBtn);header.appendChild(delBtn);card.appendChild(header);

    // Titulo e descricao
    if(p.titulo||p.descricao){
      var txtBlock=document.createElement('div');txtBlock.className='pasta-txt-block';
      if(p.titulo){var tEl=document.createElement('div');tEl.className='pasta-titulo-label';tEl.textContent='Titulo: '+p.titulo;txtBlock.appendChild(tEl);}
      if(p.descricao){var dEl=document.createElement('div');dEl.className='pasta-desc-preview';dEl.textContent=p.descricao.substring(0,120)+'...';txtBlock.appendChild(dEl);}
      card.appendChild(txtBlock);
    }

    // Imagens
    var imgs=p.imagens||[];
    if(imgs.length){
      var igrid=document.createElement('div');igrid.className='pasta-imgs-grid';
      imgs.forEach(function(img){
        var icard=document.createElement('div');icard.className='pasta-img-card';
        icard.innerHTML='<img src="'+img.url+'" alt="'+esc(img.nome)+'"><div class="pasta-img-nome">'+esc(img.nome)+'</div><div class="pasta-img-actions"><a href="'+img.url+'" download="'+esc(img.nome)+'.png" class="mini-btn" style="text-decoration:none;font-size:10px">Baixar</a><button class="mini-btn" style="font-size:10px" onclick="removerImagemDaPasta(\''+p.id+'\',\''+img.id+'\')">x</button></div>';
        igrid.appendChild(icard);
      });
      card.appendChild(igrid);
    } else {
      var empty=document.createElement('div');empty.style.cssText='font-size:11px;color:var(--t3);padding:10px 0';empty.textContent='Nenhuma imagem nesta pasta.';card.appendChild(empty);
    }
    lista.appendChild(card);
  });
}

async function renomearPasta(pid,nome){try{await fetch('/api/pastas/'+pid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:nome})});loadPastas();}catch(e){alert('Erro: '+e.message);}}
async function deletarPasta(pid){try{await fetch('/api/pastas/'+pid,{method:'DELETE'});loadPastas();}catch(e){alert('Erro: '+e.message);}}
async function removerImagemDaPasta(pid,iid){if(!confirm('Remover imagem?'))return;try{await fetch('/api/pastas/'+pid+'/imagens/'+iid,{method:'DELETE'});loadPastas();}catch(e){alert('Erro: '+e.message);}}

// ══════════════════════════════════════════════════════════
// EDITOR DE MOLDURAS
// ══════════════════════════════════════════════════════════
var _molduraState={mockupId:'',mockupUrl:'',pontos:[],imgNatural:null,escala:1};
var MOLDURA_LABELS=[['Esq sup-esq','Esq sup-dir','Esq inf-dir','Esq inf-esq'],['Ctr sup-esq','Ctr sup-dir','Ctr inf-dir','Ctr inf-esq'],['Dir sup-esq','Dir sup-dir','Dir inf-dir','Dir inf-esq']];
var MOLDURA_CORES=['#49cd7c','#d8a54a','#4ea2ff'];

function abrirEditorMolduras(mockupId,mockupUrl,moldurasSalvas){
  _molduraState.mockupId=mockupId;_molduraState.mockupUrl=mockupUrl;_molduraState.pontos=[];
  if(moldurasSalvas&&moldurasSalvas.length===3){moldurasSalvas.forEach(function(m){_molduraState.pontos.push({x:m.tl.x,y:m.tl.y});_molduraState.pontos.push({x:m.tr.x,y:m.tr.y});_molduraState.pontos.push({x:m.br.x,y:m.br.y});_molduraState.pontos.push({x:m.bl.x,y:m.bl.y});});}
  document.getElementById('molduraModal').style.display='flex';
  var img=new Image();img.crossOrigin='anonymous';img.onload=function(){_molduraState.imgNatural=img;redrawMolduraCanvas();atualizarInstrucao();};img.src=mockupUrl+'?t='+Date.now();
}
function fecharEditorMolduras(){document.getElementById('molduraModal').style.display='none';_molduraState.imgNatural=null;}
function resetarMolduras(){_molduraState.pontos=[];redrawMolduraCanvas();atualizarInstrucao();}
function desfazerUltimoPonto(){if(_molduraState.pontos.length>0){_molduraState.pontos.pop();redrawMolduraCanvas();atualizarInstrucao();}}
function atualizarInstrucao(){
  var n=_molduraState.pontos.length;var btn=document.getElementById('btnSalvarMolduras');var lbl=document.getElementById('molduraInstrucao');
  if(n>=12){lbl.textContent='Todas as molduras mapeadas! Clique em Salvar.';lbl.style.color='#7ec893';btn.disabled=false;}
  else{var m=Math.floor(n/4);var c=n%4;lbl.textContent=(m+1)+'/3 — '+MOLDURA_LABELS[m][c];lbl.style.color=MOLDURA_CORES[m];btn.disabled=true;}
}
function redrawMolduraCanvas(){
  var canvas=document.getElementById('molduraCanvas');var wrap=canvas.parentElement;var img=_molduraState.imgNatural;if(!img)return;
  var maxW=wrap.clientWidth||700;var maxH=Math.min(window.innerHeight*0.55,520);var escala=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight,1);
  canvas.width=Math.round(img.naturalWidth*escala);canvas.height=Math.round(img.naturalHeight*escala);_molduraState.escala=escala;
  var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  for(var m=0;m<3;m++){var base=m*4;var pts=_molduraState.pontos.slice(base,base+4);if(!pts.length)continue;var cor=MOLDURA_CORES[m];
    if(pts.length===4){ctx.beginPath();ctx.moveTo(pts[0].x*escala,pts[0].y*escala);for(var p=1;p<4;p++)ctx.lineTo(pts[p].x*escala,pts[p].y*escala);ctx.closePath();ctx.strokeStyle=cor;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=cor+'22';ctx.fill();}
    pts.forEach(function(pt,pi){ctx.beginPath();ctx.arc(pt.x*escala,pt.y*escala,7,0,Math.PI*2);ctx.fillStyle=cor;ctx.fill();ctx.fillStyle='#000';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(pi+1,pt.x*escala,pt.y*escala);});
  }
  var n=_molduraState.pontos.length;if(n<12){var mc=Math.floor(n/4);ctx.strokeStyle=MOLDURA_CORES[mc];ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.strokeRect(2,2,canvas.width-4,canvas.height-4);ctx.setLineDash([]);}
}
async function salvarMolduras(){
  var pontos=_molduraState.pontos;if(pontos.length<12)return;
  var molduras=[];for(var m=0;m<3;m++){var b=m*4;molduras.push({tl:pontos[b],tr:pontos[b+1],br:pontos[b+2],bl:pontos[b+3]});}
  var btn=document.getElementById('btnSalvarMolduras');btn.disabled=true;btn.textContent='Salvando...';
  try{var res=await fetch('/api/mockups/'+_molduraState.mockupId+'/molduras',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({molduras:molduras})});var data=await res.json();if(data.ok){btn.textContent='Salvo!';setTimeout(function(){fecharEditorMolduras();loadMockupsLibrary();btn.textContent='Salvar molduras';btn.disabled=false;},800);}else{alert('Erro: '+(data.error||''));btn.disabled=false;btn.textContent='Salvar molduras';}}catch(e){alert('Erro: '+e.message);btn.disabled=false;btn.textContent='Salvar molduras';}
}

// ── UTILS ────────────────────────────────────────────────
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
