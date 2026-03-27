import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Role } from '../models/user.model';


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

export const mockAuthInterceptor: HttpInterceptorFn = (req, next) => {

  if (!environment.useMockApi) {
    return next(req);
  }

  /**
   */
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
        body: { user: mockCurrentUser }
      })).pipe(delay(300));
    }
    return of(new HttpResponse({ status: 200, body: { user: null } })).pipe(delay(300));
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
      body: { user: mockCurrentUser }
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
        body: { user: mockCurrentUser }
      })).pipe(delay(300));
    }
    return of(new HttpResponse({ status: 200, body: { user: null } })).pipe(delay(300));
  }

  // GET /games
  if (req.url.endsWith('/games') && req.method === 'GET') {
    const mockGames = [
      {
        id: 1,
        player1: 'Ash',
        description: 'Match amical à Jadielle',
        nombrePokemon: 3,
      },
      {
        id: 2,
        player1: 'Misty',
        description: 'Tournoi arène eau',
        nombrePokemon: 6,
      },
      {
        id: 3,
        player1: 'Brock',
        description: 'Duel d\'entraînement',
        nombrePokemon: 4,
      },
    ];

    return of(new HttpResponse({
      status: 200,
      body: mockGames,
    })).pipe(delay(300));
  }

  // GET /team
  if (req.url.endsWith('/team') && req.method === 'GET') {
    const mockTeam = {
      userId: mockCurrentUser?.id ?? '1',
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
          stats: {
            hp: 78,
            attack: 84,
            defense: 78,
            specialAttack: 109,
            specialDefense: 85,
            speed: 100,
          },
          moves: [
            { slot: 0, name: 'Flamethrower', type: 'fire', power: 90, accuracy: 100, damageClass: 'special' },
            { slot: 1, name: 'Fire Blast', type: 'fire', power: 110, accuracy: 85, damageClass: 'special' },
            { slot: 2, name: 'Wing Attack', type: 'flying', power: 60, accuracy: 100, damageClass: 'physical' },
            { slot: 3, name: 'Slash', type: 'normal', power: 70, accuracy: 100, damageClass: 'physical' },
          ],
        },
        null,
        null,
        null,
        null,
        null,
      ],
    };

    return of(new HttpResponse({
      status: 200,
      body: mockTeam,
    })).pipe(delay(300));
  }


  return next(req);
};
