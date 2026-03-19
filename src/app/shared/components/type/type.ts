import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-type',
  imports: [],
  templateUrl: './type.html',
  styleUrl: './type.css',
})
/**
 * Composant pour afficher le type d'un Pokémon avec une couleur de fond correspondante.
 * Accepte la propriété suivante :
 * - type : Le type du Pokémon (ex: "fire", "water", etc.).
 */
export class Type {

  @Input() type: string = "";

  private readonly colors: Record<string, string> = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    dark: '#705746',
    steel: '#B7B7CE',
    fairy: '#D685AD'
  };

  get bgColor(): string {
    return this.colors[this.type] ?? '#A8A77A';
  }
}
