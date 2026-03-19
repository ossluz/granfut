/* ════════════════════════════════════════════════════
   GranFut · missions.js  — Sistema de Missões
   Missões normais, ocultas e baseadas em tempo
   ════════════════════════════════════════════════════ */
'use strict';

const GranFutMissions = (() => {

  // ─── Banco de Missões ─────────────────────────────────────────────────────
  const MISSIONS_DB = [

    // ══ MODO SOLO ══════════════════════════════════════════════════════════

    // Normal – Solo
    {
      id: 'solo_first_goal',
      mode: ['solo'],
      type: 'normal',
      icon: '⚽',
      name: 'Estreia de Ouro',
      desc: 'Marque seu primeiro gol num jogo profissional.',
      condition: (s) => (s.soloStats?.goals || 0) >= 1,
      reward: { granFut: 100, xp: 200, desc: '◈ 100 GranFut + 200 XP' },
      completed: false,
    },
    {
      id: 'solo_hat_trick',
      mode: ['solo'],
      type: 'normal',
      icon: '🎩',
      name: 'Hat-trick!',
      desc: 'Marque 3 gols em um único jogo.',
      condition: (s) => (s.lastMatchStats?.goals || 0) >= 3,
      reward: { granFut: 300, xp: 500, reputationBonus: 20, desc: '◈ 300 + 500 XP + 20 Reputação' },
      completed: false,
    },
    {
      id: 'solo_10_games',
      mode: ['solo'],
      type: 'normal',
      icon: '🏃',
      name: 'Rodado',
      desc: 'Dispute 10 partidas pelo seu clube.',
      condition: (s) => (s.soloStats?.matchesPlayed || 0) >= 10,
      reward: { granFut: 50, xp: 300, salary: 200, desc: '◈ 50 + 300 XP + R$200/sem no salário' },
      completed: false,
    },
    {
      id: 'solo_top_player',
      mode: ['solo'],
      type: 'normal',
      icon: '🏆',
      name: 'Melhor em Campo',
      desc: 'Receba nota 8.0 ou mais em 3 partidas consecutivas.',
      condition: (s) => (s.soloStats?.consecutiveHighRating || 0) >= 3,
      reward: { granFut: 200, xp: 400, desc: '◈ 200 + 400 XP' },
      completed: false,
    },
    {
      id: 'solo_promotion',
      mode: ['solo'],
      type: 'normal',
      icon: '⬆️',
      name: 'Subindo de Nível',
      desc: 'Seja contratado por um time de divisão superior.',
      condition: (s) => s.soloStats?.promotionReceived === true,
      reward: { granFut: 500, xp: 800, desc: '◈ 500 + 800 XP' },
      completed: false,
    },

    // Oculta – Solo
    {
      id: 'solo_survive_relegation',
      mode: ['solo'],
      type: 'hidden',
      icon: '🔥',
      name: '"Contra Tudo e Contra Todos"',
      desc: 'Salve seu time do rebaixamento nos últimos 3 jogos.',
      condition: (s) => s.soloStats?.survivedRelegation === true,
      reward: { granFut: 800, xp: 1200, unlockItem: 'elite_pack', desc: '◈ 800 + item Pacote Elite desbloqueado' },
      completed: false,
      revealHint: 'Diz a lenda que existe uma missão para quem salva um time de forma impossível...',
    },
    {
      id: 'solo_win_derby_expelled',
      mode: ['solo'],
      type: 'hidden',
      icon: '💀',
      name: 'Herói Expulso',
      desc: 'Vença um clássico mesmo após ser expulso.',
      condition: (s) => s.soloStats?.wonDerbyAfterExpulsion === true,
      reward: { granFut: 600, unlockItem: 'secret_pack', desc: '◈ 600 + Pacote Secreto' },
      completed: false,
    },
    {
      id: 'solo_max_energy',
      mode: ['solo'],
      type: 'hidden',
      icon: '⚡',
      name: 'Máquina Humana',
      desc: 'Chegue a 5 jogos consecutivos com energia acima de 90.',
      condition: (s) => (s.soloStats?.highEnergyStreak || 0) >= 5,
      reward: { granFut: 400, stat: { energy: 10 }, desc: '◈ 400 + Energia máxima +10 permanente' },
      completed: false,
    },

    // ══ MODO MANAGER ═══════════════════════════════════════════════════════

    // Normal – Manager
    {
      id: 'mgr_first_win',
      mode: ['manager', 'tycoon'],
      type: 'normal',
      icon: '🥇',
      name: 'Primeira Vitória',
      desc: 'Vença sua primeira partida como técnico.',
      condition: (s) => (s.clubStats?.wins || 0) >= 1,
      reward: { granFut: 50, xp: 150, desc: '◈ 50 + 150 XP' },
      completed: false,
    },
    {
      id: 'mgr_unbeaten_streak',
      mode: ['manager', 'tycoon'],
      type: 'normal',
      icon: '🛡️',
      name: 'Invicto',
      desc: 'Fique 5 jogos sem perder.',
      condition: (s) => (s.clubStats?.unbeatenStreak || 0) >= 5,
      reward: { granFut: 200, xp: 400, moralBonus: 20, desc: '◈ 200 + 400 XP + +20 Moral do elenco' },
      completed: false,
    },
    {
      id: 'mgr_moral_master',
      mode: ['manager', 'tycoon'],
      type: 'normal',
      icon: '💪',
      name: 'Mestre do Vestiário',
      desc: 'Mantenha o moral do time acima de 90 por 5 jogos.',
      condition: (s) => (s.clubStats?.highMoralStreak || 0) >= 5,
      reward: { granFut: 150, xp: 300, reputation: 10, desc: '◈ 150 + 10 Reputação' },
      completed: false,
    },
    {
      id: 'mgr_promote',
      mode: ['manager', 'tycoon'],
      type: 'normal',
      icon: '🏆',
      name: 'Acesso Conquistado',
      desc: 'Suba de divisão ao final de uma temporada.',
      condition: (s) => s.clubStats?.promotedThisSeason === true,
      reward: { granFut: 1000, xp: 2000, cash: 50000, desc: '◈ 1.000 + R$ 50.000' },
      completed: false,
    },
    {
      id: 'mgr_youth_star',
      mode: ['manager', 'tycoon'],
      type: 'normal',
      icon: '🌟',
      name: 'Revelação da Base',
      desc: 'Promova um jovem da base que chegue a 70 de Overall.',
      condition: (s) => s.clubStats?.youthPromotionSuccess === true,
      reward: { granFut: 250, xp: 500, desc: '◈ 250 + 500 XP' },
      completed: false,
    },

    // Oculta – Manager
    {
      id: 'mgr_win_derby_2_red',
      mode: ['manager', 'tycoon'],
      type: 'hidden',
      icon: '🔴',
      name: '"Dez Contra Onze"',
      desc: 'Vença um clássico com 2 jogadores expulsos.',
      condition: (s) => s.clubStats?.wonDerbyWith2Reds === true,
      reward: { granFut: 800, xp: 1500, unlockItem: 'secret_pack', desc: '◈ 800 + Pacote Secreto Desbloqueado' },
      completed: false,
    },
    {
      id: 'mgr_relegation_escape',
      mode: ['manager', 'tycoon'],
      type: 'hidden',
      icon: '🎭',
      name: '"Resgate Rápido"',
      desc: 'Tire o time da zona de rebaixamento em menos de 5 rodadas.',
      condition: (s) => s.clubStats?.quickRescue === true,
      reward: { granFut: 600, reputation: 50, desc: '◈ 600 + 50 Reputação Nacional imediata' },
      completed: false,
    },
    {
      id: 'mgr_clean_sheet_title',
      mode: ['manager', 'tycoon'],
      type: 'hidden',
      icon: '🧱',
      name: '"Dono do Estado"',
      desc: 'Vença a série estadual sem sofrer nenhum gol na fase final.',
      condition: (s) => s.clubStats?.cleanSheetChampion === true,
      reward: { granFut: 1500, xp: 3000, title: 'Muralha', desc: '◈ 1.500 + Título "Muralha" + 3000 XP' },
      completed: false,
    },

    // ══ MODO TYCOON ════════════════════════════════════════════════════════

    {
      id: 'tycoon_buy_club',
      mode: ['tycoon'],
      type: 'normal',
      icon: '🏢',
      name: 'Magnata do Futebol',
      desc: 'Compre seu primeiro clube.',
      condition: (s) => (s.userProfile?.clubsOwned || 0) >= 1,
      reward: { granFut: 500, xp: 1000, desc: '◈ 500 + 1.000 XP' },
      completed: false,
    },
    {
      id: 'tycoon_upgrade_stadium',
      mode: ['tycoon'],
      type: 'normal',
      icon: '🏟️',
      name: 'Construtor',
      desc: 'Chegue ao nível 3 no estádio.',
      condition: (s) => (s.team?.stadium?.level || 1) >= 3,
      reward: { granFut: 300, ticketBonus: 0.1, desc: '◈ 300 + 10% de bônus permanente na bilheteria' },
      completed: false,
    },
    {
      id: 'tycoon_women_team',
      mode: ['tycoon'],
      type: 'normal',
      icon: '♀️',
      name: 'Futebol para Todos',
      desc: 'Construa uma academia feminina com 5 jogadoras.',
      condition: (s) => (s.team?.women?.length || 0) >= 5,
      reward: { granFut: 400, xp: 600, desc: '◈ 400 + 600 XP' },
      completed: false,
    },

    // ══ MISSÕES DE TEMPO (desaparecem se não completadas) ═══════════════

    {
      id: 'time_bonus_week',
      mode: ['solo','manager','tycoon'],
      type: 'timed',
      icon: '⏰',
      name: 'Bônus da Semana',
      desc: 'Complete 2 partidas nesta semana real.',
      condition: (s) => (s.weeklyMatches || 0) >= 2,
      reward: { common: 5000, desc: 'R$ 5.000 bônus semanal' },
      completed: false,
      expiresIn: 7, // dias
    },
  ];

  // ─── Gerenciador de Missões ──────────────────────────────────────────────
  class MissionManager {
    constructor(savedState = {}) {
      // Clona missões e restaura estado salvo
      this.missions = MISSIONS_DB.map(m => ({
        ...m,
        completed: savedState[m.id]?.completed || false,
        discovered: savedState[m.id]?.discovered || m.type !== 'hidden',
        rewardClaimed: savedState[m.id]?.rewardClaimed || false,
      }));
    }

    // Checa todas as missões com base no estado atual do jogo
    checkAll(gameState) {
      const newlyCompleted = [];

      for (const mission of this.missions) {
        if (mission.completed) continue;

        // Verificar modo
        const mode = gameState.userProfile?.mode || 'manager';
        if (!mission.mode.includes(mode)) continue;

        try {
          if (mission.condition(gameState)) {
            mission.completed = true;
            newlyCompleted.push(mission);

            // Missões ocultas: descoberta ao completar
            if (mission.type === 'hidden') mission.discovered = true;
          }
        } catch (e) { /* condição falhou graciosamente */ }
      }

      // Verificar missões ocultas que podem ser reveladas por itens
      this._tryRevealHidden(gameState);

      return newlyCompleted;
    }

    // Missão oculta pode ser revelada por olheiro especial
    _tryRevealHidden(gameState) {
      if (gameState.shopEffects?.includes('scout_reveal_hidden')) {
        const hidden = this.missions.filter(m => m.type === 'hidden' && !m.discovered);
        if (hidden.length > 0) {
          const toReveal = hidden[Math.floor(Math.random() * hidden.length)];
          toReveal.discovered = true;
          return toReveal;
        }
      }
      return null;
    }

    // Resgata recompensa de uma missão completada
    claimReward(missionId, state) {
      const mission = this.missions.find(m => m.id === missionId);
      if (!mission || !mission.completed || mission.rewardClaimed) {
        return { success: false, reason: 'Missão não disponível ou já resgatada.' };
      }

      const r = mission.reward;
      if (r.granFut)   state.user.granFut = (state.user.granFut || 0) + r.granFut;
      if (r.xp)        { if (state.soloPlayer) state.soloPlayer.xp = (state.soloPlayer.xp || 0) + r.xp; }
      if (r.common)    state.team.finances.cash = (state.team.finances.cash || 0) + r.common;
      if (r.cash)      state.team.finances.cash = (state.team.finances.cash || 0) + r.cash;
      if (r.reputation){ if (state.soloPlayer) state.soloPlayer.reputation = (state.soloPlayer.reputation||0) + r.reputation; }
      if (r.moralBonus){ state.team.moral = Math.min(100, (state.team.moral||50) + r.moralBonus); }
      if (r.stat)      {
        if (state.soloPlayer) {
          for (const [k,v] of Object.entries(r.stat)) {
            state.soloPlayer[k] = Math.min(99, (state.soloPlayer[k]||60) + v);
          }
        }
      }
      if (r.unlockItem) {
        if (!state.unlockedItems) state.unlockedItems = [];
        state.unlockedItems.push(r.unlockItem);
      }

      mission.rewardClaimed = true;
      return { success: true, mission, reward: r };
    }

    // Lista missões filtradas por modo e estado
    getVisible(mode) {
      return this.missions.filter(m => {
        if (!m.mode.includes(mode)) return false;
        if (m.type === 'hidden' && !m.discovered) return false;
        return true;
      });
    }

    getCompleted()   { return this.missions.filter(m => m.completed && !m.rewardClaimed); }
    getInProgress()  { return this.missions.filter(m => !m.completed && m.discovered); }
    getSecret()      { return this.missions.filter(m => m.type === 'hidden' && !m.discovered); }

    // Serializa para localStorage
    serialize() {
      const out = {};
      for (const m of this.missions) {
        out[m.id] = { completed: m.completed, discovered: m.discovered, rewardClaimed: m.rewardClaimed };
      }
      return out;
    }
  }

  // ─── Export ───────────────────────────────────────────────────────────────
  return {
    MISSIONS_DB,
    MissionManager,
  };

})();
