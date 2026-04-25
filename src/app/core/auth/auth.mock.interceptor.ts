import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Role } from '../models/user.model';
import { ApiResponse } from '../../shared/models/api-response.model';

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

  return next(req);
};
