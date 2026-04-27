import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Interceptor pour ajouter les credentials (cookies) à chaque requete HTTP
 * Nécessaire pour que le backend puisse identifier l'utilisateur connecté via les cookies de session
 * Appliqué uniquement aux requetes vers le backend (pas vers des API tierces comme PokeAPI)
 * @param req La requete HTTP entrante
 * @param next La fonction pour passer la requete au prochain interceptor ou au backend
 * @returns Un Observable de la réponse HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const reqWithCredentials = req.clone({
    withCredentials: true
  });
  return next(reqWithCredentials);
};
