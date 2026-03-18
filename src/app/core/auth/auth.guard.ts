import { inject } from "@angular/core";
import {CanActivateFn, Router} from "@angular/router";
import {AuthService} from './auth.service';

/** Guard pour protéger les routes nécessitant une authentification
 * Si l'utilisateur n'est pas authentifié, redirige vers la page de login
 */
export const authGuard : CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if(!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'])
  }
  return true
}
