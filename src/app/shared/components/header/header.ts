import {Component, inject} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {AuthService} from '../../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
/**
 * En-tête global de l'application.
 * Affiche la barre de navigation avec les liens vers les pages principales.
 * Les liens visibles s'adaptent selon l'état d'authentification (`AuthService.isAuthenticated`)
 * et le rôle de l'utilisateur (`AuthService.userRole`).
 */
export class Header {

  /** Service d'authentification utilisé pour conditionner l'affichage des liens de navigation. */
  auth = inject(AuthService);

}
