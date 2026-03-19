/* ════════════════════════════════════════════════════
   GranFut · narr_patch.js — Narração com Nomes
   Substitui {time} por JOGADOR da EQUIPE nas narrações
   de falta, pênalti e escanteio
   Saieso Seraos Edition v1.0
   ════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.GranFutEngine?.MatchEngine) {
    console.warn('[narr_patch] GranFutEngine não encontrado'); return;
  }

  const ME = GranFutEngine.MatchEngine.prototype;

  // ── Micro-utilitários (réplica dos privados do engine) ──────────────────
  const _p  = arr => arr[Math.floor(Math.random() * arr.length)];
  const _f  = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  const _r  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  // "CAUÃ S." — nome curto legível para narração
  const _sn = p => {
    if (!p?.name) return 'Jogador';
    const pts = p.name.split(' ');
    return pts.length === 1
      ? pts[0].toUpperCase()
      : `${pts[0].toUpperCase()} ${pts[pts.length - 1][0].toUpperCase()}.`;
  };

  // ── Pools de narração aprimorados ────────────────────────────────────────

  const FOUL = [
    "{player} da {team} entra com o pé em cima! Falta clara, o árbitro apita!",
    "PANCADA! {player} ({team}) derruba o adversário no meio do campo!",
    "{player} ({team}) comete falta desnecessária — juiz para o jogo.",
    "Que entrada dura! {player} da {team} pisa no calcanhar do rival!",
    "{player} ({team}) chega atrasado e o árbitro não perdoa. Falta!",
    "Bateu feio! {player} da {team} levou a bola e o tornozelo de brinde.",
    "{player} ({team}) — falta na beira da área. Bola parada perigosa!",
  ];

  const RED = [
    "VERMELHO! {player} ({team}) tá FORA! Entrada pesada demais!",
    "EXPULSO! {player} da {team} vai pro vestiário mais cedo!",
    "SEGUNDO AMARELO = VERMELHO! {player} ({team}) perdeu a cabeça!",
    "Direto pro vermelho! {player} da {team} entrou pra machucar!",
    "FUI! RUA! {player} ({team}) tirou a raiva no adversário. Expulsão justa!",
  ];

  const YELLOW = [
    "AMARELO! {player} ({team}) recebe advertência. Cuidado no 2° tempo!",
    "Cartão amarelo pra {player} da {team}! O árbitro se impôs.",
    "{player} ({team}) amarelouuuu! Ainda tem jogo pela frente.",
    "O juiz tirou o cartão pra {player} da {team}. Reclamou demais!",
    "Amarelo mostrado. {player} ({team}) vai ter que se controlar.",
  ];

  const CORNER = [
    "{player} da {team} vai bater o escanteio! Área lotada de jogadores!",
    "Escanteio pra {team}! {player} se prepara pra cobrar. Tensão na área!",
    "{player} ({team}) cobra o escanteio com precisão. Bola perigosa!",
    "Saiu! {player} da {team} já está na bandeirinha pro escanteio.",
    "{player} vai bater pra {team}! Quem vai aparecer pra cabecear?",
  ];

  const PEN_WON = [
    "{player} da {team} é derrubado dentro da área! PÊNALTI! O árbitro não tem dúvidas!",
    "MÃOS NA ÁREA! O árbitro viu tudo — pênalti pra {team} depois de jogada de {player}!",
    "{player} ({team}) é empurrado pelo goleiro! PÊNALTI! Que escândalo!",
    "O árbitro aponta para o ponto! {player} da {team} foi derrubado com o pé dentro!",
    "Contato! {player} ({team}) caiu na área e o juiz apita pênalti!",
  ];

  const PEN_KICK = [
    "{player} ({team}) cobra... canto direito... GOOOOL! O goleiro não alcança!",
    "{player} bate forte no ângulo! CONVERTEU! {team} amplia no placar!",
    "Correu e bateu! {player} da {team} não desperdiça. Gol de pênalti!",
    "{player} ({team}) com categoria no batedor — bola no ângulo. Sem chance!",
    "GOOOL! {player} ({team}) chutou rasteiro e o goleiro mergulhou em vão!",
  ];

  const PEN_MISS = [
    "{player} ({team}) cobra... NA TRAVE! Que desperdício absurdo!",
    "DEFENDEU O GOLEIRO! {player} da {team} bateu fraco demais e o goleiro voou!",
    "{player} ({team}) mandou à direita — goleiro foi pro mesmo lado. Defendido!",
    "Que tragédia! {player} da {team} mandou a bola nas arquibancadas!",
    "Pênalti perdido! {player} ({team}) escorregou na hora de bater!",
  ];

  // ── Patch _triggerFoul ──────────────────────────────────────────────────
  ME._triggerFoul = function(min, side) {
    const s    = this.state;
    const team = side === 'H' ? this.home : this.away;
    side === 'H' ? s.foulsH++ : s.foulsA++;

    const fouler = this._pickRandomPlayer(team);
    this._log(_f(_p(FOUL), { player: _sn(fouler), team: team.name }), 'normal');

    const cardChance = 30 + (team.aggression || 50) * 0.2 + (this.isDerby ? 15 : 0);

    if (Math.random() * 100 < cardChance) {
      const player    = fouler || this._pickRandomPlayer(team);
      const hasYellow = player?._yellow;

      if (hasYellow || Math.random() < 0.08) {
        this._log(_f(_p(RED), { player: _sn(player), team: team.name }), 'red');
        side === 'H' ? s.redsH++ : s.redsA++;
        if (player) { player._expelled = true; s.expelledPlayers.push(player); }
        this.emit('redCard', { side, player, min });
        this.emit('punishment', {
          type: 'RED_CARD', team: team.name,
          fine: _r(5000, 20000), repLoss: _r(3, 8),
        });
      } else {
        this._log(_f(_p(YELLOW), { player: _sn(player), team: team.name }), 'yellow');
        side === 'H' ? s.yellowsH++ : s.yellowsA++;
        if (player) player._yellow = true;
        this.emit('yellowCard', { side, player, min });
      }
    }

    if (Math.random() < 0.08) this._triggerPenalty(min, side === 'H' ? 'A' : 'H');
  };

  // ── Patch _triggerPenalty ───────────────────────────────────────────────
  ME._triggerPenalty = function(min, beneficiarySide) {
    const team   = beneficiarySide === 'H' ? this.home : this.away;
    const s      = this.state;
    const player = this._pickScorer(team) || this._pickRandomPlayer(team);

    this._log(_f(_p(PEN_WON), { player: _sn(player), team: team.name }), 'penalty');

    setTimeout(() => {
      const converted = Math.random() < 0.75;
      if (converted) {
        this._log(_f(_p(PEN_KICK), { player: _sn(player), team: team.name }), 'goal');
        beneficiarySide === 'H' ? s.scoreH++ : s.scoreA++;
        this.emit('goal', {
          side: beneficiarySide, scorer: player, min,
          isPenalty: true, score: { h: s.scoreH, a: s.scoreA },
        });
      } else {
        this._log(_f(_p(PEN_MISS), { player: _sn(player), team: team.name }), 'normal');
      }
      this.emit('penalty', { side: beneficiarySide, converted });
    }, this.tickRate * 0.5);
  };

  // ── Patch _processMinute — adiciona jogador no escanteio ────────────────
  ME._processMinute = function(min) {
    const s      = this.state;
    const chance = Math.random() * 100;

    // Briga/Confusão
    if (chance < (this.isDerby ? 2.5 : 0.4)) { this._triggerBrawl(min); return; }

    // Falta (agora com nome do jogador)
    if (chance < 10) { this._triggerFoul(min, chance < 5 ? 'H' : 'A'); return; }

    // Escanteio — com nome do cobrador!
    if (chance < 14) {
      const cside  = Math.random() < 0.5 ? 'H' : 'A';
      cside === 'H' ? s.cornersH++ : s.cornersA++;
      const cteam  = cside === 'H' ? this.home : this.away;
      const kicker = this._pickRandomPlayer(cteam);
      this._log(_f(_p(CORNER), { player: _sn(kicker), team: cteam.name }), 'normal');
      return;
    }

    // Tentativa de gol (mantém lógica original — já usa scorer.name)
    if (chance < 22) { this._goalAttempt(min, chance); return; }

    // Fadiga do jogador solo
    if (this.isSoloMode && this.userPlayer && chance < 24) {
      const p = this.userPlayer;
      if ((p.energy || 100) < 30) {
        const msg = `⚡ GUIA: ${p.name} está no limite físico! Energia crítica — considere substituição.`;
        this._log(msg, 'guide');
        this.emit('guideTip', msg);
      }
    }
  };

  console.log('[narr_patch] ✓ Narração aprimorada com nomes de jogadores.');
})();
