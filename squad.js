/* ════════════════════════════════════════════════════
   GranFut · squad.js  — Elenco & Campo Tático
   Única responsável pelo screen-squad:
   ▸ Seletor visual de formações
   ▸ Campo SVG dinâmico por formação
   ▸ Lista de jogadores clicável
   Sobrepõe qualquer versão anterior de renderSquad
   Saieso Seraos Edition v1.0
   ════════════════════════════════════════════════════ */
'use strict';

/* ─── Definição completa das formações ──────────────
   Cada linha = array de posições, do ATAQUE → DEFESA → GOL
   ────────────────────────────────────────────────── */
const SQ_FORMATIONS = {
  '4-3-3':   {
    label:'4-3-3', desc:'Ofensivo equilibrado',
    lines: [['ATA','ATA','ATA'], ['MEI','VOL','MEI'], ['LAT','ZAG','ZAG','LAT'], ['GOL']],
  },
  '4-4-2':   {
    label:'4-4-2', desc:'Clássico e sólido',
    lines: [['ATA','ATA'], ['MEI','MEI','MEI','MEI'], ['LAT','ZAG','ZAG','LAT'], ['GOL']],
  },
  '4-2-3-1': {
    label:'4-2-3-1', desc:'Controle do meio',
    lines: [['ATA'], ['MEI','MEI','MEI'], ['VOL','VOL'], ['LAT','ZAG','ZAG','LAT'], ['GOL']],
  },
  '3-5-2':   {
    label:'3-5-2', desc:'Domínio do meio-campo',
    lines: [['ATA','ATA'], ['MEI','MEI','VOL','MEI','MEI'], ['ZAG','ZAG','ZAG'], ['GOL']],
  },
  '5-3-2':   {
    label:'5-3-2', desc:'Defensivo compacto',
    lines: [['ATA','ATA'], ['MEI','VOL','MEI'], ['LAT','ZAG','ZAG','ZAG','LAT'], ['GOL']],
  },
  '4-5-1':   {
    label:'4-5-1', desc:'Ultra defensivo',
    lines: [['ATA'], ['MEI','MEI','VOL','MEI','MEI'], ['LAT','ZAG','ZAG','LAT'], ['GOL']],
  },
  '3-4-3':   {
    label:'3-4-3', desc:'Ataque total',
    lines: [['ATA','ATA','ATA'], ['MEI','MEI','MEI','MEI'], ['ZAG','ZAG','ZAG'], ['GOL']],
  },
  '4-1-4-1': {
    label:'4-1-4-1', desc:'Pivô no meio',
    lines: [['ATA'], ['MEI','MEI','MEI','MEI'], ['VOL'], ['LAT','ZAG','ZAG','LAT'], ['GOL']],
  },
};

const SQ_FORMATION_KEYS = Object.keys(SQ_FORMATIONS);

/* ─── Cores de energia ─────────────────────────────── */
function _enColor(en) {
  return en >= 70 ? 'var(--green)' : en >= 50 ? 'var(--gold)' : 'var(--red)';
}

/* ─── Pegar jogador do pool sem repetir ──────────────── */
function _pickPlayer(pool, usedIds, pos) {
  // Primeiro, posição exata
  for (const p of (pool[pos] || [])) {
    if (!usedIds.has(p.id)) { usedIds.add(p.id); return p; }
  }
  // Fallback: qualquer posição adjacente
  const fallbackOrder = { GOL:['ZAG'], ZAG:['LAT','VOL'], LAT:['ZAG','VOL'],
                          VOL:['MEI','ZAG'], MEI:['VOL','ATA'], ATA:['MEI'] };
  for (const alt of (fallbackOrder[pos] || [])) {
    for (const p of (pool[alt] || [])) {
      if (!usedIds.has(p.id)) { usedIds.add(p.id); return p; }
    }
  }
  // Qualquer um disponível
  for (const ps of Object.values(pool)) {
    for (const p of ps) {
      if (!usedIds.has(p.id)) { usedIds.add(p.id); return p; }
    }
  }
  return null;
}

/* ════════════════════════════════════════════════════
   RENDERIZAÇÃO PRINCIPAL DO ELENCO
   ════════════════════════════════════════════════════ */
function renderSquadScreen() {
  if (!window.G) return;

  const formation = G.team?.formation || '4-3-3';

  // 1. Seletor de formações
  _renderFormationSelector(formation);

  // 2. Campo tático SVG
  _renderCampoByFormation(formation);

  // 3. Lista de jogadores
  _renderPlayerList();
}

/* ─── Seletor de formações ─────────────────────────── */
function _renderFormationSelector(active) {
  const wrap = document.getElementById('squad-form-selector');
  if (!wrap) return;
  wrap.innerHTML = '';

  SQ_FORMATION_KEYS.forEach(key => {
    const f   = SQ_FORMATIONS[key];
    const btn = document.createElement('button');
    btn.textContent = f.label;
    btn.title       = f.desc;
    btn.className   = 'sq-form-btn';

    // Estilo inline (sem depender de class externa)
    const isActive = key === active;
    btn.style.cssText = `
      padding:5px 10px;border-radius:6px;font-family:'Rajdhani',sans-serif;
      font-weight:700;font-size:.78rem;cursor:pointer;transition:all .15s;
      background:${isActive ? 'var(--green)' : 'var(--s2)'};
      color:${isActive ? '#000' : 'var(--t2)'};
      border:2px solid ${isActive ? 'var(--green)' : 'var(--b2)'};
      box-shadow:${isActive ? '0 0 12px rgba(0,232,122,.3)' : 'none'};
    `;

    btn.addEventListener('click', () => {
      // Salva no estado
      G.team.formation = key;

      // Propaga ao engine se partida ativa
      if (window.ActiveEngine?.home && window.FORMATIONS_DB?.[key]) {
        const fmod = FORMATIONS_DB[key];
        const base = G.team.power || 60;
        ActiveEngine.home.power = Math.max(1, base + fmod.powerMod);
        ActiveEngine.home.aggression = Math.min(100, Math.max(0,
          (G.team.aggression || 50) + fmod.aggrMod));
      }

      // Re-renderiza sem chamar renderSquad() recursivo
      _renderFormationSelector(key);
      _renderCampoByFormation(key);

      // Atualiza título
      const titleEl = document.getElementById('squad-form-title');
      if (titleEl) titleEl.innerHTML = `<span class="dot"></span>FORMAÇÃO: <span style="color:var(--green)">${key}</span> <small style="font-size:.65rem;color:var(--t2);font-family:'Rajdhani',sans-serif"> — ${SQ_FORMATIONS[key].desc}</small>`;

      window.toast?.(`📋 Formação ${key}`, 'var(--blue)');
      window.saveGame?.();
    });

    wrap.appendChild(btn);
  });

  // Atualiza título
  const titleEl = document.getElementById('squad-form-title');
  const fObj    = SQ_FORMATIONS[active];
  if (titleEl && fObj) {
    titleEl.innerHTML = `<span class="dot"></span>FORMAÇÃO: <span style="color:var(--green)">${active}</span> <small style="font-size:.65rem;color:var(--t2);font-family:'Rajdhani',sans-serif"> — ${fObj.desc}</small>`;
  }
}

/* ─── Campo Tático SVG dinâmico ─────────────────────── */
function _renderCampoByFormation(formation) {
  const campo = document.getElementById('campo');
  if (!campo || !window.G) return;

  const fObj  = SQ_FORMATIONS[formation] || SQ_FORMATIONS['4-3-3'];
  const lines = fObj.lines;
  const squad = G.team.squad.filter(p =>
    !p.injured && !p.suspended && !p._expelled && !p._subbed
  );

  // Monta pool por posição
  const pool = {};
  for (const p of squad) {
    if (!pool[p.position]) pool[p.position] = [];
    pool[p.position].push(p);
  }
  const usedIds = new Set();

  // Gera HTML das linhas
  const linesHTML = lines.map((posArr, lineIdx) => {
    const isGolLine = posArr.length === 1 && posArr[0] === 'GOL';
    const cells = posArr.map(pos => {
      const p = _pickPlayer(pool, usedIds, pos);
      if (!p) {
        return `<div class="campo-player inactive">
          <span class="cp-ovr">—</span>
          <span style="font-size:.64rem">?</span>
          <span class="cp-pos">${pos}</span>
        </div>`;
      }
      const en  = p.energy || 70;
      const ec  = _enColor(en);
      const nm  = p.name.split(' ')[0];
      return `<div class="campo-player" style="cursor:pointer;border-color:${ec}30"
        onclick="window.openPlayerModal?.('${p.id}')">
        <span class="cp-ovr" style="color:${ec}">${p.overall}</span>
        <span style="font-size:.64rem;max-width:54px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${nm}</span>
        <span class="cp-pos">${p.position}</span>
      </div>`;
    }).join('');

    return `<div class="campo-line" style="margin-bottom:${isGolLine?'0':'2px'}">${cells}</div>`;
  }).join('');

  campo.innerHTML = linesHTML;
}

/* ─── Lista de jogadores ─────────────────────────────── */
function _renderPlayerList() {
  const list = document.getElementById('squad-list');
  if (!list || !window.G) return;
  list.innerHTML = '';

  const order  = ['GOL','ZAG','LAT','VOL','MEI','ATA'];
  const sorted = [...G.team.squad].sort((a,b) =>
    order.indexOf(a.position) - order.indexOf(b.position)
  );

  for (const p of sorted) {
    const en     = p.energy || 70;
    const ec     = _enColor(en);
    const injB   = p.injured   ? `<span class="badge badge-red"  style="font-size:.58rem">🩼 ${p.injuredWeeks||1}sem</span>` : '';
    const susB   = p.suspended ? `<span class="badge badge-gold" style="font-size:.58rem">🟥 Sus</span>` : '';
    const yellowB= p._yellow   ? `<span class="badge badge-gold" style="font-size:.58rem">🟡 Am.</span>` : '';
    const tired  = en < 50     ? `<span class="badge badge-red"  style="font-size:.58rem">⚡ Can</span>` : '';

    const healBtn  = p.injured   ? `<button class="btn btn-xs btn-primary"  onclick="healPlayer('${p.id}');event.stopPropagation()">🏥</button>` : '';
    const clearBtn = p.suspended ? `<button class="btn btn-xs btn-secondary" onclick="clearSuspension('${p.id}');event.stopPropagation()">✓</button>` : '';
    const saleBtn  = !G.forSale.includes(p.id)
      ? `<button class="btn btn-xs btn-ghost"  onclick="listForSale('${p.id}');event.stopPropagation()">Vender</button>`
      : `<button class="btn btn-xs btn-danger"  onclick="removeFromSale('${p.id}');event.stopPropagation()">✕</button>`;

    const card = document.createElement('div');
    card.className = `player-card ${p.injured?'injured':''} ${p.suspended?'suspended':''}`;
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="pc-pos">${p.position}</div>
      <div class="pc-ovr" style="color:${ec}">${p.overall}</div>
      <div class="pc-info">
        <div class="pc-name">${p.name} ${injB}${susB}${yellowB}${tired}</div>
        <div class="pc-sub">Idade ${p.age} · R$${(p.salary||0).toLocaleString('pt-BR')}/sem · ⚡<span style="color:${ec}">${en}</span></div>
      </div>
      <div class="pc-actions">${healBtn}${clearBtn}${saleBtn}</div>`;

    card.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      window.openPlayerModal?.(p.id);
    });

    list.appendChild(card);
  }
}

/* ════════════════════════════════════════════════════
   INSTALA: sobrepõe renderSquad definitivamente
   ════════════════════════════════════════════════════ */
(function installSquadRenderer() {
  // Espera o app.js carregar e registrar renderSquad
  function install() {
    if (typeof window.renderSquad === 'undefined') {
      setTimeout(install, 100); return;
    }
    // Substitui completamente
    window.renderSquad = renderSquadScreen;
    console.log('[squad.js] ✓ renderSquad instalado — campo dinâmico ativo.');
  }
  install();
})();
