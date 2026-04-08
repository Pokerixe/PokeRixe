import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { HpBar } from '../hp-bar/hp-bar';

@Component({
  selector: 'app-fight-pokemon-card',
  imports: [HpBar],
  templateUrl: './fight-pokemon-card.html',
  styleUrl: './fight-pokemon-card.css',
})
/**
 * Carte d'un Pokémon affiché dans l'interface de combat.
 * Affiche le sprite, le nom et la barre de HP du Pokémon.
 * Émet un événement `switchClick` lorsque le joueur clique pour effectuer un changement.
 *
 * @example
 * ```html
 * <app-fight-pokemon-card
 *   [img]="pokemon.sprite"
 *   [name]="pokemon.name"
 *   [hp]="pokemon.hp"
 *   [hpMax]="pokemon.hpMax"
 *   [isFainted]="pokemon.isFainted"
 *   [isActive]="pokemon.slotIndex === activeIndex"
 *   [canSwitch]="canSwitch"
 *   (switchClick)="onPokemonSwitch(pokemon.slotIndex)">
 * </app-fight-pokemon-card>
 * ```
 */
export class FightPokemonCard {
  /** URL du sprite du Pokémon. */
  @Input() img: string = '';
  /** Nom du Pokémon. */
  @Input() name: string = '';
  /** Points de vie actuels. */
  hp = input<number>(0);
  /** Points de vie maximum. */
  hpMax = input<number>(0);
  /** `true` si le Pokémon est K.O. — la carte est alors grisée et non cliquable. */
  isFainted = input<boolean>(false);
  /** `true` si ce Pokémon est actuellement actif en combat — la carte est mise en évidence. */
  isActive = input<boolean>(false);
  /** `true` si le joueur peut actuellement effectuer un changement de Pokémon. */
  canSwitch = input<boolean>(false);

  /** Émis lorsque le joueur clique sur la carte pour envoyer ce Pokémon au combat. */
  @Output() switchClick = new EventEmitter<void>();

  /** Gère le clic sur la carte. N'émet que si le switch est autorisé. */
  onClick(): void {
    if (!this.isFainted() && !this.isActive() && this.canSwitch()) {
      this.switchClick.emit();
    }
  }
}
