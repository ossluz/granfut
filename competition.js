/* ════════════════════════════════════════════════════
   GranFut · competition.js — Sistema de Competição
   Municipal → Estadual → Nacional
   Simulação IA, fim de temporada, promoção
   Saieso Seraos Edition v1.0
   ════════════════════════════════════════════════════ */
'use strict';

// ════════════════════════════════════════════════════
// PATCH: buildDefaultState — adiciona fase de competição
// ════════════════════════════════════════════════════
(function() {
  const _orig = window.buildDefaultState;
  if (!_orig) { console.warn('[competition.js] buildDefaultState não encontrado'); return; }

  window.buildDefaultState = function(config) {
    const state   = _orig(config);
    const stateUF = config.state || 'SP';
    const regionIdx = Math.floor(Math.random() * 4);

    // Adiciona campos de competição
    state.competitionPhase  = 'MUNICIPAL';
    state.currentRegion     = regionIdx;
    state.currentRegionName = GranFutData.getRegionName(stateUF, regionIdx);
    state.seasonRound       = 1;
    state.totalRounds       = GranFutData.totalRounds(20); // 20 times → 38 rodadas

    // Regenera liga regional (20 times, poder 10-14)
    const aiTeams = GranFutData.generateRegionalLeague(stateUF, regionIdx, config.gender);
    aiTeams.forEach(t => {
      t.regionIdx  = regionIdx;
      t.regionName = GranFutData.getRegionName(stateUF, regionIdx);
    });
    state.team.regionIdx  = regionIdx;
    state.team.regionName = GranFutData.getRegionName(stateUF, regionIdx);
    state.leagueTeams = [state.team, ...aiTeams];
    state.table       = GranFutData.buildLeagueTable(state.leagueTeams);
    state.schedule    = GranFutData.buildSchedule(state.leagueTeams);

    return state;
  };
})();

// ════════════════════════════════════════════════════
// PATCH: processMatchResult — simula IA + verifica fim
// ════════════════════════════════════════════════════
(function() {
  const _orig = window.processMatchResult;
  if (!_orig) { console.warn('[competition.js] processMatchResult não encontrado'); return; }

  window.processMatchResult = function(result) {
    // 1) Lógica original (pontos do user, histórico, missões, etc.)
    _orig(result);

    // 2) Simula uma rodada de IA para manter tabela viva
    _simulateAIRound();

    // 3) Verifica fim de temporada
    _checkSeasonEnd();
  };
})();

// ════════════════════════════════════════════════════
// SIMULAÇÃO DE RODADA IA
// Após cada partida do user, simula N partidas IA
// ════════════════════════════════════════════════════
function _simulateAIRound() {
  if (!G || !G.table) return;

  const aiRows = G.table.filter(r => !r.isUser);
  if (aiRows.length < 2) return;

  // Embaralha e pega pares (simula ~metade dos times jogando)
  const shuffled = [...aiRows].sort(() => Math.random() - 0.5);
  const pairs    = Math.floor(shuffled.length / 2);

  for (let i = 0; i < pairs; i++) {
    _simulateAIMatch(shuffled[i * 2], shuffled[i * 2 + 1]);
  }

  // Não re-renderiza aqui para não travar — app.js já chama renderAll
}

function _simulateAIMatch(homeRow, awayRow) {
  const homePow = homeRow._power || 12;
  const awayPow = awayRow._power || 12;
  const total   = homePow + awayPow + 8; // vantagem de mandante
  const homeP   = (homePow + 4) / total;

  const r = Math.random();
  let outcome;
  if      (r < homeP * 0.55)                      outcome = 'HOME';
  else if (r < homeP * 0.55 + 0.28)               outcome = 'DRAW';
  else                                              outcome = 'AWAY';

  const hg = rndAI(0, 3);
  const ag = outcome === 'HOME' ? Math.max(0, hg - rndAI(1,2))
           : outcome === 'AWAY' ? hg + rndAI(1,2)
           : hg;

  if (outcome === 'HOME') {
    homeRow.pts += 3; homeRow.wins++;
    homeRow.form = ['V', ...(homeRow.form||[])].slice(0,5);
    awayRow.losses++;
    awayRow.form = ['D', ...(awayRow.form||[])].slice(0,5);
  } else if (outcome === 'DRAW') {
    homeRow.pts += 1; awayRow.pts += 1;
    homeRow.draws++; awayRow.draws++;
    homeRow.form = ['E', ...(homeRow.form||[])].slice(0,5);
    awayRow.form = ['E', ...(awayRow.form||[])].slice(0,5);
  } else {
    awayRow.pts += 3; awayRow.wins++;
    awayRow.form = ['V', ...(awayRow.form||[])].slice(0,5);
    homeRow.losses++;
    homeRow.form = ['D', ...(homeRow.form||[])].slice(0,5);
  }
  homeRow.pj++; awayRow.pj++;
  homeRow.gf += hg; homeRow.ga += ag;
  awayRow.gf += ag; awayRow.ga += hg;
}

function rndAI(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ════════════════════════════════════════════════════
// VERIFICAÇÃO DE FIM DE TEMPORADA
// ════════════════════════════════════════════════════
function _checkSeasonEnd() {
  if (!G) return;
  const myRow = G.table.find(r => r.isUser);
  if (!myRow) return;

  const totalRds = G.totalRounds || GranFutData.totalRounds(20);

  // Usa G.round como proxy de rodadas jogadas pelo user
  if ((G.round - 1) < totalRds) return; // ainda tem rodadas

  // Fim de temporada!
  setTimeout(() => _endSeason(), 400);
}

// ════════════════════════════════════════════════════
// FIM DE TEMPORADA — promove ou rebaixa
// ════════════════════════════════════════════════════
function _endSeason() {
  if (!G) return;
  const phase   = G.competitionPhase || 'MUNICIPAL';
  const cfg     = GranFutData.COMPETITION_PHASES[phase];
  if (!cfg)     return;

  const sorted  = [...G.table].sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return (b.gf - b.ga) - (a.gf - a.ga);
  });

  const userPos = sorted.findIndex(r => r.isUser) + 1;
  const qualN   = cfg.qualifiers;
  const qualified = userPos <= qualN;

  // Mensagem de fim de temporada
  const phase_label = cfg.label;
  const next_label  = cfg.nextPhase ? GranFutData.COMPETITION_PHASES[cfg.nextPhase]?.label : null;

  let msg = '';
  if (qualified && next_label) {
    msg = `🏆 PARABÉNS! Você terminou em ${userPos}º lugar no ${phase_label} e se classificou para o ${next_label}!`;
    _advanceToNextPhase(cfg.nextPhase);
  } else if (qualified && !next_label) {
    msg = `🎉 Você venceu o ${phase_label}! Você chegou ao topo do futebol brasileiro!`;
    G.userProfile.granFut = (G.userProfile.granFut || 0) + 2000;
  } else {
    msg = `📉 Você terminou em ${userPos}º lugar no ${phase_label}. Não se classificou (top ${qualN} necessário). Tente na próxima temporada!`;
    _resetSeason(phase);
  }

  toast(msg, qualified ? 'var(--gold)' : 'var(--red)');
  _showSeasonSummary(sorted, userPos, qualified, cfg);
  saveGame?.();
}

// ─── Avança para próxima fase ────────────────────────────────────────────────
function _advanceToNextPhase(nextPhase) {
  if (!G || !nextPhase) return;
  const stateUF  = G.team.state || 'SP';
  const gender   = G.team.gender || 'M';
  const nextDiv  = GranFutData.getDivisionForPhase(nextPhase);

  G.competitionPhase = nextPhase;
  G.season++;
  G.round         = 1;
  G.seasonRound   = 1;
  G.totalRounds   = GranFutData.totalRounds(20);
  G.resultHistory = [];

  // Atualiza divisão e poder do time do user
  G.team.division = nextDiv;
  G.team.power    = Math.max(G.team.power, GranFutData.COMPETITION_PHASES[nextPhase].powerBase - 2);

  // Gera nova liga baseada na próxima fase
  let aiTeams = [];
  if (nextPhase === 'ESTADUAL') {
    aiTeams = GranFutData.generateStateChampionshipTeams(stateUF, gender);
    G.currentRegionName = `Estadual ${_stateName(stateUF)}`;
  } else if (nextPhase === 'NACIONAL_G') {
    aiTeams = GranFutData.generateNationalGTeams(gender);
    G.currentRegionName = 'Nacional · Série G';
  } else {
    aiTeams = GranFutData.generateLeague(nextDiv, null, gender, nextPhase, 19);
    G.currentRegionName = `${GranFutData.COMPETITION_PHASES[nextPhase].label} · Nacional`;
  }

  G.leagueTeams = [G.team, ...aiTeams];
  G.table       = GranFutData.buildLeagueTable(G.leagueTeams);
  G.schedule    = GranFutData.buildSchedule(G.leagueTeams);
  G.market      = GranFutData.generateMarket(nextDiv, 6);

  // Recompensa por promoção
  const cashBonus = GranFutData.COMPETITION_PHASES[nextPhase].budget * 0.1;
  G.team.finances.cash += cashBonus;
  G.clubStats.promotedThisSeason = true;

  renderAll?.();
}

// ─── Reseta temporada (não classificou) ─────────────────────────────────────
function _resetSeason(phase) {
  if (!G) return;
  G.season++;
  G.round         = 1;
  G.seasonRound   = 1;
  G.totalRounds   = GranFutData.totalRounds(20);
  G.resultHistory = [];
  G.clubStats.promotedThisSeason = false;

  // Regenera a mesma fase
  const stateUF  = G.team.state || 'SP';
  const gender   = G.team.gender || 'M';
  const div      = GranFutData.getDivisionForPhase(phase);
  const regionIdx = G.currentRegion || 0;

  let aiTeams = [];
  if (phase === 'MUNICIPAL') {
    aiTeams = GranFutData.generateRegionalLeague(stateUF, regionIdx, gender);
  } else if (phase === 'ESTADUAL') {
    aiTeams = GranFutData.generateStateChampionshipTeams(stateUF, gender);
  } else {
    aiTeams = GranFutData.generateLeague(div, null, gender, phase, 19);
  }

  G.leagueTeams = [G.team, ...aiTeams];
  G.table       = GranFutData.buildLeagueTable(G.leagueTeams);
  G.schedule    = GranFutData.buildSchedule(G.leagueTeams);

  renderAll?.();
}

// ─── Modal de Resumo da Temporada ────────────────────────────────────────────
function _showSeasonSummary(sorted, userPos, qualified, cfg) {
  // Remove modal antigo se existir
  const old = document.getElementById('season-summary-modal');
  if (old) old.remove();

  const next_cfg = cfg.nextPhase ? GranFutData.COMPETITION_PHASES[cfg.nextPhase] : null;

  const modal = document.createElement('div');
  modal.id    = 'season-summary-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(6,11,16,.97);z-index:500;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:20px;font-family:'Rajdhani',sans-serif;animation:su .3s ease;
    max-width:480px;margin:0 auto;
  `;

  // Top 8 da tabela
  const top8 = sorted.slice(0,8);
  const rowsHtml = top8.map((t,i) => {
    const q   = i < cfg.qualifiers;
    const me  = t.isUser;
    const bg  = me ? 'rgba(0,232,122,.12)' : q ? 'rgba(255,193,7,.06)' : 'transparent';
    const clr = me ? 'var(--green)' : q ? 'var(--gold)' : 'var(--t2)';
    const sg  = (t.gf - t.ga) >= 0 ? '+' : '';
    return `<tr style="color:${clr};background:${bg}">
      <td style="padding:5px 6px;font-family:'Bebas Neue',cursive;font-size:1rem">${i+1}</td>
      <td style="padding:5px 6px;font-weight:${me?'700':'400'}">${me?'⭐ ':''}${t.name}</td>
      <td style="padding:5px 6px;text-align:center">${t.pj}</td>
      <td style="padding:5px 6px;text-align:center;font-weight:700">${t.pts}</td>
      <td style="padding:5px 6px;text-align:center">${sg}${t.gf-t.ga}</td>
      ${q ? `<td style="padding:5px 2px;font-size:.7rem;color:var(--gold)">✓ Classif.</td>` : `<td></td>`}
    </tr>`;
  }).join('');

  modal.innerHTML = `
    <div style="width:100%;max-width:420px">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-family:'Bebas Neue',cursive;font-size:2rem;letter-spacing:4px;color:${qualified?'var(--gold)':'var(--red)'}">
          ${qualified ? '🏆 CLASSIFICADO!' : '📉 ELIMINADO'}
        </div>
        <div style="color:var(--t2);font-size:.85rem;margin-top:4px">Fim do ${cfg.label} · Temporada ${G?.season || 1}</div>
        <div style="font-size:1rem;margin-top:8px;font-weight:600">${userPos}º lugar de ${sorted.length} times</div>
      </div>

      <div style="background:var(--s1);border:1px solid var(--b1);border-radius:12px;overflow:hidden;margin-bottom:14px">
        <div style="padding:8px 10px;background:var(--s2);font-family:'Bebas Neue',cursive;font-size:.9rem;letter-spacing:2px;color:var(--t2)">
          CLASSIFICAÇÃO FINAL
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.82rem">
          <thead>
            <tr style="color:var(--t3);font-size:.65rem">
              <th style="padding:5px 6px;text-align:left">#</th>
              <th style="padding:5px 6px;text-align:left">Time</th>
              <th style="padding:5px 6px">PJ</th>
              <th style="padding:5px 6px">PTS</th>
              <th style="padding:5px 6px">SG</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        ${sorted.length > 8 ? `<div style="text-align:center;color:var(--t3);font-size:.72rem;padding:6px">+ ${sorted.length - 8} times...</div>` : ''}
      </div>

      <div style="background:${qualified?'rgba(0,232,122,.1)':'rgba(245,54,92,.1)'};border:1px solid ${qualified?'rgba(0,232,122,.3)':'rgba(245,54,92,.3)'};border-radius:10px;padding:12px;margin-bottom:14px;font-size:.85rem;line-height:1.5">
        ${qualified && next_cfg
          ? `✅ Você avançou para o <strong style="color:var(--green)">${next_cfg.label}</strong>!<br>Os ${cfg.qualifiers} melhores se classificam.`
          : qualified
          ? `🎉 Você venceu o nível máximo do GranFut!`
          : `❌ Apenas os <strong>${cfg.qualifiers}</strong> primeiros se classificam. Você ficou em <strong>${userPos}º</strong>. A temporada reinicia.`
        }
      </div>

      <button onclick="document.getElementById('season-summary-modal').remove()" class="btn btn-primary btn-full" style="font-size:.9rem">
        ${qualified && next_cfg ? `▶ Ir para o ${next_cfg.label}` : '▶ Nova Temporada'}
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function _stateName(uf) {
  const st = GranFutData.STATES.find(s => s.uf === uf);
  return st ? st.name : uf;
}

// ════════════════════════════════════════════════════
// PATCH: renderHeader — mostra fase atual
// ════════════════════════════════════════════════════
(function() {
  const _origRH = window.renderHeader;
  if (!_origRH) return;

  window.renderHeader = function() {
    _origRH();
    if (!G) return;
    // Sobrepõe o pill de temporada com fase atual
    const cfg   = GranFutData.COMPETITION_PHASES[G.competitionPhase] || {};
    const label = cfg.label || 'Municipal';
    const el    = document.getElementById('hdr-season');
    if (el) el.textContent = `T${G.season||1}·R${G.round||1} · ${label}`;
  };
})();

// ════════════════════════════════════════════════════
// PATCH: renderLeague — mostra título correto e zonas
// ════════════════════════════════════════════════════
(function() {
  const _origRL = window.renderLeague;
  if (!_origRL) return;

  window.renderLeague = function() {
    // Atualiza título da página de liga
    const titleEl = document.querySelector('#screen-league .page-title');
    if (titleEl && G) {
      const cfg  = GranFutData.COMPETITION_PHASES[G.competitionPhase] || {};
      const name = G.currentRegionName || cfg.label || 'Campeonato';
      titleEl.innerHTML = `🏆 ${name}`;
    }

    _origRL();

    // Adiciona legenda de zonas de classificação
    if (!G) return;
    const cfg   = GranFutData.COMPETITION_PHASES[G.competitionPhase] || {};
    const tbody = document.getElementById('table-body');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
      const pos = i + 1;
      if (pos <= (cfg.qualifiers || 5)) {
        row.style.borderLeft = '3px solid var(--green)';
      }
    });

    // Legenda
    const card = document.querySelector('#screen-league .card');
    if (card) {
      let legend = card.querySelector('.comp-legend');
      if (!legend) {
        legend = document.createElement('div');
        legend.className = 'comp-legend';
        card.appendChild(legend);
      }
      const cfg = GranFutData.COMPETITION_PHASES[G.competitionPhase] || {};
      const next = cfg.nextPhase ? GranFutData.COMPETITION_PHASES[cfg.nextPhase]?.label : null;
      const total = G.totalRounds || GranFutData.totalRounds(20);
      const played = Math.max(0, (G.round || 1) - 1);

      legend.innerHTML = `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--b1)">
          <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:var(--green);margin-bottom:4px">
            <div style="width:10px;height:3px;background:var(--green);border-radius:2px"></div>
            Top ${cfg.qualifiers||5} → ${next || 'Campeão'}</div>
          <div style="font-size:.7rem;color:var(--t3)">
            Rodada ${played}/${total} · ${G.competitionPhase||'MUNICIPAL'} · ${cfg.label||''}</div>
        </div>`;
    }
  };
})();

// ════════════════════════════════════════════════════
// PATCH: buildDefaultState — garante novos campos em
// saves já existentes (migração)
// ════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!G) return;
    if (!G.competitionPhase) G.competitionPhase = 'MUNICIPAL';
    if (!G.totalRounds)      G.totalRounds      = GranFutData.totalRounds(20);
    if (!G.currentRegionName) {
      const uf  = G.team?.state || 'SP';
      const idx = G.currentRegion || 0;
      G.currentRegionName = GranFutData.getRegionName(uf, idx);
    }
    // Garante _power em cada row da tabela (para simulação IA)
    if (G.table) {
      G.table.forEach(row => {
        if (!row._power) {
          const t = G.leagueTeams?.find(t => t.id === row.id);
          row._power = t?.power || 12;
        }
      });
    }
    renderHeader?.();
    renderLeague?.();
    saveGame?.();
  }, 300);
});
