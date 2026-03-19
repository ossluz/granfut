/* ════════════════════════════════════════════════════
   GranFut · interval.js — Intervalo, Pausa, Táticas
   Sistema de substituições, formações e loja no vestiário
   Saieso Seraos Edition v1.0
   ════════════════════════════════════════════════════ */
'use strict';

// ─── Banco de Formações ─────────────────────────────────────────────────────
const FORMATIONS_DB = {
  '4-3-3':   { name:'4-3-3',   desc:'Ofensivo equilibrado',  powerMod:0,   aggrMod:5  },
  '4-4-2':   { name:'4-4-2',   desc:'Clássico e sólido',     powerMod:2,   aggrMod:0  },
  '4-2-3-1': { name:'4-2-3-1', desc:'Controle do meio',      powerMod:1,   aggrMod:-5 },
  '3-5-2':   { name:'3-5-2',   desc:'Domínio do meio-campo', powerMod:3,   aggrMod:5  },
  '5-3-2':   { name:'5-3-2',   desc:'Defensivo compacto',    powerMod:-3,  aggrMod:-10},
  '4-5-1':   { name:'4-5-1',   desc:'Ultra defensivo',       powerMod:-5,  aggrMod:-15},
  '3-4-3':   { name:'3-4-3',   desc:'Ataque total',          powerMod:-2,  aggrMod:15 },
  '4-1-4-1': { name:'4-1-4-1', desc:'Pivô no meio',          powerMod:1,   aggrMod:-5 },
};

// ─── Banco de Táticas ───────────────────────────────────────────────────────
const TACTICS_DB = [
  { id:'normal',   icon:'⚖️', name:'Normal',          desc:'Equilibrado',                   powerMod:0,  aggrMod:0   },
  { id:'attack',   icon:'⚔️', name:'Atacar',          desc:'+Pressão alta | +Gols | +Fadiga',powerMod:6,  aggrMod:20  },
  { id:'defend',   icon:'🛡️', name:'Defender',        desc:'+Solidez | -Posse | -Gols',      powerMod:-4, aggrMod:-20 },
  { id:'counter',  icon:'⚡', name:'Contra-ataque',   desc:'Rápido nas transições',          powerMod:3,  aggrMod:5   },
  { id:'tiki',     icon:'🔄', name:'Posse de bola',   desc:'+Controle | -Velocidade',        powerMod:1,  aggrMod:-10 },
  { id:'pressing', icon:'🔥', name:'Pressão alta',    desc:'Sufoca o rival | +Cansaço',      powerMod:4,  aggrMod:15  },
];

// ─── Itens da Loja do Vestiário ─────────────────────────────────────────────
const INTERVAL_ITEMS = [
  { id:'energy_shot',   icon:'🧊', name:'Gelo Instantâneo',      desc:'Recupera 40 de energia do elenco',    price:800,   currency:'common',  effect:'ENERGY_40'    },
  { id:'energy_full',   icon:'💊', name:'Soro de Recuperação',   desc:'+30% energia de todo o elenco',       price:3500,  currency:'common',  effect:'ENERGY_30PCT' },
  { id:'morale_boost',  icon:'🎤', name:'Discurso do Técnico',   desc:'Moral do elenco +20 por 2 jogos',     price:1500,  currency:'common',  effect:'MORAL_20'     },
  { id:'heal_all',      icon:'🏥', name:'Fisioterapeuta',        desc:'Cura todos os lesionados leves',       price:4000,  currency:'common',  effect:'HEAL_ALL'     },
  { id:'stim_pack',     icon:'⚡', name:'Estimulante Esportivo', desc:'+15 poder ofensivo no 2° tempo',       price:200,   currency:'granfut', effect:'ATK_BOOST', premium:true },
  { id:'fresh_legs',    icon:'🦵', name:'Pernas Novas',          desc:'Próxima sub entra com energia cheia',  price:600,   currency:'common',  effect:'SUB_ENERGY'   },
];

// ─── Estado do Intervalo ────────────────────────────────────────────────────
let _iTab        = 'vestiario'; // aba ativa
let _subsUsed    = 0;           // substituições usadas nesta partida
let _subOut      = null;        // jogador selecionado para sair
let _freshNextSub = false;      // efeito Fresh Legs ativo
const MAX_SUBS   = 3;

// ════════════════════════════════════════════════════
// SOBREPÕE showIntervalPanel do app.js
// ════════════════════════════════════════════════════
window.showIntervalPanel = function(score, guideMsg) {
  _iTab     = 'vestiario';
  _subOut   = null;

  const panel = document.getElementById('interval-panel');
  if (!panel) return;
  panel.dataset.scoreH = score.h;
  panel.dataset.scoreA = score.a;
  panel.dataset.guide  = guideMsg;

  setText('interval-score', `${score.h} – ${score.a}`);
  _renderInterval();
  panel.style.display = 'flex';
};

// ════════════════════════════════════════════════════
// SOBREPÕE resumeSecondHalf do app.js
// ════════════════════════════════════════════════════
window.resumeSecondHalf = function() {
  document.getElementById('interval-panel').style.display = 'none';
  closePausePanel();
  if (ActiveEngine) ActiveEngine.startSecondHalf();
};

// ════════════════════════════════════════════════════
// TABS DO INTERVALO
// ════════════════════════════════════════════════════
window.switchIntervalTab = function(tab) {
  _iTab   = tab;
  _subOut = null;
  _renderInterval();
};

function _renderInterval() {
  // Atualiza classes das tabs
  document.querySelectorAll('.itab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === _iTab)
  );
  const content = document.getElementById('interval-content');
  if (!content) return;

  switch (_iTab) {
    case 'vestiario': content.innerHTML = _buildVestiarioHTML(); break;
    case 'loja':      content.innerHTML = _buildLojaHTML();      break;
    case 'taticas':   content.innerHTML = _buildTaticasHTML();   break;
    case 'subs':      content.innerHTML = _buildSubsHTML();      break;
  }
}

// ─── Vestiário ──────────────────────────────────────────────────────────────
function _buildVestiarioHTML() {
  const panel  = document.getElementById('interval-panel');
  const guide  = panel?.dataset.guide || '';
  const squad  = G?.team?.squad || [];
  const tired  = squad.filter(p => (p.energy||70) < 50).length;
  const yellows= squad.filter(p => p._yellow).length;
  const injured= squad.filter(p => p.injured).length;
  const avgEn  = squad.length ? Math.round(squad.reduce((a,p)=>a+(p.energy||70),0)/squad.length) : 70;

  const enColor= avgEn >= 70 ? 'var(--green)' : avgEn >= 50 ? 'var(--gold)' : 'var(--red)';

  let alerts = '';
  if (tired   > 0) alerts += `<div class="iv-alert red">⚡ ${tired} jogador(es) com pouca energia</div>`;
  if (yellows > 0) alerts += `<div class="iv-alert orange">🟡 ${yellows} jogador(es) com cartão amarelo</div>`;
  if (injured > 0) alerts += `<div class="iv-alert red">🔴 ${injured} jogador(es) lesionado(s)</div>`;
  if (!alerts)      alerts  = `<div class="iv-alert green">✅ Elenco em boas condições</div>`;

  return `
    <div class="iv-guide">${guide}</div>
    <div class="iv-alerts">${alerts}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:8px 12px;background:var(--s2);border-radius:var(--rs)">
      <span style="font-size:.78rem;color:var(--t2)">Energia média do elenco</span>
      <strong style="color:${enColor};font-family:var(--fd);font-size:1rem">${avgEn}%</strong>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:8px 12px;background:var(--s2);border-radius:var(--rs)">
      <span style="font-size:.78rem;color:var(--t2)">Substituições disponíveis</span>
      <strong style="color:var(--t1);font-family:var(--fd);font-size:1rem">${MAX_SUBS - _subsUsed}/${MAX_SUBS}</strong>
    </div>
    <div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">
      <button class="btn btn-secondary btn-sm btn-full" onclick="switchIntervalTab('subs')">🔄 Fazer Substituição</button>
      <button class="btn btn-ghost btn-sm btn-full" onclick="switchIntervalTab('taticas')">📋 Mudar Formação / Tática</button>
      <button class="btn btn-ghost btn-sm btn-full" onclick="switchIntervalTab('loja')">🛒 Loja do Vestiário</button>
    </div>
  `;
}

// ─── Loja do Vestiário ───────────────────────────────────────────────────────
function _buildLojaHTML() {
  const cash = G?.team?.finances?.cash || 0;
  const gran = G?.userProfile?.granFut || 0;

  let html = `
    <div style="display:flex;gap:7px;margin-bottom:12px">
      <div class="iv-stat">💰 R$ ${cash.toLocaleString('pt-BR')}</div>
      <div class="iv-stat"><span style="color:var(--gold)">◈</span> ${gran} GF</div>
    </div>
  `;

  INTERVAL_ITEMS.forEach(item => {
    const affordable = item.currency === 'granfut' ? gran >= item.price : cash >= item.price;
    html += `
      <div class="iv-shop-item">
        <div class="iv-shop-icon">${item.icon}</div>
        <div class="iv-shop-body">
          <div class="iv-shop-name">${item.name}${item.premium?` <span class="badge badge-gold">GF</span>`:''}</div>
          <div class="iv-shop-desc">${item.desc}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:var(--fd);font-size:.9rem;color:${item.currency==='granfut'?'var(--gold)':'var(--green)'}">
            ${item.currency==='granfut'?'◈':'R$'} ${item.price.toLocaleString('pt-BR')}
          </div>
          <button class="btn btn-xs ${affordable?'btn-primary':'btn-ghost'} mt10"
            ${affordable?'':'disabled'} onclick="buyIntervalItem('${item.id}')">
            ${affordable?'Comprar':'Sem saldo'}
          </button>
        </div>
      </div>`;
  });
  return html;
}

// ─── Táticas ────────────────────────────────────────────────────────────────
function _buildTaticasHTML() {
  const curForm   = G?.team?.formation || '4-3-3';
  const curTactic = G?.team?.tactic    || 'normal';

  let html = `<div class="iv-section-title">FORMAÇÃO</div>
  <div class="iv-formations">`;

  Object.values(FORMATIONS_DB).forEach(f => {
    html += `<div class="iv-formation ${f.name===curForm?'active':''}" onclick="applyFormation('${f.name}')">
      <div class="iv-form-name">${f.name}</div>
      <div class="iv-form-desc">${f.desc}</div>
    </div>`;
  });
  html += `</div>
  <div class="iv-section-title" style="margin-top:14px">TÁTICA</div>
  <div class="iv-tactics">`;

  TACTICS_DB.forEach(t => {
    html += `<div class="iv-tactic ${t.id===curTactic?'active':''}" onclick="applyTactic('${t.id}')">
      <span class="iv-tac-icon">${t.icon}</span>
      <span class="iv-tac-name">${t.name}</span>
      <span class="iv-tac-desc">${t.desc}</span>
    </div>`;
  });
  html += `</div>`;
  return html;
}

// ─── Substituições ───────────────────────────────────────────────────────────
function _buildSubsHTML() {
  const squad = G?.team?.squad || [];

  if (_subsUsed >= MAX_SUBS) {
    return `<div class="empty">🔒 Limite de ${MAX_SUBS} substituições atingido.<br><small>Regra do campeonato.</small></div>`;
  }

  if (_subOut) {
    // Etapa 2: escolher quem entra
    const candidates = squad
      .filter(p => p.id !== _subOut.id && !p.injured && !p._expelled)
      .sort((a,b) => (b.energy||70) - (a.energy||70));

    let html = `
      <div style="background:var(--rdim);border:1px solid rgba(245,54,92,.4);border-radius:var(--rx);padding:9px 12px;margin-bottom:10px;font-size:.82rem">
        Saindo: <strong style="color:var(--red)">${_subOut.name}</strong>
        <br><small style="color:var(--t2)">Quem entra no lugar?</small>
      </div>
      <button class="btn btn-ghost btn-xs" onclick="cancelSubSelect()" style="margin-bottom:10px">← Voltar</button>
    `;
    candidates.forEach(p => { html += _subCard(p, 'in'); });
    return html;
  }

  // Etapa 1: quem sai (ordenar por urgência: lesionado > amarelo > cansado)
  const sorted = [...squad].sort((a,b) => {
    const s = p => (p.injured?8:0) + (p._yellow?4:0) + ((p.energy||70)<50?2:0);
    return s(b) - s(a);
  });

  let html = `<div style="font-size:.78rem;color:var(--t2);margin-bottom:10px;">
    Selecione o jogador que <strong style="color:var(--red)">sai</strong> (${MAX_SUBS - _subsUsed} sub(s) restante(s)):
  </div>`;
  sorted.forEach(p => { html += _subCard(p, 'out'); });
  return html;
}

function _subCard(p, action) {
  const en = p.energy || 70;
  const enColor = en >= 70 ? 'var(--green)' : en >= 50 ? 'var(--gold)' : 'var(--red)';
  const flags = [
    p.injured    ? `<span class="badge badge-red"  style="font-size:.55rem">LESIONADO</span>` : '',
    p._yellow    ? `<span class="badge badge-gold" style="font-size:.55rem">AMARELO</span>`   : '',
    en < 50      ? `<span class="badge badge-red"  style="font-size:.55rem">CANSADO</span>`   : '',
  ].filter(Boolean).join(' ');

  const clickFn  = action === 'out' ? `selectSubOut('${p.id}')` : `confirmSub('${p.id}')`;
  const btnLabel = action === 'out' ? 'Tirar' : 'Colocar';
  const btnCls   = action === 'out' ? 'btn-danger' : 'btn-primary';

  return `
    <div class="iv-sub-card">
      <div class="iv-sub-info">
        <span class="pc-pos">${p.position||'—'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
          <div style="font-size:.68rem;color:var(--t2)">OVR ${p.overall||60} &middot; ⚡ <span style="color:${enColor}">${en}%</span> ${flags}</div>
        </div>
      </div>
      <button class="btn btn-xs ${btnCls}" onclick="${clickFn}" style="flex-shrink:0">${btnLabel}</button>
    </div>`;
}

// ════════════════════════════════════════════════════
// AÇÕES DE SUBSTITUIÇÃO
// ════════════════════════════════════════════════════
window.selectSubOut = function(pid) {
  const p = G?.team?.squad.find(x => x.id === pid);
  if (!p) return;
  _subOut = p;
  _refreshSubContent();
};

window.cancelSubSelect = function() {
  _subOut = null;
  _refreshSubContent();
};

window.confirmSub = function(inPid) {
  if (!_subOut || _subsUsed >= MAX_SUBS) return;
  const inP = G?.team?.squad.find(x => x.id === inPid);
  if (!inP) return;

  // Jogador que entra: boost de energia
  const boost = _freshNextSub ? 100 : Math.min(100, (inP.energy||70) + 25);
  inP.energy  = boost;
  _freshNextSub = false;

  // Jogador que sai: deixa registro
  _subOut._subbed = true;

  _subsUsed++;
  toast(`🔄 ${inP.name} ↑  ${_subOut.name} ↓`, 'var(--green)');
  _subOut = null;

  // Atualiza poder do time no engine
  if (ActiveEngine?.home) {
    ActiveEngine.home.power = _calcPower();
  }

  _refreshSubContent();
  renderSquad?.();
  saveGame?.();
};

function _refreshSubContent() {
  const isPaused   = document.getElementById('pause-panel')?.style.display !== 'none';
  const isInterval = document.getElementById('interval-panel')?.style.display !== 'none';

  if (isPaused && _iTab === 'subs') {
    const c = document.getElementById('pause-content');
    if (c) c.innerHTML = _buildSubsHTML();
    document.querySelectorAll('.ptab').forEach(t => t.classList.toggle('active', t.dataset.tab === _iTab));
  } else if (isInterval && _iTab === 'subs') {
    const c = document.getElementById('interval-content');
    if (c) c.innerHTML = _buildSubsHTML();
  }
}

// ════════════════════════════════════════════════════
// AÇÕES DE TÁTICA/FORMAÇÃO
// ════════════════════════════════════════════════════
window.applyFormation = function(name) {
  if (!G) return;
  G.team.formation = name;
  const f = FORMATIONS_DB[name];
  if (f && ActiveEngine?.home) {
    ActiveEngine.home.power     = _calcPower() + f.powerMod + _tacticMod().powerMod;
    ActiveEngine.home.aggression = Math.min(100, Math.max(0, (G.team.aggression||50) + f.aggrMod + _tacticMod().aggrMod));
  }
  toast(`📋 Formação ${name} aplicada!`, 'var(--blue)');
  _renderInterval();
  saveGame?.();
};

window.applyTactic = function(id) {
  if (!G) return;
  G.team.tactic = id;
  const t = TACTICS_DB.find(x => x.id === id);
  if (t && ActiveEngine?.home) {
    const f = FORMATIONS_DB[G.team.formation] || { powerMod:0, aggrMod:0 };
    ActiveEngine.home.power      = _calcPower() + f.powerMod + t.powerMod;
    ActiveEngine.home.aggression = Math.min(100, Math.max(0, (G.team.aggression||50) + f.aggrMod + t.aggrMod));
  }
  toast(`${t?.icon||'⚙️'} Tática "${t?.name||id}" aplicada!`, 'var(--blue)');
  _renderInterval();
  saveGame?.();
};

function _tacticMod() {
  const id = G?.team?.tactic || 'normal';
  return TACTICS_DB.find(x => x.id === id) || { powerMod:0, aggrMod:0 };
}

function _calcPower() {
  const squad = G?.team?.squad || [];
  if (!squad.length) return 60;
  const top11 = [...squad].sort((a,b) => (b.overall||60) - (a.overall||60)).slice(0,11);
  const avgOvr = top11.reduce((s,p) => s + (p.overall||60), 0) / top11.length;
  const avgEn  = top11.reduce((s,p) => s + (p.energy||70),  0) / top11.length;
  return Math.round(avgOvr * (avgEn / 100));
}

// ════════════════════════════════════════════════════
// COMPRA NA LOJA DO VESTIÁRIO
// ════════════════════════════════════════════════════
window.buyIntervalItem = function(itemId) {
  if (!G) return;
  const item = INTERVAL_ITEMS.find(x => x.id === itemId);
  if (!item) return;

  const cash = G.team.finances.cash || 0;
  const gran = G.userProfile.granFut || 0;

  if (item.currency === 'common'  && cash < item.price) { toast('💸 Saldo insuficiente!', 'var(--red)'); return; }
  if (item.currency === 'granfut' && gran < item.price) { toast('◈ GranFut insuficiente!', 'var(--red)'); return; }

  if (item.currency === 'common')  G.team.finances.cash    -= item.price;
  else                              G.userProfile.granFut   -= item.price;

  switch (item.effect) {
    case 'ENERGY_40':
      G.team.squad.forEach(p => p.energy = Math.min(100, (p.energy||70) + 40));
      if (G.soloPlayer) G.soloPlayer.energy = Math.min(100, (G.soloPlayer.energy||70) + 40);
      if (ActiveEngine?.home) ActiveEngine.home.power = _calcPower();
      break;
    case 'ENERGY_30PCT':
      G.team.squad.forEach(p => p.energy = Math.min(100, Math.round((p.energy||70) * 1.30)));
      if (ActiveEngine?.home) ActiveEngine.home.power = _calcPower();
      break;
    case 'MORAL_20':
      G.team.moral = Math.min(100, (G.team.moral||70) + 20);
      if (ActiveEngine?.home) ActiveEngine.home.moral = G.team.moral;
      break;
    case 'HEAL_ALL':
      G.team.squad.forEach(p => {
        if (p.injured) { p.injured = false; p.injuredWeeks = 0; p.energy = Math.min(100, (p.energy||50) + 20); }
      });
      break;
    case 'ATK_BOOST':
      if (ActiveEngine?.home) ActiveEngine.home.power = Math.min(99, (ActiveEngine.home.power||60) + 15);
      break;
    case 'SUB_ENERGY':
      _freshNextSub = true;
      break;
  }

  toast(`${item.icon} ${item.name} aplicado!`, 'var(--gold)');
  _renderInterval();
  renderHeader?.();
  saveGame?.();
};

// ════════════════════════════════════════════════════
// PAUSA DURANTE O JOGO
// ════════════════════════════════════════════════════
window.togglePauseMatch = function() {
  if (!ActiveEngine) return;
  const pauseBtn = document.getElementById('btn-pause');

  if (ActiveEngine._paused && document.getElementById('pause-panel').style.display !== 'none') {
    // Já pausado → retomar
    closePausePanel();
    ActiveEngine.resume();
    if (pauseBtn) pauseBtn.textContent = '⏸ Pausar';
  } else {
    // Pausar
    ActiveEngine.pause();
    if (pauseBtn) pauseBtn.textContent = '▶ Retomar';
    _iTab   = 'subs';
    _subOut = null;
    _renderPause();
    document.getElementById('pause-panel').style.display = 'flex';
  }
};

window.resumeFromPause = function() {
  closePausePanel();
  if (ActiveEngine?._paused) ActiveEngine.resume();
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) pauseBtn.textContent = '⏸ Pausar';
};

window.closePausePanel = function() {
  const panel = document.getElementById('pause-panel');
  if (panel) panel.style.display = 'none';
};

window.switchPauseTab = function(tab) {
  _iTab   = tab;
  _subOut = null;
  _renderPause();
};

function _renderPause() {
  document.querySelectorAll('.ptab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === _iTab)
  );
  const content = document.getElementById('pause-content');
  if (!content) return;
  switch (_iTab) {
    case 'subs':    content.innerHTML = _buildSubsHTML();    break;
    case 'taticas': content.innerHTML = _buildTaticasHTML(); break;
    case 'loja':    content.innerHTML = _buildLojaHTML();    break;
  }
}

// ════════════════════════════════════════════════════
// Patch: esconder botão Pausa quando jogo termina
// ════════════════════════════════════════════════════
(function() {
  const _orig = window.processMatchResult;
  if (_orig) {
    window.processMatchResult = function(result) {
      closePausePanel();
      document.getElementById('pause-panel').style.display = 'none';
      const pauseBtn = document.getElementById('btn-pause');
      if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.textContent = '⏸ Pausar'; }
      _orig(result);
    };
  }
})();

// Reativa botão de pausa quando novo jogo começa
(function() {
  const _orig = window.openMatchScreen;
  if (_orig) {
    window.openMatchScreen = function() {
      _subsUsed     = 0;
      _subOut       = null;
      _freshNextSub = false;
      const pauseBtn = document.getElementById('btn-pause');
      if (pauseBtn) { pauseBtn.disabled = false; pauseBtn.textContent = '⏸ Pausar'; }
      _orig.apply(this, arguments);
    };
  }
})();
