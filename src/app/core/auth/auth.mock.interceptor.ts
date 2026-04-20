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

// ─── Historique de parties ────────────────────────────────────────────────────

const S = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

const mockGameHistory = [
  {
    id: 101,
    date: '2026-04-15T14:30:00Z',
    opponentName: 'Ash',
    result: 'win',
    turnCount: 5,
    playerTeam: [
      { pokedexId: 6,  name: 'charizard', sprite: `${S}6.png`,  isFainted: false },
      { pokedexId: 9,  name: 'blastoise', sprite: `${S}9.png`,  isFainted: true  },
      { pokedexId: 3,  name: 'venusaur',  sprite: `${S}3.png`,  isFainted: false },
    ],
    opponentTeam: [
      { pokedexId: 25, name: 'pikachu',  sprite: `${S}25.png`, isFainted: true },
      { pokedexId: 94, name: 'gengar',   sprite: `${S}94.png`, isFainted: true },
      { pokedexId: 68, name: 'machamp',  sprite: `${S}68.png`, isFainted: true },
    ],
    log: [
      { turn: 1, type: 'turn_start', message: '--- Tour 1 ---' },
      { turn: 1, type: 'attack',     message: 'charizard utilise Flamethrower !' },
      { turn: 1, type: 'damage',     message: 'pikachu perd 28 PV ! (7/35 PV)' },
      { turn: 1, type: 'attack',     message: 'pikachu utilise Thunderbolt !' },
      { turn: 1, type: 'damage',     message: 'charizard perd 22 PV ! (56/78 PV)' },
      { turn: 2, type: 'turn_start', message: '--- Tour 2 ---' },
      { turn: 2, type: 'attack',     message: 'charizard utilise Flamethrower !' },
      { turn: 2, type: 'damage',     message: 'pikachu perd 15 PV ! (0/35 PV)' },
      { turn: 2, type: 'faint',      message: 'pikachu est K.O. !' },
      { turn: 2, type: 'switch',     message: 'Ash envoie gengar !' },
      { turn: 3, type: 'turn_start', message: '--- Tour 3 ---' },
      { turn: 3, type: 'attack',     message: 'gengar utilise Shadow Ball !' },
      { turn: 3, type: 'damage',     message: 'charizard perd 30 PV ! (26/78 PV)' },
      { turn: 3, type: 'attack',     message: 'charizard utilise Fire Blast !' },
      { turn: 3, type: 'damage',     message: 'gengar perd 34 PV ! (26/60 PV)' },
      { turn: 4, type: 'turn_start', message: '--- Tour 4 ---' },
      { turn: 4, type: 'attack',     message: 'gengar utilise Shadow Ball !' },
      { turn: 4, type: 'damage',     message: 'charizard perd 26 PV ! (0/78 PV)' },
      { turn: 4, type: 'faint',      message: 'charizard est K.O. !' },
      { turn: 4, type: 'switch',     message: 'Test User envoie blastoise !' },
      { turn: 4, type: 'attack',     message: 'blastoise utilise Surf !' },
      { turn: 4, type: 'damage',     message: 'gengar perd 26 PV ! (0/60 PV)' },
      { turn: 4, type: 'faint',      message: 'gengar est K.O. !' },
      { turn: 4, type: 'switch',     message: 'Ash envoie machamp !' },
      { turn: 4, type: 'attack',     message: 'machamp utilise Cross Chop !' },
      { turn: 4, type: 'damage',     message: 'blastoise perd 45 PV ! (0/79 PV)' },
      { turn: 4, type: 'faint',      message: 'blastoise est K.O. !' },
      { turn: 4, type: 'switch',     message: 'Test User envoie venusaur !' },
      { turn: 5, type: 'turn_start', message: '--- Tour 5 ---' },
      { turn: 5, type: 'attack',     message: 'venusaur utilise Solar Beam !' },
      { turn: 5, type: 'damage',     message: 'machamp perd 52 PV ! (0/90 PV)' },
      { turn: 5, type: 'faint',      message: 'machamp est K.O. !' },
      { turn: 5, type: 'fight_end',  message: 'Test User remporte le combat !' },
    ],
  },
  {
    id: 102,
    date: '2026-04-12T10:15:00Z',
    opponentName: 'Misty',
    result: 'loss',
    turnCount: 8,
    playerTeam: [
      { pokedexId: 6,  name: 'charizard', sprite: `${S}6.png`,  isFainted: true },
      { pokedexId: 9,  name: 'blastoise', sprite: `${S}9.png`,  isFainted: true },
      { pokedexId: 3,  name: 'venusaur',  sprite: `${S}3.png`,  isFainted: true },
    ],
    opponentTeam: [
      { pokedexId: 120, name: 'staryu',   sprite: `${S}120.png`, isFainted: true  },
      { pokedexId: 121, name: 'starmie',  sprite: `${S}121.png`, isFainted: false },
      { pokedexId: 54,  name: 'psyduck',  sprite: `${S}54.png`,  isFainted: true  },
    ],
    log: [
      { turn: 1, type: 'turn_start', message: '--- Tour 1 ---' },
      { turn: 1, type: 'attack',     message: 'charizard utilise Wing Attack !' },
      { turn: 1, type: 'damage',     message: 'staryu perd 18 PV ! (22/40 PV)' },
      { turn: 1, type: 'attack',     message: 'staryu utilise Water Gun !' },
      { turn: 1, type: 'damage',     message: 'charizard perd 35 PV ! (43/78 PV)' },
      { turn: 2, type: 'turn_start', message: '--- Tour 2 ---' },
      { turn: 2, type: 'attack',     message: 'charizard utilise Wing Attack !' },
      { turn: 2, type: 'damage',     message: 'staryu perd 22 PV ! (0/40 PV)' },
      { turn: 2, type: 'faint',      message: 'staryu est K.O. !' },
      { turn: 2, type: 'switch',     message: 'Misty envoie starmie !' },
      { turn: 3, type: 'turn_start', message: '--- Tour 3 ---' },
      { turn: 3, type: 'attack',     message: 'starmie utilise Hydro Pump !' },
      { turn: 3, type: 'damage',     message: 'charizard perd 43 PV ! (0/78 PV)' },
      { turn: 3, type: 'faint',      message: 'charizard est K.O. !' },
      { turn: 3, type: 'switch',     message: 'Test User envoie venusaur !' },
      { turn: 4, type: 'turn_start', message: '--- Tour 4 ---' },
      { turn: 4, type: 'attack',     message: 'venusaur utilise Solar Beam !' },
      { turn: 4, type: 'damage',     message: 'starmie perd 28 PV ! (32/60 PV)' },
      { turn: 4, type: 'attack',     message: 'starmie utilise Psychic !' },
      { turn: 4, type: 'damage',     message: 'venusaur perd 38 PV ! (42/80 PV)' },
      { turn: 5, type: 'turn_start', message: '--- Tour 5 ---' },
      { turn: 5, type: 'attack',     message: 'starmie utilise Hydro Pump !' },
      { turn: 5, type: 'damage',     message: 'venusaur perd 42 PV ! (0/80 PV)' },
      { turn: 5, type: 'faint',      message: 'venusaur est K.O. !' },
      { turn: 5, type: 'switch',     message: 'Test User envoie blastoise !' },
      { turn: 6, type: 'turn_start', message: '--- Tour 6 ---' },
      { turn: 6, type: 'attack',     message: 'blastoise utilise Ice Beam !' },
      { turn: 6, type: 'damage',     message: 'starmie perd 30 PV ! (2/60 PV)' },
      { turn: 6, type: 'attack',     message: 'starmie utilise Hydro Pump !' },
      { turn: 6, type: 'attack',     message: 'starmie a raté son attaque !' },
      { turn: 7, type: 'turn_start', message: '--- Tour 7 ---' },
      { turn: 7, type: 'attack',     message: 'starmie utilise Psychic !' },
      { turn: 7, type: 'damage',     message: 'blastoise perd 25 PV ! (54/79 PV)' },
      { turn: 7, type: 'attack',     message: 'blastoise utilise Surf !' },
      { turn: 7, type: 'damage',     message: 'starmie perd 2 PV ! (0/60 PV)' },
      { turn: 7, type: 'faint',      message: 'starmie est K.O. !' },
      { turn: 7, type: 'switch',     message: 'Misty envoie psyduck !' },
      { turn: 8, type: 'turn_start', message: '--- Tour 8 ---' },
      { turn: 8, type: 'attack',     message: 'psyduck utilise Headbutt !' },
      { turn: 8, type: 'damage',     message: 'blastoise perd 54 PV ! (0/79 PV)' },
      { turn: 8, type: 'faint',      message: 'blastoise est K.O. !' },
      { turn: 8, type: 'fight_end',  message: 'Misty remporte le combat !' },
    ],
  },
  {
    id: 103,
    date: '2026-04-10T17:00:00Z',
    opponentName: 'Brock',
    result: 'win',
    turnCount: 3,
    playerTeam: [
      { pokedexId: 6,  name: 'charizard', sprite: `${S}6.png`, isFainted: false },
      { pokedexId: 9,  name: 'blastoise', sprite: `${S}9.png`, isFainted: false },
      { pokedexId: 3,  name: 'venusaur',  sprite: `${S}3.png`, isFainted: true  },
    ],
    opponentTeam: [
      { pokedexId: 95,  name: 'onix',     sprite: `${S}95.png`,  isFainted: true },
      { pokedexId: 74,  name: 'geodude',  sprite: `${S}74.png`,  isFainted: true },
      { pokedexId: 62,  name: 'poliwrath',sprite: `${S}62.png`,  isFainted: true },
    ],
    log: [
      { turn: 1, type: 'turn_start', message: '--- Tour 1 ---' },
      { turn: 1, type: 'attack',     message: 'venusaur utilise Solar Beam !' },
      { turn: 1, type: 'damage',     message: 'onix perd 45 PV ! (0/45 PV)' },
      { turn: 1, type: 'faint',      message: 'onix est K.O. !' },
      { turn: 1, type: 'switch',     message: 'Brock envoie geodude !' },
      { turn: 1, type: 'attack',     message: 'geodude utilise Rock Throw !' },
      { turn: 1, type: 'damage',     message: 'venusaur perd 55 PV ! (25/80 PV)' },
      { turn: 2, type: 'turn_start', message: '--- Tour 2 ---' },
      { turn: 2, type: 'attack',     message: 'venusaur utilise Sludge Bomb !' },
      { turn: 2, type: 'damage',     message: 'geodude perd 30 PV ! (0/35 PV)' },
      { turn: 2, type: 'faint',      message: 'geodude est K.O. !' },
      { turn: 2, type: 'switch',     message: 'Brock envoie poliwrath !' },
      { turn: 2, type: 'attack',     message: 'poliwrath utilise Submission !' },
      { turn: 2, type: 'damage',     message: 'venusaur perd 25 PV ! (0/80 PV)' },
      { turn: 2, type: 'faint',      message: 'venusaur est K.O. !' },
      { turn: 2, type: 'switch',     message: 'Test User envoie blastoise !' },
      { turn: 3, type: 'turn_start', message: '--- Tour 3 ---' },
      { turn: 3, type: 'attack',     message: 'blastoise utilise Surf !' },
      { turn: 3, type: 'damage',     message: 'poliwrath perd 42 PV ! (0/70 PV)' },
      { turn: 3, type: 'faint',      message: 'poliwrath est K.O. !' },
      { turn: 3, type: 'fight_end',  message: 'Test User remporte le combat !' },
    ],
  },
  {
    id: 104,
    date: '2026-04-08T09:45:00Z',
    opponentName: 'Gary',
    result: 'loss',
    turnCount: 12,
    playerTeam: [
      { pokedexId: 6, name: 'charizard', sprite: `${S}6.png`, isFainted: true },
      { pokedexId: 9, name: 'blastoise', sprite: `${S}9.png`, isFainted: true },
      { pokedexId: 3, name: 'venusaur',  sprite: `${S}3.png`, isFainted: true },
    ],
    opponentTeam: [
      { pokedexId: 133, name: 'eevee',   sprite: `${S}133.png`, isFainted: true  },
      { pokedexId: 135, name: 'jolteon', sprite: `${S}135.png`, isFainted: false },
      { pokedexId: 136, name: 'flareon', sprite: `${S}136.png`, isFainted: true  },
    ],
    log: [
      { turn: 1,  type: 'turn_start', message: '--- Tour 1 ---' },
      { turn: 1,  type: 'attack',     message: 'charizard utilise Flamethrower !' },
      { turn: 1,  type: 'damage',     message: 'eevee perd 20 PV ! (35/55 PV)' },
      { turn: 1,  type: 'attack',     message: 'eevee utilise Bite !' },
      { turn: 1,  type: 'damage',     message: 'charizard perd 15 PV ! (63/78 PV)' },
      { turn: 2,  type: 'turn_start', message: '--- Tour 2 ---' },
      { turn: 2,  type: 'attack',     message: 'charizard utilise Fire Blast !' },
      { turn: 2,  type: 'damage',     message: 'eevee perd 35 PV ! (0/55 PV)' },
      { turn: 2,  type: 'faint',      message: 'eevee est K.O. !' },
      { turn: 2,  type: 'switch',     message: 'Gary envoie flareon !' },
      { turn: 3,  type: 'turn_start', message: '--- Tour 3 ---' },
      { turn: 3,  type: 'attack',     message: 'flareon utilise Fire Blast !' },
      { turn: 3,  type: 'damage',     message: 'charizard perd 40 PV ! (23/78 PV)' },
      { turn: 3,  type: 'attack',     message: 'charizard utilise Slash !' },
      { turn: 3,  type: 'damage',     message: 'flareon perd 22 PV ! (43/65 PV)' },
      { turn: 4,  type: 'turn_start', message: '--- Tour 4 ---' },
      { turn: 4,  type: 'attack',     message: 'flareon utilise Fire Blast !' },
      { turn: 4,  type: 'damage',     message: 'charizard perd 23 PV ! (0/78 PV)' },
      { turn: 4,  type: 'faint',      message: 'charizard est K.O. !' },
      { turn: 4,  type: 'switch',     message: 'Test User envoie blastoise !' },
      { turn: 5,  type: 'turn_start', message: '--- Tour 5 ---' },
      { turn: 5,  type: 'attack',     message: 'blastoise utilise Surf !' },
      { turn: 5,  type: 'damage',     message: 'flareon perd 43 PV ! (0/65 PV)' },
      { turn: 5,  type: 'faint',      message: 'flareon est K.O. !' },
      { turn: 5,  type: 'switch',     message: 'Gary envoie jolteon !' },
      { turn: 6,  type: 'turn_start', message: '--- Tour 6 ---' },
      { turn: 6,  type: 'attack',     message: 'jolteon utilise Thunderbolt !' },
      { turn: 6,  type: 'damage',     message: 'blastoise perd 32 PV ! (47/79 PV)' },
      { turn: 6,  type: 'attack',     message: 'blastoise utilise Ice Beam !' },
      { turn: 6,  type: 'damage',     message: 'jolteon perd 20 PV ! (45/65 PV)' },
      { turn: 7,  type: 'turn_start', message: '--- Tour 7 ---' },
      { turn: 7,  type: 'attack',     message: 'jolteon utilise Thunder !' },
      { turn: 7,  type: 'damage',     message: 'blastoise perd 47 PV ! (0/79 PV)' },
      { turn: 7,  type: 'faint',      message: 'blastoise est K.O. !' },
      { turn: 7,  type: 'switch',     message: 'Test User envoie venusaur !' },
      { turn: 8,  type: 'turn_start', message: '--- Tour 8 ---' },
      { turn: 8,  type: 'attack',     message: 'venusaur utilise Razor Leaf !' },
      { turn: 8,  type: 'damage',     message: 'jolteon perd 18 PV ! (27/65 PV)' },
      { turn: 8,  type: 'attack',     message: 'jolteon utilise Thunderbolt !' },
      { turn: 8,  type: 'damage',     message: 'venusaur perd 28 PV ! (52/80 PV)' },
      { turn: 9,  type: 'turn_start', message: '--- Tour 9 ---' },
      { turn: 9,  type: 'attack',     message: 'venusaur utilise Solar Beam !' },
      { turn: 9,  type: 'damage',     message: 'jolteon perd 25 PV ! (2/65 PV)' },
      { turn: 9,  type: 'attack',     message: 'jolteon utilise Thunder !' },
      { turn: 9,  type: 'damage',     message: 'venusaur perd 30 PV ! (22/80 PV)' },
      { turn: 10, type: 'turn_start', message: '--- Tour 10 ---' },
      { turn: 10, type: 'attack',     message: 'jolteon utilise Quick Attack !' },
      { turn: 10, type: 'damage',     message: 'venusaur perd 22 PV ! (0/80 PV)' },
      { turn: 10, type: 'faint',      message: 'venusaur est K.O. !' },
      { turn: 10, type: 'fight_end',  message: 'Gary remporte le combat !' },
    ],
  },
  {
    id: 105,
    date: '2026-04-05T16:20:00Z',
    opponentName: 'Sacha',
    result: 'win',
    turnCount: 4,
    playerTeam: [
      { pokedexId: 6, name: 'charizard', sprite: `${S}6.png`, isFainted: false },
      { pokedexId: 9, name: 'blastoise', sprite: `${S}9.png`, isFainted: false },
      { pokedexId: 3, name: 'venusaur',  sprite: `${S}3.png`, isFainted: false },
    ],
    opponentTeam: [
      { pokedexId: 143, name: 'snorlax', sprite: `${S}143.png`, isFainted: true },
      { pokedexId: 131, name: 'lapras',  sprite: `${S}131.png`, isFainted: true },
      { pokedexId: 112, name: 'rhydon',  sprite: `${S}112.png`, isFainted: true },
    ],
    log: [
      { turn: 1, type: 'turn_start', message: '--- Tour 1 ---' },
      { turn: 1, type: 'attack',     message: 'charizard utilise Flamethrower !' },
      { turn: 1, type: 'damage',     message: 'snorlax perd 30 PV ! (130/160 PV)' },
      { turn: 1, type: 'attack',     message: 'snorlax utilise Body Slam !' },
      { turn: 1, type: 'damage',     message: 'charizard perd 18 PV ! (60/78 PV)' },
      { turn: 2, type: 'turn_start', message: '--- Tour 2 ---' },
      { turn: 2, type: 'attack',     message: 'charizard utilise Fire Blast !' },
      { turn: 2, type: 'damage',     message: 'snorlax perd 40 PV ! (90/160 PV)' },
      { turn: 2, type: 'attack',     message: 'snorlax utilise Hyper Beam !' },
      { turn: 2, type: 'attack',     message: 'snorlax a raté son attaque !' },
      { turn: 3, type: 'turn_start', message: '--- Tour 3 ---' },
      { turn: 3, type: 'attack',     message: 'charizard utilise Wing Attack !' },
      { turn: 3, type: 'damage',     message: 'snorlax perd 45 PV ! (45/160 PV)' },
      { turn: 3, type: 'attack',     message: 'snorlax utilise Body Slam !' },
      { turn: 3, type: 'damage',     message: 'charizard perd 12 PV ! (48/78 PV)' },
      { turn: 4, type: 'turn_start', message: '--- Tour 4 ---' },
      { turn: 4, type: 'attack',     message: 'charizard utilise Flamethrower !' },
      { turn: 4, type: 'damage',     message: 'snorlax perd 45 PV ! (0/160 PV)' },
      { turn: 4, type: 'faint',      message: 'snorlax est K.O. !' },
      { turn: 4, type: 'switch',     message: 'Sacha envoie lapras !' },
      { turn: 4, type: 'attack',     message: 'lapras utilise Blizzard !' },
      { turn: 4, type: 'damage',     message: 'charizard perd 48 PV ! (0/78 PV)' },
      { turn: 4, type: 'faint',      message: 'charizard est K.O. !' },
      { turn: 4, type: 'switch',     message: 'Test User envoie venusaur !' },
      { turn: 4, type: 'attack',     message: 'venusaur utilise Solar Beam !' },
      { turn: 4, type: 'damage',     message: 'lapras perd 55 PV ! (75/130 PV)' },
      { turn: 4, type: 'fight_end',  message: 'Test User remporte le combat !' },
    ],
  },
  {
    id: 106,
    date: '2026-04-02T11:30:00Z',
    opponentName: 'Jessie',
    result: 'win',
    turnCount: 4,
    playerTeam: [
      { pokedexId: 6, name: 'charizard', sprite: `${S}6.png`, isFainted: true  },
      { pokedexId: 9, name: 'blastoise', sprite: `${S}9.png`, isFainted: false },
      { pokedexId: 3, name: 'venusaur',  sprite: `${S}3.png`, isFainted: false },
    ],
    opponentTeam: [
      { pokedexId: 24,  name: 'arbok',    sprite: `${S}24.png`,  isFainted: true },
      { pokedexId: 110, name: 'weezing',  sprite: `${S}110.png`, isFainted: true },
      { pokedexId: 108, name: 'lickitung',sprite: `${S}108.png`, isFainted: true },
    ],
    log: [
      { turn: 1, type: 'turn_start', message: '--- Tour 1 ---' },
      { turn: 1, type: 'attack',     message: 'charizard utilise Flamethrower !' },
      { turn: 1, type: 'damage',     message: 'arbok perd 38 PV ! (27/65 PV)' },
      { turn: 1, type: 'attack',     message: 'arbok utilise Bite !' },
      { turn: 1, type: 'damage',     message: 'charizard perd 20 PV ! (58/78 PV)' },
      { turn: 2, type: 'turn_start', message: '--- Tour 2 ---' },
      { turn: 2, type: 'attack',     message: 'charizard utilise Fire Blast !' },
      { turn: 2, type: 'damage',     message: 'arbok perd 27 PV ! (0/65 PV)' },
      { turn: 2, type: 'faint',      message: 'arbok est K.O. !' },
      { turn: 2, type: 'switch',     message: 'Jessie envoie weezing !' },
      { turn: 2, type: 'attack',     message: 'weezing utilise Sludge Bomb !' },
      { turn: 2, type: 'damage',     message: 'charizard perd 38 PV ! (20/78 PV)' },
      { turn: 3, type: 'turn_start', message: '--- Tour 3 ---' },
      { turn: 3, type: 'attack',     message: 'weezing utilise Sludge Bomb !' },
      { turn: 3, type: 'damage',     message: 'charizard perd 20 PV ! (0/78 PV)' },
      { turn: 3, type: 'faint',      message: 'charizard est K.O. !' },
      { turn: 3, type: 'switch',     message: 'Test User envoie blastoise !' },
      { turn: 3, type: 'attack',     message: 'blastoise utilise Surf !' },
      { turn: 3, type: 'damage',     message: 'weezing perd 45 PV ! (0/65 PV)' },
      { turn: 3, type: 'faint',      message: 'weezing est K.O. !' },
      { turn: 3, type: 'switch',     message: 'Jessie envoie lickitung !' },
      { turn: 4, type: 'turn_start', message: '--- Tour 4 ---' },
      { turn: 4, type: 'attack',     message: 'blastoise utilise Ice Beam !' },
      { turn: 4, type: 'damage',     message: 'lickitung perd 50 PV ! (0/90 PV)' },
      { turn: 4, type: 'faint',      message: 'lickitung est K.O. !' },
      { turn: 4, type: 'fight_end',  message: 'Test User remporte le combat !' },
    ],
  },
  {
    id: 107,
    date: '2026-03-30T20:00:00Z',
    opponentName: 'James',
    result: 'loss',
    turnCount: 9,
    playerTeam: [
      { pokedexId: 6, name: 'charizard', sprite: `${S}6.png`, isFainted: true },
      { pokedexId: 9, name: 'blastoise', sprite: `${S}9.png`, isFainted: true },
      { pokedexId: 3, name: 'venusaur',  sprite: `${S}3.png`, isFainted: true },
    ],
    opponentTeam: [
      { pokedexId: 71,  name: 'victreebel', sprite: `${S}71.png`,  isFainted: false },
      { pokedexId: 70,  name: 'weepinbell', sprite: `${S}70.png`,  isFainted: true  },
      { pokedexId: 109, name: 'koffing',    sprite: `${S}109.png`, isFainted: true  },
    ],
    log: [
      { turn: 1, type: 'turn_start', message: '--- Tour 1 ---' },
      { turn: 1, type: 'attack',     message: 'charizard utilise Flamethrower !' },
      { turn: 1, type: 'damage',     message: 'weepinbell perd 35 PV ! (30/65 PV)' },
      { turn: 1, type: 'attack',     message: 'weepinbell utilise Razor Leaf !' },
      { turn: 1, type: 'damage',     message: 'charizard perd 28 PV ! (50/78 PV)' },
      { turn: 2, type: 'turn_start', message: '--- Tour 2 ---' },
      { turn: 2, type: 'attack',     message: 'charizard utilise Fire Blast !' },
      { turn: 2, type: 'damage',     message: 'weepinbell perd 30 PV ! (0/65 PV)' },
      { turn: 2, type: 'faint',      message: 'weepinbell est K.O. !' },
      { turn: 2, type: 'switch',     message: 'James envoie koffing !' },
      { turn: 2, type: 'attack',     message: 'koffing utilise Sludge Bomb !' },
      { turn: 2, type: 'damage',     message: 'charizard perd 28 PV ! (22/78 PV)' },
      { turn: 3, type: 'turn_start', message: '--- Tour 3 ---' },
      { turn: 3, type: 'attack',     message: 'koffing utilise Explosion !' },
      { turn: 3, type: 'damage',     message: 'charizard perd 22 PV ! (0/78 PV)' },
      { turn: 3, type: 'faint',      message: 'charizard est K.O. !' },
      { turn: 3, type: 'faint',      message: 'koffing est K.O. !' },
      { turn: 3, type: 'switch',     message: 'James envoie victreebel !' },
      { turn: 3, type: 'switch',     message: 'Test User envoie blastoise !' },
      { turn: 4, type: 'turn_start', message: '--- Tour 4 ---' },
      { turn: 4, type: 'attack',     message: 'victreebel utilise Razor Leaf !' },
      { turn: 4, type: 'damage',     message: 'blastoise perd 22 PV ! (57/79 PV)' },
      { turn: 4, type: 'attack',     message: 'blastoise utilise Ice Beam !' },
      { turn: 4, type: 'damage',     message: 'victreebel perd 25 PV ! (75/100 PV)' },
      { turn: 5, type: 'turn_start', message: '--- Tour 5 ---' },
      { turn: 5, type: 'attack',     message: 'victreebel utilise Solar Beam !' },
      { turn: 5, type: 'damage',     message: 'blastoise perd 35 PV ! (22/79 PV)' },
      { turn: 5, type: 'attack',     message: 'blastoise utilise Surf !' },
      { turn: 5, type: 'damage',     message: 'victreebel perd 28 PV ! (47/100 PV)' },
      { turn: 6, type: 'turn_start', message: '--- Tour 6 ---' },
      { turn: 6, type: 'attack',     message: 'victreebel utilise Razor Leaf !' },
      { turn: 6, type: 'damage',     message: 'blastoise perd 22 PV ! (0/79 PV)' },
      { turn: 6, type: 'faint',      message: 'blastoise est K.O. !' },
      { turn: 6, type: 'switch',     message: 'Test User envoie venusaur !' },
      { turn: 7, type: 'turn_start', message: '--- Tour 7 ---' },
      { turn: 7, type: 'attack',     message: 'venusaur utilise Sludge Bomb !' },
      { turn: 7, type: 'damage',     message: 'victreebel perd 30 PV ! (17/100 PV)' },
      { turn: 7, type: 'attack',     message: 'victreebel utilise Solar Beam !' },
      { turn: 7, type: 'damage',     message: 'venusaur perd 40 PV ! (40/80 PV)' },
      { turn: 8, type: 'turn_start', message: '--- Tour 8 ---' },
      { turn: 8, type: 'attack',     message: 'victreebel utilise Razor Leaf !' },
      { turn: 8, type: 'damage',     message: 'venusaur perd 25 PV ! (15/80 PV)' },
      { turn: 8, type: 'attack',     message: 'venusaur utilise Solar Beam !' },
      { turn: 8, type: 'damage',     message: 'victreebel perd 17 PV ! (0/100 PV)' },
      { turn: 8, type: 'attack',     message: 'victreebel a raté son attaque !' },
      { turn: 9, type: 'turn_start', message: '--- Tour 9 ---' },
      { turn: 9, type: 'attack',     message: 'victreebel utilise Solar Beam !' },
      { turn: 9, type: 'damage',     message: 'venusaur perd 15 PV ! (0/80 PV)' },
      { turn: 9, type: 'faint',      message: 'venusaur est K.O. !' },
      { turn: 9, type: 'fight_end',  message: 'James remporte le combat !' },
    ],
  },
];

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


  // GET /games/history — historique des parties du joueur connecté
  if (req.url.endsWith('/games/history') && req.method === 'GET') {
    return of(new HttpResponse({ status: 200, body: apiResp([...mockGameHistory]) })).pipe(delay(300));
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
