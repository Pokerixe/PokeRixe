import { Component, input } from '@angular/core';
import { TurnEvent } from '../../../core/fight/fight.model';

@Component({
  selector: 'app-fight-log',
  imports: [],
  templateUrl: './fight-log.html',
  styleUrl: './fight-log.css',
})
/**
 * Journal des événements de combat.
 * Affiche le déroulé des actions tour par tour (attaques, dégâts, changements de Pokémon…).
 * Se met à jour automatiquement via le signal `events` connecté au `FightService`.
 */
export class FightLog {
  /** Liste des événements à afficher, fournie par le `FightService`. */
  events = input<TurnEvent[]>([]);
}
