/* ════════════════════════════════════════════════════
   GranFut · engine.js  — Motor de Partida v1.5
   Narração "Estilo Luiz" com contexto dinâmico
   Eventos: Gol, Falta, Cartão, Expulsão, Briga, Pênalti, Escanteio
   ════════════════════════════════════════════════════ */
'use strict';

const GranFutEngine = (() => {

  // ─── Banco de Narrações "Estilo Luiz" ────────────────────────────────────
  const NARR = {
    GOAL: {
      NORMAL: [
        "OLHA O QUE ELE FEZ! OLHA O QUE ELE FEZ! É REDE!!!",
        "TÁ LÁ DENTRO! Onde a coruja dorme e o goleiro chora!",
        "GOOOOOL! Solta o grito da garganta, torcedor!",
        "É CAIXA! O artilheiro não perdoa na cara do gol!",
        "GOOOL DO {team}! A bola entrou como um foguete!",
        "PARABÉNS MINHA GENTE! QUE GOLAÇO!",
        "TOMOU! A defesa não viu nem a cor da bola!",
        "FEZ UMA! Mandou a bola no lugar certo, na hora certa!",
        "CAIU! O goleiro ficou plantado que nem árvore!",
      ],
      CLUTCH: [
        "NO APAGAR DAS LUZES! É PRA INFARTAR O TORCEDOR!",
        "EXPLODE O ESTÁDIO! Um gol épico nos últimos suspiros!",
        "HEROICO! Ele coloca o nome na história da rodada!",
        "MEUS DEUS DO CÉU! Nos acréscimos! O {team} vira a mesa!",
        "INACREDITÁVEL! IMPOSSÍVEL! ACONTECEU! {team} nos acréscimos!",
      ],
      HEADER: [
        "DE CABEÇA! Uma tabela perfeita e a bola entrou na gaveta!",
        "CABEÇADA CERTEIRA! O goleiro nem saiu na foto!",
        "OLHA A CABEÇADA DO {scorer}! QUE PONTARIA!",
      ],
      DISTANCE: [
        "QUE PINTURA! Mandou um pombo sem asa do meio da rua!",
        "DO MEIO DO CAMPO?! O goleiro nem saiu na foto!",
        "DE FORA DA ÁREA! Que golaço histórico! {team} faz!",
        "CHUTOU DE LONGE! A bola entrou no ângulo igual carta no correio!",
      ],
      PENALTY: [
        "CONVERTEU O PÊNALTI! {scorer} bateu no canto e não tem jeito!",
        "GOL DE PÊNALTI! O {team} aproveita a chance e não perdoa!",
        "CAVOU E CONVERTEU! Pênalti soberano do {scorer}!",
      ],
      OWN_GOAL: [
        "CONTRA! O {team_against} marcou contra! A sorte estava ao lado do adversário!",
        "TRAGÉDIA! Gol contra do {team_against}! O torcedor não acredita!",
      ],
    },

    MISS: [
      "ISOLOU! Mandou a redonda lá na arquibancada para espantar o pombo!",
      "PELO AMOR DOS MEUS FILHINHOS! Como é que perde um gol desse?!",
      "A bola passou raspando a trave... o grito de gol ficou entalado!",
      "Chutou torto! Parecia que estava com a chuteira trocada!",
      "QUE DESPERDÍCIO! O gol estava completamente aberto!",
      "Mandou a bola num endereço errado! O goleiro agradece!",
      "POR UMA PALHA! A bola tirou tinta da trave e saiu!",
      "Pegou mal na bola! Mandou pro lado de onde Judas perdeu as botas!",
    ],

    SAVE: [
      "MILAGRE! O goleiro buscou onde a coruja dorme!",
      "PAREDE! Ele fechou o ângulo e disse: 'AQUI NÃO!'",
      "ESPALMA! Uma defesa de cinema para salvar o time!",
      "VIROU O JOGO! O goleiro jogou a bola pra escanteio com categoria!",
      "DEFENDEU! Que intervenção soberba! O goleiro está inspiradíssimo!",
      "NÃO PASSOU! O {team} agradece ao seu goleiro pela defesaça!",
    ],

    FOUL: [
      "Passou o rodo! Levou a bola e o tornozelo de brinde!",
      "Falta perigosa! O batedor já está de olho no ângulo...",
      "O juiz marcou! O jogador reclama, mas a pancada foi clara.",
      "FALTAÇO! Entrada de estudar! Deixa o cara andando torto!",
      "Pisou na bola depois do adversário. Falta clara. Juiz marcou.",
      "Falta. O {team} vai bater de falta. Quem sai pra barreira?",
    ],

    YELLOW: [
      "CARTÃO AMARELO! O juiz perdeu a paciência com a entrada!",
      "AMARELOU! {player} recebe advertência. Ainda tem jogo pela frente.",
      "Cartão na cara dura! O jogo tá quente demais aqui!",
      "Amarelo mostrado. {player} reclamou demais e o árbitro se impôs.",
    ],

    RED: [
      "VERMELHO! {player} tá FORA! Entrou pesado demais e o juiz não perdoou!",
      "EXPULSO! E agora, como fica o {team} com um a menos?!",
      "SEGUNDO AMARELO = VERMELHO! {player} vai ter que assistir do vestiário!",
      "FUI! RUA! QUE BURRICE! {player} perdeu a cabeça na hora errada!",
      "Direto pro vermelho! Essa entrada foi pra lesionar! Expulsão justa!",
    ],

    BRAWL: {
      PLAYERS: [
        "O TEMPO FECHOU! É o famoso 'deixa disso' que ninguém quer deixar!",
        "CENAS LAMENTÁVEIS! Os jogadores estão trocando carinhos nada amistosos!",
        "CLIMA QUENTE! O juiz perdeu o controle, é confusão no gramado!",
        "ENTRA TUDOOO! Jogadores dos dois times se juntaram na pancadaria!",
        "Bate boca virou pancadaria! O auxiliar também vai se envolver?",
      ],
      STAFF: [
        "ATÉ O TÉCNICO SE ENVOLVEU! Desceu do banco e veio meter o bedelho!",
        "O AUXILIAR TÉCNICO FOI EXPULSO! Falou demais pro quarto árbitro!",
        "TÉCNICO EXPULSO! Gesticulou demais e levou cartão vermelho do banco!",
      ],
      CROWD: [
        "CENAS TERRÍVEIS NAS ARQUIBANCADAS! A torcida está em conflito!",
        "O JOGO TÁ SUSPENSO! Briga generalizada na torcida do clássico!",
        "CAPETA SOLTO NAS ARQUIBANCADAS! A polícia já foi acionada!",
      ],
    },

    CORNER: [
      "Escanteio para o {team}! A zaga salvou na linha!",
      "Saiu pela linha de fundo. Escanteio cobrado...",
      "ESCANTEIO! O {team} vai cruzar na área!",
    ],

    PENALTY_MISS: [
      "PERDEU O PÊNALTI! O goleiro adivinhou o lado! Que defesaça épica!",
      "NA TRAVE! O pênalti bateu no ferro! O goleiro nem se moveu!",
      "MANDOU FORA! Inacreditável! Perdeu o pênalti por cima do gol!",
    ],

    FATIGUE: [
      "O {player} está claramente cansado. Precisa ser substituído urgente!",
      "Corrida pesada! {player} está andando em campo. A energia acabou.",
      "FADIGA TOTAL! {player} parece que esqueceu o futebol no vestiário.",
    ],

    SUBSTITUTION: [
      "SUBSTITUIÇÃO NO {team}: Sai {player_out}, entra {player_in}!",
      "Mexida tática no {team}: {player_in} em campo no lugar de {player_out}.",
    ],

    HALFTIME: [
      "FIM DO PRIMEIRO TEMPO! O placar marca {score}. Boa noite no vestiário!",
      "INTERVALO! Tempo para o técnico fazer a cabeça do time!",
      "ZERO A ZERO NO INTERVALO! Jogo aberto, tudo pra decidir no segundo tempo!",
    ],

    FULLTIME: [
      "FIM DE JOGO! {score}. O resultado está definido!",
      "APITOU O FIM! O {team} sai com os três pontos!",
      "ACABOU! {score}. Que batalha essa aqui hoje!",
    ],

    KICKOFF: [
      "COMEÇOU O ESPETÁCULO! O árbitro apitou! Vamos nessa!",
      "BOI NA CHÁCARA! O jogo começou entre {home} e {away}!",
      "E BOM FUTEBOL! A bola rola entre {home} e {away}!",
    ],

    GUIDE: {
      LOW_ENERGY: "⚡ GUIA: Energia baixa em {player}. Risco de lesão. Substituição recomendada!",
      LOSING_STREAK: "📉 GUIA: {matches} derrotas seguidas. A diretoria está de olho. Algo precisa mudar!",
      TACTICAL: "💡 GUIA: O adversário está explorando o corredor direito. Posicione um lateralmente.",
      GOOD_FORM:  "⭐ GUIA: Boa sequência de resultados! Continue com a mesma formação.",
      STAGNATION: "⚠️ GUIA: Seus atributos pararam de crescer. Faça o treino obrigatório esta semana!",
      INJURY:     "🩺 GUIA: {player} se lesionou! Custos de recuperação: R$ 3.000",
      OPPORTUNITY:"🔍 GUIA: Olheiro detectou talento da Série {div} disponível no mercado.",
      COMEBACK:   "🔥 GUIA: Conseguiu virar o jogo! Moral do elenco disparou. Bom momento para renovar contratos.",
    },
  };

  // ─── Buffer anti-repetição ────────────────────────────────────────────────
  const recentPhrases = [];
  const BUFFER_SIZE = 8;

  function pickNarration(pool) {
    if (!pool || pool.length === 0) return '';
    const available = pool.filter(p => !recentPhrases.includes(p));
    const phrase = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    recentPhrases.push(phrase);
    if (recentPhrases.length > BUFFER_SIZE) recentPhrases.shift();
    return phrase;
  }

  function format(tpl, vars = {}) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
  }

  // ─── Classe Principal do Motor ────────────────────────────────────────────
  class MatchEngine {
    constructor(home, away, options = {}) {
      this.home = home;   // { id, name, power, aggression, moral, squad, colors }
      this.away = away;

      this.isDerby    = options.isDerby    || false;
      this.isSoloMode = options.isSoloMode || false;
      this.userPlayer = options.userPlayer || null;
      this.speed      = options.speed      || 'NORMAL'; // NORMAL=60s/tempo FAST=15s/tempo

      this.state = {
        minute: 0,
        half: 1,
        scoreH: 0,
        scoreA: 0,
        yellowsH: 0, yellowsA: 0,
        redsH: 0,    redsA: 0,
        cornersH: 0, cornersA: 0,
        foulsH: 0,   foulsA: 0,
        shotsH: 0,   shotsA: 0,
        events: [],
        finished: false,
        intervalReached: false,
        injuredPlayers: [],
        expelledPlayers: [],
        additionalTime: 0,
      };

      this._timer = null;
      this._paused = false;
      this._callbacks = {};
    }

    // Velocidade em ms por minuto de jogo
    get tickRate() {
      const totalMs = this.speed === 'FAST' ? 15000 : 60000;
      return Math.floor(totalMs / 45);
    }

    on(event, cb) { this._callbacks[event] = cb; return this; }
    emit(event, data) { if (this._callbacks[event]) this._callbacks[event](data); }

    start() {
      const entry = pickNarration(NARR.KICKOFF);
      this._log(format(entry, { home: this.home.name, away: this.away.name }), 'kickoff');
      this._scheduleNext();
    }

    pause()  { this._paused = true;  clearTimeout(this._timer); }
    resume() { this._paused = false; this._scheduleNext(); }

    setSpeed(s) {
      this.speed = s;
      this.emit('speedChange', s);
    }

    _scheduleNext() {
      if (this._paused) return;
      this._timer = setTimeout(() => this._tick(), this.tickRate);
    }

    _tick() {
      const s = this.state;
      s.minute++;

      this._processMinute(s.minute);

      // Fim de tempo
      const limit = s.half === 1 ? 45 : 90 + s.additionalTime;

      if (s.half === 1 && s.minute >= 45) {
        this._halfTime();
        return;
      }

      if (s.half === 2 && s.minute >= limit) {
        this._fullTime();
        return;
      }

      this._scheduleNext();
    }

    _processMinute(min) {
      const s = this.state;
      const chance = Math.random() * 100;

      // ── Brigas e Confusão ─────────────────────────
      const brawlChance = this.isDerby ? 2.5 : 0.4;
      if (chance < brawlChance) {
        this._triggerBrawl(min);
        return;
      }

      // ── Faltas ────────────────────────────────────
      if (chance < 10) {
        this._triggerFoul(min, chance < 5 ? 'H' : 'A');
        return;
      }

      // ── Escanteio ─────────────────────────────────
      if (chance < 14) {
        const side = Math.random() < 0.5 ? 'H' : 'A';
        side === 'H' ? s.cornersH++ : s.cornersA++;
        this._log(format(pickNarration(NARR.CORNER), { team: side === 'H' ? this.home.name : this.away.name }), 'normal');
        return;
      }

      // ── Tentativa de Gol ──────────────────────────
      if (chance < 22) {
        this._goalAttempt(min, chance);
        return;
      }

      // ── Fadiga do Jogador Solo ────────────────────
      if (this.isSoloMode && this.userPlayer && chance < 24) {
        const p = this.userPlayer;
        if (p.energy < 30) {
          const msg = format(NARR.GUIDE.LOW_ENERGY, { player: p.name });
          this._log(msg, 'guide');
          this.emit('guideTip', msg);
        }
      }
    }

    _goalAttempt(min, chance) {
      const s = this.state;
      const powerH = this._effectivePower('H');
      const powerA = this._effectivePower('A');
      const total  = powerH + powerA;

      // Vantagem de mandante
      const homeProb = (powerH / total) * 100 + 5;
      const attackingSide = Math.random() * 100 < homeProb ? 'H' : 'A';

      const attacker = attackingSide === 'H' ? this.home : this.away;
      const defender = attackingSide === 'H' ? this.away : this.home;

      attackingSide === 'H' ? s.shotsH++ : s.shotsA++;

      // Qualidade do chute (baseada em poder relativo)
      const shotQuality = 40 + (attackingSide === 'H' ? powerH : powerA) / 2;
      const defQuality  = 40 + (attackingSide === 'H' ? powerA : powerH) / 2;

      const isGoal = Math.random() * 100 < (shotQuality - defQuality * 0.6 + rnd(0,20));

      if (isGoal) {
        attackingSide === 'H' ? s.scoreH++ : s.scoreA++;

        let pool = NARR.GOAL.NORMAL;
        if (min > 85)       pool = NARR.GOAL.CLUTCH;
        else if (chance < 14.5) pool = NARR.GOAL.DISTANCE;
        else if (chance < 16)   pool = NARR.GOAL.HEADER;

        const scorer = this._pickScorer(attacker);
        const msg = format(pickNarration(pool), { team: attacker.name, scorer: scorer ? scorer.name : '', score: this._scoreStr() });
        this._log(msg, 'goal');
        this.emit('goal', { side: attackingSide, scorer, min, score: { h: s.scoreH, a: s.scoreA } });
      } else {
        // Defesa ou erro
        const isSave = Math.random() < 0.5;
        const msg = isSave
          ? format(pickNarration(NARR.SAVE), { team: defender.name })
          : pickNarration(NARR.MISS);
        this._log(msg, 'normal');
        this.emit('shot', { side: attackingSide, result: isSave ? 'save' : 'miss' });
      }
    }

    _triggerFoul(min, side) {
      const s = this.state;
      const team = side === 'H' ? this.home : this.away;
      side === 'H' ? s.foulsH++ : s.foulsA++;

      const foulMsg = format(pickNarration(NARR.FOUL), { team: team.name });
      this._log(foulMsg, 'normal');

      // Chance de cartão
      const cardChance = 30 + (team.aggression || 50) * 0.2 + (this.isDerby ? 15 : 0);

      if (Math.random() * 100 < cardChance) {
        const player = this._pickRandomPlayer(team);
        const hasYellow = player && player._yellow;

        if (hasYellow || Math.random() < 0.08) {
          // Vermelho
          const msg = format(pickNarration(NARR.RED), { player: player?.name || 'Jogador', team: team.name });
          this._log(msg, 'red');
          side === 'H' ? s.redsH++ : s.redsA++;
          if (player) { player._expelled = true; s.expelledPlayers.push(player); }
          this.emit('redCard', { side, player, min });

          // Multa e reputação
          this.emit('punishment', { type: 'RED_CARD', team: team.name, fine: rnd(5000, 20000), repLoss: rnd(3,8) });
        } else {
          // Amarelo
          const msg = format(pickNarration(NARR.YELLOW), { player: player?.name || 'Jogador' });
          this._log(msg, 'yellow');
          side === 'H' ? s.yellowsH++ : s.yellowsA++;
          if (player) player._yellow = true;
          this.emit('yellowCard', { side, player, min });
        }
      }

      // Chance de pênalti (se falta foi na área)
      if (Math.random() < 0.08) {
        this._triggerPenalty(min, side === 'H' ? 'A' : 'H');
      }
    }

    _triggerBrawl(min) {
      const s = this.state;
      const r = Math.random();
      let pool, type;

      if (r < 0.5)      { pool = NARR.BRAWL.PLAYERS; type = 'players'; }
      else if (r < 0.75){ pool = NARR.BRAWL.STAFF;   type = 'staff'; }
      else              { pool = this.isDerby ? NARR.BRAWL.CROWD : NARR.BRAWL.PLAYERS; type = 'crowd'; }

      const msg = pickNarration(pool);
      this._log(msg, 'brawl');

      // Expulsões automáticas em brigas
      s.yellowsH += rnd(0,2); s.yellowsA += rnd(0,2);

      const consequences = {
        type: 'BRAWL',
        repLoss: type === 'crowd' ? rnd(10,25) : rnd(3,10),
        fine: type === 'crowd' ? rnd(20000, 80000) : rnd(5000, 15000),
        homeTeam: this.home.name,
        min,
        isDerby: this.isDerby,
      };
      this.emit('brawl', consequences);
      this.emit('punishment', consequences);

      // Guide
      const guideMsg = `⚠️ GUIA: Incidente no jogo! Reputação do clube afetada. Multa de R$ ${consequences.fine.toLocaleString()}.`;
      this._log(guideMsg, 'guide');
      this.emit('guideTip', guideMsg);
    }

    _triggerPenalty(min, beneficiarySide) {
      const team = beneficiarySide === 'H' ? this.home : this.away;
      const s = this.state;

      this._log(`🔴 PÊNALTI! O árbitro aponta para a marca! ${team.name} vai cobrar...`, 'penalty');

      // Aguarda 1 tick e converte ou perde
      setTimeout(() => {
        const converted = Math.random() < 0.75;
        if (converted) {
          const scorer = this._pickScorer(team);
          const msg = format(pickNarration(NARR.GOAL.PENALTY), { team: team.name, scorer: scorer?.name || '' });
          this._log(msg, 'goal');
          beneficiarySide === 'H' ? s.scoreH++ : s.scoreA++;
          this.emit('goal', { side: beneficiarySide, scorer, min, isPenalty: true, score: { h: s.scoreH, a: s.scoreA } });
        } else {
          const msg = pickNarration(NARR.PENALTY_MISS);
          this._log(msg, 'normal');
        }
        this.emit('penalty', { side: beneficiarySide, converted });
      }, this.tickRate * 0.5);
    }

    _halfTime() {
      const s = this.state;
      s.intervalReached = true;
      this._paused = true;

      const scoreStr = this._scoreStr();
      const msg = format(
        NARR.HALFTIME[Math.floor(Math.random() * NARR.HALFTIME.length)],
        { score: scoreStr }
      );
      this._log(msg, 'halftime');

      // Guia de intervalo
      const guideMsg = this._buildIntervalGuide();
      this.emit('guideTip', guideMsg);
      this.emit('halftime', { score: { h: s.scoreH, a: s.scoreA }, guideMsg });
    }

    startSecondHalf() {
      const s = this.state;
      s.half = 2;
      s.intervalReached = false;
      s.additionalTime = rnd(2,6);
      this._paused = false;
      this._log(`═══ 2° TEMPO ═══  Acréscimos previstos: +${s.additionalTime}'`, 'normal');
      this._scheduleNext();
    }

    _fullTime() {
      const s = this.state;
      s.finished = true;

      const winning = s.scoreH > s.scoreA ? this.home
                    : s.scoreA > s.scoreH ? this.away
                    : null;

      const msg = format(
        NARR.FULLTIME[Math.floor(Math.random() * NARR.FULLTIME.length)],
        { score: this._scoreStr(), team: winning?.name || '' }
      );
      this._log(msg, 'fulltime');

      const result = this._buildResult();
      this.emit('fulltime', result);

      // Análise pós-jogo do Guia
      const postGuide = this._buildPostMatchGuide(result);
      this.emit('guideTip', postGuide);
    }

    _buildResult() {
      const s = this.state;
      const diff = s.scoreH - s.scoreA;
      const outcome = diff > 0 ? 'WIN' : diff < 0 ? 'LOSS' : 'DRAW';

      return {
        home: this.home.name,
        away: this.away.name,
        scoreH: s.scoreH,
        scoreA: s.scoreA,
        outcome,
        yellowsH: s.yellowsH, yellowsA: s.yellowsA,
        redsH: s.redsH, redsA: s.redsA,
        cornersH: s.cornersH, cornersA: s.cornersA,
        foulsH: s.foulsH, foulsA: s.foulsA,
        shotsH: s.shotsH, shotsA: s.shotsA,
        events: [...s.events],
        expelledPlayers: [...s.expelledPlayers],
      };
    }

    _buildIntervalGuide() {
      const s = this.state;
      const scoreDiff = s.scoreH - s.scoreA;

      if (scoreDiff < -1) return '💡 GUIA: Estamos perdendo feio. Hora de arriscar! Troque um defensor por um atacante.';
      if (scoreDiff > 1)  return '🔒 GUIA: Boa vantagem! Recue um pouco, economize energia e segure o resultado.';
      if (s.yellowsH >= 2) return '⚠️ GUIA: Muitos amarelos! Avise seus jogadores para controlarem a agressividade no 2° tempo.';
      return '📊 GUIA: Jogo equilibrado. Foque em aproveitar as bolas paradas. Seu adversário está cansado.';
    }

    _buildPostMatchGuide(result) {
      if (result.outcome === 'WIN') {
        return '⭐ GUIA: Boa vitória! Moral do elenco subiu. Bom momento para renovar contratos favoráveis.';
      }
      if (result.outcome === 'LOSS') {
        return '📉 GUIA: Derrota. Análise os atributos mais fracos do elenco e programe um treino intensivo.';
      }
      return '🤝 GUIA: Empate. Resultado razoável dependendo do adversário. Continue no campeonato.';
    }

    _effectivePower(side) {
      const team = side === 'H' ? this.home : this.away;
      const base = team.power || 60;
      const moralBonus = ((team.moral || 70) - 70) * 0.1;
      const redPenalty = (side === 'H' ? this.state.redsH : this.state.redsA) * 5;
      return Math.max(10, base + moralBonus - redPenalty);
    }

    _pickScorer(team) {
      if (!team.squad || team.squad.length === 0) return null;
      const attackers = team.squad.filter(p => p.position === 'ATA' || p.position === 'MEI');
      const pool = attackers.length > 0 ? attackers : team.squad;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    _pickRandomPlayer(team) {
      if (!team.squad || team.squad.length === 0) return null;
      const active = team.squad.filter(p => !p._expelled);
      return active[Math.floor(Math.random() * active.length)] || null;
    }

    _scoreStr() {
      return `${this.state.scoreH} – ${this.state.scoreA}`;
    }

    _log(text, type = 'normal') {
      const entry = { min: this.state.minute, text, type };
      this.state.events.push(entry);
      this.emit('event', entry);
    }
  }

  // ─── Smart Guide (Análise de Estagnação) ─────────────────────────────────
  function buildGuideAdvice(playerStats, matchStats, leagueStats) {
    const tips = [];

    if (playerStats.energy < 30) {
      tips.push('⚡ Sua energia está crítica! Compre um pacote de recuperação na Loja ou descanse.');
    }
    if (matchStats.rating < 5.0) {
      const weakAttr = getWeakestAttribute(playerStats);
      tips.push(`📉 Nota abaixo de 5. Seu atributo mais fraco é ${weakAttr}. Foque o treino obrigatório nele.`);
    }
    if (leagueStats.lossStreak >= 3) {
      tips.push('🔴 3 derrotas seguidas. A diretoria está inquieta. Considere mudar a tática ou reforçar o elenco.');
    }
    if (leagueStats.winStreak >= 3) {
      tips.push('🌟 3 vitórias seguidas! O time está em ótima fase. Hora de ousar e tentar subir de divisão.');
    }
    if (playerStats.gamesSinceTraining >= 2) {
      tips.push('🏋️ Treino obrigatório pendente! Sem treinar, seus atributos vão regredir 5% por rodada.');
    }
    if (matchStats.opponentPower > playerStats.teamPower + 10) {
      tips.push(`⚠️ Adversário ${matchStats.opponentPower - playerStats.teamPower} pontos mais forte. Defesa compacta e contra-ataques são a chave.`);
    }
    if (tips.length === 0) {
      tips.push('✅ Tudo certo! Mantenha a consistência para atrair olheiros de divisões superiores.');
    }

    return tips[Math.floor(Math.random() * Math.min(tips.length, 2))];
  }

  function getWeakestAttribute(stats) {
    const attrs = {
      'Pace': stats.pace, 'Força': stats.strength, 'Stamina': stats.stamina,
      'Destreza': stats.dexterity, 'Inteligência': stats.intelligence,
    };
    return Object.entries(attrs).sort(([,a],[,b]) => a-b)[0][0];
  }

  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // ─── Export ───────────────────────────────────────────────────────────────
  return {
    MatchEngine,
    NARR,
    buildGuideAdvice,
    pickNarration,
    format,
  };

})();
