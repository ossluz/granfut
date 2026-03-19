/* ════════════════════════════════════════════════════
   GranFut · fixes.js — Correções e Novidades
   1. Fix claimReward (state.user → state.userProfile)
   2. Botão de atualização via Service Worker
   3. Troca de modo com alerta de save
   4. Seção "Sobre" no Config
   Saieso Seraos Edition v1.0
   ════════════════════════════════════════════════════ */
'use strict';

// ════════════════════════════════════════════════════
// 1. FIX: claimReward — state.user → state.userProfile
// ════════════════════════════════════════════════════
(function patchClaimReward() {
  function tryPatch() {
    if (!window.GranFutMissions?.MissionManager) {
      setTimeout(tryPatch, 150); return;
    }
    const proto = GranFutMissions.MissionManager.prototype;
    proto.claimReward = function(missionId, state) {
      const mission = this.missions.find(m => m.id === missionId);
      if (!mission || !mission.completed || mission.rewardClaimed) {
        return { success: false, reason: 'Missão não disponível ou já resgatada.' };
      }
      const r = mission.reward;
      // ── CORRIGIDO: state.userProfile (não state.user) ──
      if (r.granFut)    state.userProfile.granFut = (state.userProfile.granFut  || 0) + r.granFut;
      if (r.xp)        { if (state.soloPlayer) state.soloPlayer.xp = (state.soloPlayer.xp || 0) + r.xp; }
      if (r.common)    state.team.finances.cash  = (state.team.finances.cash    || 0) + r.common;
      if (r.cash)      state.team.finances.cash  = (state.team.finances.cash    || 0) + r.cash;
      if (r.salary)    { /* aplica como bônus de caixa também */
                         state.team.finances.cash = (state.team.finances.cash   || 0) + (r.salary * 4); }
      if (r.reputation){ if (state.soloPlayer) state.soloPlayer.reputation = (state.soloPlayer.reputation||0)+r.reputation; }
      if (r.moralBonus){ state.team.moral = Math.min(100,(state.team.moral||50)+r.moralBonus); }
      if (r.reputationBonus){ state.userProfile.granFut = (state.userProfile.granFut||0) + r.reputationBonus; }
      if (r.stat) {
        if (state.soloPlayer) {
          for (const [k,v] of Object.entries(r.stat))
            state.soloPlayer[k] = Math.min(99,(state.soloPlayer[k]||60)+v);
        }
      }
      if (r.unlockItem) {
        if (!state.unlockedItems) state.unlockedItems = [];
        if (!state.unlockedItems.includes(r.unlockItem)) state.unlockedItems.push(r.unlockItem);
      }
      mission.rewardClaimed = true;
      return { success: true, mission, reward: r };
    };
    console.log('[fixes] ✓ claimReward corrigido.');
  }
  tryPatch();
})();

// ════════════════════════════════════════════════════
// 2. BOTÃO DE ATUALIZAÇÃO (Service Worker)
// ════════════════════════════════════════════════════
(function setupUpdateBanner() {
  if (!('serviceWorker' in navigator)) return;

  function showUpdateBanner() {
    if (document.getElementById('gf-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'gf-update-banner';
    banner.style.cssText = `
      position:fixed;top:0;left:0;right:0;
      background:linear-gradient(90deg,#0d2a3e,#0a1e2e);
      border-bottom:2px solid var(--green,#00e87a);
      padding:10px 14px;
      display:flex;align-items:center;justify-content:space-between;gap:10px;
      z-index:10000;font-family:'Rajdhani',sans-serif;
      animation:slideDown .3s ease;
      max-width:480px;margin:0 auto;
    `;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:1.1rem">🚀</span>
        <div>
          <div style="font-size:.82rem;font-weight:700;color:#ddeeff">Nova versão disponível!</div>
          <div style="font-size:.68rem;color:#7aaec8">Atualize para ter as últimas novidades do GranFut</div>
        </div>
      </div>
      <button id="gf-update-btn" style="
        background:var(--green,#00e87a);color:#000;border:none;
        border-radius:8px;padding:6px 13px;font-weight:800;font-size:.78rem;
        cursor:pointer;white-space:nowrap;flex-shrink:0;
        font-family:'Rajdhani',sans-serif;
      ">⬆ Atualizar</button>
    `;
    document.body.prepend(banner);

    document.getElementById('gf-update-btn').addEventListener('click', () => {
      // Manda mensagem pro SW pular waiting
      navigator.serviceWorker.getRegistration().then(reg => {
        reg?.waiting?.postMessage('SKIP_WAITING');
      });
      // Quando o novo SW assumir, recarrega
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        banner.innerHTML = `<div style="flex:1;text-align:center;color:#00e87a;font-weight:700">✅ Atualizando... aguarde.</div>`;
        setTimeout(() => location.reload(), 600);
      });
      // Fallback: recarrega após 2s de qualquer forma
      setTimeout(() => location.reload(), 2000);
    });
  }

  navigator.serviceWorker.ready.then(reg => {
    // Já tem um worker esperando (update chegou antes do load)
    if (reg.waiting) { showUpdateBanner(); return; }

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });

    // Verifica update a cada 60 segundos (enquanto app aberto)
    setInterval(() => reg.update(), 60000);
  });
})();

// ════════════════════════════════════════════════════
// 3. TROCA DE MODO (pill no header)
// ════════════════════════════════════════════════════
(function setupModeSwitcher() {
  // Aguarda o DOM e o G estarem prontos
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(_attachModePill, 500);
  });
  // Também patcha renderHeader para re-attachar
  const origRH = window.renderHeader;
  if (origRH) {
    window.renderHeader = function() {
      origRH.apply(this, arguments);
      _attachModePill();
    };
  }
})();

function _attachModePill() {
  const pill = document.getElementById('hdr-mode-pill');
  if (!pill || pill.dataset.modePatch) return;
  pill.dataset.modePatch = '1';
  pill.style.cursor      = 'pointer';
  pill.style.userSelect  = 'none';
  pill.title = 'Clique para trocar de modo';
  pill.addEventListener('click', openModeSwitcher);
}

window.openModeSwitcher = function() {
  document.getElementById('gf-mode-modal')?.remove();
  const cur = G?.userProfile?.mode || 'manager';

  const modes = [
    { id:'solo',    icon:'⭐', name:'Solo',    desc:'Você é o jogador — controle sua carreira' },
    { id:'manager', icon:'⚙️', name:'Manager', desc:'Técnico do time — táticas e elenco'      },
    { id:'tycoon',  icon:'🏢', name:'Tycoon',  desc:'Dono do clube — finanças e estrutura'    },
  ];

  const modal = document.createElement('div');
  modal.id = 'gf-mode-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(6,11,16,.97);z-index:800;
    display:flex;align-items:center;justify-content:center;padding:20px;
    font-family:'Rajdhani',sans-serif;animation:su .2s ease;
  `;
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  const cardsHTML = modes.map(m => `
    <div class="mode-card ${m.id===cur?'active':''}" style="cursor:pointer;text-align:center;padding:16px 8px;position:relative"
         onclick="confirmModeSwitch('${m.id}')">
      ${m.id===cur ? `<div style="position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green)"></div>` : ''}
      <div style="font-size:1.8rem;margin-bottom:6px">${m.icon}</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:1.1rem;letter-spacing:2px;color:${m.id===cur?'var(--green)':'var(--t1)'}">${m.name}</div>
      <div style="font-size:.67rem;color:var(--t2);margin-top:3px;line-height:1.3">${m.desc}</div>
    </div>`).join('');

  modal.innerHTML = `
    <div style="background:var(--s1);border:1px solid var(--b1);border-radius:18px;padding:22px;width:100%;max-width:380px">
      <div style="font-family:'Bebas Neue',cursive;font-size:1.35rem;letter-spacing:3px;color:var(--t1);margin-bottom:4px">TROCAR MODO DE JOGO</div>
      <div style="font-size:.78rem;color:var(--t2);margin-bottom:16px">Modo atual: <strong style="color:var(--green)">${cur.toUpperCase()}</strong></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">${cardsHTML}</div>
      <button class="btn btn-ghost btn-full" onclick="document.getElementById('gf-mode-modal').remove()">✕ Cancelar</button>
    </div>`;
  document.body.appendChild(modal);
};

window.confirmModeSwitch = function(newMode) {
  const cur = G?.userProfile?.mode || 'manager';
  if (newMode === cur) { document.getElementById('gf-mode-modal')?.remove(); return; }
  document.getElementById('gf-mode-modal')?.remove();

  // Modal de confirmação de save
  const conf = document.createElement('div');
  conf.id = 'gf-modeconf-modal';
  conf.style.cssText = `
    position:fixed;inset:0;background:rgba(6,11,16,.98);z-index:820;
    display:flex;align-items:center;justify-content:center;padding:20px;
    font-family:'Rajdhani',sans-serif;
  `;
  conf.innerHTML = `
    <div style="background:var(--s1);border:1px solid rgba(245,54,92,.4);border-radius:18px;padding:22px;width:100%;max-width:360px">
      <div style="font-size:1.5rem;text-align:center;margin-bottom:8px">⚠️</div>
      <div style="font-family:'Bebas Neue',cursive;font-size:1.2rem;letter-spacing:2px;text-align:center;margin-bottom:10px;color:var(--gold)">ATENÇÃO</div>
      <p style="font-size:.83rem;color:var(--t2);text-align:center;margin-bottom:18px;line-height:1.6">
        Você está saindo do modo <strong style="color:var(--t1)">${cur.toUpperCase()}</strong>
        para o modo <strong style="color:var(--green)">${newMode.toUpperCase()}</strong>.<br><br>
        <strong style="color:var(--red)">Se não salvar, todo o progresso atual será perdido.</strong>
      </p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-primary btn-full" onclick="saveThenSwitch('${newMode}')">💾 Salvar e Trocar de Modo</button>
        <button class="btn btn-danger btn-full" onclick="switchWithoutSave('${newMode}')">🗑️ Trocar Sem Salvar (Perder Progresso)</button>
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('gf-modeconf-modal').remove()">← Voltar</button>
      </div>
    </div>`;
  document.body.appendChild(conf);
};

window.saveThenSwitch = function(newMode) {
  document.getElementById('gf-modeconf-modal')?.remove();
  saveGame?.();
  toast('💾 Progresso salvo! Iniciando novo modo...', 'var(--green)');
  setTimeout(() => _launchNewMode(newMode), 800);
};

window.switchWithoutSave = function(newMode) {
  document.getElementById('gf-modeconf-modal')?.remove();
  _launchNewMode(newMode);
};

function _launchNewMode(newMode) {
  // Limpa o save atual e reinicia com o novo modo
  // (mantém o nome do manager/clube do save anterior como sugestão)
  const prevName  = G?.userProfile?.name  || '';
  const prevClub  = G?.team?.name         || '';
  const prevState = G?.team?.state        || 'SP';

  try { localStorage.removeItem('granfut_save_v1'); } catch(e) {}

  // Pré-preenche o onboarding com dados do save anterior
  const obName  = document.getElementById('ob-mname');
  const obClub  = document.getElementById('ob-cname');
  const obState = document.getElementById('ob-state');
  if (obName  && prevName)  obName.value  = prevName;
  if (obClub  && prevClub)  obClub.value  = prevClub;
  if (obState && prevState) obState.value = prevState;

  // Pré-seleciona o modo correto
  document.querySelectorAll('.ob-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === newMode);
  });

  // Esconde o app e mostra o onboarding
  const app = document.getElementById('app');
  const ob  = document.getElementById('onboarding');
  if (app) app.style.display = 'none';
  if (ob)  ob.style.display  = '';

  // Reseta estado global
  window.G           = null;
  window.MgrMissions = null;
  window.ActiveEngine= null;

  toast('🔄 Modo trocado! Configure seu novo perfil.', '#11cdef');
}

// ════════════════════════════════════════════════════
// 4. PATCH renderConfig — Adiciona "Sobre o Jogo"
// ════════════════════════════════════════════════════
(function patchRenderConfig() {
  function tryPatch() {
    const orig = window.renderConfig;
    if (!orig) { setTimeout(tryPatch, 200); return; }
    window.renderConfig = function() {
      orig();
      _injectAboutSection();
    };
  }
  tryPatch();
})();

function _injectAboutSection() {
  const el = document.getElementById('config-content');
  if (!el) return;
  if (el.querySelector('.gf-about-card')) return; // evita duplicar

  const phase  = (window.G?.competitionPhase) || 'MUNICIPAL';
  const season = (window.G?.season) || 1;
  const round  = (window.G?.round)  || 1;
  const mode   = (window.G?.userProfile?.mode || 'manager').toUpperCase();
  const div    = window.G?.team?.division || 'G';

  const card = document.createElement('div');
  card.className = 'card gf-about-card';
  card.style.marginTop = '4px';
  card.innerHTML = `
    <div class="card-title"><span class="dot blue"></span>SOBRE O JOGO</div>
    <div style="display:flex;flex-direction:column;gap:0">
      ${_cfgRow('🎮 Jogo',        'GranFut Manager',       'var(--green)')}
      ${_cfgRow('🏷️ Versão',      'v1.1.0',                'var(--t1)')}
      ${_cfgRow('📅 Build',       'Março 2026',            'var(--t2)')}
      ${_cfgRow('👨‍💻 Autor',       'Saieso Seraos',         'var(--gold)')}
      ${_cfgRow('🌐 Plataforma',  'Web App / PWA',         'var(--t2)')}
      ${_cfgRow('💾 Modo Atual',  mode,                    'var(--green)')}
      ${_cfgRow('🏆 Fase',        phase.replace('_',' '),  'var(--blue)')}
      ${_cfgRow('📅 Temporada',   `T${season} · Rodada ${round}`, 'var(--t1)')}
      ${_cfgRow('📊 Divisão',     div,                     'var(--gold)')}
    </div>
    <div class="btn-row" style="margin-top:10px">
      <a href="https://github.com/ossluz/granfut" target="_blank" class="btn btn-ghost btn-sm">💻 Ver no GitHub</a>
      <button class="btn btn-ghost btn-sm" onclick="_checkForUpdates()">🔄 Verificar Atualização</button>
    </div>
  `;
  el.appendChild(card);
}

function _cfgRow(label, value, color) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--b1)">
    <span style="color:var(--t2);font-size:.8rem">${label}</span>
    <span style="color:${color};font-size:.82rem;font-weight:600">${value}</span>
  </div>`;
}

window._checkForUpdates = function() {
  if (!('serviceWorker' in navigator)) { toast('Service Worker não disponível.', 'var(--red)'); return; }
  toast('🔄 Verificando atualizações...', 'var(--blue)');
  navigator.serviceWorker.ready.then(reg => {
    reg.update().then(() => {
      if (reg.waiting) {
        toast('🚀 Atualização disponível! Use o banner no topo.', 'var(--gold)');
      } else {
        toast('✅ Você já está na versão mais recente!', 'var(--green)');
      }
    });
  });
};
