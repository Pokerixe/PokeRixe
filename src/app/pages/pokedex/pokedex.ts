import {
  Component
} from '@angular/core';
import {PokemonCardList} from '../../shared/components/pokemon-card-list/pokemon-card-list';

@Component({
  selector: 'app-pokedex',
  imports: [
    PokemonCardList
  ],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.css',
})
export class Pokedex {

}
