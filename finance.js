/* ════════════════════════════════════════════════════
   GranFut · finance.js  — Sistema de Economia Dual
   Dinheiro Comum + GranFut Premium
   ════════════════════════════════════════════════════ */
'use strict';

const GranFutFinance = (() => {

  // ─── Catálogo da Loja ─────────────────────────────────────────────────────
  const SHOP_ITEMS = [
    // ── Recuperação (Dinheiro Comum) ──────────────────────────────────────
    {
      id: 'energy_shot',
      name: 'Gelo Instantâneo',
      desc: 'Recupera 40 de energia do jogador solo. Ideal para o intervalo.',
      icon: '🧊',
      currency: 'common',
      price: 800,
      effect: { type: 'ENERGY', value: 40, target: 'solo' },
      category: 'recovery',
    },
    {
      id: 'energy_full',
      name: 'Soro de Recuperação',
      desc: 'Energia total do elenco sobe 30%. Ótimo antes de um jogo decisivo.',
      icon: '💊',
      currency: 'common',
      price: 3500,
      effect: { type: 'TEAM_ENERGY', value: 30, target: 'squad' },
      category: 'recovery',
    },
    {
      id: 'heal_injury',
      name: 'Tratamento Médico',
      desc: 'Cura um jogador lesionado imediatamente.',
      icon: '🏥',
      currency: 'common',
      price: 3000,
      effect: { type: 'HEAL', target: 'injured' },
      category: 'recovery',
    },

    // ── Buffs de Atributo (Dinheiro Comum) ────────────────────────────────
    {
      id: 'train_boost',
      name: 'Treino Intensivo',
      desc: 'Próximo treino com 200% de eficiência. +XP extra.',
      icon: '🏋️',
      currency: 'common',
      price: 2000,
      effect: { type: 'TRAIN_BOOST', value: 2.0 },
      category: 'training',
    },
    {
      id: 'morale_speech',
      name: 'Palestra Motivacional',
      desc: 'Moral do elenco vai a 100. Reduz fadiga mental.',
      icon: '🎤',
      currency: 'common',
      price: 4000,
      effect: { type: 'MORAL', value: 100 },
      category: 'morale',
    },

    // ── Pacotes Comuns ────────────────────────────────────────────────────
    {
      id: 'scout_report',
      name: 'Relatório de Olheiro',
      desc: 'Revela o potencial oculto de 3 jogadores do mercado.',
      icon: '🔍',
      currency: 'common',
      price: 1500,
      effect: { type: 'SCOUT', count: 3 },
      category: 'scout',
    },
    {
      id: 'youth_camp',
      name: 'Peneira da Base',
      desc: 'Adiciona 1 jovem talento aleatório às categorias de base.',
      icon: '🌱',
      currency: 'common',
      price: 2000,
      effect: { type: 'YOUTH', count: 1 },
      category: 'youth',
    },

    // ── Itens GranFut (Premium) ───────────────────────────────────────────
    {
      id: 'elite_pack',
      name: 'Pacote Elite',
      desc: '+5 em todos os atributos do jogador solo por 5 jogos.',
      icon: '⭐',
      currency: 'granfut',
      price: 150,
      effect: { type: 'ALL_STATS', value: 5, duration: 5 },
      category: 'buff',
      premium: true,
    },
    {
      id: 'stadium_boost',
      name: 'Evento Especial no Estádio',
      desc: 'Dobra a renda de bilheteria na próxima partida em casa.',
      icon: '🏟️',
      currency: 'granfut',
      price: 80,
      effect: { type: 'TICKET_BOOST', multiplier: 2, duration: 1 },
      category: 'stadium',
      premium: true,
    },
    {
      id: 'transfer_scout',
      name: 'Super Olheiro',
      desc: 'Adiciona 5 jogadores premium ao mercado de transferências.',
      icon: '🔭',
      currency: 'granfut',
      price: 200,
      effect: { type: 'PREMIUM_MARKET', count: 5 },
      category: 'scout',
      premium: true,
    },
    {
      id: 'shirt_custom',
      name: 'Kit Visual do Clube',
      desc: 'Personalize as cores do uniforme, escudo e nome do time.',
      icon: '👕',
      currency: 'granfut',
      price: 300,
      effect: { type: 'COSMETIC', sub: 'shirt' },
      category: 'cosmetic',
      premium: true,
    },
    {
      id: 'secret_pack',
      name: 'Pacote Secreto 🔒',
      desc: 'Só aparece ao completar certas missões ocultas. Conteúdo surpresa.',
      icon: '🎁',
      currency: 'granfut',
      price: 500,
      effect: { type: 'SECRET' },
      category: 'secret',
      hidden: true,
      premium: true,
    },
  ];

  // ─── Upgrades de Infraestrutura (GranFut) ────────────────────────────────
  const FACILITY_UPGRADES = {
    stadium: [
      { level: 2, cost: 500,  name: 'Reforma Básica',   bonus: '+5.000 capacidade, +20% bilheteria' },
      { level: 3, cost: 1500, name: 'Expansão Setorial', bonus: '+15.000 capacidade, +50% bilheteria' },
      { level: 4, cost: 4000, name: 'Estádio Moderno',   bonus: '+30.000 capacidade, +100% bilheteria' },
      { level: 5, cost: 10000,name: 'Arena Premium',     bonus: 'Capacidade máxima, sede de eventos' },
    ],
    ct: [
      { level: 2, cost: 300,  name: 'CT Padrão',         bonus: '+10% XP de treino, -5% lesões' },
      { level: 3, cost: 800,  name: 'CT Profissional',    bonus: '+25% XP, novo equipamento físico' },
      { level: 4, cost: 2000, name: 'CT de Elite',        bonus: '+50% XP, análise tática avançada' },
      { level: 5, cost: 5000, name: 'Centro de Excelência',bonus: '+100% XP, atrai talentos da base' },
    ],
    marketing: [
      { level: 2, cost: 200,  name: 'Marketing Digital',   bonus: '+30% patrocínio semanal' },
      { level: 3, cost: 600,  name: 'Campanha Regional',   bonus: '+70% patrocínio, fanbase maior' },
      { level: 4, cost: 1500, name: 'Campanha Nacional',   bonus: '+150% patrocínio, visibilidade nacional' },
      { level: 5, cost: 4000, name: 'Marca Global',        bonus: 'Contratos internacionais disponíveis' },
    ],
    academia: [
      { level: 2, cost: 400,  name: 'Academia Sub-17',   bonus: 'Jovens com potencial +5' },
      { level: 3, cost: 1000, name: 'Academia Sub-20',   bonus: 'Peneiras automáticas toda temporada' },
      { level: 4, cost: 3000, name: 'Centro de Formação',bonus: 'Revela talentos com potencial 85+' },
      { level: 5, cost: 8000, name: 'Fábrica de Craques',bonus: 'Chance de revelar jogador 90+' },
    ],
  };

  // ─── Sistema Financeiro ──────────────────────────────────────────────────
  class FinanceSystem {
    constructor(club) {
      this.club = club;
    }

    // Processa balanço semanal
    processWeek(events = []) {
      const income    = this.calculateIncome(events);
      const expenses  = this.calculateExpenses();
      const net       = income - expenses;

      this.club.finances.cash = (this.club.finances.cash || 0) + net;

      const report = {
        income,
        expenses,
        net,
        breakdown: {
          tickets:    this._ticketRevenue(events),
          sponsors:   this._sponsorRevenue(),
          transfers:  events.salesRevenue || 0,
          wages:      this._totalWages(),
          maintenance:this._maintenanceCost(),
        },
        bankrupt: this.club.finances.cash < 0,
        week: new Date().toLocaleDateString('pt-BR'),
      };

      if (report.bankrupt) {
        report.guide = '🚨 FALÊNCIA IMINENTE! O saldo zerou. Venda jogadores ou a diretoria vai encerrar tudo!';
      } else if (net < 0) {
        report.guide = `📉 Semana no vermelho! Despesas de R$ ${expenses.toLocaleString()} superaram receita.`;
      } else {
        report.guide = `✅ Semana positiva! Lucro de R$ ${net.toLocaleString()}.`;
      }

      return report;
    }

    calculateIncome(events = {}) {
      return this._ticketRevenue(events) + this._sponsorRevenue() + (events.salesRevenue || 0);
    }

    calculateExpenses() {
      return this._totalWages() + this._maintenanceCost();
    }

    _ticketRevenue(events = {}) {
      const base = this.club.finances.ticketRevenue || 5000;
      const capacity = this.club.stadium?.capacity || 10000;
      const moral = this.club.moral || 70;
      const occupancy = Math.min(1, (0.3 + moral / 200 + (events.homeWin ? 0.2 : 0)));
      const multiplier = events.ticketBoost || 1;
      return Math.round(base * occupancy * multiplier);
    }

    _sponsorRevenue() {
      const base = this.club.finances.sponsorRevenue || 1000;
      const mktLevel = this.club.marketing?.level || 1;
      const bonus = [1, 1.3, 1.7, 2.5, 4][Math.min(4, mktLevel - 1)];
      return Math.round(base * bonus);
    }

    _totalWages() {
      if (!this.club.squad) return 0;
      return this.club.squad.reduce((acc, p) => acc + (p.salary || 0), 0);
    }

    _maintenanceCost() {
      const stadLvl = this.club.stadium?.level || 1;
      const ctLvl   = this.club.ct?.level || 1;
      const mktLvl  = this.club.marketing?.level || 1;
      const div = this.club.division || 'G';
      const baseCosts = { A:50000, B:20000, C:8000, D:3000, E:1000, F:300, G:80 };
      const base = baseCosts[div] || 100;
      return Math.round(base * (0.5 + (stadLvl + ctLvl + mktLvl) * 0.2));
    }

    // Compra jogador do mercado
    buyPlayer(player, overridePrice = null) {
      const price = overridePrice || player.value;
      if ((this.club.transferBudget || 0) < price) {
        return { success: false, reason: 'Orçamento de transferências insuficiente!' };
      }
      this.club.transferBudget -= price;
      return { success: true, price };
    }

    // Vende jogador
    sellPlayer(playerId) {
      if (!this.club.squad) return { success: false };
      const idx = this.club.squad.findIndex(p => p.id === playerId);
      if (idx === -1) return { success: false, reason: 'Jogador não encontrado.' };
      const player = this.club.squad[idx];
      const price = player.value || GranFutData.calcValue(player.overall, this.club.division);
      this.club.squad.splice(idx, 1);
      this.club.transferBudget = (this.club.transferBudget || 0) + price;
      this.club.finances.cash = (this.club.finances.cash || 0) + price;
      return { success: true, price, player };
    }

    // Assina patrocínio
    signSponsor(sponsor) {
      if (!this.club.sponsors) this.club.sponsors = [];
      this.club.sponsors.push(sponsor);
      // Adiantamento inicial
      const advance = sponsor.value * 4;
      this.club.finances.cash += advance;
      return { success: true, advance };
    }

    // Upgrade de infraestrutura (GranFut)
    upgradeFacility(facilityKey, user) {
      const current = this.club[facilityKey]?.level || 1;
      const upgrades = FACILITY_UPGRADES[facilityKey];
      if (!upgrades) return { success: false, reason: 'Infraestrutura inválida.' };

      const upgrade = upgrades.find(u => u.level === current + 1);
      if (!upgrade) return { success: false, reason: 'Nível máximo atingido!' };

      if ((user.granFut || 0) < upgrade.cost) {
        return { success: false, reason: `GranFut insuficiente! Necessário: ◈ ${upgrade.cost}` };
      }

      user.granFut -= upgrade.cost;
      this.club[facilityKey].level = upgrade.level;

      return { success: true, upgrade, newLevel: upgrade.level };
    }

    // Compra time completo (Modo Tycoon)
    buyClub(targetClub, user) {
      const price = calcClubPrice(targetClub);
      const gfTax = calcGranFutTax(targetClub.division);

      if ((this.club.finances.cash || 0) < price) {
        return { success: false, reason: `Saldo insuficiente. Necessário: R$ ${price.toLocaleString()}` };
      }
      if ((user.granFut || 0) < gfTax) {
        return { success: false, reason: `GranFut insuficiente. Taxa de registro: ◈ ${gfTax}` };
      }

      this.club.finances.cash -= price;
      user.granFut -= gfTax;

      return { success: true, price, gfTax, club: targetClub };
    }
  }

  // ─── Preços de Compra de Clube ───────────────────────────────────────────
  function calcClubPrice(club) {
    const basePrices = {
      G: 50000, F: 250000, E: 600000, D: 2000000,
      C: 8000000, B: 30000000, A: 150000000
    };
    const base = basePrices[club.division] || 50000;
    // Times em crise têm 50% de desconto
    const discount = (club.finances?.cash || 0) < 0 ? 0.5 : 1;
    return Math.round(base * discount);
  }

  function calcGranFutTax(division) {
    const taxes = { G:50, F:150, E:400, D:750, C:1500, B:3000, A:5000 };
    return taxes[division] || 50;
  }

  // ─── Aplicar efeito de item da loja ─────────────────────────────────────
  function applyShopEffect(itemId, state) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, reason: 'Item não encontrado.' };

    const currency = item.currency === 'granfut' ? 'granFut' : 'cash';
    const balance = item.currency === 'granfut' ? (state.user.granFut || 0) : (state.team.finances.cash || 0);

    if (balance < item.price) {
      return { success: false, reason: `${item.currency === 'granfut' ? 'GranFut' : 'Saldo'} insuficiente!` };
    }

    if (item.currency === 'granfut') {
      state.user.granFut -= item.price;
    } else {
      state.team.finances.cash -= item.price;
    }

    // Aplicar efeito
    const eff = item.effect;
    switch (eff.type) {
      case 'ENERGY':
        if (state.soloPlayer) {
          state.soloPlayer.energy = Math.min(100, (state.soloPlayer.energy || 0) + eff.value);
        }
        break;
      case 'TEAM_ENERGY':
        if (state.team.squad) {
          state.team.squad.forEach(p => {
            p.energy = Math.min(100, (p.energy || 0) + eff.value);
          });
        }
        break;
      case 'HEAL':
        if (state.team.squad) {
          const injured = state.team.squad.find(p => p.injured);
          if (injured) { injured.injured = false; injured.injuredWeeks = 0; }
        }
        break;
      case 'MORAL':
        if (state.team) state.team.moral = eff.value;
        break;
      case 'YOUTH':
        if (!state.team.youth) state.team.youth = [];
        for (let i = 0; i < eff.count; i++) {
          state.team.youth.push(GranFutData.generatePlayer(state.team.division, GranFutData.pick(['ATA','MEI','ZAG'])));
        }
        break;
      case 'TICKET_BOOST':
        state.ticketBoostNext = (state.ticketBoostNext || 1) * eff.multiplier;
        break;
      case 'TRAIN_BOOST':
        state.trainBoostNext = eff.value;
        break;
      case 'SECRET':
        return applySecretPack(state);
    }

    return { success: true, item };
  }

  function applySecretPack(state) {
    const rewards = [
      { desc: '◈ 200 GranFut de bônus!', fn: (s) => s.user.granFut = (s.user.granFut || 0) + 200 },
      { desc: 'Chuteira de Titânio: +10 Pace por 10 jogos', fn: (s) => { if(s.soloPlayer) s.soloPlayer.tempBuffPace = (s.soloPlayer.tempBuffPace||0) + 10; } },
      { desc: 'Convocação da Seleção! +50 Reputação', fn: (s) => { if(s.soloPlayer) s.soloPlayer.reputation = (s.soloPlayer.reputation||0) + 50; } },
      { desc: 'Contrato de Patrocínio Secreto: R$ 50.000', fn: (s) => s.team.finances.cash = (s.team.finances.cash||0) + 50000 },
    ];
    const reward = GranFutData.pick(rewards);
    reward.fn(state);
    return { success: true, isSecret: true, desc: reward.desc };
  }

  // ─── Sistema de Treino ───────────────────────────────────────────────────
  const TRAINING_CONFIG = {
    COMPULSORY_INTERVAL: 2,  // jogos sem treinar = penalidade
    REGRESSION_RATE: 0.05,   // 5% de perda nos atributos físicos
    XP_MANDATORY: 50,
    XP_OPTIONAL: 80,
    INJURY_RISK_OVERLOAD: 0.15, // 15% de risco se treinar além do limite
  };

  function processTraining(player, type = 'MANDATORY', ctLevel = 1, boostMultiplier = 1) {
    const ctBonus = [1, 1.1, 1.25, 1.5, 2][Math.min(4, ctLevel - 1)];
    const xpBase = type === 'OPTIONAL' ? TRAINING_CONFIG.XP_OPTIONAL : TRAINING_CONFIG.XP_MANDATORY;
    const xpGain = Math.round(xpBase * ctBonus * boostMultiplier);

    const result = { xpGain, attrChanges: {}, injured: false, regression: false };

    if (type !== 'NONE') {
      player.gamesSinceLastTraining = 0;

      // Evolução de atributos
      const gain = (0.3 + Math.random() * 0.5) * ctBonus * boostMultiplier;
      const attrList = ['strength','stamina','dexterity','intelligence','pace'];
      const attrToBoost = attrList[Math.floor(Math.random() * attrList.length)];
      player[attrToBoost] = Math.min(99, (player[attrToBoost] || 60) + gain);
      result.attrChanges[attrToBoost] = +gain.toFixed(2);

      // Energia consumida
      player.energy = Math.max(10, (player.energy || 100) - (type === 'OPTIONAL' ? 20 : 12));
      player.xp = (player.xp || 0) + xpGain;
      player.overall = recalcOverall(player);

      // Risco de lesão por overtraining (treino opcional acumulado)
      if (type === 'OPTIONAL' && Math.random() < TRAINING_CONFIG.INJURY_RISK_OVERLOAD) {
        player.injured = true;
        player.injuredWeeks = GranFutData.rnd(1, 3);
        result.injured = true;
        result.guide = `🩺 GUIA: Excesso de treinos! ${player.name} se machucou levemente. ${player.injuredWeeks} semana(s) fora.`;
      }

    } else {
      // Sem treino
      player.gamesSinceLastTraining = (player.gamesSinceLastTraining || 0) + 1;

      if (player.gamesSinceLastTraining > TRAINING_CONFIG.COMPULSORY_INTERVAL) {
        const regress = TRAINING_CONFIG.REGRESSION_RATE;
        player.strength = Math.max(10, (player.strength || 60) * (1 - regress));
        player.pace     = Math.max(10, (player.pace     || 60) * (1 - regress));
        player.overall  = recalcOverall(player);
        result.regression = true;
        result.guide = `⚠️ GUIA: ${player.name} está enferrujando! ${Math.round(regress*100)}% de regressão nos atributos físicos por falta de treino.`;
      }
    }

    return result;
  }

  function recalcOverall(p) {
    const attrs = [p.pace, p.strength, p.stamina, p.dexterity, p.intelligence, p.shooting, p.defending];
    const valid = attrs.filter(Boolean);
    if (valid.length === 0) return p.overall || 60;
    const avg = valid.reduce((a,b) => a+b, 0) / valid.length;
    return Math.round(Math.min(99, Math.max(10, avg)));
  }

  // ─── Geração de Patrocínios ──────────────────────────────────────────────
  const SPONSOR_POOL = [
    'TechSport','Banco Nacional GF','Mídia Esportiva','AutoGol Motors',
    'SuperBet GranFut','Construções Vitória','Alimentos União','EnergiaVerde',
    'Seraos Bank','LogíStica Expressa','Farma Popular','Telecom BR',
    'Máquinas Pesadas SA','Hotel Palmeiras','Rede Sudeste TV',
  ];

  function generateSponsor(division) {
    const div = GranFutData.DIVISIONS[division] || GranFutData.DIVISIONS.G;
    const value = Math.round(div.budget * 0.03 * (0.8 + Math.random() * 0.6));
    return {
      id: GranFutData.uid(),
      name: GranFutData.pick(SPONSOR_POOL),
      value,
      duration: GranFutData.rnd(1,3),
    };
  }

  // ─── Validação de Doação (Hash offline) ─────────────────────────────────
  function generateDonationCode(email, tier) {
    // Hash simples XOR determinístico (não usar em produção real)
    // Para produção, use HMAC-SHA256 no servidor
    let hash = 0;
    const str = email.toLowerCase().trim() + '|SERAOS_GF_2025|' + tier;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const code = Math.abs(hash).toString(36).toUpperCase().padStart(8,'0').slice(0,8);
    return `GF${tier.toUpperCase()}-${code}`;
  }

  function validateDonationCode(email, code) {
    const tiers = ['ESTADO','NACION'];
    for (const tier of tiers) {
      const expected = generateDonationCode(email, tier);
      if (expected === code) {
        return {
          valid: true,
          tier: tier === 'ESTADO' ? 1 : 2,
          granFutBonus: tier === 'ESTADO' ? 500 : 1500,
          message: tier === 'ESTADO'
            ? '✅ Série D/E desbloqueadas! Bônus de ◈ 500 GranFut.'
            : '✅ Série A/B/C desbloqueadas! Bônus de ◈ 1.500 GranFut.',
        };
      }
    }
    return { valid: false, message: '❌ Código inválido. Verifique o e-mail e tente novamente.' };
  }

  // ─── Export ───────────────────────────────────────────────────────────────
  return {
    SHOP_ITEMS,
    FACILITY_UPGRADES,
    TRAINING_CONFIG,
    FinanceSystem,
    applyShopEffect,
    processTraining,
    recalcOverall,
    generateSponsor,
    generateDonationCode,
    validateDonationCode,
    calcClubPrice,
    calcGranFutTax,
  };

})();
