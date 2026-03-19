/* ════════════════════════════════════════════════════
   GranFut · app.js  — Controlador Principal
   Estado, Navegação, UI, Game Loop, Modo Mestre
   Saieso Seraos Edition v1.0.0
   ════════════════════════════════════════════════════ */
'use strict';

// ════════════════════════════════════════════════════
// ESTADO GLOBAL
// ════════════════════════════════════════════════════
const SAVE_KEY   = 'granfut_save_v1';
const AUTOSAVE_INTERVAL = 30000; // 30s

let G = null;       // Estado global do jogo
let MgrMissions = null; // Instância de MissionManager
let ActiveEngine = null; // Motor de partida ativo

// ── Perfil do Desenvolvedor ─────────────────────────────────────────────────
const DEVELOPER = {
  name: 'Saieso Seraos',
  title: 'Master Architect & Narrative Director',
  email: 'saiesoseraos.oficial@gmail.com',
  github: 'https://github.com/ossluz/',
  version: 'v1.0.0',
  projects: [
    { name: '🚀 Aprendin',      tag: 'Educação / NEE',    url: '#' },
    { name: '💊 EnfermaStudy',  tag: 'Saúde / Enfermagem', url: '#' },
    { name: '📖 Chi no Kai',    tag: 'Horror / São Paulo', url: '#' },
    { name: '👅 Língua Forjada',tag: 'Conlang / Kalemi',   url: '#' },
  ],
};

// ── Estado Padrão ─────────────────────────────────────────────────────────
function buildDefaultState(config) {
  const div  = config.startDivision || 'G';
  const team = GranFutData.createUserTeam(config.clubName, div, config.state, config.gender);
  const squad = GranFutData.generateSquad(div, config.gender);
  team.squad = squad;
  squad.forEach(p => { p.teamId = team.id; });

  const leagueTeams = GranFutData.generateLeague(div, config.state, config.gender);
  leagueTeams.unshift(team);
  const table = GranFutData.buildLeagueTable(leagueTeams);

  return {
    version: '1.0.0',
    userProfile: {
      name: config.managerName || 'Técnico',
      mode: config.mode || 'manager',
      donationTier: 0,
      granFut: div === 'A' ? 1500 : div === 'D' ? 500 : 50,
      clubsOwned: 0,
    },
    team,
    season: 1,
    round: 1,
    transferBudget: GranFutData.DIVISIONS[div].budget * 0.2,
    market: GranFutData.generateMarket(div, 6),
    forSale: [],
    leagueTeams,
    table,
    schedule: GranFutData.buildSchedule(leagueTeams),
    resultHistory: [],
    soloPlayer: config.mode === 'solo' ? GranFutData.createSoloPlayer(config.playerName, config.age, config.position, config.gender) : null,
    soloStats: { goals: 0, assists: 0, matchesPlayed: 0, rating: 0, consecutiveHighRating: 0, highEnergyStreak: 0 },
    clubStats: { wins: 0, draws: 0, losses: 0, unbeatenStreak: 0, highMoralStreak: 0, promotedThisSeason: false },
    training: { gamesSinceLastTraining: 0, lastTrainType: null },
    weeklyMatches: 0,
    ticketBoostNext: 1,
    trainBoostNext: 1,
    sponsors: [],
    unlockedItems: [],
    shopEffects: [],
    newsCache: [],
    missions: {},
    masterMode: false,
  };
}

// ════════════════════════════════════════════════════
// PERSISTÊNCIA
// ════════════════════════════════════════════════════
function saveGame() {
  if (!G) return;
  if (MgrMissions) G.missions = MgrMissions.serialize();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch(e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function exportBackup() {
  const data = JSON.stringify(G);
  const b64  = btoa(encodeURIComponent(data));
  const blob = new Blob([b64], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `GranFut_Backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.grf`;
  a.click();
  toast('Backup exportado com sucesso!');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(decodeURIComponent(atob(e.target.result)));
      G = data;
      MgrMissions = new GranFutMissions.MissionManager(G.missions || {});
      saveGame();
      renderAll();
      toast('✅ Progresso restaurado!');
    } catch(err) {
      toast('❌ Arquivo inválido ou corrompido.', 'var(--red)');
    }
  };
  reader.readAsText(file);
}

// ════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════
let _toastTimer;
function toast(msg, color = 'var(--green)') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.color       = color;
  el.style.borderColor = color;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ════════════════════════════════════════════════════
// NAVEGAÇÃO
// ════════════════════════════════════════════════════
const SCREENS = ['home','squad','match','league','transfer','training','shop','missions','config'];

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const screen = document.getElementById(`screen-${screenId}`);
  const navBtn = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
  if (screen) screen.classList.add('active');
  if (navBtn) navBtn.classList.add('active');
  renderScreen(screenId);
}

function renderScreen(id) {
  switch(id) {
    case 'home':     renderHome();     break;
    case 'squad':    renderSquad();    break;
    case 'match':    renderMatchPrep();break;
    case 'league':   renderLeague();   break;
    case 'transfer': renderTransfer(); break;
    case 'training': renderTraining(); break;
    case 'shop':     renderShop();     break;
    case 'missions': renderMissions(); break;
    case 'config':   renderConfig();   break;
  }
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — HEADER
// ════════════════════════════════════════════════════
function renderHeader() {
  const t = G.team;
  setText('hdr-club',   t.name);
  setText('hdr-cash',   `R$ ${(t.finances.cash || 0).toLocaleString('pt-BR')}`);
  setText('hdr-granfut',`◈ ${G.userProfile.granFut || 0}`);
  setText('hdr-season', `T${G.season}·R${G.round}`);
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — HOME / DASHBOARD
// ════════════════════════════════════════════════════
function renderHome() {
  renderHeader();
  const cs = G.clubStats;
  const myRow = G.table.find(r => r.isUser);
  const total = cs.wins + cs.draws + cs.losses;
  const aprov = total > 0 ? Math.round((myRow?.pts||0) / (total*3) * 100) : 0;
  const avgOvr = G.team.squad.length
    ? Math.round(G.team.squad.reduce((a,p) => a+p.overall,0) / G.team.squad.length)
    : '—';
  const wages = G.team.squad.reduce((a,p) => a+(p.salary||0), 0);
  const sponsorRev = (G.sponsors || []).reduce((a,s) => a+s.value, 0);

  setText('home-pos',    myRow ? getPosition() : '—');
  setText('home-pts',    myRow?.pts || 0);
  setText('home-aprov',  aprov + '%');
  setText('home-ovr',    avgOvr);
  setText('home-moral',  G.team.moral);
  setText('home-wages',  `R$ ${wages.toLocaleString('pt-BR')}/sem`);
  setText('home-budget', `R$ ${(G.transferBudget||0).toLocaleString('pt-BR')}`);
  setText('home-sponsors',`R$ ${sponsorRev.toLocaleString('pt-BR')}/sem`);

  document.getElementById('home-moral-bar').style.width = G.team.moral + '%';

  // Próximo adversário
  const nextMatch = getNextMatch();
  if (nextMatch) {
    setText('home-opp', nextMatch.name);
    const shieldEl = document.getElementById('home-opp-shield');
    if (shieldEl) shieldEl.innerHTML = buildShield(nextMatch, 36);
  }

  // Guia Inteligente
  const guide = GranFutEngine.buildGuideAdvice(
    { ...(G.soloPlayer || {}), teamPower: G.team.power, gamesSinceTraining: G.training.gamesSinceLastTraining },
    { rating: G.lastMatchRating || 3.5, opponentPower: nextMatch?.power || 50 },
    { lossStreak: getLossStreak(), winStreak: getWinStreak() }
  );
  setText('guide-msg', guide);

  // Mode indicator
  const modeLabels = { solo:'⭐ Solo', manager:'⚙️ Manager', tycoon:'🏢 Tycoon' };
  setText('hdr-mode', modeLabels[G.userProfile.mode] || 'Manager');
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — ELENCO
// ════════════════════════════════════════════════════
function renderSquad() {
  // Campo tático
  const campo = document.getElementById('campo');
  if (!campo) return;
  const available = G.team.squad.filter(p => !p.injured && !p.suspended);
  const byPos = {};
  for (const p of available) {
    if (!byPos[p.position]) byPos[p.position] = [];
    byPos[p.position].push(p);
  }

  const lineAta  = (byPos.ATA||[]).slice(0,3);
  const lineMei  = [...(byPos.MEI||[]).slice(0,2), ...(byPos.VOL||[]).slice(0,1)];
  const lineDef  = [...(byPos.ZAG||[]).slice(0,2), ...(byPos.LAT||[]).slice(0,2)];
  const lineGol  = (byPos.GOL||[]).slice(0,1);

  const cpHtml = (players) => players.length
    ? players.map(p => `<div class="campo-player">
        <span class="cp-ovr">${p.overall}</span>
        ${p.name.split(' ')[0]}
        <span class="cp-pos">${p.position}</span>
      </div>`).join('')
    : '<div class="campo-player inactive"><span class="cp-ovr">—</span>?<span class="cp-pos">?</span></div>';

  campo.innerHTML = `
    <div class="campo-line">${cpHtml(lineAta)}</div>
    <div class="campo-line">${cpHtml(lineMei)}</div>
    <div class="campo-line">${cpHtml(lineDef)}</div>
    <div class="campo-line">${cpHtml(lineGol)}</div>
  `;

  // Lista completa
  const list = document.getElementById('squad-list');
  if (!list) return;
  list.innerHTML = '';
  const sorted = [...G.team.squad].sort((a,b) => {
    const order = ['GOL','ZAG','LAT','VOL','MEI','ATA'];
    return order.indexOf(a.position) - order.indexOf(b.position);
  });
  for (const p of sorted) {
    const injBadge  = p.injured   ? `<span class="badge badge-red">🩼 ${p.injuredWeeks}sem</span>` : '';
    const susBadge  = p.suspended ? `<span class="badge badge-gold">🟥 Suspenso</span>` : '';
    const healBtn   = p.injured   ? `<button class="btn btn-xs btn-primary" onclick="healPlayer('${p.id}')">Curar R$3k</button>` : '';
    const clearBtn  = p.suspended ? `<button class="btn btn-xs btn-secondary" onclick="clearSuspension('${p.id}')">Cumpriu</button>` : '';
    const sellBtn   = !G.forSale.includes(p.id)
      ? `<button class="btn btn-xs btn-ghost" onclick="listForSale('${p.id}')">Vender</button>`
      : `<button class="btn btn-xs btn-danger btn-xs" onclick="removeFromSale('${p.id}')">✕ Retirar</button>`;
    list.innerHTML += `
    <div class="player-card ${p.injured?'injured':''} ${p.suspended?'suspended':''}">
      <div class="pc-pos">${p.position}</div>
      <div class="pc-ovr">${p.overall}</div>
      <div class="pc-info">
        <div class="pc-name">${p.name} ${injBadge}${susBadge}</div>
        <div class="pc-sub">Idade ${p.age} · R$${(p.salary||0).toLocaleString('pt-BR')}/sem · Energia ${p.energy||0}</div>
      </div>
      <div class="pc-actions">${healBtn}${clearBtn}${sellBtn}</div>
    </div>`;
  }
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — PRÉ-PARTIDA
// ════════════════════════════════════════════════════
function renderMatchPrep() {
  const next = getNextMatch();
  if (!next) { setText('match-opp-name','Sem adversário'); return; }
  setText('match-home-name', G.team.name);
  setText('match-away-name', next.name);
  document.getElementById('match-home-shield').innerHTML = buildShield(G.team, 48);
  document.getElementById('match-away-shield').innerHTML = buildShield(next, 48);
  setText('match-opp-power', `Força: ${next.power || '?'}`);

  // Guia pré-jogo
  const diff = G.team.power - (next.power || 60);
  const preGuide = diff > 10 ? `💡 GUIA: Você é favorito! Mas cuidado com o contra-ataque do ${next.name}.`
    : diff < -10 ? `⚠️ GUIA: Adversário mais forte. Defenda compacto e explore bolas paradas!`
    : `📊 GUIA: Jogo equilibrado contra o ${next.name}. Qualidade decide!`;
  setText('match-preguide', preGuide);
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — TABELA
// ════════════════════════════════════════════════════
function renderLeague() {
  const sorted = [...G.table].sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return (b.gf-b.ga) - (a.gf-a.ga);
  });

  const tbody = document.getElementById('table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  sorted.forEach((t, i) => {
    const formHtml = (t.form||[]).slice(0,5).map(f =>
      `<div class="form-dot ${f}"></div>`).join('');
    tbody.innerHTML += `<tr${t.isUser?' class="me"':''}>
      <td>${i+1}</td>
      <td>${t.isUser?'⭐ ':''}${t.name}</td>
      <td>${t.pj}</td>
      <td><strong>${t.pts}</strong></td>
      <td>${t.gf}</td><td>${t.ga}</td>
      <td>${t.gf-t.ga>0?'+':''}${t.gf-t.ga}</td>
      <td><div class="form-dots">${formHtml}</div></td>
    </tr>`;
  });
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — TRANSFERÊNCIAS
// ════════════════════════════════════════════════════
function renderTransfer() {
  setText('t-budget', `R$ ${(G.transferBudget||0).toLocaleString('pt-BR')}`);

  const mktDiv = document.getElementById('market-list');
  if (mktDiv) {
    mktDiv.innerHTML = '';
    G.market.forEach((p,i) => {
      mktDiv.innerHTML += `<div class="player-card">
        <div class="pc-pos">${p.position}</div>
        <div class="pc-ovr">${p.overall}</div>
        <div class="pc-info">
          <div class="pc-name">${p.name}</div>
          <div class="pc-sub">Idade ${p.age} · R$ ${(p.value||0).toLocaleString('pt-BR')}</div>
        </div>
        <div class="pc-actions">
          <button class="btn btn-xs btn-primary" onclick="buyPlayer(${i})">Contratar</button>
        </div>
      </div>`;
    });
    if (G.market.length === 0) mktDiv.innerHTML = '<div class="empty">Mercado vazio. Refresque para novos jogadores.</div>';
  }

  const saleDiv = document.getElementById('for-sale-list');
  if (saleDiv) {
    const selling = G.team.squad.filter(p => G.forSale.includes(p.id));
    if (selling.length === 0) {
      saleDiv.innerHTML = '<div class="empty">Nenhum jogador listado para venda.</div>';
    } else {
      saleDiv.innerHTML = '';
      selling.forEach(p => {
        const price = Math.round((p.overall||60) * 900);
        saleDiv.innerHTML += `<div class="player-card">
          <div class="pc-pos">${p.position}</div>
          <div class="pc-ovr">${p.overall}</div>
          <div class="pc-info">
            <div class="pc-name">${p.name}</div>
            <div class="pc-sub">À venda · R$ ${price.toLocaleString('pt-BR')}</div>
          </div>
          <div class="pc-actions">
            <button class="btn btn-xs btn-gold" onclick="sellPlayer('${p.id}')">💰 Vender</button>
            <button class="btn btn-xs btn-danger" onclick="removeFromSale('${p.id}')">✕</button>
          </div>
        </div>`;
      });
    }
  }
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — TREINO
// ════════════════════════════════════════════════════
function renderTraining() {
  const gs = G.training.gamesSinceLastTraining;
  const urgency = gs >= 2 ? 'red' : gs >= 1 ? 'gold' : 'green';
  const urgencyColors = { red: 'var(--red)', gold: 'var(--gold)', green: 'var(--green)' };

  const el = document.getElementById('training-status');
  if (el) {
    el.style.borderColor = urgencyColors[urgency];
    setText('training-games', gs);
    setText('training-urgency',
      gs === 0 ? '✅ Treino em dia' :
      gs === 1 ? '⚠️ Treino recomendado' :
                 '🔴 URGENTE: Regressão ativa!');
    document.getElementById('training-urgency').style.color = urgencyColors[urgency];
  }

  // Energia média do elenco
  const avgEnergy = G.team.squad.length
    ? Math.round(G.team.squad.reduce((a,p) => a+(p.energy||0),0) / G.team.squad.length)
    : 0;
  setText('team-energy-avg', avgEnergy);
  const energyBar = document.getElementById('team-energy-bar');
  if (energyBar) energyBar.style.width = avgEnergy + '%';
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — LOJA
// ════════════════════════════════════════════════════
function renderShop() {
  const shopDiv = document.getElementById('shop-items');
  if (!shopDiv) return;
  shopDiv.innerHTML = '';

  const items = GranFutFinance.SHOP_ITEMS.filter(item => {
    if (item.hidden && !(G.unlockedItems || []).includes(item.id)) return false;
    return true;
  });

  items.forEach(item => {
    const canAfford = item.currency === 'granfut'
      ? (G.userProfile.granFut || 0) >= item.price
      : (G.team.finances.cash || 0) >= item.price;
    shopDiv.innerHTML += `
    <div class="shop-item">
      <div class="si-icon">${item.icon}</div>
      <div class="si-body">
        <div class="si-name">${item.name} ${item.premium ? '<span class="badge badge-gold">GranFut</span>' : ''}</div>
        <div class="si-desc">${item.desc}</div>
      </div>
      <div>
        <div class="si-price ${item.currency === 'granfut' ? 'gran' : 'common'}">
          ${item.currency === 'granfut' ? '◈' : 'R$'} ${item.price.toLocaleString('pt-BR')}
        </div>
        <button class="btn btn-xs ${canAfford ? 'btn-primary' : 'btn-ghost'} mt10"
          onclick="buyShopItem('${item.id}')" ${canAfford ? '' : 'disabled'}>
          Comprar
        </button>
      </div>
    </div>`;
  });
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — MISSÕES
// ════════════════════════════════════════════════════
function renderMissions() {
  const el = document.getElementById('missions-list');
  if (!el || !MgrMissions) return;
  el.innerHTML = '';

  const mode = G.userProfile.mode;
  const visible = MgrMissions.getVisible(mode);
  const completed = MgrMissions.getCompleted();

  if (completed.length > 0) {
    el.innerHTML += `<div class="card-title"><span class="dot"></span>RESGATAR RECOMPENSAS</div>`;
    completed.forEach(m => {
      el.innerHTML += `<div class="mission-card complete">
        <div class="mc-icon">${m.icon}</div>
        <div class="mc-body">
          <div class="mc-name">${m.name} ✅</div>
          <div class="mc-desc">${m.desc}</div>
          <div class="mc-reward">🎁 ${m.reward.desc}</div>
        </div>
        <button class="btn btn-xs btn-gold" onclick="claimReward('${m.id}')">Resgatar</button>
      </div>`;
    });
    el.innerHTML += '<hr class="separator">';
  }

  el.innerHTML += `<div class="card-title"><span class="dot"></span>EM ANDAMENTO</div>`;
  const inProgress = visible.filter(m => !m.completed);
  if (inProgress.length === 0) {
    el.innerHTML += '<div class="empty">Nenhuma missão ativa para este modo.</div>';
  } else {
    inProgress.forEach(m => {
      el.innerHTML += `<div class="mission-card ${m.type === 'hidden' ? 'hidden' : ''}">
        <div class="mc-icon">${m.icon}</div>
        <div class="mc-body">
          <div class="mc-name">${m.name} ${m.type === 'hidden' ? '<span class="badge badge-blue">OCULTA</span>' : ''}</div>
          <div class="mc-desc">${m.desc}</div>
          <div class="mc-reward">🏆 ${m.reward.desc}</div>
        </div>
      </div>`;
    });
  }

  const secretCount = MgrMissions.getSecret().length;
  if (secretCount > 0) {
    el.innerHTML += `<div class="empty text-muted fs08">🔒 +${secretCount} missão(ões) oculta(s) ainda não descobertas...</div>`;
  }
}

// ════════════════════════════════════════════════════
// RENDERIZAÇÃO — CONFIG
// ════════════════════════════════════════════════════
function renderConfig() {
  const el = document.getElementById('config-content');
  if (!el) return;
  el.innerHTML = `
    <div class="credits-header">
      <h2>⚽ ${DEVELOPER.name}</h2>
      <p>${DEVELOPER.title}</p>
    </div>
    <div class="card">
      <div class="card-title"><span class="dot"></span>PROJETOS</div>
      <div class="project-grid">
        ${DEVELOPER.projects.map(p => `
          <div class="proj-card" onclick="window.open('${p.url}')">
            <h4>${p.name}</h4>
            <p>${p.tag}</p>
          </div>
        `).join('')}
      </div>
      <div class="btn-row">
        <a href="mailto:${DEVELOPER.email}" class="btn btn-secondary btn-sm">📧 Contato</a>
        <a href="${DEVELOPER.github}" target="_blank" class="btn btn-secondary btn-sm">💻 GitHub</a>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span class="dot gold"></span>DESBLOQUEAR SÉRIES</div>
      <p class="fs08 text-muted" style="margin-bottom:10px;">Insira o código recebido após sua contribuição voluntária.</p>
      <input class="inp" id="donation-email" placeholder="Seu e-mail" type="email" style="margin-bottom:6px;">
      <input class="inp" id="donation-code"  placeholder="Código GF-XXXXX" style="margin-bottom:8px;">
      <button class="btn btn-primary btn-full" onclick="validateDonation()">✅ Validar Código</button>
    </div>
    <div class="card">
      <div class="card-title"><span class="dot"></span>DADOS DO SAVE</div>
      <div class="row"><label>Divisão atual</label><span>${G.team.division}</span></div>
      <div class="row"><label>Temporada</label><span>T${G.season}</span></div>
      <div class="row"><label>Tier de acesso</label>
        <span>${['Local (F/G)','Estadual (D/E)','Nacional (A/C)'][G.userProfile.donationTier]||'Local'}</span>
      </div>
      <div class="btn-row">
        <button class="btn btn-secondary btn-sm" onclick="exportBackup()">📥 Exportar Backup</button>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
          📤 Importar
          <input type="file" accept=".grf" style="display:none;" onchange="importBackup(this.files[0])">
        </label>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span class="dot red"></span>JOGO</div>
      <button class="btn btn-danger btn-full" onclick="confirmNewGame()">🗑️ Resetar Jogo</button>
    </div>
    <small onclick="masterClick()" style="display:block;text-align:center;color:var(--muted);padding:20px;cursor:pointer;">
      ${DEVELOPER.version} — © Saieso Seraos
    </small>
  `;
}

// ════════════════════════════════════════════════════
// AÇÕES DE JOGO
// ════════════════════════════════════════════════════

// ── Simular partida ────────────────────────────────
function openMatchScreen() {
  if (!G) return;
  const opponent = getNextMatch();
  if (!opponent) { toast('Sem adversários disponíveis!', 'var(--red)'); return; }

  const isDerby = Math.random() < 0.15; // 15% de chance de clássico

  const homeTeamData = {
    id: G.team.id,
    name: G.team.name,
    power: G.team.power,
    aggression: G.team.aggression || 50,
    moral: G.team.moral,
    squad: G.team.squad,
    colors: G.team.colors,
  };
  const awayTeamData = {
    id: opponent.id,
    name: opponent.name,
    power: opponent.power,
    aggression: opponent.aggression || 50,
    moral: opponent.moral || 70,
    squad: [],
    colors: opponent.colors,
  };

  // Renderiza scoreboard inicial
  document.getElementById('ms-home').textContent = homeTeamData.name;
  document.getElementById('ms-away').textContent = awayTeamData.name;
  document.getElementById('ms-score').textContent = '0 – 0';
  document.getElementById('ms-score').className = 'score-num';
  document.getElementById('ms-time').textContent = `0' 1° Tempo${isDerby?' 🔥 CLÁSSICO':''}`;

  const narrationBox = document.getElementById('narration-box');
  narrationBox.innerHTML = '';

  document.getElementById('match-screen').classList.add('open');

  // Atualiza ticker de notícias
  updateTicker();

  // Inicia motor
  ActiveEngine = new GranFutEngine.MatchEngine(homeTeamData, awayTeamData, {
    isDerby,
    isSoloMode: G.userProfile.mode === 'solo',
    userPlayer: G.soloPlayer,
    speed: 'NORMAL',
  });

  ActiveEngine
    .on('event', ({ min, text, type }) => {
      const el = document.createElement('div');
      el.className = `narr-entry narr-${type}`;
      el.textContent = `${min}' ${text}`;
      narrationBox.prepend(el);
      document.getElementById('ms-time').textContent = `${min}' ${ActiveEngine.state.half}° Tempo`;
    })
    .on('goal', ({ side, score }) => {
      document.getElementById('ms-score').textContent = `${score.h} – ${score.a}`;
      const diff = score.h - score.a;
      document.getElementById('ms-score').className = `score-num ${diff > 0 ? 'win' : diff < 0 ? 'loss' : 'draw'}`;
    })
    .on('halftime', ({ score, guideMsg }) => {
      showIntervalPanel(score, guideMsg);
    })
    .on('fulltime', (result) => {
      processMatchResult(result);
    })
    .on('guideTip', (msg) => {
      setText('guide-msg', msg);
    })
    .on('punishment', ({ fine, repLoss }) => {
      if (fine) G.team.finances.cash = Math.max(0, (G.team.finances.cash||0) - fine);
      if (repLoss) G.team.reputation = Math.max(0, (G.team.reputation||0) - repLoss);
    });

  ActiveEngine.start();
}

function setMatchSpeed(speed) {
  if (!ActiveEngine) return;
  ActiveEngine.speed = speed;
  setText('speed-indicator', speed === 'FAST' ? '4× RÁPIDO' : '1× NORMAL');
}

function showIntervalPanel(score, guideMsg) {
  const panel = document.getElementById('interval-panel');
  if (!panel) return;
  setText('interval-score', `${score.h} – ${score.a}`);
  setText('interval-guide', guideMsg);
  panel.style.display = 'flex';
}

function resumeSecondHalf() {
  const panel = document.getElementById('interval-panel');
  if (panel) panel.style.display = 'none';
  if (ActiveEngine) ActiveEngine.startSecondHalf();
}

function closeMatchScreen() {
  if (ActiveEngine && !ActiveEngine.state.finished) {
    if (!confirm('O jogo não terminou. Deseja sair mesmo assim?')) return;
    ActiveEngine.pause();
  }
  document.getElementById('match-screen').classList.remove('open');
  ActiveEngine = null;
}

function processMatchResult(result) {
  const cs = G.clubStats;
  const myRow = G.table.find(r => r.isUser);

  if (result.outcome === 'WIN')  { cs.wins++;  cs.unbeatenStreak++;  if (myRow) { myRow.wins++;  myRow.pts += 3; } }
  if (result.outcome === 'DRAW') { cs.draws++; cs.unbeatenStreak++;  if (myRow) { myRow.draws++; myRow.pts += 1; } }
  if (result.outcome === 'LOSS') { cs.losses++; cs.unbeatenStreak = 0; if (myRow) myRow.losses++; }

  if (myRow) {
    myRow.pj++;
    myRow.gf += result.scoreH;
    myRow.ga += result.scoreA;
    myRow.form = [result.outcome === 'WIN' ? 'V' : result.outcome === 'DRAW' ? 'E' : 'D', ...(myRow.form||[])].slice(0,5);
  }

  // Moral
  const moralDelta = result.outcome === 'WIN' ? 8 : result.outcome === 'DRAW' ? 0 : -8;
  G.team.moral = Math.min(100, Math.max(0, (G.team.moral || 70) + moralDelta));

  // Bilheteria
  const ticketRev = GranFutFinance.FinanceSystem.prototype._ticketRevenue.call(
    { club: G.team },
    { homeWin: result.outcome === 'WIN', ticketBoost: G.ticketBoostNext || 1 }
  );
  G.team.finances.cash = (G.team.finances.cash || 0) + ticketRev;
  G.ticketBoostNext = 1;

  // Jogadores com cartão vermelho = suspensos
  for (const p of (result.expelledPlayers || [])) {
    const found = G.team.squad.find(x => x.id === p.id);
    if (found) found.suspended = true;
  }

  G.round++;
  G.weeklyMatches = (G.weeklyMatches || 0) + 1;
  G.training.gamesSinceLastTraining++;
  G.lastMatchRating = result.outcome === 'WIN' ? 4.5 : result.outcome === 'DRAW' ? 3.5 : 2.5;

  G.resultHistory.unshift({ ...result, round: G.round - 1, season: G.season });
  if (G.resultHistory.length > 20) G.resultHistory.pop();

  // Missões
  const completed = MgrMissions.checkAll(G);
  if (completed.length > 0) {
    toast(`🏆 Missão completada: ${completed[0].name}!`, 'var(--gold)');
  }

  saveGame();
  renderHeader();
}

// ── Comprar jogador ────────────────────────────────
window.buyPlayer = function(idx) {
  const p = G.market[idx];
  if (!p) return;
  const fin = new GranFutFinance.FinanceSystem(G.team);
  const res = fin.buyPlayer(p, p.value);
  if (!res.success) { toast(res.reason, 'var(--red)'); return; }
  G.transferBudget -= p.value;
  p.teamId = G.team.id;
  G.team.squad.push(p);
  G.market.splice(idx, 1);
  toast(`✅ ${p.name} contratado por R$ ${p.value.toLocaleString('pt-BR')}!`);
  renderTransfer();
  renderHeader();
  saveGame();
};

// ── Vender jogador ─────────────────────────────────
window.sellPlayer = function(playerId) {
  const fin = new GranFutFinance.FinanceSystem(G.team);
  const res = fin.sellPlayer(playerId);
  if (!res.success) { toast(res.reason, 'var(--red)'); return; }
  G.forSale = G.forSale.filter(id => id !== playerId);
  G.transferBudget += res.price;
  toast(`💰 ${res.player.name} vendido por R$ ${res.price.toLocaleString('pt-BR')}!`, 'var(--gold)');
  renderTransfer(); renderSquad(); renderHeader();
  saveGame();
};

window.listForSale   = (id) => { if (!G.forSale.includes(id)) { G.forSale.push(id); renderTransfer(); renderSquad(); } };
window.removeFromSale= (id) => { G.forSale = G.forSale.filter(x => x !== id); renderTransfer(); renderSquad(); };

window.healPlayer = function(id) {
  if ((G.team.finances.cash||0) < 3000) { toast('Saldo insuficiente!', 'var(--red)'); return; }
  G.team.finances.cash -= 3000;
  const p = G.team.squad.find(x => x.id === id);
  if (p) { p.injured = false; p.injuredWeeks = 0; }
  toast('Jogador recuperado! ✅');
  renderSquad(); renderHeader(); saveGame();
};

window.clearSuspension = function(id) {
  const p = G.team.squad.find(x => x.id === id);
  if (p) p.suspended = false;
  toast('Suspensão cumprida. ✅');
  renderSquad(); saveGame();
};

// ── Treino ─────────────────────────────────────────
window.doTraining = function(type) {
  const ctLevel = G.team.ct?.level || 1;
  const boost   = G.trainBoostNext || 1;
  G.trainBoostNext = 1;

  const results = G.team.squad.map(p =>
    GranFutFinance.processTraining(p, type, ctLevel, boost)
  );

  G.training.gamesSinceLastTraining = 0;
  G.training.lastTrainType = type;

  const injured = results.filter(r => r.injured);
  if (injured.length > 0) {
    toast(`🩺 ${injured.length} jogador(es) se lesionaram no treino!`, 'var(--red)');
  } else {
    const xpTotal = results.reduce((a,r) => a + (r.xpGain || 0), 0);
    toast(`🏋️ Treino ${type === 'OPTIONAL' ? 'extra' : 'obrigatório'} concluído! +${xpTotal} XP total.`);
  }

  renderTraining(); renderSquad(); saveGame();
};

// ── Loja ───────────────────────────────────────────
window.buyShopItem = function(itemId) {
  const result = GranFutFinance.applyShopEffect(itemId, G);
  if (!result.success) { toast(result.reason, 'var(--red)'); return; }
  if (result.isSecret) {
    toast(`🎁 Pacote Secreto: ${result.desc}`, 'var(--gold)');
  } else {
    toast(`✅ ${result.item.name} aplicado com sucesso!`);
  }
  renderShop(); renderHeader(); renderSquad(); saveGame();
};

// ── Missões ────────────────────────────────────────
window.claimReward = function(missionId) {
  const result = MgrMissions.claimReward(missionId, G);
  if (!result.success) { toast(result.reason, 'var(--red)'); return; }
  toast(`🏆 Recompensa resgatada: ${result.reward.desc}!`, 'var(--gold)');
  renderMissions(); renderHeader(); saveGame();
};

// ── Doação / Validação ─────────────────────────────
window.validateDonation = function() {
  const email = (document.getElementById('donation-email')?.value || '').trim();
  const code  = (document.getElementById('donation-code')?.value || '').trim().toUpperCase();
  if (!email || !code) { toast('Preencha e-mail e código.', 'var(--red)'); return; }
  const result = GranFutFinance.validateDonationCode(email, code);
  if (result.valid) {
    G.userProfile.donationTier = Math.max(G.userProfile.donationTier, result.tier);
    G.userProfile.granFut = (G.userProfile.granFut || 0) + result.granFutBonus;
    toast(result.message, 'var(--gold)');
    saveGame();
    renderHeader();
    renderConfig();
  } else {
    toast(result.message, 'var(--red)');
  }
};

window.confirmNewGame = function() {
  if (confirm('⚠️ Isso apagará TODO o progresso. Tem certeza?')) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
};

// ════════════════════════════════════════════════════
// MODO MESTRE — SAIESO SERAOS
// ════════════════════════════════════════════════════
let _masterClicks = 0;
let _masterStep   = 0; // 0=senha, 1=comando

window.masterClick = function() {
  _masterClicks++;
  if (_masterClicks >= 7) {
    _masterClicks = 0;
    document.getElementById('master-panel').classList.add('open');
    masterLog('SISTEMA MESTRE v1.0.0 — SAIESO SERAOS', 'cmd');
    masterLog('Digite a senha para acessar:', 'ok');
    _masterStep = 0;
  }
};

window.masterSubmit = function() {
  const input = document.getElementById('master-input');
  const val   = input.value.trim();
  input.value = '';

  if (_masterStep === 0) {
    if (val === '541350as*') {
      masterLog('✅ Senha aceita. Bem-vindo, Saieso.', 'ok');
      masterLog('Comandos: SERAOS_GOD_2025 | --gold | --gran | --unlock | --fast | --reset_all', 'ok');
      _masterStep = 1;
    } else {
      masterLog('❌ Senha incorreta.', 'err');
    }
    return;
  }

  // Executar comando
  masterLog(`> ${val}`, 'cmd');
  const cmd = val.toUpperCase();

  if (cmd === 'SERAOS_GOD_2025' || cmd.includes('--GOLD')) {
    G.team.finances.cash = 999999999;
    masterLog('✅ --gold: R$ 999.999.999 no saldo.', 'ok');
  }
  if (cmd === 'SERAOS_GOD_2025' || cmd.includes('--GRAN')) {
    G.userProfile.granFut = 999999;
    masterLog('✅ --gran: ◈ 999.999 GranFut.', 'ok');
  }
  if (cmd === 'SERAOS_GOD_2025' || cmd.includes('--UNLOCK')) {
    G.userProfile.donationTier = 2;
    masterLog('✅ --unlock: Todas as divisões liberadas.', 'ok');
  }
  if (cmd.includes('--FAST')) {
    G.team.squad.forEach(p => { p.energy = 100; p.overall = Math.min(99, p.overall + 20); });
    masterLog('✅ --fast: Elenco com energia máxima e OVR +20.', 'ok');
  }
  if (cmd.includes('--RESET_ALL')) {
    masterLog('⚠️ Execute confirmNewGame() no console para reset total.', 'err');
  }
  if (cmd === 'EXIT' || cmd === 'SAIR') {
    document.getElementById('master-panel').classList.remove('open');
    _masterStep = 0;
  }

  saveGame(); renderHeader();
};

function masterLog(text, type = 'ok') {
  const log = document.getElementById('master-log');
  const line = document.createElement('div');
  line.className = type;
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

window.closeMaster = function() {
  document.getElementById('master-panel').classList.remove('open');
  _masterStep = 0;
};

// ════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function getPosition() {
  const sorted = [...G.table].sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return (b.gf-b.ga) - (a.gf-a.ga);
  });
  const i = sorted.findIndex(r => r.isUser);
  return i >= 0 ? `${i+1}°` : '—';
}

function getNextMatch() {
  const mine = G.table.find(r => r.isUser);
  if (!mine) return null;
  const others = G.leagueTeams.filter(t => t.id !== G.team.id);
  if (others.length === 0) return null;
  return others[(G.round - 1) % others.length];
}

function getLossStreak() {
  let streak = 0;
  for (const r of (G.resultHistory || [])) {
    if (r.outcome === 'LOSS') streak++;
    else break;
  }
  return streak;
}

function getWinStreak() {
  let streak = 0;
  for (const r of (G.resultHistory || [])) {
    if (r.outcome === 'WIN') streak++;
    else break;
  }
  return streak;
}

function buildShield(team, size = 48) {
  if (!team) return '';
  const [c1, c2] = team.colors || ['#333','#fff'];
  const abbr = (team.shortName || team.name.slice(0,2)).toUpperCase();
  const shapes = [
    `M 10,5 L 90,5 L 90,65 L 50,90 L 10,65 Z`,
    `M 50,5 L 95,35 L 80,90 L 20,90 L 5,35 Z`,
    `M 10,10 L 90,10 L 90,90 L 10,90 Z`,
  ];
  const shapeIdx = (team.id || '').length % shapes.length;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="${shapes[shapeIdx]}" fill="${c1}" stroke="${c2}" stroke-width="5"/>
    <text x="50" y="58" font-family="Oswald,sans-serif" font-size="28" fill="${c2}"
      text-anchor="middle" font-weight="700">${abbr.slice(0,2)}</text>
  </svg>`;
}

function updateTicker() {
  const cached = G.newsCache || [];
  const fallback = [
    'Notícias GranFut · Mercado agitado nesta semana',
    'Clássico inesquecível: 3 expulsões e briga nas arquibancadas',
    'Jovem revela do ${G.team.name} convocado para a Seleção Sub-20',
    'Lesão preocupa torcida. Médico garante: "Volta em 2 semanas"',
  ];
  const content = cached.length > 0
    ? cached.map(n => n.title || n).join(' · ')
    : fallback.join(' · ');
  setText('ticker-text', content + ' · ');

  if (navigator.onLine) {
    fetch('https://api.rss2json.com/v1/api.json?rss_url=https://ge.globo.com/servico/semantica/editorias/plantao/futebol/feed.rss')
      .then(r => r.json())
      .then(data => {
        if (!data.offline && data.items) {
          G.newsCache = data.items.slice(0,6).map(i => ({ title: i.title }));
          setText('ticker-text', G.newsCache.map(n => n.title).join(' · ') + ' · ');
        }
      })
      .catch(() => {});
  }
}

// ════════════════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════════════════
function renderAll() {
  renderHeader();
  renderHome();
  document.getElementById('onboarding')?.remove();
}

function initOnboarding() {
  const ob = document.getElementById('onboarding');
  if (!ob) return;

  let step = 0;
  const cfg = {};

  const steps = ob.querySelectorAll('.ob-step');
  const nextBtn = document.getElementById('ob-next');
  const prevBtn = document.getElementById('ob-prev');

  function showStep(i) {
    steps.forEach((s,si) => s.classList.toggle('active', si === i));
    prevBtn.style.display = i === 0 ? 'none' : '';
    nextBtn.textContent = i === steps.length - 1 ? '⚽ Começar!' : 'Próximo →';
  }

  nextBtn.addEventListener('click', () => {
    // Coleta dados do passo atual
    if (step === 0) cfg.mode     = ob.querySelector('.ob-mode-btn.active')?.dataset.mode || 'manager';
    if (step === 1) cfg.managerName = ob.querySelector('#ob-mname')?.value || 'Técnico';
    if (step === 2) {
      cfg.clubName = ob.querySelector('#ob-cname')?.value || 'Meu Clube';
      cfg.state    = ob.querySelector('#ob-state')?.value || 'SP';
    }

    if (step === steps.length - 1) {
      // Finalizar
      cfg.startDivision = 'G';
      G = buildDefaultState(cfg);
      MgrMissions = new GranFutMissions.MissionManager();
      ob.style.display = 'none';
      renderAll();
      saveGame();
      return;
    }
    step++;
    showStep(step);
  });

  prevBtn.addEventListener('click', () => {
    if (step > 0) { step--; showStep(step); }
  });

  ob.querySelectorAll('.ob-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      ob.querySelectorAll('.ob-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  showStep(0);
}

// ════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('[GranFut] Service Worker registrado'))
      .catch(err => console.warn('[GranFut] SW falhou:', err));
  }

  // Navegação
  document.querySelectorAll('.nav-item[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.screen));
  });

  // Enter no input mestre
  document.getElementById('master-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') masterSubmit();
  });

  // Carregar save ou iniciar onboarding
  const saved = loadGame();
  if (saved) {
    G = saved;
    MgrMissions = new GranFutMissions.MissionManager(G.missions || {});
    document.getElementById('onboarding')?.remove();
    renderAll();
    goTo('home');
  } else {
    initOnboarding();
  }

  // Autosave
  setInterval(saveGame, AUTOSAVE_INTERVAL);
});
