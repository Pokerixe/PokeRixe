import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Role } from '../models/user.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { FightAction, FightPhase, FightState, TurnEvent } from '../fight/fight.model';
import { PokemonStats } from '../../shared/models/pokemon-stats.model';

function apiResp<T>(data: T): ApiResponse<T> {
  return { code: '200', message: 'OK', data };
}

/** Interceptor pour simuler une API d'authentification en mémoire
 * Gère les endpoints /login, /register, /logout et /me
 * Permet de tester l'authentification sans backend réel
 * Les credentials valides pour le login sont : email: test@gmail.com, password: password
 * Simule les endpoints d'authentification :
 * - POST /login : vérifie les credentials et retourne l'utilisateur simulé ou une erreur
 * - POST /register : crée un nouvel utilisateur simulé avec les données fournies
 * - POST /logout : déconnecte l'utilisateur en mémoire
 * - GET /me : retourne l'utilisateur connecté ou null s'il n'y en a pas
 * @param req La requete HTTP entrante
 * @param next La fonction pour passer la requete au prochain interceptor ou au backend
 * @returns Un Observable de la réponse HTTP simulée
 */

// Utilisateur connecté en mémoire (simule le cookie)
let mockCurrentUser: any = null;

// Parties en mémoire (simule la persistance backend)
let mockGames: any[] = [
  { id: 1, player1: 'Ash',   player2: null, description: 'Match amical à Jadielle', nombrePokemon: 3, status: 'waiting' },
  { id: 2, player1: 'Misty', player2: null, description: 'Tournoi arène eau',        nombrePokemon: 6, status: 'waiting' },
  { id: 3, player1: 'Brock', player2: null, description: "Duel d'entraînement",      nombrePokemon: 4, status: 'waiting' },
];
let mockGameIdCounter = 4;

// ─── Données mock pour le combat ─────────────────────────────────────────────

interface MockFightPokemon {
  slotIndex: number;
  pokedexId: number;
  name: string;
  sprite: string;
  spriteBack: string;
  types: string[];
  hp: number;
  hpMax: number;
  isFainted: boolean;
  stats: PokemonStats;
  moves: Array<{ slot: number; name: string; type: string; power: number | null; accuracy: number; damageClass: string }>;
}

interface MockFightState {
  gameId: number;
  turnNumber: number;
  phase: FightPhase;
  playerName: string;
  playerTeam: MockFightPokemon[];
  playerActiveIndex: number;
  playerAction: FightAction | null;
  opponentName: string;
  opponentTeam: MockFightPokemon[];
  opponentActiveIndex: number;
  log: TurnEvent[];
  winner: string | null;
}

const MOCK_OPPONENT_TEAM: MockFightPokemon[] = [
  {
    slotIndex: 0, pokedexId: 25, name: 'pikachu', hp: 35, hpMax: 35, isFainted: false,
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
    types: ['electric'],
    stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
    moves: [
      { slot: 0, name: 'Thunderbolt', type: 'electric', power: 90, accuracy: 100, damageClass: 'special' },
      { slot: 1, name: 'Quick Attack', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' },
      { slot: 2, name: 'Iron Tail', type: 'steel', power: 100, accuracy: 75, damageClass: 'physical' },
      { slot: 3, name: 'Thunder', type: 'electric', power: 110, accuracy: 70, damageClass: 'special' },
    ],
  },
  {
    slotIndex: 1, pokedexId: 94, name: 'gengar', hp: 60, hpMax: 60, isFainted: false,
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',
    spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/94.png',
    types: ['ghost', 'poison'],
    stats: { hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110 },
    moves: [
      { slot: 0, name: 'Shadow Ball', type: 'ghost', power: 80, accuracy: 100, damageClass: 'special' },
      { slot: 1, name: 'Sludge Bomb', type: 'poison', power: 90, accuracy: 100, damageClass: 'special' },
      { slot: 2, name: 'Hypnosis', type: 'psychic', power: null, accuracy: 60, damageClass: 'status' },
      { slot: 3, name: 'Night Shade', type: 'ghost', power: 60, accuracy: 100, damageClass: 'special' },
    ],
  },
  {
    slotIndex: 2, pokedexId: 68, name: 'machamp', hp: 90, hpMax: 90, isFainted: false,
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/68.png',
    spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/68.png',
    types: ['fighting'],
    stats: { hp: 90, attack: 130, defense: 80, specialAttack: 65, specialDefense: 85, speed: 55 },
    moves: [
      { slot: 0, name: 'Cross Chop', type: 'fighting', power: 100, accuracy: 80, damageClass: 'physical' },
      { slot: 1, name: 'Earthquake', type: 'ground', power: 100, accuracy: 100, damageClass: 'physical' },
      { slot: 2, name: 'Rock Slide', type: 'rock', power: 75, accuracy: 90, damageClass: 'physical' },
      { slot: 3, name: 'Seismic Toss', type: 'fighting', power: 80, accuracy: 100, damageClass: 'physical' },
    ],
  },
];

/** Résout un tour de combat mock (actions simultanées, ordre par vitesse). */
function resolveMockTurn(fight: MockFightState): void {
  const playerPokemon = fight.playerTeam[fight.playerActiveIndex];
  const opponentPokemon = fight.opponentTeam[fight.opponentActiveIndex];
  const pAction = fight.playerAction!;

  // Construire une action adversaire automatique (move aléatoire non-status)
  const oppMoves = opponentPokemon.moves.filter(m => (m.power ?? 0) > 0);
  const chosenMove = oppMoves.length > 0
    ? oppMoves[Math.floor(Math.random() * oppMoves.length)]
    : opponentPokemon.moves[0];
  const oAction: FightAction = {
    type: 'attack',
    attack: {
      moveSlot: chosenMove.slot,
      moveName: chosenMove.name,
      moveType: chosenMove.type,
      movePower: chosenMove.power,
      moveAccuracy: chosenMove.accuracy,
      moveDamageClass: chosenMove.damageClass,
      attackerStats: opponentPokemon.stats,
      attackerTypes: opponentPokemon.types,
    },
  };

  fight.log.push({ turn: fight.turnNumber, type: 'turn_start', message: `--- Tour ${fight.turnNumber} ---` });

  // Ordre d'action : par vitesse (égalité → joueur en premier)
  const playerFirst = playerPokemon.stats.speed >= opponentPokemon.stats.speed;
  const sequence = playerFirst
    ? [
        { action: pAction, attacker: playerPokemon, defender: opponentPokemon, attackerLabel: fight.playerName, defenderLabel: fight.opponentName, isPlayer: true },
        { action: oAction, attacker: opponentPokemon, defender: playerPokemon, attackerLabel: fight.opponentName, defenderLabel: fight.playerName, isPlayer: false },
      ]
    : [
        { action: oAction, attacker: opponentPokemon, defender: playerPokemon, attackerLabel: fight.opponentName, defenderLabel: fight.playerName, isPlayer: false },
        { action: pAction, attacker: playerPokemon, defender: opponentPokemon, attackerLabel: fight.playerName, defenderLabel: fight.opponentName, isPlayer: true },
      ];

  for (const { action, attacker, defender, attackerLabel, defenderLabel } of sequence) {
    if (attacker.isFainted) continue;

    if (action.type === 'switch') {
      const idx = action.switch!.switchToSlotIndex;
      const team = attacker === playerPokemon ? fight.playerTeam : fight.opponentTeam;
      const newIdx = team.findIndex(p => p.slotIndex === idx);
      if (newIdx !== -1) {
        if (attacker === playerPokemon) fight.playerActiveIndex = newIdx;
        else fight.opponentActiveIndex = newIdx;
        fight.log.push({ turn: fight.turnNumber, type: 'switch', message: `${attackerLabel} envoie ${team[newIdx].name} !` });
      }
      continue;
    }

    // Attaque
    const atk = action.attack!;
    const power = atk.movePower ?? 0;
    fight.log.push({ turn: fight.turnNumber, type: 'attack', message: `${attacker.name} utilise ${atk.moveName} !` });

    if (power === 0) continue; // move de statut, pas de dégâts

    // Vérification précision
    if (Math.random() * 100 >= atk.moveAccuracy) {
      fight.log.push({ turn: fight.turnNumber, type: 'attack', message: `${attacker.name} a raté son attaque !` });
      continue;
    }

    // Calcul dégâts simplifié (mock)
    const damage = Math.max(1, Math.floor(power * 0.3 - 5 + Math.random() * 10));
    defender.hp = Math.max(0, defender.hp - damage);
    fight.log.push({ turn: fight.turnNumber, type: 'damage', message: `${defender.name} perd ${damage} PV ! (${defender.hp}/${defender.hpMax} PV)` });

    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.isFainted = true;
      fight.log.push({ turn: fight.turnNumber, type: 'faint', message: `${defender.name} est K.O. !` });
    }
  }

  // Reset actions + incrément tour
  fight.playerAction = null;
  fight.turnNumber++;

  // Déterminer la phase suivante
  const playerAllFainted = fight.playerTeam.every(p => p.isFainted);
  const opponentAllFainted = fight.opponentTeam.every(p => p.isFainted);

  if (playerAllFainted) {
    fight.phase = 'finished';
    fight.winner = fight.opponentName;
    fight.log.push({ turn: fight.turnNumber - 1, type: 'fight_end', message: `${fight.opponentName} remporte le combat !` });
  } else if (opponentAllFainted) {
    fight.phase = 'finished';
    fight.winner = fight.playerName;
    fight.log.push({ turn: fight.turnNumber - 1, type: 'fight_end', message: `${fight.playerName} remporte le combat !` });
  } else if (fight.playerTeam[fight.playerActiveIndex].isFainted) {
    // Joueur doit choisir un remplaçant
    fight.phase = 'waiting_switch';
  } else if (fight.opponentTeam[fight.opponentActiveIndex].isFainted) {
    // Auto-switch adversaire : premier Pokémon vivant
    const nextOpp = fight.opponentTeam.findIndex(p => !p.isFainted);
    fight.opponentActiveIndex = nextOpp;
    fight.log.push({ turn: fight.turnNumber - 1, type: 'switch', message: `${fight.opponentName} envoie ${fight.opponentTeam[nextOpp].name} !` });
    fight.phase = 'waiting_actions';
  } else {
    fight.phase = 'waiting_actions';
  }
}

/** Projette l'état interne du mock vers le `FightState` retourné au client. */
function projectFightState(fight: MockFightState): FightState {
  const playerActive = fight.playerTeam[fight.playerActiveIndex];
  const opponentActive = fight.opponentTeam[fight.opponentActiveIndex];
  return {
    gameId: fight.gameId,
    turnNumber: fight.turnNumber,
    phase: fight.phase,
    playerName: fight.playerName,
    playerActivePokemon: toFightPokemonState(playerActive),
    playerTeam: fight.playerTeam.map(toFightPokemonState),
    opponentName: fight.opponentName,
    opponentActivePokemon: toFightPokemonState(opponentActive),
    opponentRemainingCount: fight.opponentTeam.filter(p => !p.isFainted).length,
    playerHasActed: fight.playerAction !== null,
    log: [...fight.log],
    winner: fight.winner,
    mustSwitch: fight.phase === 'waiting_switch' && fight.playerTeam[fight.playerActiveIndex].isFainted,
  };
}

function toFightPokemonState(p: MockFightPokemon): import('../fight/fight.model').FightPokemonState {
  return {
    slotIndex: p.slotIndex,
    pokedexId: p.pokedexId,
    name: p.name,
    sprite: p.sprite,
    spriteBack: p.spriteBack,
    types: p.types,
    hp: p.hp,
    hpMax: p.hpMax,
    isFainted: p.isFainted,
  };
}

/** Etat des combats en cours (clé = gameId). */
let mockFights: Map<number, MockFightState> = new Map();

// Team en mémoire (simule la persistance backend)
let mockTeam: any = {
  userId: '1',
  firstPokemon: 0,
  slots: [
    {
      slotIndex: 0,
      pokedexId: 6,
      name: 'charizard',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
      spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/6.png',
      types: ['fire', 'flying'],
      hp: 78,
      hpMax: 78,
      stats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 },
      moves: [
        { slot: 0, name: 'Flamethrower', type: 'fire', power: 90, accuracy: 100, damageClass: 'special' },
        { slot: 1, name: 'Fire Blast', type: 'fire', power: 110, accuracy: 85, damageClass: 'special' },
        { slot: 2, name: 'Wing Attack', type: 'flying', power: 60, accuracy: 100, damageClass: 'physical' },
        { slot: 3, name: 'Slash', type: 'normal', power: 70, accuracy: 100, damageClass: 'physical' },
      ],
    },
    {
      slotIndex: 1,
      pokedexId: 9,
      name: 'blastoise',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png',
      spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/9.png',
      types: ['water'],
      hp: 79,
      hpMax: 79,
      stats: { hp: 79, attack: 83, defense: 100, specialAttack: 85, specialDefense: 105, speed: 78 },
      moves: [
        { slot: 0, name: 'Surf', type: 'water', power: 90, accuracy: 100, damageClass: 'special' },
        { slot: 1, name: 'Hydro Pump', type: 'water', power: 110, accuracy: 80, damageClass: 'special' },
        { slot: 2, name: 'Ice Beam', type: 'ice', power: 90, accuracy: 100, damageClass: 'special' },
        { slot: 3, name: 'Tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' },
      ],
    },
    {
      slotIndex: 2,
      pokedexId: 3,
      name: 'venusaur',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png',
      spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/3.png',
      types: ['grass', 'poison'],
      hp: 80,
      hpMax: 80,
      stats: { hp: 80, attack: 82, defense: 83, specialAttack: 100, specialDefense: 100, speed: 80 },
      moves: [
        { slot: 0, name: 'Solar Beam', type: 'grass', power: 120, accuracy: 100, damageClass: 'special' },
        { slot: 1, name: 'Razor Leaf', type: 'grass', power: 55, accuracy: 95, damageClass: 'physical' },
        { slot: 2, name: 'Sludge Bomb', type: 'poison', power: 90, accuracy: 100, damageClass: 'special' },
        { slot: 3, name: 'Tackle', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' },
      ],
    },
    null, null, null,
  ],
};

export const mockAuthInterceptor: HttpInterceptorFn = (req, next) => {

  if (!environment.useMockApi) {
    return next(req);
  }

  if (req.url.endsWith('/login') && req.method === 'POST') {
    const body: any = req.body;
    if (body.email === 'test@gmail.com' && body.password === 'password') {
      mockCurrentUser = {
        id: '1',
        name: 'Test User',
        email: 'test@gmail.com',
        role: Role.User
      };
      return of(new HttpResponse({
        status: 200,
        body: apiResp({ user: mockCurrentUser })
      })).pipe(delay(300));
    }
    return of(new HttpResponse({ status: 200, body: apiResp({ user: null }) })).pipe(delay(300));
  }

  // POST /register
  if (req.url.endsWith('/register') && req.method === 'POST') {
    const body: any = req.body;
    mockCurrentUser = {
      id: '2',
      name: body.name,
      email: body.email,
      role: Role.User
    };
    return of(new HttpResponse({
      status: 201,
      body: apiResp({ user: mockCurrentUser })
    })).pipe(delay(300));
  }

  // POST /logout
  if (req.url.endsWith('/logout') && req.method === 'POST') {
    mockCurrentUser = null;
    return of(new HttpResponse({ status: 200 })).pipe(delay(300));
  }

  // GET /me
  if (req.url.endsWith('/me') && req.method === 'GET') {
    if (mockCurrentUser) {
      return of(new HttpResponse({
        status: 200,
        body: apiResp({ user: mockCurrentUser })
      })).pipe(delay(300));
    }
    return of(new HttpResponse({ status: 200, body: apiResp({ user: null }) })).pipe(delay(300));
  }

  // GET /games
  if (req.url.endsWith('/games') && req.method === 'GET') {
    return of(new HttpResponse({ status: 200, body: apiResp([...mockGames]) })).pipe(delay(300));
  }

  // POST /games — créer une partie
  if (req.url.endsWith('/games') && req.method === 'POST') {
    const body: any = req.body;
    const newGame = {
      id: mockGameIdCounter++,
      player1: mockCurrentUser?.name ?? 'Unknown',
      player2: null,
      description: body.description ?? '',
      nombrePokemon: body.nombrePokemon ?? 1,
      status: 'waiting',
    };
    mockGames = [...mockGames, newGame];
    return of(new HttpResponse({ status: 201, body: apiResp(newGame) })).pipe(delay(300));
  }

  // POST /games/:id/join — rejoindre une partie
  const joinMatch = req.url.match(/\/games\/(\d+)\/join$/) ;
  if (joinMatch && req.method === 'POST') {
    const gameId = Number(joinMatch[1]);
    const game = mockGames.find(g => g.id === gameId);
    if (!game) {
      return of(new HttpResponse({ status: 404, body: { message: 'Game not found' } })).pipe(delay(300));
    }
    const updated = { ...game, player2: mockCurrentUser?.name ?? 'Unknown', status: 'in_progress' };
    mockGames = mockGames.map(g => g.id === gameId ? updated : g);
    return of(new HttpResponse({ status: 200, body: apiResp(updated) })).pipe(delay(300));
  }

  // DELETE /games/:id — quitter / supprimer une partie
  const deleteMatch = req.url.match(/\/games\/(\d+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    const gameId = Number(deleteMatch[1]);
    mockGames = mockGames.filter(g => g.id !== gameId);
    return of(new HttpResponse({ status: 204 })).pipe(delay(300));
  }

  // GET /team
  if (req.url.endsWith('/team') && req.method === 'GET') {
    return of(new HttpResponse({
      status: 200,
      body: apiResp({ ...mockTeam, userId: mockCurrentUser?.id ?? mockTeam.userId }),
    })).pipe(delay(300));
  }

  // PUT /team
  if (req.url.endsWith('/team') && req.method === 'PUT') {
    mockTeam = { ...(req.body as object), userId: mockCurrentUser?.id ?? mockTeam.userId };
    return of(new HttpResponse({
      status: 200,
      body: apiResp(mockTeam),
    })).pipe(delay(300));
  }


  // GET /games/:id/state — état du combat (polling)
  const stateMatch = req.url.match(/\/games\/(\d+)\/state$/);
  if (stateMatch && req.method === 'GET') {
    const gameId = Number(stateMatch[1]);

    // Initialiser l'état du combat si première visite
    if (!mockFights.has(gameId)) {
      const playerTeam: MockFightPokemon[] = (mockTeam.slots as any[])
        .filter((s: any) => s !== null)
        .map((s: any): MockFightPokemon => ({
          slotIndex: s.slotIndex,
          pokedexId: s.pokedexId,
          name: s.name,
          sprite: s.sprite,
          spriteBack: s.spriteBack,
          types: [...s.types],
          hp: s.hp,
          hpMax: s.hpMax,
          isFainted: false,
          stats: { ...s.stats },
          moves: s.moves.map((m: any) => ({ ...m })),
        }));

      const opponentTeam: MockFightPokemon[] = MOCK_OPPONENT_TEAM.map(p => ({
        ...p,
        hp: p.hpMax,
        isFainted: false,
        stats: { ...p.stats },
        moves: p.moves.map(m => ({ ...m })),
      }));

      mockFights.set(gameId, {
        gameId,
        turnNumber: 1,
        phase: 'waiting_actions',
        playerName: mockCurrentUser?.name ?? 'Joueur',
        playerTeam,
        playerActiveIndex: 0,
        playerAction: null,
        opponentName: 'Rival',
        opponentTeam,
        opponentActiveIndex: 0,
        log: [],
        winner: null,
      });
    }

    const fight = mockFights.get(gameId)!;
    return of(new HttpResponse({ status: 200, body: apiResp(projectFightState(fight)) })).pipe(delay(200));
  }

  // POST /games/:id/action — action du joueur (attaque ou switch)
  const actionMatch = req.url.match(/\/games\/(\d+)\/action$/);
  if (actionMatch && req.method === 'POST') {
    const gameId = Number(actionMatch[1]);
    const fight = mockFights.get(gameId);

    if (!fight) {
      return of(new HttpResponse({ status: 404, body: { message: 'Combat introuvable' } })).pipe(delay(200));
    }

    const action = req.body as FightAction;

    if (fight.phase === 'waiting_switch') {
      // Cas spécial : le joueur choisit un remplaçant après un KO
      if (action.type === 'switch') {
        const idx = action.switch!.switchToSlotIndex;
        const newIdx = fight.playerTeam.findIndex(p => p.slotIndex === idx);
        if (newIdx !== -1 && !fight.playerTeam[newIdx].isFainted) {
          fight.playerActiveIndex = newIdx;
          fight.log.push({ turn: fight.turnNumber - 1, type: 'switch', message: `${fight.playerName} envoie ${fight.playerTeam[newIdx].name} !` });
          fight.phase = 'waiting_actions';
        }
      }
      return of(new HttpResponse({ status: 200, body: apiResp({ accepted: true }) })).pipe(delay(200));
    }

    if (fight.phase !== 'waiting_actions') {
      return of(new HttpResponse({ status: 200, body: apiResp({ accepted: false, reason: 'Le combat est terminé' }) })).pipe(delay(200));
    }

    if (fight.playerAction !== null) {
      return of(new HttpResponse({ status: 200, body: apiResp({ accepted: false, reason: 'Vous avez déjà joué ce tour' }) })).pipe(delay(200));
    }

    // Enregistrer l'action et résoudre le tour
    fight.playerAction = action;
    resolveMockTurn(fight);

    return of(new HttpResponse({ status: 200, body: apiResp({ accepted: true }) })).pipe(delay(200));
  }

  return next(req);
};
