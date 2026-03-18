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
    //return of(new HttpResponse({ status: 401, body: { message: 'Invalid credentials' } })).pipe(delay(300));
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

  return next(req);
};
