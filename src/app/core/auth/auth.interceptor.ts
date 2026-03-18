import { HttpInterceptorFn } from '@angular/common/http';

/** Interceptor pour ajouter les credentials (cookies) à chaque requete HTTP
 * Nécessaire pour que le backend puisse identifier l'utilisateur connecté via les cookies de session
 * @param req La requete HTTP entrante
 * @param next La fonction pour passer la requete au prochain interceptor ou au backend
 * @returns Un Observable de la réponse HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const reqWithCredentials = req.clone({
    withCredentials: true
  });
  return next(reqWithCredentials);
};
