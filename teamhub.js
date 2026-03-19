/* ════════════════════════════════════════════════════
   GranFut · teamhub.js
   1. Fix loja GranFut (state.user → state.userProfile)
   2. Campo dinâmico por formação
   3. Header nome do time clicável → painel do clube
   4. Tutorial / guia com mascote
   Saieso Seraos Edition v1.0
   ════════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════════════════
   1. FIX LOJA GRANFUT
   applyShopEffect usa state.user (errado) → state.userProfile
   ══════════════════════════════════════════ */
(function patchApplyShopEffect() {
  function tryPatch() {
    if (!window.GranFutFinance?.applyShopEffect) { setTimeout(tryPatch, 150); return; }

    // Substituímos a referência dentro do módulo por monkey-patch do buyShopItem
    const origBuy = window.buyShopItem;
    if (!origBuy) return;

    window.buyShopItem = function(itemId) {
      const item = GranFutFinance.SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) { toast('Item não encontrado.', 'var(--red)'); return; }

      // Verifica saldo
      if (item.currency === 'granfut') {
        if ((G.userProfile.granFut || 0) < item.price) {
          toast('◈ GranFut insuficiente!', 'var(--red)'); return;
        }
        G.userProfile.granFut -= item.price;
      } else {
        if ((G.team.finances.cash || 0) < item.price) {
          toast('💸 Saldo insuficiente!', 'var(--red)'); return;
        }
        G.team.finances.cash -= item.price;
      }

      // Aplica efeito
      const eff = item.effect;
      let desc = item.name;
      switch (eff.type) {
        case 'ENERGY':
          if (G.soloPlayer) G.soloPlayer.energy = Math.min(100,(G.soloPlayer.energy||0)+eff.value);
          break;
        case 'TEAM_ENERGY':
          G.team.squad.forEach(p => p.energy = Math.min(100,(p.energy||0)+eff.value));
          break;
        case 'HEAL':
          const injured = G.team.squad.find(p => p.injured);
          if (injured) { injured.injured = false; injured.injuredWeeks = 0; }
          break;
        case 'MORAL':
          G.team.moral = eff.value;
          break;
        case 'TICKET_BOOST':
          G.ticketBoostNext = (G.ticketBoostNext||1) * eff.multiplier;
          break;
        case 'TRAIN_BOOST':
          G.trainBoostNext = eff.value;
          break;
        case 'PREMIUM_MARKET': {
          const extra = Array.from({length: eff.count}, () =>
            GranFutData.generatePlayer(G.team.division, GranFutData.pick(['ATA','MEI','ZAG','LAT'])));
          G.market = [...extra, ...G.market];
          break;
        }
        case 'SCOUT':
          if (!G.shopEffects) G.shopEffects = [];
          G.shopEffects.push('scout_reveal_hidden');
          break;
        case 'YOUTH':
          if (!G.team.youth) G.team.youth = [];
          for (let i = 0; i < eff.count; i++)
            G.team.youth.push(GranFutData.generatePlayer(G.team.division,
              GranFutData.pick(['ATA','MEI','ZAG'])));
          break;
        case 'ALL_STATS':
          if (G.soloPlayer) {
            ['pace','strength','stamina','dexterity','intelligence','shooting','defending']
              .forEach(k => G.soloPlayer[k] = Math.min(99,(G.soloPlayer[k]||60)+eff.value));
          }
          break;
        case 'SECRET': {
          const rewards = [
            { d:'◈ 200 GranFut de bônus!',         fn:s => s.userProfile.granFut = (s.userProfile.granFut||0)+200 },
            { d:'+10 Pace por 10 jogos (solo)',      fn:s => { if(s.soloPlayer) s.soloPlayer.pace=Math.min(99,(s.soloPlayer.pace||60)+10); } },
            { d:'+50 Reputação (solo)',              fn:s => { if(s.soloPlayer) s.soloPlayer.reputation=(s.soloPlayer.reputation||0)+50; } },
            { d:'R$ 50.000 de contrato secreto!',   fn:s => s.team.finances.cash=(s.team.finances.cash||0)+50000 },
          ];
          const r = GranFutData.pick(rewards);
          r.fn(G);
          desc = '🎁 Pacote Secreto: ' + r.d;
          toast(desc, 'var(--gold)');
          renderShop?.(); renderHeader?.(); saveGame?.(); return;
        }
        case 'COSMETIC':
          openClubPanel('visual');
          toast('👕 Kit Visual desbloqueado! Personalize abaixo.', 'var(--purple)');
          renderShop?.(); renderHeader?.(); saveGame?.(); return;
      }

      toast(`✅ ${desc} aplicado!`, 'var(--green)');
      renderShop?.(); renderHeader?.(); renderSquad?.(); saveGame?.();
    };
    console.log('[teamhub] ✓ buyShopItem corrigido.');
  }
  tryPatch();
})();

/* ══════════════════════════════════════════
   2. CAMPO DINÂMICO POR FORMAÇÃO
   ══════════════════════════════════════════ */

// Mapa de formação → linhas de campo (quantos jogadores por linha, de ataque pra defesa)
const FORMATION_LINES = {
  '4-3-3':   [ ['ATA','ATA','ATA'], ['MEI','VOL','MEI'], ['LAT','ZAG','ZAG','LAT'], ['GOL'] ],
  '4-4-2':   [ ['ATA','ATA'], ['MEI','MEI','MEI','MEI'], ['LAT','ZAG','ZAG','LAT'], ['GOL'] ],
  '4-2-3-1': [ ['ATA'], ['MEI','MEI','MEI'], ['VOL','VOL'], ['LAT','ZAG','ZAG','LAT'], ['GOL'] ],
  '3-5-2':   [ ['ATA','ATA'], ['MEI','MEI','VOL','MEI','MEI'], ['ZAG','ZAG','ZAG'], ['GOL'] ],
  '5-3-2':   [ ['ATA','ATA'], ['MEI','VOL','MEI'], ['LAT','ZAG','ZAG','ZAG','LAT'], ['GOL'] ],
  '4-5-1':   [ ['ATA'], ['MEI','MEI','VOL','MEI','MEI'], ['LAT','ZAG','ZAG','LAT'], ['GOL'] ],
  '3-4-3':   [ ['ATA','ATA','ATA'], ['MEI','MEI','MEI','MEI'], ['ZAG','ZAG','ZAG'], ['GOL'] ],
  '4-1-4-1': [ ['ATA'], ['MEI','MEI','MEI','MEI'], ['VOL'], ['LAT','ZAG','ZAG','LAT'], ['GOL'] ],
};

// patchCampo DESATIVADO: squad.js é o responsável pelo screen-squad

function _renderCampoFormation() {
  const campo = document.getElementById('campo');
  if (!campo || !G) return;

  const formation = G.team?.formation || '4-3-3';
  const lines = FORMATION_LINES[formation] || FORMATION_LINES['4-3-3'];
  const squad  = G.team.squad.filter(p => !p.injured && !p.suspended && !p._expelled && !p._subbed);

  // Pool de jogadores por posição
  const pool = {};
  for (const p of squad) {
    if (!pool[p.position]) pool[p.position] = [];
    pool[p.position].push(p);
  }
  // Uso rastreado
  const used = new Set();

  function pickFromPool(pos) {
    const candidates = (pool[pos] || []).filter(p => !used.has(p.id));
    if (candidates.length) { const p = candidates[0]; used.add(p.id); return p; }
    // Fallback: qualquer disponível
    for (const pos2 of Object.keys(pool)) {
      const fb = (pool[pos2] || []).filter(p => !used.has(p.id));
      if (fb.length) { used.add(fb[0].id); return fb[0]; }
    }
    return null;
  }

  const linesHTML = lines.map(line => {
    const cells = line.map(pos => {
      const p = pickFromPool(pos);
      if (!p) return `<div class="campo-player inactive"><span class="cp-ovr">—</span>?<span class="cp-pos">${pos}</span></div>`;
      const en = p.energy || 70;
      const ec = en >= 70 ? '#00e87a' : en >= 50 ? '#ffc107' : '#f5365c';
      return `<div class="campo-player" style="cursor:pointer" onclick="openPlayerModal('${p.id}')">
        <span class="cp-ovr" style="color:${ec}">${p.overall}</span>
        ${p.name.split(' ')[0]}
        <span class="cp-pos">${p.position}</span>
      </div>`;
    }).join('');
    return `<div class="campo-line">${cells}</div>`;
  }).join('');

  campo.innerHTML = linesHTML;

  // Atualiza título do card
  const titleEl = campo.closest('.card')?.querySelector('.card-title');
  if (titleEl) titleEl.innerHTML = `<span class="dot"></span>FORMAÇÃO: ${formation}`;
}

function _renderSquadList() {
  const list = document.getElementById('squad-list');
  if (!list || !G) return;
  list.innerHTML = '';
  const order  = ['GOL','ZAG','LAT','VOL','MEI','ATA'];
  const sorted = [...G.team.squad].sort((a,b) => order.indexOf(a.position) - order.indexOf(b.position));

  for (const p of sorted) {
    const injBadge = p.injured   ? `<span class="badge badge-red" style="font-size:.58rem">🩼 ${p.injuredWeeks}sem</span>` : '';
    const susBadge = p.suspended ? `<span class="badge badge-gold" style="font-size:.58rem">🟥 Sus</span>` : '';
    const healBtn  = p.injured   ? `<button class="btn btn-xs btn-primary"  onclick="healPlayer('${p.id}');event.stopPropagation()">🏥 Curar</button>` : '';
    const clearBtn = p.suspended ? `<button class="btn btn-xs btn-secondary" onclick="clearSuspension('${p.id}');event.stopPropagation()">✓</button>` : '';
    const sellBtn  = !G.forSale.includes(p.id)
      ? `<button class="btn btn-xs btn-ghost" onclick="listForSale('${p.id}');event.stopPropagation()">Vender</button>`
      : `<button class="btn btn-xs btn-danger" onclick="removeFromSale('${p.id}');event.stopPropagation()">✕</button>`;
    const en    = p.energy || 70;
    const enClr = en >= 70 ? 'var(--green)' : en >= 50 ? 'var(--gold)' : 'var(--red)';

    list.innerHTML += `
    <div class="player-card ${p.injured?'injured':''} ${p.suspended?'suspended':''}"
         style="cursor:pointer" onclick="openPlayerModal('${p.id}')">
      <div class="pc-pos">${p.position}</div>
      <div class="pc-ovr" style="color:${enClr}">${p.overall}</div>
      <div class="pc-info">
        <div class="pc-name">${p.name} ${injBadge}${susBadge}</div>
        <div class="pc-sub">Idade ${p.age} · R$${(p.salary||0).toLocaleString('pt-BR')}/sem · ⚡ <span style="color:${enClr}">${en}</span></div>
      </div>
      <div class="pc-actions">${healBtn}${clearBtn}${sellBtn}</div>
    </div>`;
  }
}

/* ══════════════════════════════════════════
   3. PAINEL DO CLUBE (header nome clicável)
   ══════════════════════════════════════════ */
(function attachClubPill() {
  function tryAttach() {
    const pill = document.getElementById('hdr-club')?.closest('.pill');
    if (!pill) { setTimeout(tryAttach, 300); return; }
    if (pill.dataset.clubPatch) return;
    pill.dataset.clubPatch = '1';
    pill.style.cursor = 'pointer';
    pill.title = 'Clique para ver o clube';
    pill.addEventListener('click', () => openClubPanel('stats'));
  }
  document.addEventListener('DOMContentLoaded', tryAttach);

  // Re-attacha após renderHeader
  const origRH = window.renderHeader;
  if (origRH) window.renderHeader = function() { origRH.apply(this, arguments); tryAttach(); };
})();

const SHIELD_SHAPES = [
  { id:'s1', path:'M10,5 L90,5 L90,65 L50,92 L10,65 Z',          label:'Clássico'   },
  { id:'s2', path:'M50,5 L95,35 L82,85 L18,85 L5,35 Z',           label:'Pentagonal' },
  { id:'s3', path:'M10,10 L90,10 Q95,10 95,16 L95,70 L50,92 L5,70 L5,16 Q5,10 10,10 Z', label:'Moderno' },
  { id:'s4', path:'M50,5 L90,25 L90,75 L50,92 L10,75 L10,25 Z',   label:'Hexagonal'  },
  { id:'s5', path:'M50,5 C80,5 92,28 92,50 C92,78 74,92 50,92 C26,92 8,78 8,50 C8,28 20,5 50,5 Z', label:'Redondo' },
];

const THEME_COLORS = [
  { id:'default', label:'Padrão',   bg:'#060b10', accent:'#00e87a' },
  { id:'royal',   label:'Royal',    bg:'#060b18', accent:'#6c8bff' },
  { id:'crimson', label:'Crimson',  bg:'#0e0608', accent:'#ff4060' },
  { id:'amber',   label:'Âmbar',    bg:'#0c0a04', accent:'#ffc107' },
  { id:'violet',  label:'Violeta',  bg:'#0a0610', accent:'#b97cff' },
  { id:'teal',    label:'Teal',     bg:'#030f10', accent:'#00e5d4' },
];

window.openClubPanel = function(tab = 'stats') {
  document.getElementById('gf-club-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'gf-club-modal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(6,11,16,.98);z-index:600;display:flex;flex-direction:column;max-width:480px;margin:0 auto;font-family:'Rajdhani',sans-serif;animation:su .2s ease;`;
  modal.innerHTML = `
    ${_clubHeader()}
    <div id="cp-tabs" style="display:flex;background:var(--s1);border-bottom:1px solid var(--b1);flex-shrink:0;overflow-x:auto;scrollbar-width:none"></div>
    <div id="cp-content" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px"></div>
    <div style="padding:10px 14px;background:var(--s1);border-top:1px solid var(--b1);flex-shrink:0">
      <button class="btn btn-ghost btn-full" onclick="document.getElementById('gf-club-modal').remove()">✕ Fechar</button>
    </div>`;
  document.body.appendChild(modal);
  _buildCPTabs();
  _switchCPTab(tab);
};

function _clubHeader() {
  if (!G) return '';
  const t = G.team;
  return `<div style="background:linear-gradient(160deg,#0e2236,#091829);border-bottom:1px solid var(--b1);padding:14px 16px;flex-shrink:0;display:flex;align-items:center;gap:12px">
    <div id="cp-shield-preview">${window.buildShield ? buildShield(t, 52) : ''}</div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'Bebas Neue',cursive;font-size:1.4rem;letter-spacing:2px;line-height:1">${t.name}</div>
      <div style="font-size:.72rem;color:var(--t2);margin-top:3px">
        Divisão <strong style="color:var(--green)">${t.division}</strong> · 
        Moral <strong style="color:${t.moral>=70?'var(--green)':'var(--gold)'}">${t.moral}</strong> · 
        OVR médio <strong style="color:var(--t1)">${_avgOvr()}</strong>
      </div>
    </div>
    <button onclick="document.getElementById('gf-club-modal').remove()" style="background:rgba(255,255,255,.1);border:none;color:var(--t1);width:28px;height:28px;border-radius:50%;cursor:pointer;flex-shrink:0">✕</button>
  </div>`;
}

function _buildCPTabs() {
  const tabs = document.getElementById('cp-tabs');
  if (!tabs) return;
  const list = [
    { id:'stats',  label:'📊 Stats'   },
    { id:'visual', label:'🎨 Visual'  },
    { id:'news',   label:'📰 Notícias'},
    { id:'rename', label:'✏️ Nome'    },
  ];
  tabs.innerHTML = list.map(t => `
    <button class="cp-tab" data-tab="${t.id}" onclick="switchCPTab('${t.id}')"
      style="flex:0 0 auto;padding:10px 14px;background:none;border:none;border-bottom:2px solid transparent;
             color:var(--t3);font-family:'Rajdhani',sans-serif;font-size:.7rem;font-weight:700;
             cursor:pointer;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap">
      ${t.label}
    </button>`).join('');
}

window.switchCPTab = function(tab) { _switchCPTab(tab); };

function _switchCPTab(tab) {
  document.querySelectorAll('.cp-tab').forEach(t => {
    const a = t.dataset.tab === tab;
    t.style.color        = a ? 'var(--green)' : 'var(--t3)';
    t.style.borderBottom = a ? '2px solid var(--green)' : '2px solid transparent';
  });
  const content = document.getElementById('cp-content');
  if (!content) return;
  switch (tab) {
    case 'stats':  content.innerHTML = _cpStatsHTML();  break;
    case 'visual': content.innerHTML = _cpVisualHTML(); break;
    case 'news':   content.innerHTML = _cpNewsHTML();   break;
    case 'rename': content.innerHTML = _cpRenameHTML(); break;
  }
}

function _cpStatsHTML() {
  if (!G) return '';
  const cs = G.clubStats || {};
  const t  = G.team;
  const totalG = cs.wins + cs.draws + cs.losses || 0;
  const aprov  = totalG > 0 ? Math.round(((cs.wins||0)*3 + (cs.draws||0)) / (totalG*3) * 100) : 0;
  const wages  = (t.squad||[]).reduce((a,p) => a+(p.salary||0), 0);
  const goalList = (G.resultHistory||[]).slice(0,8);
  const gf = goalList.reduce((a,r) => a+(r.scoreH||0), 0);
  const ga = goalList.reduce((a,r) => a+(r.scoreA||0), 0);

  const blocks = [
    ['🏆', 'Vitórias',    cs.wins  || 0, 'var(--green)'],
    ['🤝', 'Empates',     cs.draws || 0, 'var(--gold)' ],
    ['📉', 'Derrotas',    cs.losses|| 0, 'var(--red)'  ],
    ['📊', 'Aproveit.',   aprov+'%',      'var(--blue)' ],
    ['⚽', 'Gols Feitos', gf,             'var(--green)'],
    ['🥅', 'Gols Sofrid.',ga,             'var(--red)'  ],
  ].map(([i,l,v,c]) => `
    <div style="background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:9px;text-align:center">
      <div style="font-size:.62rem;color:var(--t3);text-transform:uppercase;margin-bottom:2px">${i} ${l}</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:1.45rem;color:${c}">${v}</div>
    </div>`).join('');

  const infoRows = [
    ['Temporada',         `T${G.season||1} · Rodada ${G.round||1}`],
    ['Fase',              (G.competitionPhase||'MUNICIPAL').replace('_',' ')],
    ['Divisão',           t.division || 'G'],
    ['Moral do elenco',   t.moral || 70],
    ['OVR médio',         _avgOvr()],
    ['Folha salarial',    `R$ ${wages.toLocaleString('pt-BR')}/sem`],
    ['Saldo',             `R$ ${(t.finances?.cash||0).toLocaleString('pt-BR')}`],
    ['GranFut',           `◈ ${G.userProfile?.granFut || 0}`],
    ['Reputação',         G.soloPlayer?.reputation || t.reputation || 0],
  ].map(([l,v]) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--b1)">
      <span style="color:var(--t2);font-size:.8rem">${l}</span>
      <span style="color:var(--t1);font-size:.82rem;font-weight:600">${v}</span>
    </div>`).join('');

  // Últimas 5 partidas
  const hist = (G.resultHistory||[]).slice(0,5).map(r => {
    const c = r.outcome==='WIN'?'var(--green)':r.outcome==='DRAW'?'var(--gold)':'var(--red)';
    const l = r.outcome==='WIN'?'V':r.outcome==='DRAW'?'E':'D';
    return `<div style="display:flex;align-items:center;gap:7px;font-size:.77rem;padding:5px 0;border-bottom:1px solid var(--b1)">
      <span style="color:${c};font-family:'Bebas Neue',cursive;min-width:14px">${l}</span>
      <span style="color:var(--t2);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.home} <strong style="color:var(--t1)">${r.scoreH}–${r.scoreA}</strong> ${r.away}</span>
    </div>`;
  }).join('') || '<div style="color:var(--t3);font-size:.78rem;padding:8px 0">Sem partidas ainda.</div>';

  return `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:14px">${blocks}</div>
    <div style="background:var(--s2);border:1px solid var(--b1);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:8px">INFORMAÇÕES DO CLUBE</div>
      ${infoRows}
    </div>
    <div style="background:var(--s2);border:1px solid var(--b1);border-radius:12px;padding:12px">
      <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:6px">ÚLTIMAS PARTIDAS</div>
      ${hist}
    </div>`;
}

function _cpVisualHTML() {
  if (!G) return '';
  const t  = G.team;
  const [c1,c2] = t.colors || ['#cc0000','#ffffff'];
  const curShape = t.shieldShape || 's1';
  const curTheme = G._theme || 'default';

  const shapeOpts = SHIELD_SHAPES.map(s => `
    <div onclick="previewShield('${s.id}')"
      style="cursor:pointer;padding:8px;text-align:center;background:${s.id===curShape?'rgba(0,232,122,.12)':'var(--s2)'};
             border:2px solid ${s.id===curShape?'var(--green)':'var(--b1)'};border-radius:10px;">
      <svg width="38" height="38" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="${s.path}" fill="${c1}" stroke="${c2}" stroke-width="5"/>
        <text x="50" y="58" font-family="sans-serif" font-size="24" fill="${c2}" text-anchor="middle" font-weight="700">
          ${(t.shortName||t.name.slice(0,2)).slice(0,2).toUpperCase()}
        </text>
      </svg>
      <div style="font-size:.6rem;color:var(--t2);margin-top:3px">${s.label}</div>
    </div>`).join('');

  const themeOpts = THEME_COLORS.map(th => `
    <div onclick="applyTheme('${th.id}')"
      style="cursor:pointer;padding:8px 6px;text-align:center;background:${th.bg};
             border:2px solid ${th.id===curTheme?th.accent:'rgba(255,255,255,.1)'};border-radius:10px;">
      <div style="width:24px;height:24px;border-radius:50%;background:${th.accent};margin:0 auto 4px"></div>
      <div style="font-size:.62rem;color:${th.accent}">${th.label}</div>
    </div>`).join('');

  return `
    <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:8px">COR PRINCIPAL DO BRASÃO</div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <div style="flex:1">
        <label style="font-size:.7rem;color:var(--t2);display:block;margin-bottom:4px">Cor 1</label>
        <input type="color" value="${c1}" oninput="updateShieldColor(0,this.value)"
          style="width:100%;height:40px;border:1px solid var(--b2);border-radius:8px;background:none;cursor:pointer">
      </div>
      <div style="flex:1">
        <label style="font-size:.7rem;color:var(--t2);display:block;margin-bottom:4px">Cor 2</label>
        <input type="color" value="${c2}" oninput="updateShieldColor(1,this.value)"
          style="width:100%;height:40px;border:1px solid var(--b2);border-radius:8px;background:none;cursor:pointer">
      </div>
    </div>

    <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:8px">FORMATO DO BRASÃO</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:16px">${shapeOpts}</div>

    <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:8px">TEMA DA INTERFACE</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px">${themeOpts}</div>

    <button class="btn btn-primary btn-full" onclick="saveVisualChanges()">💾 Salvar Aparência</button>`;
}

function _cpNewsHTML() {
  const cache = G?.newsCache || [];
  const fallback = [
    `📢 Temporada ${G?.season||1}: ${G?.team?.name||'Seu time'} busca a classificação!`,
    '⚽ Mercado de transferências aquecido nesta rodada.',
    '🏆 Apenas os melhores avançam. Continue treinando!',
    '📊 Análise: equipes com moral alto têm 23% mais vitórias.',
    '🌟 Revelações da base animam torcedores de todo o Brasil.',
  ];
  const items = cache.length ? cache.map(n => n.title||n) : fallback;
  const rows  = items.map((t,i) => `
    <div style="padding:10px 12px;background:var(--s2);border:1px solid var(--b1);border-radius:10px;margin-bottom:7px">
      <div style="font-size:.75rem;color:var(--t3);margin-bottom:3px">📰 Notícia ${i+1}</div>
      <div style="font-size:.83rem;font-weight:600;line-height:1.4">${t}</div>
    </div>`).join('');
  return `
    <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:10px">PRINCIPAIS NOTÍCIAS</div>
    ${rows}
    <button class="btn btn-ghost btn-full" onclick="refreshNewsInPanel()" style="margin-top:4px">🔄 Atualizar Notícias</button>`;
}

function _cpRenameHTML() {
  if (!G) return '';
  const level  = (G.team?.squad||[]).length > 15 ? 2 : 1;
  const locked = level < 2;
  const cur    = G.team.name;
  return `
    <div style="background:${locked?'rgba(245,54,92,.08)':'rgba(0,232,122,.08)'};border:1px solid ${locked?'rgba(245,54,92,.3)':'rgba(0,232,122,.3)'};border-radius:12px;padding:12px;margin-bottom:14px;font-size:.82rem;line-height:1.5">
      ${locked
        ? '🔒 A troca de nome é liberada quando seu elenco tiver pelo menos 16 jogadores (nível 2).'
        : '✏️ Você pode renomear seu clube. A mudança é permanente.'
      }
    </div>
    ${locked ? '' : `
      <div style="font-family:'Bebas Neue',cursive;font-size:.85rem;letter-spacing:2px;color:var(--t2);margin-bottom:8px">NOME ATUAL: ${cur}</div>
      <input id="cp-rename-input" class="inp" type="text" maxlength="30" placeholder="Novo nome do clube" value="${cur}" style="margin-bottom:10px">
      <input id="cp-shortname-input" class="inp" type="text" maxlength="4" placeholder="Abreviação (ex: FCP)" style="margin-bottom:14px">
      <button class="btn btn-primary btn-full" onclick="applyClubRename()">✅ Renomear Clube</button>
    `}`;
}

// ── Visual actions ──────────────────────────────────
window.updateShieldColor = function(idx, color) {
  if (!G) return;
  if (!G.team.colors) G.team.colors = ['#cc0000','#ffffff'];
  G.team.colors[idx] = color;
  const prev = document.getElementById('cp-shield-preview');
  if (prev && window.buildShield) prev.innerHTML = buildShield(G.team, 52);
  const shapeArea = document.querySelector('[onclick*="previewShield"]');
  if (shapeArea) _switchCPTab('visual'); // re-render shapes with new colors
};

window.previewShield = function(shapeId) {
  if (!G) return;
  G.team.shieldShape = shapeId;
  _switchCPTab('visual');
  const prev = document.getElementById('cp-shield-preview');
  if (prev && window.buildShield) prev.innerHTML = buildShield(G.team, 52);
};

window.applyTheme = function(themeId) {
  if (!G) return;
  G._theme = themeId;
  _applyThemeCSS(themeId);
  _switchCPTab('visual');
};

function _applyThemeCSS(themeId) {
  const th = THEME_COLORS.find(t => t.id === themeId) || THEME_COLORS[0];
  const root = document.documentElement;
  root.style.setProperty('--bg',    th.bg);
  root.style.setProperty('--green', th.accent);
  root.style.setProperty('--gglow', th.accent + '44');
}

window.saveVisualChanges = function() {
  if (!G) return;
  saveGame?.();
  // Re-render shields in header
  renderHeader?.();
  renderSquad?.();
  toast('🎨 Aparência salva!', 'var(--purple)');
  document.getElementById('gf-club-modal')?.remove();
};

window.applyClubRename = function() {
  const name  = (document.getElementById('cp-rename-input')?.value||'').trim();
  const short = (document.getElementById('cp-shortname-input')?.value||'').trim().slice(0,4).toUpperCase();
  if (!name || name.length < 2) { toast('Nome inválido!', 'var(--red)'); return; }
  G.team.name      = name;
  if (short) G.team.shortName = short;
  // Update table
  const row = G.table?.find(r => r.isUser);
  if (row) row.name = name;
  renderHeader?.();
  saveGame?.();
  toast(`✅ Clube renomeado para ${name}!`, 'var(--green)');
  document.getElementById('gf-club-modal')?.remove();
};

window.refreshNewsInPanel = function() {
  if (!navigator.onLine) { toast('Sem conexão.', 'var(--red)'); return; }
  fetch('https://api.rss2json.com/v1/api.json?rss_url=https://ge.globo.com/servico/semantica/editorias/plantao/futebol/feed.rss')
    .then(r => r.json()).then(data => {
      if (data.items) {
        G.newsCache = data.items.slice(0,6).map(i => ({title: i.title}));
        _switchCPTab('news');
      }
    }).catch(() => toast('Erro ao buscar notícias.', 'var(--red)'));
};

// Patch buildShield to support shieldShape
(function patchBuildShield() {
  function tryPatch() {
    const orig = window.buildShield;
    if (!orig) { setTimeout(tryPatch, 200); return; }
    window.buildShield = function(team, size = 48) {
      if (!team) return '';
      const [c1,c2] = team.colors || ['#333','#fff'];
      const abbr    = (team.shortName || team.name.slice(0,2)).toUpperCase().slice(0,2);
      const shapeId = team.shieldShape || 's1';
      const shape   = SHIELD_SHAPES.find(s => s.id === shapeId) || SHIELD_SHAPES[0];
      return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="${shape.path}" fill="${c1}" stroke="${c2}" stroke-width="5"/>
        <text x="50" y="58" font-family="'Bebas Neue',sans-serif" font-size="26" fill="${c2}"
          text-anchor="middle" font-weight="700">${abbr}</text>
      </svg>`;
    };
    console.log('[teamhub] ✓ buildShield com formas personalizáveis.');
  }
  tryPatch();
})();

/* ══════════════════════════════════════════
   4. GUIA / TUTORIAL COM MASCOTE
   ══════════════════════════════════════════ */
const GUIDE_MASCOT = '🦅'; // Águia do GranFut

const GUIDE_TIPS = [
  { screen:'home',     text:'Este é seu painel principal! Aqui você acompanha posição, pontos, finanças e o próximo adversário. O botão verde simula a partida!' },
  { screen:'squad',    text:'No Elenco você vê seu time no campo e todos os jogadores. Clique em qualquer jogador para ver estatísticas detalhadas e aplicar upgrades!' },
  { screen:'match',    text:'Antes de jogar, analise o adversário. Você pode pausar a partida para fazer substituições e trocar táticas no intervalo!' },
  { screen:'league',   text:'A tabela mostra a classificação completa. A faixa verde indica as posições que avançam de fase. Ganhe 3 pontos na vitória!' },
  { screen:'transfer', text:'No Mercado você contrata novos jogadores e vende os seus. O orçamento de transferências é separado do saldo do clube.' },
  { screen:'training', text:'Treine obrigatoriamente a cada 2 jogos! Sem treino, os atributos regridem 5%. O treino extra dá mais XP mas cansa o elenco.' },
  { screen:'shop',     text:'A Loja tem itens com dinheiro comum (R$) e itens premium com GranFut (◈). GranFut é ganho em missões e conquistas!' },
  { screen:'missions', text:'Complete missões para ganhar GranFut, XP e itens especiais. Missões ocultas são reveladas por ações especiais em campo!' },
];

let _tutorialActive = false;
let _tutorialStep   = 0;

window.startTutorial = function() {
  _tutorialActive = true;
  _tutorialStep   = 0;
  _showTutorialStep(0);
};

function _showTutorialStep(step) {
  document.getElementById('gf-tutorial-overlay')?.remove();
  if (step >= GUIDE_TIPS.length) {
    _tutorialActive = false;
    toast(`${GUIDE_MASCOT} Tutorial completo! Boa sorte, técnico!`, 'var(--gold)');
    return;
  }
  const tip  = GUIDE_TIPS[step];
  const over = document.createElement('div');
  over.id    = 'gf-tutorial-overlay';
  over.style.cssText = `
    position:fixed;bottom:70px;left:10px;right:10px;max-width:460px;margin:0 auto;
    background:linear-gradient(135deg,#0d2236,#091a2a);
    border:1px solid rgba(0,232,122,.4);border-radius:16px;
    padding:14px 16px;z-index:900;
    font-family:'Rajdhani',sans-serif;
    box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 20px rgba(0,232,122,.15);
    animation:slideDown .3s ease;
  `;
  over.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="font-size:1.7rem;flex-shrink:0;line-height:1">${GUIDE_MASCOT}</span>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Bebas Neue',cursive;font-size:.9rem;letter-spacing:2px;color:var(--green);margin-bottom:4px">
          GUIA GRANFUT · ${step+1}/${GUIDE_TIPS.length}
        </div>
        <div style="font-size:.82rem;color:var(--t1);line-height:1.5">${tip.text}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
      <div style="display:flex;gap:4px">
        ${GUIDE_TIPS.map((_,i) => `<div style="width:${i===step?'16px':'6px'};height:5px;border-radius:3px;background:${i===step?'var(--green)':'var(--b3)'}"></div>`).join('')}
      </div>
      <div style="display:flex;gap:7px">
        ${step > 0 ? `<button class="btn btn-ghost btn-sm" onclick="_tutStep(${step-1})">← Anterior</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="_tutDismiss()">✕ Fechar</button>
        <button class="btn btn-primary btn-sm" onclick="_tutStep(${step+1})">
          ${step < GUIDE_TIPS.length-1 ? 'Próximo →' : '✅ Concluir'}
        </button>
      </div>
    </div>`;
  // Navigate to the relevant screen
  if (tip.screen && window.goTo && step > 0) goTo(tip.screen);
  document.body.appendChild(over);
}

window._tutStep    = function(s) { _tutorialStep = s; _showTutorialStep(s); };
window._tutDismiss = function()  { document.getElementById('gf-tutorial-overlay')?.remove(); _tutorialActive = false; };

// Guia Flutuante (botão sempre visível)
(function addGuideButton() {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (document.getElementById('gf-guide-fab')) return;
      const fab = document.createElement('button');
      fab.id = 'gf-guide-fab';
      fab.innerHTML = GUIDE_MASCOT;
      fab.title = 'Guia do GranFut';
      fab.style.cssText = `
        position:fixed;bottom:70px;right:12px;
        width:44px;height:44px;border-radius:50%;
        background:linear-gradient(135deg,#0d2a3e,#091a2a);
        border:2px solid rgba(0,232,122,.5);
        font-size:1.3rem;cursor:pointer;
        box-shadow:0 4px 16px rgba(0,0,0,.4),0 0 12px rgba(0,232,122,.2);
        z-index:100;display:flex;align-items:center;justify-content:center;
        transition:transform .15s;
      `;
      fab.onclick = () => openGuideFab();
      fab.addEventListener('mousedown', () => fab.style.transform = 'scale(.9)');
      fab.addEventListener('mouseup',   () => fab.style.transform = 'scale(1)');
      document.body.appendChild(fab);
    }, 600);
  });
})();

window.openGuideFab = function() {
  document.getElementById('gf-guide-menu')?.remove();
  const menu = document.createElement('div');
  menu.id = 'gf-guide-menu';
  menu.style.cssText = `
    position:fixed;bottom:125px;right:12px;
    background:var(--s1);border:1px solid var(--b2);border-radius:14px;
    padding:10px;z-index:200;min-width:200px;
    font-family:'Rajdhani',sans-serif;
    box-shadow:0 8px 24px rgba(0,0,0,.5);
    animation:su .2s ease;
  `;
  const curScreen = document.querySelector('.nav-item.active')?.dataset.screen || 'home';
  const screenTip = GUIDE_TIPS.find(t => t.screen === curScreen);
  menu.innerHTML = `
    <div style="font-family:'Bebas Neue',cursive;font-size:.9rem;letter-spacing:2px;color:var(--green);margin-bottom:8px">${GUIDE_MASCOT} GUIA</div>
    ${screenTip ? `
      <div style="background:var(--s2);border-radius:10px;padding:9px;font-size:.78rem;color:var(--t1);line-height:1.5;margin-bottom:8px">
        ${screenTip.text}
      </div>` : ''}
    <button class="btn btn-primary btn-full btn-sm" onclick="startTutorial();document.getElementById('gf-guide-menu').remove()" style="margin-bottom:6px">
      📖 Iniciar Tutorial Completo
    </button>
    <button class="btn btn-ghost btn-full btn-sm" onclick="document.getElementById('gf-guide-menu').remove()">✕ Fechar</button>`;
  document.body.appendChild(menu);
  // Fecha se clicar fora
  setTimeout(() => document.addEventListener('click', function h(e) {
    if (!menu.contains(e.target) && e.target.id !== 'gf-guide-fab') {
      menu.remove(); document.removeEventListener('click', h);
    }
  }), 100);
};

// ─── Auto-tutorial para novos jogadores ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!localStorage.getItem('gf_tutorial_done') && window.G) {
      localStorage.setItem('gf_tutorial_done','1');
      setTimeout(startTutorial, 1200);
    }
  }, 1500);
});

// ─── Restore theme on load ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (G?._theme && G._theme !== 'default') _applyThemeCSS(G._theme);
  }, 400);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function _avgOvr() {
  const sq = G?.team?.squad || [];
  if (!sq.length) return '—';
  return Math.round(sq.reduce((a,p) => a+(p.overall||60), 0) / sq.length);
}
