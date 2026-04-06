import {Component, input, Input} from '@angular/core';
import {HpBar} from '../hp-bar/hp-bar';

@Component({
  selector: 'app-fight-pokemon-card',
  imports: [
    HpBar
  ],
  templateUrl: './fight-pokemon-card.html',
  styleUrl: './fight-pokemon-card.css',
})
/**
 * Carte d'un Pokémon affiché sur l'écran de combat.
 * Affiche le sprite, le nom et la barre de HP du Pokémon (joueur ou adversaire).
 *
 * @example
 * `<app-fight-pokemon-card [img]="sprite" [name]="name" [hp]="hp" [hpMax]="hpMax" />`
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
}
