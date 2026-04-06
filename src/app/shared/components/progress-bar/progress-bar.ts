import {Component, Input} from '@angular/core';
import {NgStyle} from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  imports: [
    NgStyle
  ],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
/**
 * Barre de progression générique affichant une valeur entre 0 et 255.
 * Utilisée pour visualiser les statistiques de base d'un Pokémon.
 *
 * @example
 * `<app-progress-bar [value]="pokemon.stats.attack" />`
 */
export class ProgressBar {
  /** Valeur à afficher (entre 0 et 255 pour les stats Pokémon). */
  @Input () value: number = 0;
  protected readonly Math = Math;
}
