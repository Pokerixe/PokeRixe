import { Component, signal } from '@angular/core';
import { PokemonCardList } from '../../shared/components/pokemon-card-list/pokemon-card-list';

@Component({
  selector: 'app-pokedex',
  imports: [PokemonCardList],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.css',
})
/**
 * Page principale du Pokédex.
 * Affiche les 150 premiers Pokémon (Gen 1) en scroll infini avec filtre par type.
 * Les filtres sélectionnés sont transmis à `PokemonCardList` qui gère le rendu impératif.
 */
export class Pokedex {
  /** Signal contenant les types actuellement sélectionnés pour le filtrage. */
  readonly selectedTypes = signal<string[]>([]);

  /** Liste des 15 types Gen 1 disponibles pour le filtre. */
  readonly allTypes = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon',
  ];

  /**
   * Ajoute ou retire un type du filtre actif.
   * @param type Identifiant du type (ex: `"fire"`)
   */
  toggleType(type: string): void {
    this.selectedTypes.update(types =>
      types.includes(type) ? types.filter(t => t !== type) : [...types, type]
    );
  }
}
