import { Component, signal } from '@angular/core';
import { PokemonCardList } from '../../shared/components/pokemon-card-list/pokemon-card-list';

@Component({
  selector: 'app-pokedex',
  imports: [PokemonCardList],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.css',
})
export class Pokedex {
  readonly selectedTypes = signal<string[]>([]);

  readonly allTypes = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon',
  ];

  toggleType(type: string): void {
    this.selectedTypes.update(types =>
      types.includes(type) ? types.filter(t => t !== type) : [...types, type]
    );
  }
}
