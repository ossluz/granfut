/* ════════════════════════════════════════════════════
   GranFut · squad.js v2 — Elenco & Campo Tático
   Formação clicável → picker flutuante
   Campo SVG dinâmico com jogadores reais
   Instalação robusta (sobrepõe qualquer versão anterior)
   Saieso Seraos Edition
   ════════════════════════════════════════════════════ */
'use strict';

/* ════ FORMAÇÕES ════════════════════════════════════ */
const SQUAD_FORMS = {
  '4-3-3':   { desc:'Ofensivo equilibrado',   lines:[['ATA','ATA','ATA'],['MEI','VOL','MEI'],['LAT','ZAG','ZAG','LAT'],['GOL']] },
  '4-4-2':   { desc:'Clássico e sólido',      lines:[['ATA','ATA'],['MEI','MEI','MEI','MEI'],['LAT','ZAG','ZAG','LAT'],['GOL']] },
  '4-2-3-1': { desc:'Controle do meio',       lines:[['ATA'],['MEI','MEI','MEI'],['VOL','VOL'],['LAT','ZAG','ZAG','LAT'],['GOL']] },
  '3-5-2':   { desc:'Domínio do meio',        lines:[['ATA','ATA'],['MEI','MEI','VOL','MEI','MEI'],['ZAG','ZAG','ZAG'],['GOL']] },
  '5-3-2':   { desc:'Defensivo compacto',     lines:[['ATA','ATA'],['MEI','VOL','MEI'],['LAT','ZAG','ZAG','ZAG','LAT'],['GOL']] },
  '4-5-1':   { desc:'Ultra defensivo',        lines:[['ATA'],['MEI','MEI','VOL','MEI','MEI'],['LAT','ZAG','ZAG','LAT'],['GOL']] },
  '3-4-3':   { desc:'Ataque total',           lines:[['ATA','ATA','ATA'],['MEI','MEI','MEI','MEI'],['ZAG','ZAG','ZAG'],['GOL']] },
  '4-1-4-1': { desc:'Pivô no meio',           lines:[['ATA'],['MEI','MEI','MEI','MEI'],['VOL'],['LAT','ZAG','ZAG','LAT'],['GOL']] },
};

function _ec(en){ return en>=70?'#00e87a':en>=50?'#ffc107':'#f5365c'; }

function _pickPlayer(pool, used, pos){
  const try1 = (pool[pos]||[]).find(p=>!used.has(p.id));
  if(try1){ used.add(try1.id); return try1; }
  const fallback={GOL:['ZAG'],ZAG:['LAT','VOL'],LAT:['ZAG','MEI'],VOL:['MEI','ZAG'],MEI:['VOL','ATA'],ATA:['MEI']};
  for(const alt of (fallback[pos]||[])){
    const p=(pool[alt]||[]).find(p=>!used.has(p.id));
    if(p){ used.add(p.id); return p; }
  }
  for(const ps of Object.values(pool)){
    const p=ps.find(p=>!used.has(p.id));
    if(p){ used.add(p.id); return p; }
  }
  return null;
}

/* ════ RENDER PRINCIPAL ═════════════════════════════ */
function sqRender(){
  if(!window.G) return;
  const form = G.team?.formation || '4-3-3';
  _renderTitle(form);
  _renderCampo(form);
  _renderList();
}

/* ── Título clicável ─────────────────────────────── */
function _renderTitle(form){
  const el = document.getElementById('squad-form-title');
  if(!el) return;
  const desc = SQUAD_FORMS[form]?.desc || '';
  el.style.cursor = 'pointer';
  el.innerHTML = `<span class="dot"></span>FORMAÇÃO: <span id="sq-form-label" style="color:var(--green);text-decoration:underline dotted">${form}</span> <small style="font-size:.62rem;color:var(--t2)"> ${desc}</small> <span style="color:var(--t3);font-size:.7rem">▾</span>`;
  el.onclick = e => { e.stopPropagation(); _openFormPicker(el, form); };
}

/* ── Picker flutuante ────────────────────────────── */
function _openFormPicker(anchor, current){
  document.getElementById('sq-form-picker')?.remove();

  const picker = document.createElement('div');
  picker.id = 'sq-form-picker';

  // Posição relativa ao anchor
  const rect = anchor.getBoundingClientRect();
  picker.style.cssText = `
    position:fixed;
    top:${rect.bottom+4}px;
    left:${Math.min(rect.left, window.innerWidth-240)}px;
    width:232px;
    background:var(--s1,#0c1520);
    border:1px solid rgba(0,232,122,.4);
    border-radius:12px;
    padding:8px;
    z-index:2000;
    box-shadow:0 8px 32px rgba(0,0,0,.7),0 0 16px rgba(0,232,122,.15);
    font-family:'Rajdhani',sans-serif;
    animation:fadeIn .15s ease;
  `;

  const header = document.createElement('div');
  header.style.cssText = `font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:rgba(0,232,122,.7);padding:4px 4px 8px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:6px;`;
  header.textContent = '📋 SELECIONAR FORMAÇÃO';
  picker.appendChild(header);

  Object.entries(SQUAD_FORMS).forEach(([key, fObj]) => {
    const row = document.createElement('div');
    const isActive = key === current;
    row.style.cssText = `
      display:flex;align-items:center;gap:8px;padding:8px 8px;
      border-radius:8px;cursor:pointer;transition:background .12s;
      background:${isActive?'rgba(0,232,122,.1)':'transparent'};
      border:1px solid ${isActive?'rgba(0,232,122,.35)':'transparent'};
      margin-bottom:3px;
    `;
    row.innerHTML = `
      <span style="font-family:'Bebas Neue',cursive;font-size:1.05rem;color:${isActive?'#00e87a':'#cce8ff'};min-width:60px">${key}</span>
      <span style="font-size:.7rem;color:#7aaec8;flex:1;line-height:1.2">${fObj.desc}</span>
      ${isActive?'<span style="color:#00e87a;font-size:.7rem">✓</span>':''}
    `;
    row.addEventListener('mouseover', ()=>{ if(!isActive) row.style.background='rgba(255,255,255,.05)'; });
    row.addEventListener('mouseout',  ()=>{ if(!isActive) row.style.background='transparent'; });
    row.addEventListener('click', ()=>{
      picker.remove();
      _applyFormation(key);
    });
    picker.appendChild(row);
  });

  document.body.appendChild(picker);

  // Fecha ao clicar fora
  function closeOnOut(e){
    if(!picker.contains(e.target)){
      picker.remove();
      document.removeEventListener('click', closeOnOut, true);
    }
  }
  setTimeout(()=> document.addEventListener('click', closeOnOut, true), 10);
}

/* ── Aplica formação ─────────────────────────────── */
function _applyFormation(key){
  if(!window.G) return;
  G.team.formation = key;

  // Propaga ao engine ativo se tiver
  if(window.ActiveEngine?.home && window.FORMATIONS_DB?.[key]){
    const f = FORMATIONS_DB[key];
    ActiveEngine.home.power      = Math.max(1,(G.team.power||60)+f.powerMod);
    ActiveEngine.home.aggression = Math.min(100,Math.max(0,(G.team.aggression||50)+f.aggrMod));
  }

  _renderTitle(key);
  _renderCampo(key);
  window.toast?.(`📋 Formação ${key} — ${SQUAD_FORMS[key].desc}`, '#11cdef');
  window.saveGame?.();
}

/* ── Campo SVG ───────────────────────────────────── */
function _renderCampo(form){
  const campo = document.getElementById('campo');
  if(!campo || !window.G) return;

  const fObj  = SQUAD_FORMS[form] || SQUAD_FORMS['4-3-3'];
  const squad = G.team?.squad || [];

  // Pool por posição (usa todos, inclusive lesionados marcados)
  const pool = {};
  for(const p of squad){
    if(!pool[p.position]) pool[p.position]=[];
    pool[p.position].push(p);
  }
  const used = new Set();

  const linesHTML = fObj.lines.map(posArr => {
    const cells = posArr.map(pos => {
      const p = _pickPlayer(pool, used, pos);
      if(!p) return `<div class="campo-player inactive"><span class="cp-ovr" style="font-size:.8rem">—</span><span style="font-size:.55rem">?</span><span class="cp-pos">${pos}</span></div>`;
      const en = p.energy||70;
      const ec = _ec(en);
      const nm = p.name.split(' ')[0];
      const injIcon = p.injured?'🩼':p.suspended?'🟥':p._yellow?'🟡':'';
      return `<div class="campo-player" style="cursor:pointer;border-color:${ec}55" onclick="window.openPlayerModal?.('${p.id}')">
        <span class="cp-ovr" style="color:${ec};display:block">${p.overall}</span>
        <span style="font-size:.6rem;max-width:52px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:block">${injIcon}${nm}</span>
        <span class="cp-pos" style="display:block">${p.position}</span>
      </div>`;
    }).join('');
    return `<div class="campo-line">${cells}</div>`;
  }).join('');

  campo.innerHTML = linesHTML;
}

/* ── Lista de jogadores ──────────────────────────── */
function _renderList(){
  const list = document.getElementById('squad-list');
  if(!list || !window.G) return;
  list.innerHTML = '';

  const ORDER = ['GOL','ZAG','LAT','VOL','MEI','ATA'];
  const sorted = [...(G.team?.squad||[])].sort((a,b)=>ORDER.indexOf(a.position)-ORDER.indexOf(b.position));

  if(sorted.length===0){
    list.innerHTML = '<div class="empty">Elenco vazio. Contrate jogadores no Mercado.</div>';
    return;
  }

  for(const p of sorted){
    const en  = p.energy||70;
    const ec  = _ec(en);
    const badges = [
      p.injured   ? `<span class="badge badge-red"  style="font-size:.55rem">🩼 ${p.injuredWeeks||1}s</span>`:'',
      p.suspended ? `<span class="badge badge-gold" style="font-size:.55rem">🟥 Sus</span>`:'',
      p._yellow   ? `<span class="badge badge-gold" style="font-size:.55rem">🟡 Am</span>`:'',
      en<50       ? `<span class="badge badge-red"  style="font-size:.55rem">⚡ Can</span>`:'',
    ].filter(Boolean).join(' ');

    const btns = [
      p.injured   ? `<button class="btn btn-xs btn-primary"  onclick="healPlayer('${p.id}');event.stopPropagation()">🏥</button>` : '',
      p.suspended ? `<button class="btn btn-xs btn-secondary" onclick="clearSuspension('${p.id}');event.stopPropagation()">✓</button>` : '',
      !G.forSale.includes(p.id)
        ? `<button class="btn btn-xs btn-ghost"  onclick="listForSale('${p.id}');event.stopPropagation()">Vender</button>`
        : `<button class="btn btn-xs btn-danger" onclick="removeFromSale('${p.id}');event.stopPropagation()">✕</button>`,
    ].join('');

    const card = document.createElement('div');
    card.className = `player-card ${p.injured?'injured':''} ${p.suspended?'suspended':''}`;
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="pc-pos">${p.position}</div>
      <div class="pc-ovr" style="color:${ec}">${p.overall}</div>
      <div class="pc-info">
        <div class="pc-name">${p.name}${badges?' '+badges:''}</div>
        <div class="pc-sub">Idade ${p.age} · R$${(p.salary||0).toLocaleString('pt-BR')}/sem · ⚡<span style="color:${ec}">${en}</span></div>
      </div>
      <div class="pc-actions">${btns}</div>`;

    card.addEventListener('click', e=>{ if(!e.target.closest('button')) window.openPlayerModal?.(p.id); });
    list.appendChild(card);
  }
}

/* ════ INSTALAÇÃO ═══════════════════════════════════
   Aguarda DOM + app.js e substitui renderSquad
   ════════════════════════════════════════════════════ */
function _install(){
  // Garante que o HTML do squad screen tem os IDs certos
  const campo = document.getElementById('campo');
  const title = document.getElementById('squad-form-title');

  if(!campo || !title){
    // Cria estrutura mínima se não existir (compatibilidade)
    const screen = document.getElementById('screen-squad');
    if(screen){
      const card = screen.querySelector('.card');
      if(card){
        // Adiciona id ao card-title se não tiver
        const ct = card.querySelector('.card-title');
        if(ct && !ct.id) ct.id = 'squad-form-title';
      }
    }
  }

  // Instala como renderSquad global
  window.renderSquad = sqRender;
  console.log('[squad.js v2] ✓ Instalado — formação com picker flutuante.');

  // Se o elenco já estiver visível, renderiza imediatamente
  if(document.getElementById('screen-squad')?.classList.contains('active')){
    sqRender();
  }
}

// Aguarda tudo carregar
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(_install, 400));
} else {
  setTimeout(_install, 400);
}
