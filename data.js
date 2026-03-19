/* ════════════════════════════════════════════════════
   GranFut · data.js  — Geração Procedural de Dados
   Todos os times fictícios do Brasil, 27 estados, 7 divisões
   ════════════════════════════════════════════════════ */
'use strict';

const GranFutData = (() => {

  // ─── Hierarquia de Divisões ───────────────────────────────────────────────
  const DIVISIONS = {
    A: { level: 'Nacional',  cost: 15.00, teams: 20, power: [85,99], budget: 15000000, wages: 800000, ticketBase: 80000 },
    B: { level: 'Nacional',  cost: 15.00, teams: 20, power: [74,84], budget:  8000000, wages: 350000, ticketBase: 40000 },
    C: { level: 'Nacional',  cost: 15.00, teams: 20, power: [63,73], budget:  3000000, wages: 150000, ticketBase: 18000 },
    D: { level: 'Estadual',  cost:  5.00, teams: 40, power: [52,62], budget:   800000, wages:  60000, ticketBase:  7000 },
    E: { level: 'Estadual',  cost:  5.00, teams: 60, power: [40,51], budget:   300000, wages:  25000, ticketBase:  3000 },
    F: { level: 'Local',     cost:  0.00, teams:100, power: [25,39], budget:    80000, wages:   8000, ticketBase:   800 },
    G: { level: 'Local',     cost:  0.00, teams:200, power: [10,24], budget:    20000, wages:   2000, ticketBase:   200 },
  };

  // ─── 27 Estados do Brasil ─────────────────────────────────────────────────
  const STATES = [
    { uf:'AC', name:'Acre',           region:'Norte'     },
    { uf:'AL', name:'Alagoas',        region:'Nordeste'  },
    { uf:'AP', name:'Amapá',          region:'Norte'     },
    { uf:'AM', name:'Amazonas',       region:'Norte'     },
    { uf:'BA', name:'Bahia',          region:'Nordeste'  },
    { uf:'CE', name:'Ceará',          region:'Nordeste'  },
    { uf:'DF', name:'Distrito Federal',region:'Centro-Oeste'},
    { uf:'ES', name:'Espírito Santo', region:'Sudeste'   },
    { uf:'GO', name:'Goiás',          region:'Centro-Oeste'},
    { uf:'MA', name:'Maranhão',       region:'Nordeste'  },
    { uf:'MT', name:'Mato Grosso',    region:'Centro-Oeste'},
    { uf:'MS', name:'Mato Grosso do Sul',region:'Centro-Oeste'},
    { uf:'MG', name:'Minas Gerais',   region:'Sudeste'   },
    { uf:'PA', name:'Pará',           region:'Norte'     },
    { uf:'PB', name:'Paraíba',        region:'Nordeste'  },
    { uf:'PR', name:'Paraná',         region:'Sul'       },
    { uf:'PE', name:'Pernambuco',     region:'Nordeste'  },
    { uf:'PI', name:'Piauí',          region:'Nordeste'  },
    { uf:'RJ', name:'Rio de Janeiro', region:'Sudeste'   },
    { uf:'RN', name:'Rio Grande do Norte',region:'Nordeste'},
    { uf:'RS', name:'Rio Grande do Sul',region:'Sul'     },
    { uf:'RO', name:'Rondônia',       region:'Norte'     },
    { uf:'RR', name:'Roraima',        region:'Norte'     },
    { uf:'SC', name:'Santa Catarina', region:'Sul'       },
    { uf:'SP', name:'São Paulo',      region:'Sudeste'   },
    { uf:'SE', name:'Sergipe',        region:'Nordeste'  },
    { uf:'TO', name:'Tocantins',      region:'Norte'     },
  ];

  // ─── Matrizes de Nomes para Times Fictícios ──────────────────────────────
  const TEAM_NAMES = {
    prefixes: [
      'União','Atlético','Real','Grêmio','Esporte Clube','Independente',
      'Sociedade','Nacional','Cruzeiro','Associação','América','Botafogo',
      'Internacional','Fluminense','Vitória','Sport','Portuguesa','Coritiba',
      'Avaí','Guarani','Tombense','Juventude','Sampaio','Náutico','ABC'
    ],
    suffixes: [
      'da Serra','do Vale','da Fronteira','Central','Litorâneo','Metropolitano',
      'do Planalto','dos Pinhais','da Mata','do Cerrado','do Sertão','do Norte',
      'do Sul','da Baixada','da Capital','do Litoral','dos Campos','da Mantiqueira',
      'da Chapada','do Pantanal','Serrano','Campestre','Nordestino','Mineiro',
      'Gaúcho','Carioca','Paulistano','Nordestino','Baiano','Cearense'
    ],
    abbreviations: ['FC','EC','AC','SC','CF','SC','GE','AA']
  };

  // ─── Nomes de Jogadores Fictícios ─────────────────────────────────────────
  const PLAYER_NAMES = {
    first: [
      'Cauã','Enzo','Tiago','Matheus','Júlio','Dante','Renan','Bruno','Igor','Vitor',
      'Luan','Yago','Caio','Lucas','Gabriel','Thiago','Anderson','Felipe','Diego',
      'Rafael','Pedro','Gustavo','Leandro','Marcos','Rodrigo','Edson','Nilton','Valdir',
      'Robson','Cleber','Éverton','Wellington','Alisson','Willian','Jadson','Alan',
      'Fernandinho','Hulk','Marquinhos','Dani','Keno','Marrony','Hyoran','Angulo','Bitello'
    ],
    last: [
      'Silva','Santos','Oliveira','Souza','Pereira','Costa','Rocha','Mendes','Barbosa',
      'Nascimento','Lima','Carvalho','Ferreira','Alves','Martins','Ribeiro','Rodrigues',
      'Gomes','Araújo','Xavier','Moraes','Melo','Pinto','Nunes','Monteiro','Borges',
      'Teixeira','Andrade','Cardoso','Ramos','Machado','Castro','Correa','Moreira',
      'Figueiredo','Azevedo','Campos','Dias','Cunha','Moura','Medeiros','Freitas'
    ],
    female: {
      first: [
        'Mariana','Fernanda','Juliana','Letícia','Camila','Aline','Sabrina','Tatiane',
        'Priscila','Vanessa','Cristiane','Marta','Formiga','Debinha','Andressa','Tamires',
        'Rafaelle','Monica','Kathellen','Adriana','Beatriz','Giovanna','Alice','Sofia'
      ]
    }
  };

  // ─── Posições e Distribuição ─────────────────────────────────────────────
  const POSITIONS = {
    GOL: { label:'GOL', group:'defesa',  slots:2 },
    ZAG: { label:'ZAG', group:'defesa',  slots:4 },
    LAT: { label:'LAT', group:'defesa',  slots:4 },
    VOL: { label:'VOL', group:'meio',    slots:3 },
    MEI: { label:'MEI', group:'meio',    slots:4 },
    ATA: { label:'ATA', group:'ataque',  slots:3 },
  };

  const SQUAD_TEMPLATE = ['GOL','ZAG','ZAG','LAT','LAT','VOL','VOL','MEI','MEI','ATA','ATA',
                          'GOL','ZAG','LAT','VOL','MEI','ATA'];

  // ─── Utilitários ─────────────────────────────────────────────────────────
  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function uid() { return Math.random().toString(36).slice(2,10); }

  // Gerador determinístico por seed (garante consistência entre sessões)
  function seededRand(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  // ─── Geração de Time ─────────────────────────────────────────────────────
  function generateTeam(division, stateUF, gender = 'M', seed = null) {
    const r = seed ? seededRand(seed) : Math.random.bind(Math);
    const div = DIVISIONS[division];
    const pre = TEAM_NAMES.prefixes[Math.floor(r() * TEAM_NAMES.prefixes.length)];
    const suf = TEAM_NAMES.suffixes[Math.floor(r() * TEAM_NAMES.suffixes.length)];
    const abb = TEAM_NAMES.abbreviations[Math.floor(r() * TEAM_NAMES.abbreviations.length)];
    const power = rnd(div.power[0], div.power[1]);
    const colors = generateColors(r);

    return {
      id: uid(),
      name: `${pre} ${suf}`,
      shortName: abb,
      state: stateUF,
      division,
      gender,
      power,
      reputation: Math.round(power * 0.9 + rnd(0,10)),
      moral: rnd(50,90),
      aggression: rnd(20,80),
      rivalryWith: null,
      finances: {
        cash: rnd(Math.round(div.budget * 0.3), div.budget),
        weeklyWages: 0,
        weeklyIncome: 0,
        ticketRevenue: div.ticketBase,
        sponsorRevenue: Math.round(div.budget * 0.04),
      },
      stadium: { level: 1, capacity: getStadiumCapacity(division) },
      ct: { level: 1 },
      marketing: { level: 1 },
      colors,
      titles: { local: 0, state: 0, national: 0, copa: 0 },
      isUser: false,
    };
  }

  function generateColors(r) {
    const palettes = [
      ['#cc0000','#ffffff'], ['#000066','#ffffff'], ['#006600','#ffffff'],
      ['#cc6600','#000000'], ['#000000','#ffcc00'], ['#660066','#ffffff'],
      ['#003366','#cc0000'], ['#ffffff','#000000'], ['#009900','#ffff00'],
      ['#cc0000','#000000'],
    ];
    return palettes[Math.floor(r() * palettes.length)];
  }

  function getStadiumCapacity(division) {
    const caps = { A:50000, B:30000, C:20000, D:12000, E:6000, F:2500, G:800 };
    return caps[division] || 1000;
  }

  // ─── Geração de Jogador ──────────────────────────────────────────────────
  function generatePlayer(division, position, gender = 'M', overrides = {}) {
    const div = DIVISIONS[division];
    const baseOvr = rnd(div.power[0], div.power[1]);
    const firstName = gender === 'F'
      ? pick(PLAYER_NAMES.female.first)
      : pick(PLAYER_NAMES.first);
    const lastName = pick(PLAYER_NAMES.last);

    const stats = generateStats(baseOvr, position);

    return {
      id: uid(),
      name: `${firstName} ${lastName}`,
      shortName: firstName,
      position,
      age: rnd(17, 35),
      overall: baseOvr,
      potential: Math.min(99, baseOvr + rnd(0, 15)),
      gender,
      ...stats,
      energy: rnd(70, 100),
      form: 3 + Math.random() * 2,        // 3.0–5.0
      aggression: rnd(20, 80),
      yellowCards: 0,
      redCard: false,
      injured: false,
      injuredWeeks: 0,
      suspended: false,
      salary: calcSalary(baseOvr, division),
      value: calcValue(baseOvr, division),
      xp: 0,
      reputation: rnd(10, 50),
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      rating: 0,
      isUser: false,
      teamId: null,
      contract: { years: rnd(1,4), renewals: 0 },
      ...overrides
    };
  }

  function generateStats(ovr, pos) {
    const spread = () => rnd(Math.max(10, ovr - 15), Math.min(99, ovr + 15));
    const by = (modifier) => Math.min(99, Math.max(10, Math.round(ovr * modifier + rnd(-5,5))));

    const profiles = {
      GOL: { pace:by(0.5), strength:by(0.8), stamina:by(0.7), dexterity:by(0.7), intelligence:by(1.0), defending:by(1.1), shooting:by(0.3) },
      ZAG: { pace:by(0.7), strength:by(1.1), stamina:by(0.9), dexterity:by(0.7), intelligence:by(1.0), defending:by(1.1), shooting:by(0.5) },
      LAT: { pace:by(1.1), strength:by(0.8), stamina:by(1.0), dexterity:by(0.9), intelligence:by(0.9), defending:by(0.9), shooting:by(0.7) },
      VOL: { pace:by(0.8), strength:by(1.0), stamina:by(1.1), dexterity:by(0.9), intelligence:by(1.0), defending:by(1.0), shooting:by(0.7) },
      MEI: { pace:by(0.9), strength:by(0.8), stamina:by(0.9), dexterity:by(1.1), intelligence:by(1.1), defending:by(0.7), shooting:by(0.9) },
      ATA: { pace:by(1.1), strength:by(0.9), stamina:by(0.9), dexterity:by(1.1), intelligence:by(0.9), defending:by(0.5), shooting:by(1.2) },
    };
    return profiles[pos] || profiles.MEI;
  }

  function calcSalary(ovr, div) {
    const base = { A:20000, B:8000, C:3000, D:1200, E:500, F:180, G:50 };
    return Math.round((base[div] || 100) * (0.7 + (ovr/99) * 0.6) * (0.9 + Math.random() * 0.2));
  }

  function calcValue(ovr, div) {
    const base = { A:5000000, B:1500000, C:500000, D:150000, E:40000, F:10000, G:2000 };
    return Math.round((base[div] || 5000) * (ovr/75) * (0.8 + Math.random() * 0.4));
  }

  // ─── Geração de Elenco Completo ─────────────────────────────────────────
  function generateSquad(division, gender = 'M') {
    return SQUAD_TEMPLATE.map(pos => generatePlayer(division, pos, gender));
  }

  // ─── Geração de Liga ─────────────────────────────────────────────────────
  function generateLeague(division, stateUF = null, gender = 'M') {
    const div = DIVISIONS[division];
    const statePool = stateUF
      ? STATES.filter(s => s.uf === stateUF)
      : STATES;

    const teams = [];
    for (let i = 0; i < div.teams; i++) {
      const state = pick(statePool);
      teams.push(generateTeam(division, state.uf, gender));
    }
    return teams;
  }

  // ─── Geração do Mercado ──────────────────────────────────────────────────
  function generateMarket(division, count = 8) {
    const positions = Object.keys(POSITIONS);
    return Array.from({ length: count }, () => {
      const pos = pick(positions);
      const p = generatePlayer(division, pos);
      // Jogadores do mercado têm valor ligeiramente menor (desvalorizados)
      p.value = Math.round(p.value * (0.7 + Math.random() * 0.4));
      return p;
    });
  }

  // ─── Estado inicial do Time do Jogador ──────────────────────────────────
  function createUserTeam(name, division, stateUF, gender = 'M') {
    const team = generateTeam(division, stateUF, gender);
    team.name = name || team.name;
    team.isUser = true;
    team.squad = generateSquad(division, gender);
    team.squad.forEach(p => { p.teamId = team.id; });
    return team;
  }

  // ─── Criação do Perfil Solo ──────────────────────────────────────────────
  function createSoloPlayer(name, age, position, gender = 'M') {
    const division = 'G'; // sempre começa na base
    const player = generatePlayer(division, position || 'ATA', gender);
    player.name = name || player.name;
    player.age = age || rnd(17,22);
    player.isUser = true;
    player.salary = 150;
    player.overall = rnd(45, 60);
    player.energy = 100;
    player.form = 3.0;
    player.boardTrust = 70;
    player.soloClub = 'Sem clube';
    player.proposals = [];
    return player;
  }

  // ─── Tabela de Classificação Inicial ────────────────────────────────────
  function buildLeagueTable(teams) {
    return teams.map(t => ({
      id: t.id,
      name: t.name,
      pj: 0, wins: 0, draws: 0, losses: 0,
      gf: 0, ga: 0, pts: 0,
      form: [],
      isUser: t.isUser || false,
    }));
  }

  // ─── Calendário da Temporada ─────────────────────────────────────────────
  function buildSchedule(teams) {
    const schedule = [];
    const ids = teams.map(t => t.id);
    // Round-robin simples (cada time joga contra todos 1x em casa, 1x fora)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        schedule.push({ homeId: ids[i], awayId: ids[j], played: false, result: null });
        schedule.push({ homeId: ids[j], awayId: ids[i], played: false, result: null });
      }
    }
    // Shuffle
    for (let i = schedule.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [schedule[i], schedule[j]] = [schedule[j], schedule[i]];
    }
    return schedule;
  }

  // ─── Tier de Acesso ──────────────────────────────────────────────────────
  const ACCESS_TIERS = { LOCAL: 0, ESTADUAL: 1, NACIONAL: 2 };

  function canAccessDivision(division, tier) {
    if (['F','G'].includes(division)) return true;
    if (['D','E'].includes(division)) return tier >= ACCESS_TIERS.ESTADUAL;
    if (['A','B','C'].includes(division)) return tier >= ACCESS_TIERS.NACIONAL;
    return false;
  }

  function getDivisionsByTier(tier) {
    if (tier >= ACCESS_TIERS.NACIONAL) return ['A','B','C','D','E','F','G'];
    if (tier >= ACCESS_TIERS.ESTADUAL) return ['D','E','F','G'];
    return ['F','G'];
  }

  // ─── Export ───────────────────────────────────────────────────────────────
  return {
    DIVISIONS,
    STATES,
    POSITIONS,
    SQUAD_TEMPLATE,
    ACCESS_TIERS,
    rnd,
    pick,
    uid,
    generateTeam,
    generatePlayer,
    generateSquad,
    generateLeague,
    generateMarket,
    createUserTeam,
    createSoloPlayer,
    buildLeagueTable,
    buildSchedule,
    canAccessDivision,
    getDivisionsByTier,
    calcSalary,
    calcValue,
    getStadiumCapacity,
    TEAM_NAMES,
    PLAYER_NAMES,
  };

})();
