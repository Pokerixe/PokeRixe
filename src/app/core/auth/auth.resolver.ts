import {inject} from "@angular/core";
import {ResolveFn} from "@angular/router";
import {AuthService} from './auth.service';

/** Resolver pour charger les données de l'utilisateur avant d'afficher la page user
 * Permet d'avoir les informations de l'utilisateur disponibles dès le chargement de la page
 * Utile pour afficher le nom de l'utilisateur, son rôle, etc. dans la page user
 */
export const authResolver: ResolveFn<void> = () => {
  const auth = inject(AuthService);
  auth.loadCurrentUser();
};
