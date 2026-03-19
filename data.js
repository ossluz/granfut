/* ════════════════════════════════════════════════════
   GranFut · data.js v2.0 — Geração Procedural
   Sistema de competição: Municipal → Estadual → Nacional
   Níveis de poder por divisão com variação realista
   Saieso Seraos Edition
   ════════════════════════════════════════════════════ */
'use strict';

const GranFutData = (() => {

  // ─── Fases de Competição ─────────────────────────────────────────────────
  // Progressão: MUNICIPAL → ESTADUAL → NACIONAL_G → F → E → D → C
  const COMPETITION_PHASES = {
    MUNICIPAL: {
      label: 'Municipal',    sublabel: 'Campeonato Regional',
      teamsTotal: 20,        // 20 times por região
      qualifiers: 5,         // top 5 vão ao estadual
      regionsPerState: 4,    // 4 regiões por estado
      powerBase: 12,         // poder padrão dos times
      powerRange: 2,         // variação ±2  → times entre 10 e 14
      budget: 20000,         wages: 2000,   ticketBase: 200,
      nextPhase: 'ESTADUAL',
    },
    ESTADUAL: {
      label: 'Estadual',     sublabel: 'Campeonato Estadual',
      teamsTotal: 20,        // 5 de cada uma das 4 regiões
      qualifiers: 4,         // top 4 vão ao Nacional G
      powerBase: 20,
      powerRange: 4,         // entre 16 e 24
      budget: 100000,        wages: 8000,   ticketBase: 1000,
      nextPhase: 'NACIONAL_G',
    },
    NACIONAL_G: {
      label: 'Série G',      sublabel: 'Nacional',
      teamsTotal: 20,        qualifiers: 4,
      powerBase: 32,         powerRange: 6, // entre 26 e 38
      budget: 300000,        wages: 25000,  ticketBase: 3000,
      nextPhase: 'NACIONAL_F',
    },
    NACIONAL_F: {
      label: 'Série F',      sublabel: 'Nacional',
      teamsTotal: 20,        qualifiers: 4,
      powerBase: 46,         powerRange: 7, // entre 39 e 53
      budget: 800000,        wages: 60000,  ticketBase: 7000,
      nextPhase: 'NACIONAL_E',
    },
    NACIONAL_E: {
      label: 'Série E',      sublabel: 'Nacional',
      teamsTotal: 20,        qualifiers: 4,
      powerBase: 60,         powerRange: 8, // entre 52 e 68
      budget: 3000000,       wages: 150000, ticketBase: 18000,
      nextPhase: 'NACIONAL_D',
    },
    NACIONAL_D: {
      label: 'Série D',      sublabel: 'Nacional',
      teamsTotal: 20,        qualifiers: 4,
      powerBase: 74,         powerRange: 8, // entre 66 e 82
      budget: 8000000,       wages: 350000, ticketBase: 40000,
      nextPhase: 'NACIONAL_C',
    },
    NACIONAL_C: {
      label: 'Série C',      sublabel: 'Nacional',
      teamsTotal: 20,        qualifiers: 0,
      powerBase: 88,         powerRange: 7, // entre 81 e 95
      budget: 15000000,      wages: 800000, ticketBase: 80000,
      nextPhase: null,
    },
  };

  // ─── DIVISIONS (retrocompatibilidade com finance.js / outros módulos) ────
  const DIVISIONS = {
    G: { level:'Local',    cost:0,     teams:20, power:[10,14], budget:20000,    wages:2000,   ticketBase:200   },
    F: { level:'Local',    cost:0,     teams:20, power:[16,24], budget:100000,   wages:8000,   ticketBase:1000  },
    E: { level:'Estadual', cost:5,     teams:20, power:[26,38], budget:300000,   wages:25000,  ticketBase:3000  },
    D: { level:'Estadual', cost:5,     teams:20, power:[39,53], budget:800000,   wages:60000,  ticketBase:7000  },
    C: { level:'Nacional', cost:15,    teams:20, power:[52,68], budget:3000000,  wages:150000, ticketBase:18000 },
    B: { level:'Nacional', cost:15,    teams:20, power:[66,82], budget:8000000,  wages:350000, ticketBase:40000 },
    A: { level:'Nacional', cost:15,    teams:20, power:[81,95], budget:15000000, wages:800000, ticketBase:80000 },
  };

  // Mapa fase → divisão (para retrocompat)
  const PHASE_TO_DIV = {
    MUNICIPAL:  'G', ESTADUAL: 'F',
    NACIONAL_G: 'E', NACIONAL_F: 'D',
    NACIONAL_E: 'C', NACIONAL_D: 'B', NACIONAL_C: 'A',
  };

  // ─── 4 Regiões por Estado ────────────────────────────────────────────────
  const STATE_REGIONS = {
    AC: ['Rio Branco','Juruá','Tarauacá','Alto Acre'],
    AL: ['Maceió e Litoral','Sertão Alagoano','Agreste','Zona da Mata'],
    AP: ['Macapá/Santana','Norte do Amapá','Sul do Amapá','Calçoene'],
    AM: ['Manaus e RMM','Alto Solimões','Baixo Amazonas','Médio Amazonas'],
    BA: ['Salvador/RMS','Chapada Diamantina','Sul Baiano','Oeste Baiano'],
    CE: ['Fortaleza/RMF','Sertão Central','Cariri','Litoral Leste'],
    DF: ['Plano Piloto','Eixo Sul','Eixo Norte','Entorno Sul'],
    ES: ['Grande Vitória','Norte Capixaba','Sul Capixaba','Serrana ES'],
    GO: ['Goiânia/RMG','Entorno do DF','Sul Goiano','Norte Goiano'],
    MA: ['São Luís/RML','Imperatriz','Chapada Maranhense','Baixada'],
    MT: ['Cuiabá/RMC','Norte Mato-Grossense','Médio Norte','Sudeste MT'],
    MS: ['Campo Grande','Pantanal','Dourados','Bolsão'],
    MG: ['BH/RMBH','Triângulo Mineiro','Sul de Minas','Zona da Mata'],
    PA: ['Belém/RMB','Sudeste Paraense','Nordeste Paraense','Sudoeste PA'],
    PB: ['João Pessoa/Litorâneo','Campina Grande','Sertão','Agreste PB'],
    PR: ['Curitiba/RMC','Oeste Paranaense','Norte Paranaense','Campos Gerais'],
    PE: ['Recife/RMR','Sertão PE','Agreste PE','Zona da Mata PE'],
    PI: ['Teresina/RMT','Médio Parnaíba','Chapada Piauiense','Sul do Piauí'],
    RJ: ['Capital/Baixada','Lagos/Costa Verde','Noroeste Fluminense','Serrana RJ'],
    RN: ['Natal/RMN','Mossoró e Oeste','Agreste Potiguar','Sertão Central RN'],
    RS: ['Porto Alegre/RMC','Serra Gaúcha','Fronteira Oeste','Missões'],
    RO: ['Porto Velho/RMC','Cone Sul','Madeira-Mamoré','Leste Rondoniense'],
    RR: ['Boa Vista/RMC','Sul de Roraima','Nordeste RR','Amajari'],
    SC: ['Florianópolis/RMF','Oeste Catarinense','Norte Catarinense','Serra SC'],
    SP: ['Grande SP','Interior Norte','Interior Sul','Interior Oeste'],
    SE: ['Aracaju/RMA','Agreste SE','Sertão SE','Sul Sergipano'],
    TO: ['Palmas/RMP','Norte Tocantinense','Sul Tocantinense','Bico do Papagaio'],
  };

  // ─── 27 Estados ─────────────────────────────────────────────────────────
  const STATES = [
    { uf:'AC', name:'Acre',           region:'Norte'       },
    { uf:'AL', name:'Alagoas',        region:'Nordeste'    },
    { uf:'AP', name:'Amapá',          region:'Norte'       },
    { uf:'AM', name:'Amazonas',       region:'Norte'       },
    { uf:'BA', name:'Bahia',          region:'Nordeste'    },
    { uf:'CE', name:'Ceará',          region:'Nordeste'    },
    { uf:'DF', name:'Distrito Federal',region:'Centro-Oeste'},
    { uf:'ES', name:'Espírito Santo', region:'Sudeste'     },
    { uf:'GO', name:'Goiás',          region:'Centro-Oeste'},
    { uf:'MA', name:'Maranhão',       region:'Nordeste'    },
    { uf:'MT', name:'Mato Grosso',    region:'Centro-Oeste'},
    { uf:'MS', name:'Mato Grosso do Sul',region:'Centro-Oeste'},
    { uf:'MG', name:'Minas Gerais',   region:'Sudeste'     },
    { uf:'PA', name:'Pará',           region:'Norte'       },
    { uf:'PB', name:'Paraíba',        region:'Nordeste'    },
    { uf:'PR', name:'Paraná',         region:'Sul'         },
    { uf:'PE', name:'Pernambuco',     region:'Nordeste'    },
    { uf:'PI', name:'Piauí',          region:'Nordeste'    },
    { uf:'RJ', name:'Rio de Janeiro', region:'Sudeste'     },
    { uf:'RN', name:'Rio Grande do Norte',region:'Nordeste'},
    { uf:'RS', name:'Rio Grande do Sul',region:'Sul'       },
    { uf:'RO', name:'Rondônia',       region:'Norte'       },
    { uf:'RR', name:'Roraima',        region:'Norte'       },
    { uf:'SC', name:'Santa Catarina', region:'Sul'         },
    { uf:'SP', name:'São Paulo',      region:'Sudeste'     },
    { uf:'SE', name:'Sergipe',        region:'Nordeste'    },
    { uf:'TO', name:'Tocantins',      region:'Norte'       },
  ];

  // ─── Nomes Fictícios ─────────────────────────────────────────────────────
  const TEAM_NAMES = {
    prefixes: [
      'União','Atlético','Real','Grêmio','Esporte Clube','Independente',
      'Sociedade','Nacional','Cruzeiro','Associação','América','Botafogo',
      'Internacional','Fluminense','Vitória','Sport','Portuguesa','Coritiba',
      'Avaí','Guarani','Tombense','Juventude','Sampaio','Náutico','ABC',
      'Ferroviário','Fortaleza','Ceará','Bragantino','Chapecoense',
    ],
    suffixes: [
      'da Serra','do Vale','da Fronteira','Central','Litorâneo','Metropolitano',
      'do Planalto','dos Pinhais','da Mata','do Cerrado','do Sertão','do Norte',
      'do Sul','da Baixada','da Capital','do Litoral','dos Campos','da Mantiqueira',
      'da Chapada','do Pantanal','Serrano','Campestre','Nordestino','Mineiro',
      'Gaúcho','Carioca','Paulistano','Baiano','Cearense','Paraense',
    ],
    abbreviations: ['FC','EC','AC','SC','CF','GE','AA','SAD'],
  };

  const PLAYER_NAMES = {
    first: [
      'Cauã','Enzo','Tiago','Matheus','Júlio','Dante','Renan','Bruno','Igor','Vitor',
      'Luan','Yago','Caio','Lucas','Gabriel','Thiago','Anderson','Felipe','Diego',
      'Rafael','Pedro','Gustavo','Leandro','Marcos','Rodrigo','Edson','Nilton',
      'Robson','Cleber','Éverton','Wellington','Alisson','Willian','Jadson','Alan',
      'Fernandinho','Hulk','Marquinhos','Dani','Keno','Marrony','Hyoran','Bitello',
    ],
    last: [
      'Silva','Santos','Oliveira','Souza','Pereira','Costa','Rocha','Mendes','Barbosa',
      'Nascimento','Lima','Carvalho','Ferreira','Alves','Martins','Ribeiro','Rodrigues',
      'Gomes','Araújo','Xavier','Moraes','Melo','Pinto','Nunes','Monteiro','Borges',
      'Teixeira','Andrade','Cardoso','Ramos','Machado','Castro','Correa','Moreira',
      'Figueiredo','Azevedo','Campos','Dias','Cunha','Moura','Medeiros','Freitas',
    ],
    female: {
      first: [
        'Mariana','Fernanda','Juliana','Letícia','Camila','Aline','Sabrina','Tatiane',
        'Priscila','Vanessa','Cristiane','Marta','Formiga','Debinha','Andressa','Tamires',
        'Rafaelle','Monica','Kathellen','Adriana','Beatriz','Giovanna','Alice','Sofia',
      ],
    },
  };

  // ─── Posições ────────────────────────────────────────────────────────────
  const POSITIONS = {
    GOL: { label:'GOL', group:'defesa',  slots:2 },
    ZAG: { label:'ZAG', group:'defesa',  slots:4 },
    LAT: { label:'LAT', group:'defesa',  slots:4 },
    VOL: { label:'VOL', group:'meio',    slots:3 },
    MEI: { label:'MEI', group:'meio',    slots:4 },
    ATA: { label:'ATA', group:'ataque',  slots:3 },
  };

  const SQUAD_TEMPLATE = [
    'GOL','ZAG','ZAG','LAT','LAT','VOL','VOL','MEI','MEI','ATA','ATA',
    'GOL','ZAG','LAT','VOL','MEI','ATA',
  ];

  // ─── Utilitários ─────────────────────────────────────────────────────────
  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function uid() { return Math.random().toString(36).slice(2,10); }

  function seededRand(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  // ─── Poder do time baseado em fase ──────────────────────────────────────
  // Garante variação ±range ao redor de powerBase, nunca fora do intervalo
  function phasePower(phase) {
    const p = COMPETITION_PHASES[phase] || COMPETITION_PHASES.MUNICIPAL;
    const delta = rnd(-p.powerRange, p.powerRange);
    return Math.max(1, Math.min(99, p.powerBase + delta));
  }

  // ─── Geração de Time ─────────────────────────────────────────────────────
  function generateTeam(division, stateUF, gender = 'M', seed = null, phase = null) {
    const r      = seed ? seededRand(seed) : Math.random.bind(Math);
    const div    = DIVISIONS[division] || DIVISIONS.G;
    const ph     = phase ? COMPETITION_PHASES[phase] : null;
    const pre    = TEAM_NAMES.prefixes[Math.floor(r() * TEAM_NAMES.prefixes.length)];
    const suf    = TEAM_NAMES.suffixes[Math.floor(r() * TEAM_NAMES.suffixes.length)];
    const abb    = TEAM_NAMES.abbreviations[Math.floor(r() * TEAM_NAMES.abbreviations.length)];
    const colors = generateColors(r);

    // Poder: usa fase se disponível (garante range correto), senão usa divisão
    let power;
    if (ph) {
      const delta = rnd(-ph.powerRange, ph.powerRange);
      power = Math.max(1, Math.min(99, ph.powerBase + delta));
    } else {
      power = rnd(div.power[0], div.power[1]);
    }

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
      stadium: { level:1, capacity: getStadiumCapacity(division) },
      ct:        { level:1 },
      marketing: { level:1 },
      colors,
      titles: { local:0, state:0, national:0, copa:0 },
      isUser: false,
    };
  }

  function generateColors(r) {
    const palettes = [
      ['#cc0000','#ffffff'],['#000066','#ffffff'],['#006600','#ffffff'],
      ['#cc6600','#000000'],['#000000','#ffcc00'],['#660066','#ffffff'],
      ['#003366','#cc0000'],['#ffffff','#000000'],['#009900','#ffff00'],
      ['#cc0000','#000000'],['#005599','#ffcc00'],['#004400','#ffaa00'],
    ];
    return palettes[Math.floor(r() * palettes.length)];
  }

  function getStadiumCapacity(division) {
    const caps = { A:50000, B:30000, C:20000, D:12000, E:6000, F:2500, G:800 };
    return caps[division] || 1000;
  }

  // ─── Geração de Jogador ──────────────────────────────────────────────────
  function generatePlayer(division, position, gender = 'M', overrides = {}) {
    const div     = DIVISIONS[division] || DIVISIONS.G;
    const baseOvr = rnd(div.power[0], div.power[1]);
    const firstName = gender === 'F' ? pick(PLAYER_NAMES.female.first) : pick(PLAYER_NAMES.first);
    const lastName  = pick(PLAYER_NAMES.last);
    const stats     = generateStats(baseOvr, position);

    return {
      id: uid(),
      name: `${firstName} ${lastName}`,
      shortName: firstName,
      position,
      age: rnd(17,35),
      overall: baseOvr,
      potential: Math.min(99, baseOvr + rnd(0,15)),
      gender,
      ...stats,
      energy: rnd(70,100),
      form: 3 + Math.random() * 2,
      aggression: rnd(20,80),
      yellowCards: 0,
      redCard: false,
      injured: false,
      injuredWeeks: 0,
      suspended: false,
      salary: calcSalary(baseOvr, division),
      value: calcValue(baseOvr, division),
      xp: 0,
      reputation: rnd(10,50),
      goals: 0, assists: 0, matchesPlayed: 0, rating: 0,
      isUser: false, teamId: null,
      contract: { years: rnd(1,4), renewals: 0 },
      ...overrides,
    };
  }

  function generateStats(ovr, pos) {
    const by = (mod) => Math.min(99, Math.max(10, Math.round(ovr * mod + rnd(-5,5))));
    const profiles = {
      GOL: { pace:by(.5),strength:by(.8),stamina:by(.7),dexterity:by(.7),intelligence:by(1.0),defending:by(1.1),shooting:by(.3) },
      ZAG: { pace:by(.7),strength:by(1.1),stamina:by(.9),dexterity:by(.7),intelligence:by(1.0),defending:by(1.1),shooting:by(.5) },
      LAT: { pace:by(1.1),strength:by(.8),stamina:by(1.0),dexterity:by(.9),intelligence:by(.9),defending:by(.9),shooting:by(.7) },
      VOL: { pace:by(.8),strength:by(1.0),stamina:by(1.1),dexterity:by(.9),intelligence:by(1.0),defending:by(1.0),shooting:by(.7) },
      MEI: { pace:by(.9),strength:by(.8),stamina:by(.9),dexterity:by(1.1),intelligence:by(1.1),defending:by(.7),shooting:by(.9) },
      ATA: { pace:by(1.1),strength:by(.9),stamina:by(.9),dexterity:by(1.1),intelligence:by(.9),defending:by(.5),shooting:by(1.2) },
    };
    return profiles[pos] || profiles.MEI;
  }

  function calcSalary(ovr, div) {
    const base = { A:20000, B:8000, C:3000, D:1200, E:500, F:180, G:50 };
    return Math.round((base[div]||100) * (0.7 + (ovr/99) * 0.6) * (0.9 + Math.random() * 0.2));
  }

  function calcValue(ovr, div) {
    const base = { A:5000000, B:1500000, C:500000, D:150000, E:40000, F:10000, G:2000 };
    return Math.round((base[div]||5000) * (ovr/75) * (0.8 + Math.random() * 0.4));
  }

  // ─── Geração de Elenco ───────────────────────────────────────────────────
  function generateSquad(division, gender = 'M') {
    return SQUAD_TEMPLATE.map(pos => generatePlayer(division, pos, gender));
  }

  // ─── Geração de Liga com fase correta ────────────────────────────────────
  // count = número de times IA a gerar (user team é o 20º)
  function generateLeague(division, stateUF = null, gender = 'M', phase = null, count = null) {
    const ph     = phase || _divToPhase(division);
    const cfg    = COMPETITION_PHASES[ph] || COMPETITION_PHASES.MUNICIPAL;
    const total  = count !== null ? count : cfg.teamsTotal - 1; // -1 para o user
    const pool   = stateUF ? STATES.filter(s => s.uf === stateUF) : STATES;
    const teams  = [];
    for (let i = 0; i < total; i++) {
      const state = pick(pool);
      teams.push(generateTeam(division, state.uf, gender, null, ph));
    }
    return teams;
  }

  // ─── Liga Municipal: 20 times por região ─────────────────────────────────
  // regionIdx 0-3, retorna 19 times IA (o user completa os 20)
  function generateRegionalLeague(stateUF, regionIdx, gender = 'M') {
    const state = STATES.find(s => s.uf === stateUF) || STATES[0];
    const teams = [];
    for (let i = 0; i < 19; i++) {
      const t = generateTeam('G', stateUF, gender, null, 'MUNICIPAL');
      t.regionIdx  = regionIdx;
      t.regionName = getRegionName(stateUF, regionIdx);
      teams.push(t);
    }
    return teams;
  }

  // ─── Liga Estadual: 5 qualificados de cada uma das 4 regiões ────────────
  // Gera 19 times IA representando os outros qualificados
  function generateStateChampionshipTeams(stateUF, gender = 'M') {
    const teams = [];
    for (let region = 0; region < 4; region++) {
      // 5 times por região (o user ocupa 1 slot na sua região)
      const count = region === 0 ? 4 : 5; // região 0 = região do user
      for (let i = 0; i < count; i++) {
        const t = generateTeam('F', stateUF, gender, null, 'ESTADUAL');
        t.regionIdx  = region;
        t.regionName = getRegionName(stateUF, region);
        t.qualifiedFrom = 'MUNICIPAL';
        teams.push(t);
      }
    }
    return teams; // 19 times IA + user = 20
  }

  // ─── Liga Nacional G: 4 qualificados por estado ─────────────────────────
  function generateNationalGTeams(gender = 'M') {
    const teams = [];
    // Pega estados variados (4 representantes por estado, 5 estados = 20 times)
    const statePool = [...STATES].sort(() => Math.random() - 0.5).slice(0, 4);
    for (const st of statePool) {
      for (let i = 0; i < 4; i++) {
        const t = generateTeam('E', st.uf, gender, null, 'NACIONAL_G');
        t.qualifiedFrom = 'ESTADUAL';
        teams.push(t);
      }
    }
    // Completa até 19 se necessário
    while (teams.length < 19) {
      const st = pick(STATES);
      const t  = generateTeam('E', st.uf, gender, null, 'NACIONAL_G');
      t.qualifiedFrom = 'ESTADUAL';
      teams.push(t);
    }
    return teams.slice(0, 19);
  }

  // ─── Helpers de fase ─────────────────────────────────────────────────────
  function _divToPhase(division) {
    const map = { G:'MUNICIPAL', F:'ESTADUAL', E:'NACIONAL_G', D:'NACIONAL_F', C:'NACIONAL_E', B:'NACIONAL_D', A:'NACIONAL_C' };
    return map[division] || 'MUNICIPAL';
  }

  function getRegionName(stateUF, regionIdx) {
    const regions = STATE_REGIONS[stateUF] || [`Região ${regionIdx+1}`];
    return regions[regionIdx] || `Região ${regionIdx+1}`;
  }

  function getPhaseInfo(phase) {
    return COMPETITION_PHASES[phase] || COMPETITION_PHASES.MUNICIPAL;
  }

  function getDivisionForPhase(phase) {
    return PHASE_TO_DIV[phase] || 'G';
  }

  // ─── Número de rodadas para round-robin completo ─────────────────────────
  // 20 times → cada time joga 19 em casa + 19 fora = 38 rodadas
  function totalRounds(numTeams) {
    return (numTeams - 1) * 2;
  }

  // ─── Mercado de Transferências ───────────────────────────────────────────
  function generateMarket(division, count = 8) {
    const positions = Object.keys(POSITIONS);
    return Array.from({ length: count }, () => {
      const pos = pick(positions);
      const p   = generatePlayer(division, pos);
      p.value   = Math.round(p.value * (0.7 + Math.random() * 0.4));
      return p;
    });
  }

  // ─── Time do Usuário ─────────────────────────────────────────────────────
  function createUserTeam(name, division, stateUF, gender = 'M') {
    const team  = generateTeam(division, stateUF, gender);
    team.name   = name || team.name;
    team.isUser = true;
    team.squad  = generateSquad(division, gender);
    team.squad.forEach(p => { p.teamId = team.id; });
    return team;
  }

  // ─── Jogador Solo ────────────────────────────────────────────────────────
  function createSoloPlayer(name, age, position, gender = 'M') {
    const player      = generatePlayer('G', position || 'ATA', gender);
    player.name       = name || player.name;
    player.age        = age || rnd(17,22);
    player.isUser     = true;
    player.salary     = 150;
    player.overall    = rnd(45,60);
    player.energy     = 100;
    player.form       = 3.0;
    player.boardTrust = 70;
    player.soloClub   = 'Sem clube';
    player.proposals  = [];
    return player;
  }

  // ─── Tabela de Classificação ─────────────────────────────────────────────
  function buildLeagueTable(teams) {
    return teams.map(t => ({
      id: t.id,
      name: t.name,
      pj: 0, wins: 0, draws: 0, losses: 0,
      gf: 0, ga: 0, pts: 0,
      form: [],
      isUser: t.isUser || false,
      _power: t.power || 12,    // armazenado para simulação IA
      regionIdx: t.regionIdx,
      regionName: t.regionName,
    }));
  }

  // ─── Calendário Round-Robin ──────────────────────────────────────────────
  function buildSchedule(teams) {
    const schedule = [];
    const ids = teams.map(t => t.id);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        schedule.push({ homeId:ids[i], awayId:ids[j], played:false, result:null });
        schedule.push({ homeId:ids[j], awayId:ids[i], played:false, result:null });
      }
    }
    // Shuffle
    for (let i = schedule.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [schedule[i], schedule[j]] = [schedule[j], schedule[i]];
    }
    return schedule;
  }

  // ─── Acesso a Divisões ───────────────────────────────────────────────────
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

  // ─── Export ──────────────────────────────────────────────────────────────
  return {
    DIVISIONS, COMPETITION_PHASES, STATE_REGIONS,
    STATES, POSITIONS, SQUAD_TEMPLATE, ACCESS_TIERS,
    PHASE_TO_DIV,
    rnd, pick, uid,
    generateTeam, generatePlayer, generateSquad,
    generateLeague, generateRegionalLeague,
    generateStateChampionshipTeams, generateNationalGTeams,
    generateMarket, createUserTeam, createSoloPlayer,
    buildLeagueTable, buildSchedule,
    canAccessDivision, getDivisionsByTier,
    calcSalary, calcValue, getStadiumCapacity,
    getRegionName, getPhaseInfo, getDivisionForPhase,
    phasePower, totalRounds,
    TEAM_NAMES, PLAYER_NAMES,
  };

})();
