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


  return next(req);
};
