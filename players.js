/* ════════════════════════════════════════════════════
   GranFut · players.js — Perfil, Upgrades, Formação
   Modal de jogador, evolução individual, seletor de
   formação no elenco, edição de orçamento
   Saieso Seraos Edition v1.0
   ════════════════════════════════════════════════════ */
'use strict';

// ─── Pacotes de evolução individual ─────────────────────────────────────────
const PLAYER_PACKS = [
  { id:'spd', icon:'⚡', name:'Pack Velocidade',       desc:'+5 Pace · +3 Resistência',     price:2000,  currency:'common',  effect:{pace:5,stamina:3}                  },
  { id:'str', icon:'💪', name:'Pack Força',            desc:'+5 Força · +3 Defesa',         price:2000,  currency:'common',  effect:{strength:5,defending:3}             },
  { id:'tec', icon:'🎯', name:'Pack Técnico',          desc:'+5 Destreza · +3 Chute',       price:2000,  currency:'common',  effect:{dexterity:5,shooting:3}             },
  { id:'men', icon:'🧠', name:'Pack Mental',           desc:'+5 Inteligência · +Forma',     price:2500,  currency:'common',  effect:{intelligence:5},   formBonus:0.3     },
  { id:'a3',  icon:'⭐', name:'Evolução Geral +3',    desc:'+3 em todos os atributos',     price:6000,  currency:'common',  effect:'ALL+3'                              },
  { id:'a5',  icon:'🌟', name:'Evolução Elite +5',    desc:'+5 em todos os atributos',     price:150,   currency:'granfut', effect:'ALL+5',    premium:true             },
  { id:'pot', icon:'🚀', name:'Despertar do Potencial',desc:'OVR → Potencial máximo',      price:300,   currency:'granfut', effect:'POTENTIAL',premium:true             },
];

const STAT_CFG = [
  { key:'pace',         label:'Velocidade',   icon:'⚡', color:'#00e87a' },
  { key:'stamina',      label:'Resistência',  icon:'🏃', color:'#00e87a' },
  { key:'strength',     label:'Força',        icon:'💪', color:'#11cdef' },
  { key:'dexterity',    label:'Destreza',     icon:'🎯', color:'#11cdef' },
  { key:'intelligence', label:'Inteligência', icon:'🧠', color:'#ffc107' },
  { key:'defending',    label:'Defesa',       icon:'🛡️', color:'#ffc107' },
  { key:'shooting',     label:'Finalização',  icon:'⚽', color:'#f5365c' },
];

const STAT_KEYS = STAT_CFG.map(s => s.key);

// ────────────────────────────────────────────────────
// PATCH — renderSquad
// ────────────────────────────────────────────────────
(function patchRenderSquad() {
  const orig = window.renderSquad;
  if (!orig) { setTimeout(patchRenderSquad, 100); return; }

  window.renderSquad = function() {
    orig();
    if (!G) return;
    _injectFormationSelector();
    _makePlayersClickable();
  };
})();

// ────────────────────────────────────────────────────
// PATCH — renderTransfer (botão editar orçamento)
// ────────────────────────────────────────────────────
(function patchRenderTransfer() {
  const orig = window.renderTransfer;
  if (!orig) { setTimeout(patchRenderTransfer, 100); return; }

  window.renderTransfer = function() {
    orig();
    _injectBudgetEdit();
  };
})();

// ────────────────────────────────────────────────────
// PATCH — masterSubmit (unlock budget edit via senha)
// ────────────────────────────────────────────────────
(function patchMasterSubmit() {
  const orig = window.masterSubmit;
  if (!orig) { setTimeout(patchMasterSubmit, 100); return; }

  window.masterSubmit = function() {
    orig();
    // Se o master logou com sucesso, unlock budget edit
    if (G) {
      const input = document.getElementById('master-input');
      // masterSubmit already cleared input, check if master log says OK
      const log = document.getElementById('master-log');
      if (log && log.textContent.includes('Bem-vindo, Saieso')) {
        G._masterUnlocked = true;
        saveGame?.();
      }
    }
  };
})();

// ════════════════════════════════════════════════════
// SELETOR DE FORMAÇÃO no Elenco
// ════════════════════════════════════════════════════
const FORMATIONS_LIST = ['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2','4-5-1','3-4-3','4-1-4-1'];

function _injectFormationSelector() {
  const card = document.querySelector('#screen-squad .card');
  if (!card || !G) return;

  // Atualiza título do card
  const titleEl = card.querySelector('.card-title');
  const curForm  = G.team?.formation || '4-3-3';
  if (titleEl) titleEl.innerHTML = `<span class="dot"></span>FORMAÇÃO ATUAL: ${curForm}`;

  // Remove seletor antigo
  card.querySelector('.squad-form-wrap')?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'squad-form-wrap';
  wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;';

  FORMATIONS_LIST.forEach(f => {
    const btn = document.createElement('button');
    btn.textContent = f;
    btn.className   = `btn btn-xs ${f === curForm ? 'btn-primary' : 'btn-ghost'}`;
    btn.onclick = () => {
      G.team.formation = f;
      // Propaga ao engine se partida ativa
      if (window.ActiveEngine?.home) {
        const fmod = window.FORMATIONS_DB?.[f];
        if (fmod) {
          const base = G.team.power || 60;
          ActiveEngine.home.power = Math.max(1, base + fmod.powerMod);
          ActiveEngine.home.aggression = Math.min(100, Math.max(0,
            (G.team.aggression || 50) + fmod.aggrMod));
        }
      }
      renderSquad?.();
      toast(`📋 Formação ${f} ativada!`, '#11cdef');
      saveGame?.();
    };
    wrap.appendChild(btn);
  });

  const campo = card.querySelector('.campo');
  card.insertBefore(wrap, campo);
}

// ════════════════════════════════════════════════════
// CLIQUE NOS JOGADORES
// ════════════════════════════════════════════════════
function _makePlayersClickable() {
  const list = document.getElementById('squad-list');
  if (!list || !G) return;

  const order = ['GOL','ZAG','LAT','VOL','MEI','ATA'];
  const sorted = [...G.team.squad].sort((a,b) =>
    order.indexOf(a.position) - order.indexOf(b.position));

  list.querySelectorAll('.player-card').forEach((card, i) => {
    const p = sorted[i];
    if (!p) return;
    card.style.cursor = 'pointer';
    card.style.transition = 'background .15s';
    // Remove handler antigo e re-adiciona
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
    newCard.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      openPlayerModal(p.id);
    });
  });
}

// ════════════════════════════════════════════════════
// EDIÇÃO DE ORÇAMENTO
// ════════════════════════════════════════════════════
function _injectBudgetEdit() {
  if (!G) return;
  const unlocked = (G.userProfile?.donationTier >= 2) || G._masterUnlocked;
  if (!unlocked) return;

  const budEl = document.getElementById('t-budget');
  if (!budEl) return;
  const block = budEl.closest('.stat-block');
  if (!block || block.querySelector('.budget-edit-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'btn btn-xs btn-ghost budget-edit-btn';
  btn.style.marginTop = '4px';
  btn.innerHTML = '✏️ Editar';
  btn.onclick = openBudgetEdit;
  block.appendChild(btn);
}

window.openBudgetEdit = function() {
  document.getElementById('gf-budget-modal')?.remove();
  const cur = (G?.transferBudget || 0).toLocaleString('pt-BR');
  const m = document.createElement('div');
  m.id = 'gf-budget-modal';
  m.style.cssText = `
    position:fixed;inset:0;background:rgba(6,11,16,.95);z-index:700;
    display:flex;align-items:center;justify-content:center;padding:20px;
    font-family:'Rajdhani',sans-serif;
  `;
  m.onclick = e => { if (e.target === m) m.remove(); };
  m.innerHTML = `
    <div style="background:var(--s1);border:1px solid var(--b1);border-radius:16px;padding:22px;width:100%;max-width:360px">
      <div style="font-family:'Bebas Neue',cursive;font-size:1.35rem;letter-spacing:3px;color:var(--green);margin-bottom:12px">✏️ EDITAR ORÇAMENTO</div>
      <p style="font-size:.83rem;color:var(--t2);margin-bottom:12px;line-height:1.5">
        Orçamento atual: <strong style="color:var(--t1)">R$ ${cur}</strong>
      </p>
      <input id="gf-budget-input" class="inp" type="number" min="0" placeholder="Novo valor (ex: 500000)" style="margin-bottom:14px">
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1" onclick="applyBudgetEdit()">✅ Confirmar</button>
        <button class="btn btn-ghost" onclick="document.getElementById('gf-budget-modal').remove()">✕</button>
      </div>
    </div>`;
  document.body.appendChild(m);
  setTimeout(() => document.getElementById('gf-budget-input')?.focus(), 100);
};

window.applyBudgetEdit = function() {
  const val = Number(document.getElementById('gf-budget-input')?.value || '');
  if (isNaN(val) || val < 0) { toast('Valor inválido!', 'var(--red)'); return; }
  G.transferBudget = val;
  document.getElementById('gf-budget-modal')?.remove();
  renderTransfer?.();
  renderHeader?.();
  toast(`💰 Orçamento: R$ ${val.toLocaleString('pt-BR')}`, 'var(--gold)');
  saveGame?.();
};

// ════════════════════════════════════════════════════
// MODAL DE JOGADOR
// ════════════════════════════════════════════════════
window.openPlayerModal = function(pid) {
  const player = G?.team?.squad.find(p => p.id === pid);
  if (!player) return;
  document.getElementById('gf-player-modal')?.remove();

  const modal = document.createElement('div');
  modal.id    = 'gf-player-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(6,11,16,.98);z-index:650;
    display:flex;flex-direction:column;max-width:480px;margin:0 auto;
    font-family:'Rajdhani',sans-serif;animation:su .2s ease;
  `;
  modal.innerHTML = `
    ${_buildPlayerHeader(player)}
    <div style="display:flex;background:var(--s1);border-bottom:1px solid var(--b1);flex-shrink:0" id="pm-tabs"></div>
    <div id="pm-content" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px"></div>
    <div style="padding:10px 14px;background:var(--s1);border-top:1px solid var(--b1);flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap">
      ${player.injured   ? `<button class="btn btn-primary btn-sm" onclick="healPlayer('${player.id}');renderSquad?.();document.getElementById('gf-player-modal').remove()">🏥 Curar (R$3k)</button>` : ''}
      ${player.suspended ? `<button class="btn btn-secondary btn-sm" onclick="clearSuspension('${player.id}');document.getElementById('gf-player-modal').remove()">✓ Cumpriu Pena</button>` : ''}
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="document.getElementById('gf-player-modal').remove()">✕ Fechar</button>
    </div>
  `;
  modal.dataset.pid = pid;
  document.body.appendChild(modal);

  _buildPMTabs();
  _switchPMTab('stats');
};

function _buildPlayerHeader(p) {
  const ovr = p.overall || 60;
  const en  = p.energy  || 70;
  const ovrColor = ovr >= 80 ? '#00e87a' : ovr >= 65 ? '#ffc107' : ovr >= 50 ? '#11cdef' : '#f5365c';
  const enColor  = en  >= 70 ? '#00e87a' : en  >= 50 ? '#ffc107' : '#f5365c';
  const badges = [
    p.injured    ? `<span class="badge badge-red"  style="font-size:.62rem">🩼 Lesionado</span>` : '',
    p.suspended  ? `<span class="badge badge-gold" style="font-size:.62rem">🟥 Suspenso</span>` : '',
    en < 50      ? `<span class="badge badge-red"  style="font-size:.62rem">⚡ Cansado</span>`   : '',
    p._yellow    ? `<span class="badge badge-gold" style="font-size:.62rem">🟡 Amarelado</span>` : '',
  ].filter(Boolean).join(' ');

  const mini = [
    { label:'Gols', val: p.goals || 0, color:'#00e87a' },
    { label:'Assi.', val: p.assists || 0, color:'#11cdef' },
    { label:'Jogos', val: p.matchesPlayed || 0, color:'var(--t1)' },
    { label:'Potenc', val: p.potential || ovr, color:'#ffc107' },
    { label:'Valor', val: _fc(p.value||0), color:'#ffc107' },
  ].map(x => `
    <div style="flex:1;text-align:center;background:var(--s2);border-radius:7px;padding:5px 3px">
      <div style="font-size:.58rem;color:var(--t3);text-transform:uppercase">${x.label}</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:1rem;color:${x.color}">${x.val}</div>
    </div>`).join('');

  return `
    <div style="background:linear-gradient(160deg,#0e2236,#091829);border-bottom:1px solid var(--b1);padding:14px;flex-shrink:0;position:relative">
      <button onclick="document.getElementById('gf-player-modal').remove()"
        style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,.1);border:none;
               color:var(--t1);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:.9rem">✕</button>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="background:var(--s3);border:2px solid var(--b2);border-radius:10px;padding:7px 11px;text-align:center;flex-shrink:0">
          <div style="font-size:.58rem;color:var(--t3);text-transform:uppercase;letter-spacing:1px">${p.position}</div>
          <div style="font-family:'Bebas Neue',cursive;font-size:2rem;color:${ovrColor};line-height:1">${ovr}</div>
          <div style="font-size:.58rem;color:var(--t3)">OVR</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Bebas Neue',cursive;font-size:1.35rem;letter-spacing:1px;line-height:1">${p.name}</div>
          <div style="font-size:.75rem;color:var(--t2);margin-top:2px">Idade ${p.age} · Contrato ${p.contract?.years||1}a</div>
          <div style="margin-top:5px;display:flex;align-items:center;gap:5px">
            <span style="font-size:.68rem;color:var(--t2);white-space:nowrap">Energia</span>
            <div style="flex:1;height:5px;background:var(--s3);border-radius:3px;overflow:hidden">
              <div style="width:${en}%;height:100%;background:${enColor};border-radius:3px"></div>
            </div>
            <span style="font-size:.72rem;color:${enColor};font-family:'Bebas Neue',cursive">${en}%</span>
          </div>
          ${badges ? `<div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">${badges}</div>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:5px;margin-top:10px">${mini}</div>
    </div>`;
}

function _buildPMTabs() {
  const tabs = document.getElementById('pm-tabs');
  if (!tabs) return;
  const list = [
    { id:'stats',    label:'📊 Stats'    },
    { id:'upgrades', label:'⬆️ Upgrade'  },
    { id:'history',  label:'📋 Histórico'},
  ];
  tabs.innerHTML = list.map(t => `
    <button class="pm-tab" data-tab="${t.id}" onclick="switchPMTab('${t.id}')"
      style="flex:1;padding:10px 4px;background:none;border:none;border-bottom:2px solid transparent;
             color:var(--t3);font-family:'Rajdhani',sans-serif;font-size:.68rem;
             font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:.5px">
      ${t.label}
    </button>`).join('');
}

window.switchPMTab = function(tab) {
  _switchPMTab(tab);
};

function _switchPMTab(tab) {
  // Update tab active states
  document.querySelectorAll('.pm-tab').forEach(t => {
    const active = t.dataset.tab === tab;
    t.style.color        = active ? 'var(--green)' : 'var(--t3)';
    t.style.borderBottom = active ? '2px solid var(--green)' : '2px solid transparent';
  });

  const modal  = document.getElementById('gf-player-modal');
  const pid    = modal?.dataset.pid;
  const player = G?.team?.squad.find(p => p.id === pid);
  if (!player) return;

  const content = document.getElementById('pm-content');
  if (!content) return;

  switch (tab) {
    case 'stats':    content.innerHTML = _pmStatsHTML(player);    break;
    case 'upgrades': content.innerHTML = _pmUpgradesHTML(player); break;
    case 'history':  content.innerHTML = _pmHistoryHTML(player);  break;
  }
}

// ── Aba Stats ──────────────────────────────────────────────────────────────
function _pmStatsHTML(p) {
  const bars = STAT_CFG.map(s => {
    const v   = p[s.key] || 0;
    const pct = Math.round((v / 99) * 100);
    return `
      <div style="margin-bottom:9px">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-size:.75rem;color:var(--t2)">${s.icon} ${s.label}</span>
          <span style="font-family:'Bebas Neue',cursive;font-size:.95rem;color:${s.color}">${v}</span>
        </div>
        <div style="height:5px;background:var(--s3);border-radius:3px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${s.color};border-radius:3px;transition:width .4s"></div>
        </div>
      </div>`;
  }).join('');

  const rows = [
    ['Potencial máx.', p.potential || p.overall || 60, '#ffc107'],
    ['Salário/semana', `R$ ${(p.salary||0).toLocaleString('pt-BR')}`, '#00e87a'],
    ['Valor mercado',  `R$ ${_fc(p.value||0)}`, '#00e87a'],
    ['Agressividade',  p.aggression || 50, '#f5365c'],
    ['Forma atual',    (p.form || 3.0).toFixed(1), '#11cdef'],
    ['Contrato',       `${p.contract?.years||1} ano(s)`, 'var(--t1)'],
  ].map(([l, v, c]) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--b1)">
      <span style="color:var(--t2);font-size:.8rem">${l}</span>
      <span style="color:${c};font-size:.82rem;font-weight:600">${v}</span>
    </div>`).join('');

  return `
    <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:8px">ATRIBUTOS</div>
    ${bars}
    <div style="background:var(--s2);border:1px solid var(--b1);border-radius:12px;padding:12px;margin-top:6px">
      <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:8px">INFORMAÇÕES</div>
      ${rows}
    </div>`;
}

// ── Aba Upgrades ───────────────────────────────────────────────────────────
function _pmUpgradesHTML(player) {
  const cash = G?.team?.finances?.cash || 0;
  const gran = G?.userProfile?.granFut  || 0;
  const pid  = player.id;

  const packs = PLAYER_PACKS.map(pk => {
    const ok = pk.currency === 'granfut' ? gran >= pk.price : cash >= pk.price;
    return `
      <div style="display:flex;align-items:center;gap:9px;background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:10px 11px;margin-bottom:7px">
        <span style="font-size:1.45rem;flex-shrink:0">${pk.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:.85rem;display:flex;align-items:center;gap:5px">
            ${pk.name}
            ${pk.premium ? `<span style="font-size:.58rem;background:rgba(255,193,7,.15);color:#ffc107;padding:1px 6px;border-radius:10px">GF</span>` : ''}
          </div>
          <div style="font-size:.7rem;color:var(--t2);margin-top:2px">${pk.desc}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:'Bebas Neue',cursive;font-size:.9rem;color:${pk.currency==='granfut'?'#ffc107':'#00e87a'}">
            ${pk.currency==='granfut'?'◈':'R$'} ${pk.price.toLocaleString('pt-BR')}
          </div>
          <button class="btn btn-xs ${ok?'btn-primary':'btn-ghost'}" style="margin-top:4px"
            ${ok?'':'disabled'} onclick="applyPlayerPack('${pid}','${pk.id}')">
            ${ok?'Aplicar':'Sem saldo'}
          </button>
        </div>
      </div>`;
  }).join('');

  return `
    <div style="display:flex;gap:6px;margin-bottom:12px">
      <div style="flex:1;background:var(--s2);border:1px solid var(--b1);border-radius:8px;padding:7px 10px;font-family:'Bebas Neue',cursive;color:#00e87a">💰 R$ ${cash.toLocaleString('pt-BR')}</div>
      <div style="flex:1;background:var(--s2);border:1px solid var(--b1);border-radius:8px;padding:7px 10px;font-family:'Bebas Neue',cursive;color:#ffc107">◈ ${gran} GF</div>
    </div>
    <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:8px">PACOTES DISPONÍVEIS</div>
    ${packs}`;
}

// ── Aba Histórico ──────────────────────────────────────────────────────────
function _pmHistoryHTML(player) {
  const miniStats = [
    { l:'Gols',       v: player.goals       || 0, c:'#00e87a' },
    { l:'Assist.',    v: player.assists      || 0, c:'#11cdef' },
    { l:'Partidas',   v: player.matchesPlayed|| 0, c:'var(--t1)' },
    { l:'XP Total',   v: player.xp           || 0, c:'#b97cff' },
    { l:'Amarelos',   v: player.yellowCards  || 0, c:'#ffc107' },
    { l:'Reputação',  v: player.reputation  || 0,  c:'var(--t1)' },
  ].map(x => `
    <div style="background:var(--s2);border:1px solid var(--b1);border-radius:8px;padding:8px;text-align:center">
      <div style="font-size:.58rem;color:var(--t3);text-transform:uppercase">${x.l}</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:1.4rem;color:${x.c}">${x.v}</div>
    </div>`).join('');

  const history = (G?.resultHistory || []).slice(0, 8);
  const histRows = history.length
    ? history.map(r => {
        const c = r.outcome==='WIN' ? '#00e87a' : r.outcome==='DRAW' ? '#ffc107' : '#f5365c';
        const l = r.outcome==='WIN' ? 'V' : r.outcome==='DRAW' ? 'E' : 'D';
        return `<div style="display:flex;align-items:center;gap:7px;font-size:.78rem;padding:6px 0;border-bottom:1px solid var(--b1)">
          <span style="color:${c};font-family:'Bebas Neue',cursive;min-width:14px">${l}</span>
          <span style="color:var(--t2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${r.home} <strong style="color:var(--t1)">${r.scoreH}–${r.scoreA}</strong> ${r.away}
          </span>
          <span style="color:var(--t3);font-size:.66rem;flex-shrink:0">T${r.season||1}·R${r.round||1}</span>
        </div>`;
      }).join('')
    : '<div style="color:var(--t3);font-size:.8rem;padding:10px 0">Nenhuma partida disputada ainda.</div>';

  return `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px">${miniStats}</div>
    <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:6px">HISTÓRICO DO TIME</div>
    ${histRows}`;
}

// ════════════════════════════════════════════════════
// APLICAR PACK DE EVOLUÇÃO
// ════════════════════════════════════════════════════
window.applyPlayerPack = function(pid, packId) {
  const player = G?.team?.squad.find(p => p.id === pid);
  const pack   = PLAYER_PACKS.find(pk => pk.id === packId);
  if (!player || !pack || !G) return;

  if (pack.currency === 'common'  && (G.team.finances.cash  || 0) < pack.price) { toast('💸 Saldo insuficiente!', 'var(--red)'); return; }
  if (pack.currency === 'granfut' && (G.userProfile.granFut || 0) < pack.price) { toast('◈ GF insuficiente!', 'var(--red)'); return; }

  // Debitar
  if (pack.currency === 'common')  G.team.finances.cash    -= pack.price;
  else                              G.userProfile.granFut   -= pack.price;

  // Aplicar efeito
  if (typeof pack.effect === 'object') {
    for (const [k, v] of Object.entries(pack.effect)) {
      player[k] = Math.min(99, Math.max(10, (player[k] || 60) + v));
    }
    if (pack.formBonus) player.form = Math.min(5.0, (player.form || 3.0) + pack.formBonus);
  } else if (pack.effect === 'ALL+3') {
    STAT_KEYS.forEach(k => { player[k] = Math.min(99, (player[k] || 60) + 3); });
  } else if (pack.effect === 'ALL+5') {
    STAT_KEYS.forEach(k => { player[k] = Math.min(99, (player[k] || 60) + 5); });
  } else if (pack.effect === 'POTENTIAL') {
    const tgt = player.potential || player.overall || 60;
    STAT_KEYS.forEach(k => { player[k] = Math.min(99, Math.max(player[k] || 60, tgt)); });
  }

  // Recalcula OVR
  const defined = STAT_KEYS.filter(k => player[k] !== undefined);
  if (defined.length) {
    player.overall = Math.round(defined.reduce((s, k) => s + player[k], 0) / defined.length);
  }

  toast(`${pack.icon} ${pack.name} aplicado em ${player.name.split(' ')[0]}!`, '#ffc107');
  _switchPMTab('upgrades'); // re-render aba com saldos atualizados
  renderSquad?.();
  renderHeader?.();
  saveGame?.();
};

// ─── Helper ────────────────────────────────────────────────────────────────
function _fc(v) {
  if (v >= 1e6) return (v/1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v/1e3).toFixed(0) + 'K';
  return v.toString();
}
