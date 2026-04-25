import { inject } from "@angular/core";
import {CanActivateFn, Router} from "@angular/router";
import {AuthService} from './auth.service';
import {Role} from '../models/user.model';

const rolePriority = {
  [Role.Guest]: 0,
  [Role.User]: 1,
  [Role.Admin]: 2
};

/** Guard pour protéger les routes nécessitant un rôle spécifique
 * Si l'utilisateur n'a pas le rôle requis, redirige vers la page forbidden
 * Le rôle de l'utilisateur doit être égal ou supérieur au rôle requis pour accéder à la route
 * @param requiredRole Valeur de typer Role qui correspond au rôle minimum requis pour accéder à la route
 * Exemple d'utilisation : canActivate: [roleGuard(Role.Admin)] pour protéger une route réservée aux admins
 */
export const roleGuard = (requiredRole: Role): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const userRole = auth.userRole();
  if (userRole === null) {
    return router.createUrlTree(['/forbidden']);
  }

  if (rolePriority[userRole] < rolePriority[requiredRole]) {
    return router.createUrlTree(['/forbidden'])
  }
  return true
}
