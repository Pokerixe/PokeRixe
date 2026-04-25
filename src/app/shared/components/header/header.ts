import {Component, effect, inject, OnDestroy} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {AuthService} from '../../../core/auth/auth.service';
import {GameService} from '../../../core/game/game.service';
import {FightWsService} from '../../../core/fight/fight-ws.service';

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
export class Header implements OnDestroy {

  /** Service d'authentification utilisé pour conditionner l'affichage des liens de navigation. */
  auth = inject(AuthService);

  /** Service de jeu utilisé pour conditionner l'affichage du lien Fight. */
  game = inject(GameService);

  private readonly fightService = inject(FightWsService);
  private clearGameTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.fightService.isFinished()) {
        this.clearGameTimeout ??= setTimeout(() => {
          this.game.clearCurrentGame();
          this.clearGameTimeout = null;
        }, 5000);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.clearGameTimeout !== null) {
      clearTimeout(this.clearGameTimeout);
    }
  }

}
